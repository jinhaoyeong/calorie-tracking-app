# Trained model

Put the exported classifier here as two files:

```
backend/models/model.onnx
backend/models/model_config.json
```

While `model.onnx` is absent the API recognises dishes with Claude when `ANTHROPIC_API_KEY` is
set, and otherwise runs a **demo classifier** whose predictions are placeholders (the app labels
them as demo output). Once the model is here it takes priority; set `PINGGAN_RECOGNIZER=claude`
to compare against Claude.

## model_config.json

```json
{
  "name": "MobileNetV3-Large",
  "architecture": "mobilenet_v3_large",
  "labels": [
    "nasi_lemak", "roti_canai", "chicken_rice", "char_kuey_teow", "mee_goreng_mamak",
    "nasi_goreng", "laksa", "satay", "rendang", "thosai"
  ],
  "input_size": 224,
  "layout": "NCHW",
  "scale": 255.0,
  "mean": [0.485, 0.456, 0.406],
  "std": [0.229, 0.224, 0.225],
  "output": "logits"
}
```

| Key | Meaning |
|---|---|
| `labels` | Class ids **in the model's output order**. Ids must match `data/malaysian_foods.json` to get nutrition data. |
| `input_size` | Images are resized to this square size. |
| `layout` | `NCHW` for PyTorch exports, `NHWC` for most Keras exports. |
| `scale`, `mean`, `std` | Pixels are divided by `scale`, then normalised with `mean`/`std`. For Keras models that include their own preprocessing layers, use `"scale": 1, "mean": [0,0,0], "std": [1,1,1]`. |
| `output` | `logits` (softmax is applied by the server) or `probabilities`. |

## Exporting

PyTorch (torchvision MobileNetV3 / EfficientNet-B0 / ResNet50 with a 10-class head):

```python
model.eval()
dummy = torch.randn(1, 3, 224, 224)
torch.onnx.export(
    model, dummy, "backend/models/model.onnx",
    input_names=["input"], output_names=["logits"],
    dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}},
    opset_version=17,
)
```

TensorFlow / Keras:

```bash
pip install tf2onnx
python -m tf2onnx.convert --saved-model path/to/saved_model --output backend/models/model.onnx
```

Restart the API after adding or replacing the model. `GET /api/health` reports which model is loaded.
