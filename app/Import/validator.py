from datetime import datetime

DATE_FORMATS: list[str] = [
    "%Y-%m-%d",
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%d %H:%M",
    "%d-%m-%Y",
    "%d-%m-%Y %H:%M:%S",
    "%d-%m-%Y %H:%M",
    "%m/%d/%Y",
    "%m/%d/%Y %H:%M:%S",
    "%m/%d/%Y %H:%M",
    "%d/%m/%Y",
    "%d/%m/%Y %H:%M:%S",
    "%d/%m/%Y %H:%M",
    "%Y/%m/%d",
    "%Y/%m/%d %H:%M:%S",
    "%Y/%m/%d %H:%M",
    "%Y%m%d",
]


def validate_row(
    row: dict[str, str],
    row_number: int,
) -> tuple[dict | None, list[str]]:
    errors: list[str] = []
    validated: dict = {}

    _validate_amount(row, validated, errors)
    _validate_type(row, validated, errors)
    _validate_category(row, validated, errors)
    _validate_datetime(row, validated, errors)
    _validate_note(row, validated)

    if errors:
        return None, errors
    return validated, []


def _validate_amount(
    row: dict[str, str],
    validated: dict,
    errors: list[str],
) -> None:
    raw = (row.get("amount") or "").strip()
    if not raw:
        errors.append("amount is required")
        return

    cleaned = raw.replace(",", "").replace(" ", "")
    try:
        value = float(cleaned)
    except ValueError:
        errors.append(f"amount must be numeric, got '{raw}'")
        return

    if value <= 0:
        errors.append(f"amount must be greater than 0, got {value}")
        return

    validated["amount"] = int(value)


def _validate_type(
    row: dict[str, str],
    validated: dict,
    errors: list[str],
) -> None:
    raw = (row.get("type") or "").strip().lower()
    if not raw:
        errors.append("type is required")
        return

    if raw not in ("income", "expense"):
        errors.append(f"type must be 'Income' or 'Expense', got '{raw}'")
        return

    validated["type"] = raw


def _validate_category(
    row: dict[str, str],
    validated: dict,
    errors: list[str],
) -> None:
    raw = (row.get("category") or "").strip()
    if not raw:
        errors.append("category is required")
        return

    validated["category"] = raw


def _validate_datetime(
    row: dict[str, str],
    validated: dict,
    errors: list[str],
) -> None:
    raw = (row.get("transaction_datetime") or "").strip()
    if not raw:
        errors.append("transaction date is required")
        return

    parsed: datetime | None = None
    for fmt in DATE_FORMATS:
        try:
            parsed = datetime.strptime(raw, fmt)
            break
        except ValueError:
            continue

    if parsed is None:
        errors.append(f"invalid date format '{raw}'")
        return

    validated["transaction_datetime"] = parsed


def _validate_note(
    row: dict[str, str],
    validated: dict,
) -> None:
    raw = (row.get("note") or "").strip()
    if raw:
        validated["note"] = raw
