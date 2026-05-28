from __future__ import annotations

import argparse
import csv
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import fitz
from PIL import Image
from rapidocr_onnxruntime import RapidOCR


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT_DIR = PROJECT_ROOT / "data" / "smae"

KNOWN_GROUPS = {
    "verduras": "Verduras",
    "frutas": "Frutas",
    "cereales": "Cereales y tuberculos",
    "leguminosas": "Leguminosas",
    "aoa": "Alimentos de origen animal",
    "leche": "Leche",
    "grasas": "Aceites y grasas",
    "azucares": "Azucares",
    "bebidas": "Bebidas",
    "libres": "Libres en energia",
}

PAGE_GROUP_OVERRIDES = [
    (21, 26, "Verduras"),
    (28, 41, "Frutas"),
    (44, 90, "Cereales y tuberculos"),
    (92, 94, "Leguminosas"),
    (96, 131, "Alimentos de origen animal"),
    (134, 143, "Leche"),
    (146, 161, "Aceites y grasas"),
    (164, 188, "Azucares"),
    (190, 192, "Libres en energia"),
]


@dataclass
class OcrItem:
    x: float
    y: float
    text: str
    score: float


def normalize_text(value: str) -> str:
    return " ".join(value.replace("\n", " ").split()).strip()


def normalize_number(value: str) -> float | None:
    cleaned = (
        value.replace(",", ".")
        .replace("O", "0")
        .replace("o", "0")
        .replace("'", ".")
        .strip()
    )

    if cleaned.upper() == "ND":
        return None

    if re.fullmatch(r"0[1-9]", cleaned):
        cleaned = cleaned[::-1]

    match = re.search(r"-?\d+(?:\.\d+)?", cleaned)
    return float(match.group(0)) if match else None


def find_pdf(pattern: str) -> Path:
    matches = list(Path.home().joinpath("Downloads").glob(pattern))
    if not matches:
        raise FileNotFoundError(f"No PDF matched {pattern!r} in Downloads")
    return matches[0]


def render_page(doc: fitz.Document, page_number: int, image_path: Path, zoom: float) -> None:
    page = doc[page_number - 1]
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
    tmp_path = image_path.with_suffix(".raw.png")
    pix.save(tmp_path)
    Image.open(tmp_path).rotate(90, expand=True).save(image_path)
    tmp_path.unlink(missing_ok=True)


def load_or_run_ocr(ocr: RapidOCR, image_path: Path, cache_path: Path) -> list[OcrItem]:
    if cache_path.exists():
        raw_items = json.loads(cache_path.read_text(encoding="utf-8"))
    else:
        result, _ = ocr(str(image_path))
        raw_items = []
        for box, text, score in result or []:
            xs = [point[0] for point in box]
            ys = [point[1] for point in box]
            raw_items.append(
                {
                    "x": sum(xs) / 4,
                    "y": sum(ys) / 4,
                    "text": normalize_text(text),
                    "score": float(score),
                }
            )
        cache_path.write_text(json.dumps(raw_items, ensure_ascii=False, indent=2), encoding="utf-8")

    return [OcrItem(**item) for item in raw_items]


def infer_group(items: Iterable[OcrItem]) -> str:
    candidates = sorted(items, key=lambda item: item.y, reverse=True)[:80]
    combined = " ".join(item.text.lower() for item in candidates)

    for key, label in KNOWN_GROUPS.items():
        if key in combined:
            return label

    if "origen animal" in combined or "animal" in combined:
        return KNOWN_GROUPS["aoa"]

    return "Sin clasificar"


def resolve_group(page_number: int, items: Iterable[OcrItem]) -> str:
    for start_page, end_page, group in PAGE_GROUP_OVERRIDES:
        if start_page <= page_number <= end_page:
            return group

    return infer_group(items)


def nearest(items: list[OcrItem], y: float, min_x: float, max_x: float) -> str:
    candidates = [
        item
        for item in items
        if min_x <= item.x <= max_x and abs(item.y - y) <= 8 and item.score >= 0.65
    ]
    if not candidates:
        return ""
    return " ".join(item.text for item in sorted(candidates, key=lambda item: item.x))


