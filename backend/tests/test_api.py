from __future__ import annotations

from dataclasses import replace

from fastapi.testclient import TestClient

from app.classifier import ModelInfo, Prediction
from app.main import create_app
from tests.conftest import encode_image

SUPPORTED = {
    "nasi_lemak",
    "roti_canai",
    "chicken_rice",
    "char_kuey_teow",
    "mee_goreng_mamak",
    "nasi_goreng",
    "laksa",
    "satay",
    "rendang",
    "thosai",
}


def upload(client: TestClient, data: bytes, filename: str = "meal.jpg", content_type: str = "image/jpeg"):
    return client.post("/api/predict", files={"image": (filename, data, content_type)})


def test_health_reports_demo_mode_without_a_model(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok"
    assert body["model"]["mode"] == "demo"
    assert set(body["model"]["labels"]) == SUPPORTED


def test_foods_lists_exactly_the_ten_proposal_classes(client):
    foods = client.get("/api/foods").json()["foods"]
    assert {f["id"] for f in foods} == SUPPORTED
    for food in foods:
        assert food["energy_kcal"] > 0
        assert food["serving"]["label"]


def test_foods_energy_agrees_with_macronutrients(client):
    # Atwater factors (4/4/9 kcal per gram) should reproduce the stated energy closely.
    for food in client.get("/api/foods").json()["foods"]:
        derived = 4 * food["carbohydrate_g"] + 4 * food["protein_g"] + 9 * food["fat_g"]
        assert abs(derived - food["energy_kcal"]) <= 0.02 * food["energy_kcal"], food["id"]


def test_predict_jpeg_returns_ranked_top3_with_nutrition(client):
    response = upload(client, encode_image("JPEG"))
    assert response.status_code == 200
    body = response.json()

    predictions = body["predictions"]
    assert len(predictions) == 3
    confidences = [p["confidence"] for p in predictions]
    assert confidences == sorted(confidences, reverse=True)
    assert all(0 <= c <= 1 for c in confidences)
    assert sum(confidences) <= 1.0001
    assert {p["food_id"] for p in predictions} <= SUPPORTED

    assert body["nutrition"]["id"] == predictions[0]["food_id"]
    assert body["low_confidence"] == (confidences[0] < body["confidence_threshold"])
    assert body["model"]["mode"] == "demo"
    assert body["inference_ms"] >= 0
    assert "standard serving" in body["disclaimer"]


def test_predict_accepts_png(client):
    assert upload(client, encode_image("PNG"), "meal.png", "image/png").status_code == 200


def test_demo_predictions_are_deterministic_per_image(client):
    image = encode_image("PNG", colour=(10, 90, 30))
    first = upload(client, image, "a.png", "image/png").json()["predictions"]
    second = upload(client, image, "a.png", "image/png").json()["predictions"]
    assert first == second


def test_predict_rejects_non_image(client):
    response = upload(client, b"just some text", "notes.txt", "text/plain")
    assert response.status_code == 415
    assert response.json()["detail"]["code"] == "unsupported_type"


def test_predict_rejects_gif_even_with_jpg_name(client):
    response = upload(client, encode_image("GIF"), "sneaky.jpg", "image/jpeg")
    assert response.status_code == 415


def test_predict_rejects_corrupt_jpeg(client):
    response = upload(client, b"\xff\xd8\xff\xe0" + b"\x00garbage" * 50)
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "unreadable_image"


def test_predict_rejects_empty_file(client):
    response = upload(client, b"")
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "empty_file"


def test_predict_rejects_tiny_image(client):
    response = upload(client, encode_image("PNG", size=(32, 32)), "tiny.png", "image/png")
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "image_too_small"


def test_predict_rejects_oversized_upload(settings):
    client = TestClient(create_app(replace(settings, max_upload_bytes=2_000)))
    response = upload(client, encode_image("PNG", size=(400, 400)) + b"\x00" * 4_000, "big.png", "image/png")
    assert response.status_code == 413
    assert response.json()["detail"]["code"] == "file_too_large"


def test_predict_requires_a_file(client):
    assert client.post("/api/predict").status_code == 422


class FixedClassifier:
    """Stub returning a label that has no nutrition entry."""

    info = ModelInfo(name="stub", architecture="stub", mode="onnx", input_size=224, labels=["kuih_lapis", "laksa"])

    def predict(self, image):
        return [Prediction("kuih_lapis", 0.55), Prediction("laksa", 0.45)]


def test_missing_nutrition_entry_returns_null_nutrition(settings):
    client = TestClient(create_app(settings, classifier=FixedClassifier()))
    body = upload(client, encode_image()).json()
    assert body["predictions"][0]["food_id"] == "kuih_lapis"
    assert body["predictions"][0]["name"] == "Kuih lapis"
    assert body["nutrition"] is None
    assert body["low_confidence"] is True
    assert len(body["predictions"]) == 2


def test_frontend_is_served_with_spa_fallback(settings):
    dist = settings.frontend_dist
    (dist / "assets").mkdir(parents=True)
    (dist / "index.html").write_text("<!doctype html><title>Pinggan</title>")
    (dist / "assets" / "app.js").write_text("console.log('ok')")
    (dist / "manifest.webmanifest").write_text("{}")
    client = TestClient(create_app(settings))

    assert "Pinggan" in client.get("/").text
    assert "Pinggan" in client.get("/progress").text
    assert client.get("/assets/app.js").text == "console.log('ok')"
    assert client.get("/manifest.webmanifest").text == "{}"
    assert client.get("/api/does-not-exist").status_code == 404
    assert "Pinggan" in client.get("/../../etc/passwd").text
