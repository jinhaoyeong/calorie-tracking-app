from __future__ import annotations

import base64
import io
import json
from dataclasses import replace
from types import SimpleNamespace

import anthropic
import httpx2
import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.classifier import DemoClassifier, OnnxClassifier
from app.config import load_settings
from app.main import create_app, select_classifier
from app.nutrition import NutritionDatabase
from app.vision import MAX_SIDE, ClaudeClassifier
from tests.conftest import encode_image
from tests.test_classifier import config, write_linear_model


class FakeMessages:
    def __init__(self, outcome):
        self.outcome = outcome
        self.requests: list[dict] = []

    def create(self, **request):
        self.requests.append(request)
        if isinstance(self.outcome, Exception):
            raise self.outcome
        return self.outcome


class FakeClient:
    """Stands in for anthropic.Anthropic: records requests and returns a canned response."""

    def __init__(self, outcome):
        self.beta = SimpleNamespace(messages=FakeMessages(outcome))

    @property
    def requests(self) -> list[dict]:
        return self.beta.messages.requests


def answer(matches=(), contains_food=True, stop_reason="end_turn"):
    text = json.dumps({"contains_food": contains_food, "matches": list(matches)})
    return SimpleNamespace(
        stop_reason=stop_reason,
        content=[SimpleNamespace(type="thinking", thinking=""), SimpleNamespace(type="text", text=text)],
    )


def match(food_id: str, confidence: float, addons=()):
    return {"food_id": food_id, "confidence": confidence, "addons": list(addons)}


@pytest.fixture
def nutrition(settings) -> NutritionDatabase:
    return NutritionDatabase.from_file(settings.foods_path)


def claude_client(settings, nutrition, outcome, model="claude-opus-5-5"):
    fake = FakeClient(outcome)
    classifier = ClaudeClassifier(nutrition, model=model, client=fake)
    return TestClient(create_app(settings, classifier=classifier, nutrition=nutrition)), fake


def upload(client: TestClient, data: bytes | None = None):
    return client.post("/api/predict", files={"image": ("meal.jpg", data or encode_image(), "image/jpeg")})


def api_error(cls, status: int):
    request = httpx2.Request("POST", "https://api.anthropic.com/v1/messages")
    return cls("failed", response=httpx2.Response(status, request=request), body=None)


def test_claude_ranks_matches_from_the_whole_food_list(settings, nutrition):
    outcome = answer(
        [
            match("nasi_goreng", 0.08),
            match("nasi_lemak", 0.84, ["telur_mata", "ayam_goreng", "kuah_dhal", "telur_mata"]),
            match("teh_tarik", 0.03),
            match("nasi_lemak", 0.02),
            match("not_a_food", 0.02),
            match("roti_canai", 0.01),
        ]
    )
    client, _ = claude_client(settings, nutrition, outcome)
    body = upload(client).json()

    assert [p["food_id"] for p in body["predictions"]] == ["nasi_lemak", "nasi_goreng", "teh_tarik"]
    assert [p["confidence"] for p in body["predictions"]] == [0.84, 0.08, 0.03]
    # Only add-ons that belong to the dish are kept, each once.
    assert body["predictions"][0]["addons"] == ["telur_mata", "ayam_goreng"]
    assert body["predictions"][1]["addons"] == []
    assert body["nutrition"]["id"] == "nasi_lemak"
    assert body["low_confidence"] is False
    assert body["model"] == {"name": "Claude vision", "architecture": "claude-opus-5-5", "mode": "claude"}


def test_claude_can_recognise_foods_outside_the_ten_model_classes(settings, nutrition):
    client, _ = claude_client(settings, nutrition, answer([match("teh_tarik", 0.9)]))
    body = upload(client).json()
    assert body["predictions"][0]["food_id"] == "teh_tarik"
    assert body["nutrition"]["id"] == "teh_tarik"

    health = client.get("/api/health").json()
    assert health["model"]["mode"] == "claude"
    assert health["model"]["labels"] == nutrition.ids


