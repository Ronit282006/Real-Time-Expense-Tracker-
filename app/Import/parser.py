import csv
from pathlib import Path

import openpyxl


def parse_file(file_path: str) -> list[dict[str, str]]:
    ext = Path(file_path).suffix.lower()
    if ext == ".csv":
        return _parse_csv(file_path)
    if ext in (".xlsx", ".xls"):
        return _parse_xlsx(file_path)
    raise ValueError(f"Unsupported file format: '{ext}'. Only .csv, .xlsx, and .xls are supported.")


def _parse_csv(file_path: str) -> list[dict[str, str]]:
    with open(file_path, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            return []
        rows: list[dict[str, str]] = []
        for row in reader:
            cleaned = {k.strip(): (v or "").strip() for k, v in row.items()}
            rows.append(cleaned)
        return rows


def _parse_xlsx(file_path: str) -> list[dict[str, str]]:
    wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
    ws = wb.active
    raw_rows = list(ws.iter_rows(values_only=True))
    wb.close()

    if not raw_rows:
        return []

    headers = [str(h).strip() if h is not None else "" for h in raw_rows[0]]
    rows: list[dict[str, str]] = []
    for raw_row in raw_rows[1:]:
        row = {}
        for i, value in enumerate(raw_row):
            key = headers[i] if i < len(headers) else f"column_{i}"
            row[key] = str(value).strip() if value is not None else ""
        rows.append(row)

    return rows
