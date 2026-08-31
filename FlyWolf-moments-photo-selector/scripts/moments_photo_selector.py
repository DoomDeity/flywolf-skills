#!/usr/bin/env python3
"""Pillow-based final photo selection, grouping, naming, and validation helper."""

from __future__ import annotations

import argparse
import csv
import re
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

from PIL import Image, ImageDraw, ImageFont, ImageOps


IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".tif",
    ".tiff",
    ".bmp",
    ".webp",
}
FINAL_NAME_PATTERN = re.compile(r"^(\d+)(?:-(\d+))?$")
try:
    RESAMPLE = Image.Resampling.LANCZOS
except AttributeError:  # pragma: no cover - compatibility with older Pillow
    RESAMPLE = Image.LANCZOS


def image_files(folder: Path, excluded_names: Optional[Sequence[str]] = None) -> List[Path]:
    excluded = {name.casefold() for name in (excluded_names or [])}
    return sorted(
        (
            path
            for path in folder.iterdir()
            if path.is_file()
            and path.suffix.lower() in IMAGE_EXTENSIONS
            and path.name.casefold() not in excluded
        ),
        key=lambda path: path.name.casefold(),
    )


def open_oriented(path: Path) -> Image.Image:
    with Image.open(path) as image:
        return ImageOps.exif_transpose(image).convert("RGB")


def image_info(path: Path) -> Tuple[int, int, str]:
    with open_oriented(path) as image:
        width, height = image.size
    return width, height, "H" if width >= height else "V"


def load_font(size: int) -> ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


def write_inventory(files: Sequence[Path], output: Path) -> Tuple[Path, Path]:
    output.mkdir(parents=True, exist_ok=True)
    inventory_path = output / "inventory.csv"
    mapping_template_path = output / "mapping_template.csv"
    with inventory_path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["index", "filename", "width", "height", "orientation"],
        )
        writer.writeheader()
        for index, path in enumerate(files, start=1):
            try:
                width, height, orientation = image_info(path)
            except Exception:
                width, height, orientation = "", "", "ERROR"
            writer.writerow(
                {
                    "index": index,
                    "filename": path.name,
                    "width": width,
                    "height": height,
                    "orientation": orientation,
                }
            )
    with mapping_template_path.open("w", newline="", encoding="utf-8-sig") as handle:
        csv.DictWriter(handle, fieldnames=["target", "source"]).writeheader()
    return inventory_path, mapping_template_path


def _draw_thumbnail(
    canvas: Image.Image,
    path: Path,
    x: int,
    y: int,
    width: int,
    height: int,
    draw: ImageDraw.ImageDraw,
    font: ImageFont.ImageFont,
) -> None:
    try:
        with open_oriented(path) as image:
            image.thumbnail((width, height), RESAMPLE)
            paste_x = x + (width - image.width) // 2
            paste_y = y + (height - image.height) // 2
            canvas.paste(image, (paste_x, paste_y))
    except Exception as error:
        draw.text((x + 8, y + 8), f"ERROR: {error}", fill=(180, 0, 0), font=font)


