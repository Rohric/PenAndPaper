"""Make uploaded pictures smaller, so every phone at the table loads them quickly."""

from io import BytesIO

from django.core.files.base import ContentFile
from PIL import Image, ImageOps

# The longest side of a picture after the upload, in pixels.
CHARACTER_PICTURE = 800
ENTRY_PICTURE = 1600
JPEG_QUALITY = 85
# The kinds of pictures that are written again, and as what; everything else stays as it was uploaded.
SHRINKABLE = {"JPEG": "JPEG", "MPO": "JPEG", "PNG": "PNG", "WEBP": "WEBP"}


def shrink_image(image, longest):
    """Return the uploaded picture made smaller, so its longest side has at most the given pixels.

    Small pictures and kinds that should not be written again (like animations) stay as they are. A photo
    is turned the way the camera was held first, because that note gets lost when it is written again.
    """
    picture = Image.open(image)
    kind = SHRINKABLE.get(picture.format)
    image.seek(0)
    if kind is None or max(picture.size) <= longest:
        return image
    picture = ImageOps.exif_transpose(picture)
    picture.thumbnail((longest, longest))
    return _as_upload(picture, image.name, kind)


def _as_upload(picture, name, kind):
    """Write a picture into a file that is saved like an upload."""
    if kind == "JPEG" and picture.mode not in ("RGB", "L"):
        picture = picture.convert("RGB")
    options = {"quality": JPEG_QUALITY} if kind == "JPEG" else {}
    buffer = BytesIO()
    picture.save(buffer, format=kind, optimize=True, **options)
    return ContentFile(buffer.getvalue(), name=name)
