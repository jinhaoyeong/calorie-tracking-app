"""Standard-serving nutrition database shared with the frontend (data/malaysian_foods.json)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class NutritionDatabase:
    def __init__(self, payload: dict[str, Any]):
        self.version: str = payload["version"]
        self.basis: str = payload["basis"]
        self.source_url: str = payload.get("source_url", "")
        self._foods: dict[str, dict[str, Any]] = {f["id"]: f for f in payload["foods"]}

    @classmethod
    def from_file(cls, path: Path) -> "NutritionDatabase":
        with path.open(encoding="utf-8") as fh:
            return cls(json.load(fh))

    def get(self, food_id: str) -> dict[str, Any] | None:
        return self._foods.get(food_id)

    def name_for(self, food_id: str) -> str:
        food = self._foods.get(food_id)
        if food:
            return food["name"]
        return food_id.replace("_", " ").capitalize()

    @property
    def ids(self) -> list[str]:
        return list(self._foods)

    def as_dict(self) -> dict[str, Any]:
        return {
            "version": self.version,
            "basis": self.basis,
            "source_url": self.source_url,
            "foods": list(self._foods.values()),
        }
