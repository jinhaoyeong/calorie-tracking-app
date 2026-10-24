"""Dish recognition with Claude's vision, used until a trained ONNX model is exported.

Claude sees the photo together with the food list from data/malaysian_foods.json and
answers with its best matches as structured JSON, so it can name any food in the
database (not only the ten model classes) and the add-ons visible on the plate.
Confidences are Claude's own estimates rather than softmax probabilities.
"""

from __future__ import annotations

import base64
import io
import json
import logging
from dataclasses import replace
from typing import Any

import anthropic
from PIL import Image

from .classifier import ModelInfo, Prediction, RecognitionError
from .nutrition import NutritionDatabase

log = logging.getLogger(__name__)

DEFAULT_MODEL = "claude-opus-5-5"
# Claude scales larger photos down to about this size, so sending more only adds upload time.
MAX_SIDE = 1092
MAX_MATCHES = 3
# Per attempt; with one retry this stays inside the serverless function's time limit.
TIMEOUT_SECONDS = 20.0
# Server-side fallback re-runs a declined request on another model within the same call.
FALLBACK_BETA = "server-side-fallback-2026-07-01"
FALLBACK_MODELS = {"claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"}

PROMPT = """You identify Malaysian food and drinks in photos for Pinggan, a calorie-tracking app. \
People photograph one dish or drink at a time, at a mamak, kopitiam, hawker stall, restaurant or at home.

Match the photo against the food list below and return up to 3 matches, best first, using only ids \
from the list.
- confidence is your probability, from 0 to 1, that the match is the food in the photo. The \
confidences add up to 1 or less. When the photo is unclear or the food is not on the list, give the \
closest foods low confidences rather than a confident guess.
- If the photo shows several foods, match the one in the centre or taking up most of the frame.
- addons lists the add-ons, from that food's own add-on list, that you can clearly see in the photo, \
such as a fried egg or a piece of fried chicken served with nasi lemak. Leave out anything you are \
unsure of; the person can add it themselves.
- Judge the food itself, not the plate, packaging or background. Do not estimate the portion size.

Set contains_food to false and return no matches when the photo shows no food or drink, for example \
a person, a menu, a screen or an empty plate.

Foods (id: name (local name). Description. Add-ons):
{foods}

Add-ons (id: name, description):
{addons}"""


def build_prompt(nutrition: NutritionDatabase) -> str:
    foods = []
    for food in nutrition.foods:
        line = f"- {food['id']}: {food['name']}"
        if food["local_name"] != food["name"]:
            line += f" ({food['local_name']})"
        line += f". {food['description']}."
        if food.get("addons"):
            line += f" Add-ons: {', '.join(food['addons'])}."
        foods.append(line)
    addons = [f"- {addon['id']}: {addon['name']}, {addon['description']}" for addon in nutrition.addons]
    return PROMPT.format(foods="\n".join(foods), addons="\n".join(addons))


def build_schema(nutrition: NutritionDatabase) -> dict[str, Any]:
    addon_ids = [addon["id"] for addon in nutrition.addons]
    addon_item: dict[str, Any] = {"type": "string", "enum": addon_ids} if addon_ids else {"type": "string"}
    return {
        "type": "object",
        "properties": {
            "contains_food": {"type": "boolean"},
            "matches": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "food_id": {"type": "string", "enum": nutrition.ids},
                        "confidence": {"type": "number"},
                        "addons": {"type": "array", "items": addon_item},
                    },
                    "required": ["food_id", "confidence", "addons"],
                    "additionalProperties": False,
                },
            },
        },
        "required": ["contains_food", "matches"],
        "additionalProperties": False,
    }


def encode_jpeg(image: Image.Image, max_side: int = MAX_SIDE) -> str:
    picture = image.convert("RGB")
    picture.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    buffer = io.BytesIO()
    picture.save(buffer, format="JPEG", quality=88)
    return base64.standard_b64encode(buffer.getvalue()).decode("ascii")