def test_claude_request_sends_a_downsized_photo_and_a_cached_food_list(settings, nutrition):
    client, fake = claude_client(settings, nutrition, answer([match("laksa", 0.7)]))
    upload(client, encode_image("JPEG", size=(2400, 1800)))

    (request,) = fake.requests
    assert request["model"] == "claude-opus-5-5"
    assert request["fallbacks"] == "default"
    assert request["betas"] == ["server-side-fallback-2026-07-01"]
    assert request["output_config"]["effort"] == "low"

    system = request["system"][0]
    assert system["cache_control"] == {"type": "ephemeral"}
    assert "nasi_lemak: Nasi lemak (Nasi lemak biasa)" in system["text"]
    assert "Add-ons: kuah_dhal, kuah_kari, sambal." in system["text"]

    schema = request["output_config"]["format"]["schema"]
    item = schema["properties"]["matches"]["items"]
    assert item["properties"]["food_id"]["enum"] == nutrition.ids
    assert item["properties"]["addons"]["items"]["enum"] == [a["id"] for a in nutrition.addons]

    image_block, text_block = request["messages"][0]["content"]
    assert text_block["type"] == "text"
    assert image_block["source"]["media_type"] == "image/jpeg"
    photo = Image.open(io.BytesIO(base64.b64decode(image_block["source"]["data"])))
    assert photo.format == "JPEG"
    assert max(photo.size) == MAX_SIDE
    assert photo.size[0] > photo.size[1]


def test_the_food_list_prompt_is_identical_between_scans(settings, nutrition):
    client, fake = claude_client(settings, nutrition, answer([match("laksa", 0.7)]))
    upload(client)
    upload(client, encode_image(colour=(10, 200, 30)))
    first, second = fake.requests
    assert first["system"] == second["system"]
    assert first["output_config"] == second["output_config"]


def test_models_without_server_side_fallback_are_called_without_it(settings, nutrition):
    client, fake = claude_client(settings, nutrition, answer([match("laksa", 0.7)]), model="claude-haiku-5-5")
    assert upload(client).status_code == 200
    assert "fallbacks" not in fake.requests[0]
    assert "betas" not in fake.requests[0]


def test_overconfident_answers_are_scaled_to_add_up_to_one(settings, nutrition):
    outcome = answer([match("satay", 0.9), match("rendang", 0.5), match("laksa", 0.2)])
    client, _ = claude_client(settings, nutrition, outcome)
    confidences = [p["confidence"] for p in upload(client).json()["predictions"]]
    assert sum(confidences) == pytest.approx(1, abs=1e-3)
    assert confidences == sorted(confidences, reverse=True)


def test_uncertain_answer_is_flagged_low_confidence(settings, nutrition):
    client, _ = claude_client(settings, nutrition, answer([match("mee_goreng_mamak", 0.45), match("char_kuey_teow", 0.4)]))
    assert upload(client).json()["low_confidence"] is True


@pytest.mark.parametrize(
    "outcome",
    [answer([], contains_food=False), answer([match("laksa", 0.5)], contains_food=False), answer([])],
)
def test_photo_without_food_is_reported(settings, nutrition, outcome):
    client, _ = claude_client(settings, nutrition, outcome)
    response = upload(client)
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "no_food_detected"


def test_refusal_is_reported_without_a_guess(settings, nutrition):
    client, _ = claude_client(settings, nutrition, SimpleNamespace(stop_reason="refusal", content=[]))
    response = upload(client)
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "not_recognised"


@pytest.mark.parametrize(
    "outcome",
    [
        answer([match("laksa", 0.5)], stop_reason="max_tokens"),
        SimpleNamespace(stop_reason="end_turn", content=[SimpleNamespace(type="text", text="{not json")]),
        SimpleNamespace(stop_reason="end_turn", content=[]),
    ],
)
def test_unusable_answers_fail_cleanly(settings, nutrition, outcome):
    client, _ = claude_client(settings, nutrition, outcome)
    response = upload(client)
    assert response.status_code == 502
    assert response.json()["detail"]["code"] == "recognition_failed"


