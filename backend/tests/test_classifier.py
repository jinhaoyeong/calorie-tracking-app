from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import onnx
import pytest
from onnx import TensorProto, helper
from PIL import Image

from app.classifier import (
    DemoClassifier,
    ModelConfigError,
    OnnxClassifier,
    Preprocessing,
    load_classifier,
)

LABELS = ["nasi_lemak", "roti_canai", "laksa"]


def write_linear_model(path: Path, weights: np.ndarray, layout: str = "NCHW") -> None:
    """A tiny ONNX graph: global average pool over pixels, then a 3x3 linear layer."""
    shape = [1, 3, 8, 8] if layout == "NCHW" else [1, 8, 8, 3]
    axes = [2, 3] if layout == "NCHW" else [1, 2]
    graph = helper.make_graph(
        [
            helper.make_node("ReduceMean", ["input", "axes"], ["pooled"], keepdims=0),
            helper.make_node("MatMul", ["pooled", "weights"], ["logits"]),
        ],
        "tiny",
        [helper.make_tensor_value_info("input", TensorProto.FLOAT, shape)],
        [helper.make_tensor_value_info("logits", TensorProto.FLOAT, [1, len(LABELS)])],
        initializer=[
            helper.make_tensor("axes", TensorProto.INT64, [2], axes),
            helper.make_tensor("weights", TensorProto.FLOAT, [3, len(LABELS)], weights.flatten().tolist()),
        ],
    )
    model = helper.make_model(graph, opset_imports=[helper.make_opsetid("", 18)])
    model.ir_version = 9
    onnx.save(model, path)


def config(**overrides) -> dict:
    base = {
        "name": "Tiny test model",
        "architecture": "linear",
        "labels": LABELS,
        "input_size": 8,
        "mean": [0, 0, 0],
        "std": [1, 1, 1],
        "scale": 255.0,
    }
    base.update(overrides)
    return base


def red_image() -> Image.Image:
    return Image.new("RGB", (40, 30), (255, 0, 0))


@pytest.mark.parametrize("layout", ["NCHW", "NHWC"])
def test_onnx_classifier_ranks_by_softmax_of_logits(tmp_path, layout):
    # Identity weights: logits equal the mean R, G, B channel values (1, 0, 0 for pure red).
    path = tmp_path / "model.onnx"
    write_linear_model(path, np.eye(3, dtype=np.float32), layout)
    classifier = OnnxClassifier(path, config(layout=layout))

    ranked = classifier.predict(red_image())

    assert [p.food_id for p in ranked][0] == "nasi_lemak"
    expected = np.exp([1.0, 0.0, 0.0]) / np.exp([1.0, 0.0, 0.0]).sum()
    assert [round(p.confidence, 4) for p in ranked] == [round(v, 4) for v in sorted(expected, reverse=True)]
    assert classifier.info.mode == "onnx"
    assert classifier.info.input_size == 8


def test_onnx_classifier_passes_probabilities_through(tmp_path):
    path = tmp_path / "model.onnx"
    weights = np.array([[0.2, 0.7, 0.1], [0, 0, 0], [0, 0, 0]], dtype=np.float32)
    write_linear_model(path, weights)
    classifier = OnnxClassifier(path, config(output="probabilities"))

    ranked = classifier.predict(red_image())

    assert [p.food_id for p in ranked] == ["roti_canai", "nasi_lemak", "laksa"]
    assert ranked[0].confidence == pytest.approx(0.7, abs=1e-5)


def test_label_count_must_match_model_output(tmp_path):
    path = tmp_path / "model.onnx"
    write_linear_model(path, np.eye(3, dtype=np.float32))
    classifier = OnnxClassifier(path, config(labels=["a", "b"]))
    with pytest.raises(ModelConfigError, match="3 scores"):
        classifier.predict(red_image())


def test_config_requires_labels(tmp_path):
    path = tmp_path / "model.onnx"
    write_linear_model(path, np.eye(3, dtype=np.float32))
    with pytest.raises(ModelConfigError):
        OnnxClassifier(path, config(labels=[]))


def test_load_classifier_falls_back_to_demo_without_model(tmp_path):
    classifier = load_classifier(tmp_path, LABELS)
    assert isinstance(classifier, DemoClassifier)
    assert classifier.info.mode == "demo"


def test_load_classifier_requires_config_beside_model(tmp_path):
    write_linear_model(tmp_path / "model.onnx", np.eye(3, dtype=np.float32))
    with pytest.raises(ModelConfigError, match="model_config.json"):
        load_classifier(tmp_path, LABELS)


def test_load_classifier_uses_onnx_when_present(tmp_path):
    write_linear_model(tmp_path / "model.onnx", np.eye(3, dtype=np.float32))
    (tmp_path / "model_config.json").write_text(json.dumps(config()))
    classifier = load_classifier(tmp_path, ["ignored"])
    assert isinstance(classifier, OnnxClassifier)
    assert classifier.info.labels == LABELS


def test_preprocessing_normalises_with_imagenet_statistics():
    batch = Preprocessing(input_size=4).apply(Image.new("RGB", (10, 10), (255, 255, 255)))
    assert batch.shape == (1, 3, 4, 4)
    expected = (1 - np.array([0.485, 0.456, 0.406])) / np.array([0.229, 0.224, 0.225])
    assert np.allclose(batch[0, :, 0, 0], expected, atol=1e-5)


def test_demo_classifier_returns_a_distribution_over_all_labels():
    ranked = DemoClassifier(LABELS).predict(red_image())
    assert sorted(p.food_id for p in ranked) == sorted(LABELS)
    assert sum(p.confidence for p in ranked) == pytest.approx(1.0)