def extract_page_rows(page_number: int, items: list[OcrItem]) -> list[dict[str, object]]:
    group = resolve_group(page_number, items)
    usable = [item for item in items if item.y < 620 and item.score >= 0.65]
    row_anchor_items = [
        item
        for item in usable
        if (
            (930 <= item.x <= 970 and re.search(r"\d", item.text))
            or (895 <= item.x <= 925 and item.text.lower() in {"taza", "pieza", "gramos", "g"})
        )
    ]

    row_ys: list[float] = []
    for item in sorted(row_anchor_items, key=lambda item: item.y):
        if not row_ys or abs(item.y - row_ys[-1]) > 14:
            row_ys.append(item.y)

    food_items = [item for item in usable if item.x >= 990 and item.score >= 0.75]
    rows: list[dict[str, object]] = []

    for index, y in enumerate(row_ys):
        next_y = row_ys[index + 1] if index + 1 < len(row_ys) else y + 42
        food_parts = [
            item.text
            for item in sorted(food_items, key=lambda item: (item.y, item.x))
            if y - 12 <= item.y < min(next_y - 8, y + 28)
        ]
        food = normalize_text(" ".join(food_parts))

        if not food or food.upper() in {"ALIMENTO", "ND"}:
            continue

        row = {
            "source": "SMAE 5a ed",
            "page": page_number,
            "group": group,
            "food": food,
            "suggested_amount": nearest(usable, y, 935, 965),
            "unit": nearest(usable, y, 895, 925),
            "gross_weight_g": normalize_number(nearest(usable, y, 855, 885)),
            "net_weight_g": normalize_number(nearest(usable, y, 820, 850)),
            "energy_kcal": normalize_number(nearest(usable, y, 785, 812)),
            "protein_g": normalize_number(nearest(usable, y, 748, 774)),
            "lipids_g": normalize_number(nearest(usable, y, 713, 738)),
            "carbs_g": normalize_number(nearest(usable, y, 678, 704)),
        }
        rows.append(row)

    return rows


def write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "source",
        "page",
        "group",
        "food",
        "suggested_amount",
        "unit",
        "gross_weight_g",
        "net_weight_g",
        "energy_kcal",
        "protein_g",
        "lipids_g",
        "carbs_g",
    ]
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_json(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path)
    parser.add_argument("--start", type=int, default=1)
    parser.add_argument("--end", type=int)
    parser.add_argument("--zoom", type=float, default=1.5)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    args = parser.parse_args()

    pdf_path = args.pdf or find_pdf("SMAE 5a ed*.pdf")
    doc = fitz.open(pdf_path)
    end_page = args.end or doc.page_count
    args.output_dir.mkdir(parents=True, exist_ok=True)
    image_dir = args.output_dir / "pages"
    cache_dir = args.output_dir / "ocr"
    image_dir.mkdir(parents=True, exist_ok=True)
    cache_dir.mkdir(parents=True, exist_ok=True)

    ocr = RapidOCR()
    all_rows: list[dict[str, object]] = []

    for page_number in range(args.start, min(end_page, doc.page_count) + 1):
        image_path = image_dir / f"page_{page_number:03}.png"
        cache_path = cache_dir / f"page_{page_number:03}.json"
        if not image_path.exists():
            render_page(doc, page_number, image_path, args.zoom)

        items = load_or_run_ocr(ocr, image_path, cache_path)
        rows = extract_page_rows(page_number, items)
        all_rows.extend(rows)
        print(f"page={page_number} group={resolve_group(page_number, items)} rows={len(rows)}")

    csv_path = args.output_dir / f"smae_foods_{args.start:03}_{end_page:03}.csv"
    json_path = args.output_dir / f"smae_foods_{args.start:03}_{end_page:03}.json"
    write_csv(csv_path, all_rows)
    write_json(json_path, all_rows)
    print(f"wrote={csv_path} rows={len(all_rows)}")
    print(f"wrote={json_path} rows={len(all_rows)}")


if __name__ == "__main__":
    main()
