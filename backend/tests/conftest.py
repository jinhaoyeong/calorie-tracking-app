from __future__ import annotations

import io
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import Settings  # noqa: E402
from app.main import create_app  # noqa: E402


def encode_image(fmt: str = "JPEG", size: tuple[int, int] = (320, 240), colour=(200, 120, 40)) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", size, colour).save(buffer, format=fmt)
    return buffer.getvalue()


@pytest.fixture
def settings(tmp_path: Path) -> Settings:
    # An empty model dir forces the demo classifier; an empty dist skips static serving.
    return Settings(model_dir=tmp_path / "models", frontend_dist=tmp_path / "dist")


@pytest.fixture
def client(settings: Settings) -> TestClient:
    return TestClient(create_app(settings))
