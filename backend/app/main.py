"""Pinggan API: dish recognition and standard-serving nutrition lookup."""

from __future__ import annotations

import logging
import time
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from starlette.concurrency import run_in_threadpool

from .classifier import (
    MODEL_FILE,
    Classifier,
    DemoClassifier,
    Prediction,
    RecognitionError,
    load_classifier,
)
from .config import Settings, load_settings
from .imaging import ImageRejected, decode_upload
from .nutrition import NutritionDatabase
from .vision import ClaudeClassifier

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

TOP_K = 3
DISCLAIMER = (
    "The photo is used only to identify the dish. Calories are for a referenced standard "
    "serving, not the portion in the photo. This is not medical or dietary advice."
)


def create_app(
    settings: Settings | None = None,
    classifier: Classifier | None = None,
    nutrition: NutritionDatabase | None = None,
) -> FastAPI:
    settings = settings or load_settings()
    nutrition = nutrition or NutritionDatabase.from_file(settings.foods_path)
    classifier = classifier or select_classifier(settings, nutrition)

    app = FastAPI(title="Pinggan API", version="0.1.0")
    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_methods=["GET", "POST"],
            allow_headers=["*"],
        )

    @app.exception_handler(ImageRejected)
    @app.exception_handler(RecognitionError)
    async def rejected(_request, exc: ImageRejected | RecognitionError):
        return JSONResponse(
            status_code=exc.status, content={"detail": {"code": exc.code, "message": exc.message}}
        )

    @app.get("/api/health")
    def health():
        return {
            "status": "ok",
            "model": classifier.info.as_dict(),
            "confidence_threshold": settings.confidence_threshold,
            "nutrition_version": nutrition.version,
        }

    @app.get("/api/foods")
    def foods():
        return nutrition.as_dict()

    @app.post("/api/predict")
    async def predict(image: UploadFile = File(...)):
        # Read one byte past the limit so oversize uploads are detected without reading them fully.
        data = await image.read(settings.max_upload_bytes + 1)
        await image.close()
        picture = await run_in_threadpool(
            decode_upload,
            data,
            max_bytes=settings.max_upload_bytes,
            min_side=settings.min_image_side,
        )
        ranked, inference_ms = await run_in_threadpool(_timed_predict, classifier, picture)

        top = ranked[0]
        return {
            "predictions": [
                {
                    "food_id": p.food_id,
                    "name": nutrition.name_for(p.food_id),
                    "confidence": round(p.confidence, 4),
                    "addons": list(p.addons),
                }
                for p in ranked[:TOP_K]
            ],
            "low_confidence": top.confidence < settings.confidence_threshold,
            "confidence_threshold": settings.confidence_threshold,
            # None when the predicted class has no entry in the nutrition database.
            "nutrition": nutrition.get(top.food_id),
            "model": {
                "name": classifier.info.name,
                "architecture": classifier.info.architecture,
                "mode": classifier.info.mode,
            },
            "inference_ms": round(inference_ms, 1),
            "disclaimer": DISCLAIMER,
        }

    _mount_frontend(app, settings.frontend_dist)
    return app


def select_classifier(settings: Settings, nutrition: NutritionDatabase) -> Classifier:
    """The exported ONNX model when there is one, else Claude when a key is set, else the demo."""
    choice = settings.recognizer
    if choice == "demo":
        return DemoClassifier(nutrition.scan_ids)
    has_model = (settings.model_dir / MODEL_FILE).exists()
    if choice == "claude" or (choice == "auto" and settings.has_anthropic_key and not has_model):
        log.info("Recognising dishes with Claude (%s).", settings.claude_model)
        return ClaudeClassifier(nutrition, model=settings.claude_model)
    return load_classifier(settings.model_dir, nutrition.scan_ids)


def _timed_predict(classifier: Classifier, picture: Image.Image) -> tuple[list[Prediction], float]:
    started = time.perf_counter()
    ranked = classifier.predict(picture)
    return ranked, (time.perf_counter() - started) * 1000


def _mount_frontend(app: FastAPI, dist: Path) -> None:
    """Serve the built mobile web app from the same origin when it has been built."""
    index = dist / "index.html"
    if not index.exists():
        return
    dist = dist.resolve()
    if (dist / "assets").is_dir():
        app.mount("/assets", StaticFiles(directory=dist / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        if path.startswith("api/"):
            raise HTTPException(status_code=404)
        candidate = (dist / path).resolve()
        if path and candidate.is_file() and dist in candidate.parents:
            return FileResponse(candidate)
        return FileResponse(index)


app = create_app()