def make_contact_sheets(
    files: Sequence[Path],
    output: Path,
    cols: int,
    rows: int,
    thumb_width: int,
    thumb_height: int,
    label_height: int,
) -> List[Path]:
    sheet_dir = output / "contact_sheets"
    sheet_dir.mkdir(parents=True, exist_ok=True)
    per_sheet = cols * rows
    paths: List[Path] = []
    font = load_font(18)
    padding = 12

    for sheet_index in range((len(files) + per_sheet - 1) // per_sheet):
        sheet_width = cols * (thumb_width + padding) + padding
        sheet_height = rows * (thumb_height + label_height + padding) + padding
        sheet = Image.new("RGB", (sheet_width, sheet_height), "white")
        draw = ImageDraw.Draw(sheet)
        batch = files[sheet_index * per_sheet : (sheet_index + 1) * per_sheet]
        for offset, path in enumerate(batch):
            row, col = divmod(offset, cols)
            x = padding + col * (thumb_width + padding)
            y = padding + row * (thumb_height + label_height + padding)
            draw.rectangle(
                [x, y, x + thumb_width, y + thumb_height], fill=(245, 245, 245)
            )
            _draw_thumbnail(sheet, path, x, y, thumb_width, thumb_height, draw, font)
            draw.rectangle(
                [x, y + thumb_height, x + thumb_width, y + thumb_height + label_height],
                fill=(20, 20, 20),
            )
            label = f"{sheet_index * per_sheet + offset + 1:04d} {path.name}"
            draw.text((x + 8, y + thumb_height + 7), label, fill="white", font=font)

        path = sheet_dir / f"contact_sheet_{sheet_index + 1:03d}.jpg"
        sheet.save(path, quality=92)
        sheet.close()
        paths.append(path)
    return paths


def _filename_only(value: str, label: str) -> str:
    candidate = value.strip()
    path = Path(candidate)
    if not candidate or path.is_absolute() or path.name != candidate or candidate in {".", ".."}:
        raise ValueError(f"{label} must be a filename in the selected folder: {value}")
    return candidate


def read_mapping(path: Path) -> List[Dict[str, str]]:
    if not path.is_file():
        raise FileNotFoundError(f"Mapping file not found: {path}")
    with path.open("r", newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        raise ValueError("Mapping CSV is empty.")
    if not rows[0].keys() >= {"target", "source"}:
        raise ValueError("Mapping CSV must contain target and source columns.")

    result: List[Dict[str, str]] = []
    targets = set()
    for row in rows:
        target = _filename_only(str(row.get("target") or ""), "target")
        source = _filename_only(str(row.get("source") or ""), "source")
        if target.casefold() in targets:
            raise ValueError(f"Duplicate target filename: {target}")
        targets.add(target.casefold())
        result.append({"target": target, "source": source})
    return result


def _source_path(source_root: Path, name: str) -> Path:
    candidate = (source_root / name).resolve()
    try:
        candidate.relative_to(source_root.resolve())
    except ValueError as error:
        raise ValueError(f"Source file must stay inside the source folder: {name}") from error
    if not candidate.is_file():
        raise FileNotFoundError(f"Source image missing: {candidate}")
    return candidate


def copy_and_rename(source: Path, output: Path, mapping_path: Path) -> Tuple[Path, Path, List[Path]]:
    mapping = read_mapping(mapping_path)
    final_dir = output / "final_grouped"
    final_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = output / "selected_manifest.csv"
    copied: List[Path] = []
    manifest_rows = []
    for order, row in enumerate(mapping, start=1):
        source_path = _source_path(source, row["source"])
        target_path = final_dir / row["target"]
        shutil.copy2(source_path, target_path)
        copied.append(target_path)
        manifest_rows.append(
            {
                "order": order,
                "target": row["target"],
                "source": row["source"],
                "source_path": str(source_path),
            }
        )
    with manifest_path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=["order", "target", "source", "source_path"])
        writer.writeheader()
        writer.writerows(manifest_rows)
    return final_dir, manifest_path, copied


def rename_existing(source: Path, mapping_path: Path) -> Path:
    mapping = read_mapping(mapping_path)
    source_root = source.resolve()
    source_paths = [_source_path(source_root, row["source"]) for row in mapping]
    source_names = {path.name.casefold() for path in source_paths}
    target_paths = [source_root / row["target"] for row in mapping]
    for target_path in target_paths:
        if target_path.exists() and target_path.name.casefold() not in source_names:
            raise FileExistsError(f"Target already exists and is not part of the mapping: {target_path}")

    temporary_paths: List[Path] = []
    for index, source_path in enumerate(source_paths, start=1):
        temporary_path = source_root / f".__moments_selector_tmp_{index:04d}__{source_path.name}"
        if temporary_path.exists():
            raise FileExistsError(f"Temporary rename path already exists: {temporary_path}")
        source_path.rename(temporary_path)
        temporary_paths.append(temporary_path)
    for temporary_path, row in zip(temporary_paths, mapping):
        temporary_path.rename(source_root / row["target"])
    return source_root


def _orientation_for_group(files: Sequence[Path]) -> List[str]:
    orientations = []
    for path in files:
        try:
            orientations.append(image_info(path)[2])
        except Exception:
            orientations.append("ERROR")
    return sorted(set(orientations))


def final_directory(output: Path, rename_mode: bool) -> Path:
    return output if rename_mode else output / "final_grouped"


def validate_final_groups(output: Path, rename_mode: bool) -> None:
    directory = final_directory(output, rename_mode)
    files = image_files(directory, excluded_names=["final_grouped_preview.jpg"])
    errors: List[str] = []
    if len(files) != 27:
        errors.append(f"Expected 27 images, found {len(files)}.")

    groups: Dict[int, List[Path]] = {index: [] for index in range(1, 10)}
    for path in files:
        match = FINAL_NAME_PATTERN.match(path.stem)
        if match and 1 <= int(match.group(1)) <= 9:
            groups[int(match.group(1))].append(path)

    for group_number, group_files in groups.items():
        if not group_files:
            errors.append(f"Group {group_number} is missing.")
            continue
        if len(group_files) % 2 == 0:
            errors.append(f"Group {group_number} has an even count: {len(group_files)}.")
        if len(group_files) > 5:
            errors.append(f"Group {group_number} has more than 5 images: {len(group_files)}.")
        orientations = _orientation_for_group(group_files)
        if len(orientations) > 1:
            errors.append(f"Group {group_number} mixes vertical and horizontal images.")
        if "ERROR" in orientations:
            errors.append(f"Group {group_number} contains an unreadable image.")

    if errors:
        raise ValueError("\n".join(errors))
    print(f"Validation passed: {directory}")


def _final_sort_key(path: Path) -> Tuple[int, int, str]:
    match = FINAL_NAME_PATTERN.match(path.stem)
    if not match:
        return 999, 999, path.name.casefold()
    group = int(match.group(1))
    item = int(match.group(2) or 0)
    return group, item, path.name.casefold()


def make_final_preview(output: Path, rename_mode: bool) -> Path:
    directory = final_directory(output, rename_mode)
    files = sorted(
        image_files(directory, excluded_names=["final_grouped_preview.jpg"]),
        key=_final_sort_key,
    )
    if not files:
        raise ValueError(f"No final images available for preview: {directory}")

    preview_path = directory / "final_grouped_preview.jpg" if rename_mode else output / "final_grouped_preview.jpg"
    thumb_width, thumb_height, label_height = 360, 480, 32
    cols, padding = 3, 12
    rows = (len(files) + cols - 1) // cols
    sheet = Image.new(
        "RGB",
        (cols * (thumb_width + padding) + padding, rows * (thumb_height + label_height + padding) + padding),
        "white",
    )
    draw = ImageDraw.Draw(sheet)
    font = load_font(15)
    for index, path in enumerate(files):
        row, col = divmod(index, cols)
        x = padding + col * (thumb_width + padding)
        y = padding + row * (thumb_height + label_height + padding)
        draw.rectangle([x, y, x + thumb_width, y + thumb_height], fill=(245, 245, 245))
        _draw_thumbnail(sheet, path, x, y, thumb_width, thumb_height, draw, font)
        draw.rectangle(
            [x, y + thumb_height, x + thumb_width, y + thumb_height + label_height],
            fill=(20, 20, 20),
        )
        draw.text((x + 8, y + thumb_height + 7), path.name, fill="white", font=font)
    sheet.save(preview_path, quality=92)
    sheet.close()
    return preview_path


def parse_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare and validate final photo selections.")
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--mapping", "--mapping-csv", dest="mapping", type=Path)
    parser.add_argument("--contact-sheets", "--make-contact-sheets", dest="contact_sheets", action="store_true")
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument("--copy-and-rename", action="store_true")
    modes.add_argument("--rename-existing", action="store_true")
    parser.add_argument("--validate", action="store_true")
    parser.add_argument("--preview", "--make-preview", dest="preview", action="store_true")
    parser.add_argument("--cols", type=int, default=4)
    parser.add_argument("--rows", type=int, default=5)
    parser.add_argument("--thumb-w", type=int, default=360)
    parser.add_argument("--thumb-h", type=int, default=270)
    return parser.parse_args(argv)


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = parse_args(argv)
    if not args.source.is_dir():
        raise FileNotFoundError(f"Source folder not found: {args.source}")
    if min(args.cols, args.rows, args.thumb_w, args.thumb_h) < 1:
        raise ValueError("cols, rows, thumb-w, and thumb-h must be positive")
    if args.copy_and_rename or args.rename_existing:
        if not args.mapping:
            raise ValueError("--mapping is required for rename operations")
    args.output.mkdir(parents=True, exist_ok=True)
    files = image_files(args.source)
    if not files:
        raise ValueError(f"No supported image files found in {args.source}")

    inventory_path, mapping_template_path = write_inventory(files, args.output)
    print(f"Inventory: {inventory_path}")
    print(f"Mapping template: {mapping_template_path}")
    print(f"Image count: {len(files)}")

    if args.contact_sheets:
        contact_paths = make_contact_sheets(
            files, args.output, args.cols, args.rows, args.thumb_w, args.thumb_h, 34
        )
        print(f"Contact sheets: {len(contact_paths)} files in {args.output / 'contact_sheets'}")

    rename_mode = bool(args.rename_existing)
    if args.copy_and_rename:
        final_dir, manifest_path, copied = copy_and_rename(args.source, args.output, args.mapping)
        print(f"Final folder: {final_dir}")
        print(f"Manifest: {manifest_path}")
        print(f"Selected count: {len(copied)}")
    elif args.rename_existing:
        renamed_dir = rename_existing(args.source, args.mapping)
        print(f"Renamed working folder: {renamed_dir}")

    if args.validate:
        validate_final_groups(args.output, rename_mode)
    if args.preview:
        preview_path = make_final_preview(args.output, rename_mode)
        print(f"Final preview: {preview_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (FileNotFoundError, OSError, ValueError) as error:
        print(f"ERROR: {error}")
        raise SystemExit(1)
