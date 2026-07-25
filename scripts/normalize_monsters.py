from __future__ import annotations

import json
import math
from pathlib import Path
from statistics import median

from PIL import Image, ImageDraw, ImageFont


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = PROJECT_ROOT / "public" / "assets" / "Monster"
OUTPUT_ROOT = PROJECT_ROOT / "public" / "assets" / "MonsterNormalized"

CANVAS_SIZE = 256
MAX_CONTENT_WIDTH = 240
MAX_CONTENT_HEIGHT = 224
BASELINE_Y = 244
TARGET_ALPHA_AREA = 30_000

SEQUENCES = (
    ("Cam", "Cam", "Cat"),
    ("Hong", "Hong", "Pig"),
    ("Tim", "Tim", "Sheep"),
    ("Trang", "Trang", "Rabbit"),
    ("Xanh_la", "Xanh_la", "Owl"),
)


def natural_frame_number(path: Path) -> int:
    return int(path.stem.rsplit("_", 1)[1])


def alpha_bbox(image: Image.Image, threshold: int) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    mask = alpha.point(
        lambda value: 255 if value > threshold else 0
    )
    bbox = mask.getbbox()

    if bbox is None:
        raise ValueError("Image does not contain visible pixels.")

    return bbox


def alpha_area(image: Image.Image, threshold: int = 16) -> int:
    alpha = image.getchannel("A")
    mask = alpha.point(
        lambda value: 255 if value > threshold else 0
    )
    return mask.histogram()[255]


def calculate_sequence_scale(
    images: list[Image.Image],
) -> tuple[float, dict[str, int]]:
    widths: list[int] = []
    heights: list[int] = []
    areas: list[int] = []

    for image in images:
        left, top, right, bottom = alpha_bbox(image, threshold=16)
        widths.append(right - left)
        heights.append(bottom - top)
        areas.append(alpha_area(image))

    maximum_width = max(widths)
    maximum_height = max(heights)
    median_area = int(median(areas))

    area_scale = math.sqrt(TARGET_ALPHA_AREA / median_area)
    width_scale = MAX_CONTENT_WIDTH / maximum_width
    height_scale = MAX_CONTENT_HEIGHT / maximum_height
    scale = min(area_scale, width_scale, height_scale)

    return scale, {
        "maximumSourceWidth": maximum_width,
        "maximumSourceHeight": maximum_height,
        "medianAlphaArea": median_area,
    }


def normalize_frame(image: Image.Image, scale: float) -> Image.Image:
    cropped = image.crop(alpha_bbox(image, threshold=1))
    resized_width = max(1, round(cropped.width * scale))
    resized_height = max(1, round(cropped.height * scale))
    resized = cropped.resize(
        (resized_width, resized_height),
        Image.Resampling.LANCZOS,
    )

    canvas = Image.new(
        "RGBA",
        (CANVAS_SIZE, CANVAS_SIZE),
        (0, 0, 0, 0),
    )
    position_x = (CANVAS_SIZE - resized_width) // 2
    position_y = BASELINE_Y - resized_height
    canvas.alpha_composite(resized, (position_x, position_y))

    return canvas


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    filename = "arialbd.ttf" if bold else "arial.ttf"
    font_path = Path("C:/Windows/Fonts") / filename

    if font_path.exists():
        return ImageFont.truetype(str(font_path), size)

    return ImageFont.load_default()


def draw_cell(
    preview: Image.Image,
    position: tuple[int, int],
    texture: Image.Image,
    size_ratio: float,
    normalized: bool,
) -> None:
    cell_size = 128
    x, y = position
    draw = ImageDraw.Draw(preview)

    draw.rounded_rectangle(
        (x, y, x + cell_size, y + cell_size),
        radius=13,
        fill=(59, 36, 24, 255),
        outline=(240, 182, 77, 255),
        width=3,
    )

    maximum_size = round(cell_size * size_ratio)

    if normalized:
        sprite = texture.resize(
            (maximum_size, maximum_size),
            Image.Resampling.LANCZOS,
        )
    else:
        scale = min(
            maximum_size / texture.width,
            maximum_size / texture.height,
        )
        sprite = texture.resize(
            (
                max(1, round(texture.width * scale)),
                max(1, round(texture.height * scale)),
            ),
            Image.Resampling.LANCZOS,
        )

    sprite_x = x + (cell_size - sprite.width) // 2
    sprite_y = y + (cell_size - sprite.height) // 2
    preview.alpha_composite(sprite, (sprite_x, sprite_y))