class ClaudeClassifier:
    def __init__(self, nutrition: NutritionDatabase, model: str = DEFAULT_MODEL, client: Any = None):
        # The SDK reads ANTHROPIC_API_KEY from the environment.
        self.client = client or anthropic.Anthropic(timeout=TIMEOUT_SECONDS, max_retries=1)
        self.model = model
        self.nutrition = nutrition
        self.system = build_prompt(nutrition)
        self.schema = build_schema(nutrition)
        self.info = ModelInfo(
            name="Claude vision",
            architecture=model,
            mode="claude",
            input_size=MAX_SIDE,
            labels=nutrition.ids,
        )

    def request(self, image: Image.Image) -> dict[str, Any]:
        request: dict[str, Any] = {
            "model": self.model,
            "max_tokens": 8000,
            # Picking from a list doesn't need long deliberation, and low effort keeps scans quick.
            "output_config": {"effort": "low", "format": {"type": "json_schema", "schema": self.schema}},
            # The food list is identical on every scan, so it is cached.
            "system": [{"type": "text", "text": self.system, "cache_control": {"type": "ephemeral"}}],
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {"type": "base64", "media_type": "image/jpeg", "data": encode_jpeg(image)},
                        },
                        {"type": "text", "text": "What food is in this photo?"},
                    ],
                }
            ],
        }
        if self.model in FALLBACK_MODELS:
            request["betas"] = [FALLBACK_BETA]
            request["fallbacks"] = "default"
        return request

    def predict(self, image: Image.Image) -> list[Prediction]:
        try:
            response = self.client.beta.messages.create(**self.request(image))
        except anthropic.APITimeoutError as exc:
            raise RecognitionError(
                504, "recognition_timeout", "Identifying the dish took too long. Try again."
            ) from exc
        except anthropic.APIConnectionError as exc:
            raise RecognitionError(
                503, "recognition_unavailable", "Can't reach the recognition service. Try again in a moment."
            ) from exc
        except anthropic.RateLimitError as exc:
            raise RecognitionError(
                503, "recognition_busy", "The recognition service is busy. Try again in a moment."
            ) from exc
        except (anthropic.AuthenticationError, anthropic.PermissionDeniedError) as exc:
            log.error("The Anthropic API rejected the key: %s", exc)
            raise RecognitionError(
                503, "recognition_unavailable", "Food recognition isn't set up correctly on the server."
            ) from exc
        except anthropic.APIStatusError as exc:
            log.error("Claude request failed with %s (request %s): %s", exc.status_code, exc.request_id, exc)
            raise RecognitionError(
                502, "recognition_failed", "The photo couldn't be analysed. Try again."
            ) from exc
        except anthropic.AnthropicError as exc:
            log.error("Claude request could not be sent: %s", exc)
            raise RecognitionError(
                503, "recognition_unavailable", "Food recognition isn't set up correctly on the server."
            ) from exc

        if response.stop_reason == "refusal":
            raise RecognitionError(
                422, "not_recognised", "This photo couldn't be analysed. Try another photo or pick the food from the list."
            )
        text = next((block.text for block in response.content if block.type == "text"), None)
        try:
            if response.stop_reason == "max_tokens" or text is None:
                raise ValueError(f"no complete answer (stop reason {response.stop_reason})")
            return self.parse(json.loads(text))
        except (ValueError, KeyError, TypeError) as exc:
            log.error("Unusable answer from Claude: %s", exc)
            raise RecognitionError(502, "recognition_failed", "The photo couldn't be analysed. Try again.") from exc

    def parse(self, answer: dict[str, Any]) -> list[Prediction]:
        predictions: list[Prediction] = []
        for match in answer["matches"] if answer["contains_food"] else []:
            food = self.nutrition.get(match["food_id"])
            if food is None or any(p.food_id == food["id"] for p in predictions):
                continue
            allowed = food.get("addons", [])
            addons = tuple(addon for addon in dict.fromkeys(match["addons"]) if addon in allowed)
            confidence = min(max(float(match["confidence"]), 0.0), 1.0)
            predictions.append(Prediction(food["id"], confidence, addons))
        if not predictions:
            raise RecognitionError(
                422, "no_food_detected", "No food found in this photo. Fit the dish inside the frame and try again."
            )

        predictions.sort(key=lambda p: p.confidence, reverse=True)
        predictions = predictions[:MAX_MATCHES]
        total = sum(p.confidence for p in predictions)
        if total > 1:
            predictions = [replace(p, confidence=p.confidence / total) for p in predictions]
        return predictions
