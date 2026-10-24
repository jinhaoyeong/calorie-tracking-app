"""Runtime settings, read from environment variables with sensible defaults."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
RECOGNIZERS = ("auto", "onnx", "claude", "demo")


@dataclass(frozen=True)
class Settings:
    foods_path: Path = REPO_ROOT / "data" / "malaysian_foods.json"
    model_dir: Path = REPO_ROOT / "backend" / "models"
    frontend_dist: Path = REPO_ROOT / "frontend" / "dist"
    # Uploads above this size are rejected before decoding.
    max_upload_bytes: int = 10 * 1024 * 1024
    # Images smaller than this on either side are too small to classify.
    min_image_side: int = 64
    # Top-1 confidence below this is flagged as low confidence in the response.
    confidence_threshold: float = 0.6
    cors_origins: list[str] = field(default_factory=list)
    # "auto" uses the exported ONNX model when there is one, then Claude when an Anthropic
    # API key is set, then the demo classifier.
    recognizer: str = "auto"
    claude_model: str = "claude-opus-5-5"
    has_anthropic_key: bool = False


def load_settings() -> Settings:
    defaults = Settings()
    origins = os.getenv("PINGGAN_CORS_ORIGINS", "")
    recognizer = os.getenv("PINGGAN_RECOGNIZER", defaults.recognizer).strip().lower()
    if recognizer not in RECOGNIZERS:
        raise ValueError(f"PINGGAN_RECOGNIZER must be one of {', '.join(RECOGNIZERS)}.")
    return Settings(
        foods_path=Path(os.getenv("PINGGAN_FOODS_PATH", defaults.foods_path)),
        model_dir=Path(os.getenv("PINGGAN_MODEL_DIR", defaults.model_dir)),
        frontend_dist=Path(os.getenv("PINGGAN_FRONTEND_DIST", defaults.frontend_dist)),
        max_upload_bytes=int(os.getenv("PINGGAN_MAX_UPLOAD_BYTES", defaults.max_upload_bytes)),
        min_image_side=int(os.getenv("PINGGAN_MIN_IMAGE_SIDE", defaults.min_image_side)),
        confidence_threshold=float(
            os.getenv("PINGGAN_CONFIDENCE_THRESHOLD", defaults.confidence_threshold)
        ),
        cors_origins=[o.strip() for o in origins.split(",") if o.strip()],
        recognizer=recognizer,
        claude_model=os.getenv("PINGGAN_CLAUDE_MODEL", defaults.claude_model).strip(),
        has_anthropic_key=bool(os.getenv("ANTHROPIC_API_KEY", "").strip()),
    )
