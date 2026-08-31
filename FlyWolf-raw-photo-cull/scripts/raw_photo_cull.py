import argparse
import csv
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


IMAGE_EXTS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".tif",
    ".tiff",
    ".bmp",
    ".webp",
}


def image_files(folder: Path):
    return sorted(
        [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS],
        key=lambda p: p.name.lower(),
    )


def open_oriented(path: Path) -> Image.Image:
    im = Image.open(path)
    return ImageOps.exif_transpose(im).convert("RGB")


def image_info(path: Path):
    with open_oriented(path) as im:
        w, h = im.size
    return w, h, "H" if w >= h else "V"


def load_font(size: int):
    for name in ("arial.ttf", "C:/Windows/Fonts/arial.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            pass
    return ImageFont.load_default()


def write_inventory(files, output: Path):
    inventory = output / "inventory.csv"
    template = output / "selection_template.csv"
    with inventory.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["index", "filename", "width", "height", "orientation"],
        )
        writer.writeheader()
        for idx, path in enumerate(files, 1):
            try:
                w, h, orientation = image_info(path)
            except Exception:
                w, h, orientation = "", "", "ERROR"
            writer.writerow(
                {
                    "index": idx,
                    "filename": path.name,
                    "width": w,
                    "height": h,
                    "orientation": orientation,
                }
            )
    with template.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["filename", "scene", "reason"])
        writer.writeheader()
    return inventory, template


def make_contact_sheets(files, output: Path, cols: int, rows: int, thumb_w: int, thumb_h: int, label_h: int):
    sheet_dir = output / "contact_sheets"
    sheet_dir.mkdir(parents=True, exist_ok=True)
    font = load_font(18)
    per_sheet = cols * rows
    paths = []

    for sheet_idx in range((len(files) + per_sheet - 1) // per_sheet):
        batch = files[sheet_idx * per_sheet : (sheet_idx + 1) * per_sheet]
        pad = 12
        sheet_w = cols * (thumb_w + pad) + pad
        sheet_h = rows * (thumb_h + label_h + pad) + pad
        sheet = Image.new("RGB", (sheet_w, sheet_h), "white")
        draw = ImageDraw.Draw(sheet)

        for i, path in enumerate(batch):
            r, c = divmod(i, cols)
            x = pad + c * (thumb_w + pad)
            y = pad + r * (thumb_h + label_h + pad)
            draw.rectangle([x, y, x + thumb_w, y + thumb_h], fill=(245, 245, 245))
            try:
                with open_oriented(path) as im:
                    im.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
                    px = x + (thumb_w - im.width) // 2
                    py = y + (thumb_h - im.height) // 2
                    sheet.paste(im, (px, py))
            except Exception as exc:
                draw.text((x + 8, y + 8), f"ERROR: {exc}", fill=(180, 0, 0), font=font)
            draw.rectangle([x, y + thumb_h, x + thumb_w, y + thumb_h + label_h], fill=(20, 20, 20))
            label = f"{sheet_idx * per_sheet + i + 1:04d} {path.name}"
            draw.text((x + 8, y + thumb_h + 7), label, fill="white", font=font)

        out = sheet_dir / f"contact_sheet_{sheet_idx + 1:03d}.jpg"
        sheet.save(out, quality=92)
        paths.append(out)
    return paths


def read_selection(selection: Path):
    if selection.suffix.lower() == ".csv":
        with selection.open("r", newline="", encoding="utf-8-sig") as f:
            rows = list(csv.DictReader(f))
        if not rows:
            return []
        filename_key = "filename" if "filename" in rows[0] else "source"
        return [row[filename_key].strip() for row in rows if row.get(filename_key, "").strip()]
    return [
        line.strip()
        for line in selection.read_text(encoding="utf-8-sig").splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    ]


def copy_selected(source: Path, output: Path, selection: Path):
    selected_names = read_selection(selection)
    if not selected_names:
        raise SystemExit("Selection file is empty.")
    selected_dir = output / "selected_for_retouch"
    selected_dir.mkdir(parents=True, exist_ok=True)

    manifest_path = output / "selected_manifest.csv"
    copied = []
    with manifest_path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["order", "output_filename", "source_filename", "source_path"])
        writer.writeheader()
        for idx, name in enumerate(selected_names, 1):
            src = source / name
            if not src.exists():
                raise FileNotFoundError(f"Selected source file not found: {src}")
            dst = selected_dir / f"{idx:03d}_{src.name}"
            shutil.copy2(src, dst)
            copied.append(dst)
            writer.writerow(
                {
                    "order": idx,
                    "output_filename": dst.name,
                    "source_filename": src.name,
                    "source_path": str(src),
                }
            )
    return selected_dir, manifest_path, copied


def main():
    parser = argparse.ArgumentParser(description="Prepare and execute large photo culling workflows.")
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--selection", type=Path)
    parser.add_argument("--contact-sheets", action="store_true")
    parser.add_argument("--copy-selected", action="store_true")
    parser.add_argument("--preview", action="store_true")
    parser.add_argument("--cols", type=int, default=5)
    parser.add_argument("--rows", type=int, default=6)
    parser.add_argument("--thumb-w", type=int, default=300)
    parser.add_argument("--thumb-h", type=int, default=240)
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    files = image_files(args.source)
    if not files:
        raise SystemExit(f"No supported image files found in {args.source}")

    inventory, template = write_inventory(files, args.output)
    print(f"Inventory: {inventory}")
    print(f"Selection template: {template}")
    print(f"Image count: {len(files)}")

    if args.contact_sheets:
        paths = make_contact_sheets(files, args.output, args.cols, args.rows, args.thumb_w, args.thumb_h, 34)
        print(f"Contact sheets: {len(paths)} files in {args.output / 'contact_sheets'}")

    copied = []
    if args.copy_selected:
        if not args.selection:
            raise SystemExit("--selection is required with --copy-selected")
        selected_dir, manifest, copied = copy_selected(args.source, args.output, args.selection)
        print(f"Selected folder: {selected_dir}")
        print(f"Selected manifest: {manifest}")
        print(f"Selected count: {len(copied)}")

    if args.preview:
        preview_files = copied
        if not preview_files:
            selected_dir = args.output / "selected_for_retouch"
            preview_files = image_files(selected_dir) if selected_dir.exists() else []
        if not preview_files:
            raise SystemExit("No selected files available for preview.")
        preview_output = args.output / "selected_preview"
        preview_paths = make_contact_sheets(preview_files, preview_output, args.cols, args.rows, args.thumb_w, args.thumb_h, 34)
        print(f"Selected preview: {len(preview_paths)} files in {preview_output / 'contact_sheets'}")


if __name__ == "__main__":
    main()