def create_preview(
    original_frames: dict[str, Image.Image],
    normalized_frames: dict[str, Image.Image],
) -> Path:
    preview = Image.new(
        "RGBA",
        (760, 890),
        (23, 23, 47, 255),
    )
    draw = ImageDraw.Draw(preview)
    title_font = load_font(30, bold=True)
    header_font = load_font(22, bold=True)
    label_font = load_font(22)

    draw.text(
        (28, 22),
        "Monster normalization preview",
        fill=(255, 255, 255, 255),
        font=title_font,
    )
    draw.text(
        (305, 78),
        "Current 72%",
        fill=(230, 230, 240, 255),
        font=header_font,
    )
    draw.text(
        (535, 78),
        "Normalized 82%",
        fill=(230, 230, 240, 255),
        font=header_font,
    )

    for index, (_, output_folder, prefix) in enumerate(SEQUENCES):
        row_y = 120 + index * 150
        label_y = row_y + 50

        draw.text(
            (28, label_y),
            prefix,
            fill=(255, 255, 255, 255),
            font=label_font,
        )

        draw_cell(
            preview,
            (300, row_y),
            original_frames[output_folder],
            size_ratio=0.72,
            normalized=False,
        )
        draw_cell(
            preview,
            (530, row_y),
            normalized_frames[output_folder],
            size_ratio=0.82,
            normalized=True,
        )

    preview_path = OUTPUT_ROOT / "_normalization-preview.png"
    preview.save(preview_path, optimize=True)
    return preview_path


def main() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)

    metadata: dict[str, object] = {
        "canvasSize": CANVAS_SIZE,
        "maximumContentWidth": MAX_CONTENT_WIDTH,
        "maximumContentHeight": MAX_CONTENT_HEIGHT,
        "baselineY": BASELINE_Y,
        "targetAlphaArea": TARGET_ALPHA_AREA,
        "sequences": {},
    }
    original_preview_frames: dict[str, Image.Image] = {}
    normalized_preview_frames: dict[str, Image.Image] = {}
    total_frames = 0

    for source_folder, output_folder, prefix in SEQUENCES:
        source_paths = sorted(
            (SOURCE_ROOT / source_folder).glob(f"{prefix}_*.png"),
            key=natural_frame_number,
        )

        if len(source_paths) != 13:
            raise ValueError(
                f"Expected 13 frames for {prefix}, found {len(source_paths)}."
            )

        images = [
            Image.open(path).convert("RGBA")
            for path in source_paths
        ]
        scale, statistics = calculate_sequence_scale(images)
        destination_folder = OUTPUT_ROOT / output_folder
        destination_folder.mkdir(parents=True, exist_ok=True)

        normalized_images: list[Image.Image] = []

        for source_path, image in zip(source_paths, images, strict=True):
            normalized = normalize_frame(image, scale)
            destination_path = destination_folder / source_path.name
            normalized.save(destination_path, optimize=True)
            normalized_images.append(normalized)
            total_frames += 1

        original_preview_frames[output_folder] = images[0].copy()
        normalized_preview_frames[output_folder] = normalized_images[0]
        metadata["sequences"][output_folder] = {
            "prefix": prefix,
            "frameCount": len(source_paths),
            "scale": round(scale, 6),
            **statistics,
        }

        for image in images:
            image.close()

    preview_path = create_preview(
        original_preview_frames,
        normalized_preview_frames,
    )
    metadata_path = OUTPUT_ROOT / "_normalization.json"
    metadata_path.write_text(
        json.dumps(metadata, indent=2),
        encoding="utf-8",
    )

    print(f"Normalized {total_frames} frames.")
    print(f"Output: {OUTPUT_ROOT}")
    print(f"Preview: {preview_path}")
    print(f"Metadata: {metadata_path}")


if __name__ == "__main__":
    main()
