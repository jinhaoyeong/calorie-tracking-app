"""Food classifiers.

The trained model (MobileNetV3, EfficientNet-B0 or ResNet50, whichever the comparison
selects) is loaded from an ONNX export so the API does not depend on the training
framework. Until a model is exported, a clearly labelled demo classifier is used so the
rest of the prototype can be exercised end to end.
"""

from __future__ import annotations

import hashlib
import json
import logging
import math
import random
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Protocol

import numpy as np
from PIL import Image

log = logging.getLogger(__name__)

MODEL_FILE = "model.onnx"
CONFIG_FILE = "model_config.json"

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


@dataclass(frozen=True)
class Prediction:
    food_id: str
    confidence: float


@dataclass(frozen=True)
class ModelInfo:
    name: str
    architecture: str
    mode: str  # "onnx" or "demo"
    input_size: int
    labels: list[str]

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


class Classifier(Protocol):
    info: ModelInfo

    def predict(self, image: Image.Image) -> list[Prediction]:
        """Return a prediction for every class, sorted by descending confidence."""
        ...


class ModelConfigError(ValueError):
    pass


def softmax(values: np.ndarray) -> np.ndarray:
    shifted = values - np.max(values)
    exp = np.exp(shifted)
    return exp / exp.sum()


def _ranked(labels: list[str], probabilities: np.ndarray) -> list[Prediction]:
    order = np.argsort(-probabilities)
    return [Prediction(labels[i], float(probabilities[i])) for i in order]


@dataclass(frozen=True)
class Preprocessing:
    input_size: int = 224
    layout: str = "NCHW"  # PyTorch exports use NCHW; Keras exports usually NHWC
    scale: float = 255.0  # pixels are divided by this before mean/std normalisation
    mean: tuple[float, float, float] = tuple(IMAGENET_MEAN)
    std: tuple[float, float, float] = tuple(IMAGENET_STD)

    def apply(self, image: Image.Image) -> np.ndarray:
        resized = image.convert("RGB").resize(
            (self.input_size, self.input_size), Image.Resampling.BILINEAR
        )
        pixels = np.asarray(resized, dtype=np.float32) / self.scale
        pixels = (pixels - np.asarray(self.mean, dtype=np.float32)) / np.asarray(
            self.std, dtype=np.float32
        )
        if self.layout == "NCHW":
            pixels = pixels.transpose(2, 0, 1)
        return pixels[np.newaxis, ...].astype(np.float32)


class OnnxClassifier:
    def __init__(self, model_path: Path, config: dict[str, Any]):
        import onnxruntime as ort

        labels = config.get("labels")
        if not isinstance(labels, list) or not labels:
            raise ModelConfigError(f"{CONFIG_FILE} must list the class labels in output order.")
        layout = config.get("layout", "NCHW")
        if layout not in ("NCHW", "NHWC"):
            raise ModelConfigError("layout must be 'NCHW' or 'NHWC'.")
        output = config.get("output", "logits")
        if output not in ("logits", "probabilities"):
            raise ModelConfigError("output must be 'logits' or 'probabilities'.")

        self.labels: list[str] = [str(label) for label in labels]
        self.apply_softmax = output == "logits"
        self.preprocessing = Preprocessing(
            input_size=int(config.get("input_size", 224)),
            layout=layout,
            scale=float(config.get("scale", 255.0)),
            mean=tuple(config.get("mean", IMAGENET_MEAN)),
            std=tuple(config.get("std", IMAGENET_STD)),
        )
        self.session = ort.InferenceSession(str(model_path), providers=["CPUExecutionProvider"])
        self.input_name = self.session.get_inputs()[0].name
        self.info = ModelInfo(
            name=str(config.get("name", model_path.stem)),
            architecture=str(config.get("architecture", "unknown")),
            mode="onnx",
            input_size=self.preprocessing.input_size,
            labels=self.labels,
        )

    def predict(self, image: Image.Image) -> list[Prediction]:
        batch = self.preprocessing.apply(image)
        (scores,) = self.session.run(None, {self.input_name: batch})[:1]
        scores = np.asarray(scores, dtype=np.float64).reshape(-1)
        if scores.shape[0] != len(self.labels):
            raise ModelConfigError(
                f"Model returned {scores.shape[0]} scores but {CONFIG_FILE} lists "
                f"{len(self.labels)} labels."
            )
        probabilities = softmax(scores) if self.apply_softmax else scores
        return _ranked(self.labels, probabilities)


class DemoClassifier:
    """Placeholder used before a trained model is exported.

    Predictions are derived from a hash of the image, so the same photo always gives the
    same answer, but they carry no visual meaning. The API and UI label them as demo output.
    """

    def __init__(self, labels: list[str]):
        self.labels = list(labels)
        self.info = ModelInfo(
            name="Demo classifier (no trained model loaded)",
            architecture="none",
            mode="demo",
            input_size=224,
            labels=self.labels,
        )

    def predict(self, image: Image.Image) -> list[Prediction]:
        thumbnail = image.convert("L").resize((16, 16), Image.Resampling.BILINEAR)
        rng = random.Random(hashlib.sha256(thumbnail.tobytes()).digest())
        logits = [rng.gauss(0.0, 1.0) for _ in self.labels]
        logits[rng.randrange(len(self.labels))] += rng.uniform(0.5, 4.5)
        peak = max(logits)
        exp = [math.exp(v - peak) for v in logits]
        total = sum(exp)
        return _ranked(self.labels, np.asarray([v / total for v in exp]))


def load_classifier(model_dir: Path, fallback_labels: list[str]) -> Classifier:
    model_path = model_dir / MODEL_FILE
    config_path = model_dir / CONFIG_FILE
    if not model_path.exists():
        log.warning("No %s in %s; using the demo classifier.", MODEL_FILE, model_dir)
        return DemoClassifier(fallback_labels)
    if not config_path.exists():
        raise ModelConfigError(f"Found {model_path} but no {CONFIG_FILE} beside it.")
    with config_path.open(encoding="utf-8") as fh:
        config = json.load(fh)
    classifier = OnnxClassifier(model_path, config)
    log.info("Loaded %s (%s) from %s", classifier.info.name, classifier.info.architecture, model_path)
    return classifier
