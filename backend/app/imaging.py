"""Upload validation. Images are decoded in memory and never written to disk."""

from __future__ import annotations

import io

from PIL import Image, ImageOps, UnidentifiedImageError

JPEG_MAGIC = b"\xff\xd8\xff"
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"


class ImageRejected(Exception):
    def __init__(self, status: int, code: str, message: str):
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message


def sniff_format(data: bytes) -> str | None:
    """Identify JPG/PNG from the file signature rather than trusting the filename."""
    if data.startswith(JPEG_MAGIC):
        return "jpeg"
    if data.startswith(PNG_MAGIC):
        return "png"
    return None


def decode_upload(data: bytes, *, max_bytes: int, min_side: int) -> Image.Image:
    if not data:
        raise ImageRejected(400, "empty_file", "The uploaded file is empty.")
    if len(data) > max_bytes:
        limit_mb = max_bytes / (1024 * 1024)
        raise ImageRejected(413, "file_too_large", f"Photos must be {limit_mb:g} MB or smaller.")
    if sniff_format(data) is None:
        raise ImageRejected(415, "unsupported_type", "Only JPG or PNG photos are supported.")

    try:
        with Image.open(io.BytesIO(data)) as probe:
            probe.verify()
        image = Image.open(io.BytesIO(data))
        image.load()
    except Image.DecompressionBombError as exc:
        raise ImageRejected(413, "file_too_large", "The photo's resolution is too large.") from exc
    except (UnidentifiedImageError, OSError, SyntaxError) as exc:
        raise ImageRejected(400, "unreadable_image", "The photo could not be read.") from exc

    # Phone cameras store rotation in EXIF; apply it so the model sees the upright dish.
    image = ImageOps.exif_transpose(image)

    if min(image.size) < min_side:
        raise ImageRejected(
            400, "image_too_small", f"The photo is too small. Use one at least {min_side} px wide."
        )
    return image.convert("RGB")