@pytest.mark.parametrize(
    ("error", "status", "code"),
    [
        (api_error(anthropic.RateLimitError, 429), 503, "recognition_busy"),
        (api_error(anthropic.AuthenticationError, 401), 503, "recognition_unavailable"),
        (api_error(anthropic.InternalServerError, 500), 502, "recognition_failed"),
        (anthropic.APITimeoutError(request=httpx2.Request("POST", "https://api.anthropic.com")), 504, "recognition_timeout"),
        (anthropic.APIConnectionError(request=httpx2.Request("POST", "https://api.anthropic.com")), 503, "recognition_unavailable"),
    ],
)
def test_api_failures_become_clear_errors(settings, nutrition, error, status, code):
    client, _ = claude_client(settings, nutrition, error)
    response = upload(client)
    assert response.status_code == status
    assert response.json()["detail"]["code"] == code
    assert response.json()["detail"]["message"]


def test_invalid_uploads_are_rejected_before_calling_claude(settings, nutrition):
    client, fake = claude_client(settings, nutrition, answer([match("laksa", 0.7)]))
    response = client.post("/api/predict", files={"image": ("notes.txt", b"hello", "text/plain")})
    assert response.status_code == 415
    assert fake.requests == []


def test_auto_mode_picks_claude_only_when_a_key_is_set(settings, nutrition, monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-test")
    assert isinstance(select_classifier(settings, nutrition), DemoClassifier)
    assert isinstance(select_classifier(replace(settings, has_anthropic_key=True), nutrition), ClaudeClassifier)
    forced_demo = replace(settings, has_anthropic_key=True, recognizer="demo")
    assert isinstance(select_classifier(forced_demo, nutrition), DemoClassifier)
    assert isinstance(select_classifier(replace(settings, recognizer="claude"), nutrition), ClaudeClassifier)


def test_an_exported_model_takes_priority_over_claude(settings, nutrition):
    settings.model_dir.mkdir(parents=True)
    write_linear_model(settings.model_dir / "model.onnx", np.eye(3, dtype=np.float32))
    (settings.model_dir / "model_config.json").write_text(json.dumps(config()))
    keyed = replace(settings, has_anthropic_key=True)
    assert isinstance(select_classifier(keyed, nutrition), OnnxClassifier)
    assert isinstance(select_classifier(replace(keyed, recognizer="claude"), nutrition), ClaudeClassifier)


def test_settings_read_the_recognizer_from_the_environment(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-test")
    monkeypatch.setenv("PINGGAN_RECOGNIZER", "Claude")
    monkeypatch.setenv("PINGGAN_CLAUDE_MODEL", "claude-sonnet-5-5")
    settings = load_settings()
    assert (settings.recognizer, settings.claude_model, settings.has_anthropic_key) == ("claude", "claude-sonnet-5-5", True)

    monkeypatch.setenv("ANTHROPIC_API_KEY", "  ")
    assert load_settings().has_anthropic_key is False
    monkeypatch.setenv("PINGGAN_RECOGNIZER", "gpt")
    with pytest.raises(ValueError):
        load_settings()


def test_the_real_sdk_sends_the_request_and_reads_the_answer(nutrition):
    sent: list[httpx2.Request] = []

    def respond(request: httpx2.Request) -> httpx2.Response:
        sent.append(request)
        text = json.dumps({"contains_food": True, "matches": [match("roti_canai", 0.9, ["kuah_dhal"])]})
        message = {
            "id": "msg_test",
            "type": "message",
            "role": "assistant",
            "model": "claude-opus-5-5",
            "content": [{"type": "thinking", "thinking": "", "signature": "sig"}, {"type": "text", "text": text}],
            "stop_reason": "end_turn",
            "stop_sequence": None,
            "usage": {"input_tokens": 2400, "output_tokens": 60},
        }
        return httpx2.Response(200, json=message)

    sdk = anthropic.Anthropic(
        api_key="sk-test",
        base_url="https://api.anthropic.com",
        http_client=anthropic.DefaultHttpxClient(transport=httpx2.MockTransport(respond)),
    )
    predictions = ClaudeClassifier(nutrition, client=sdk).predict(Image.new("RGB", (640, 480), (220, 180, 90)))

    assert [(p.food_id, p.confidence, p.addons) for p in predictions] == [("roti_canai", 0.9, ("kuah_dhal",))]
    (request,) = sent
    assert request.url.path == "/v1/messages"
    assert request.headers["anthropic-beta"] == "server-side-fallback-2026-07-01"
    body = json.loads(request.content)
    assert body["fallbacks"] == "default"
    assert body["output_config"]["format"]["type"] == "json_schema"
