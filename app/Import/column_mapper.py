SYNONYM_MAP: dict[str, list[str]] = {
    "amount": [
        "amount",
        "expense amount",
        "money",
        "cost",
        "sum",
        "value",
        "price",
        "total",
        "transaction amount",
    ],
    "note": [
        "remark",
        "description",
        "comments",
        "notes",
        "memo",
        "details",
        "note",
    ],
    "transaction_datetime": [
        "expense date",
        "date",
        "transaction date",
        "tran date",
        "date time",
        "datetime",
        "date/time",
        "transaction datetime",
        "tran date time",
        "created at",
    ],
    "category": [
        "category",
        "expense category",
        "tags",
        "group",
        "spending category",
    ],
    "type": [
        "transaction type",
        "type",
        "tran type",
        "txn type",
        "income/expense",
    ],
}

REQUIRED_FIELDS = {"amount", "category", "type", "transaction_datetime"}


def map_columns(uploaded_columns: list[str]) -> dict[str, str]:
    """Return {uploaded_column_name -> internal_field_name}."""
    mapping: dict[str, str] = {}
    for col in uploaded_columns:
        normalized = col.strip().lower()
        for internal_field, synonyms in SYNONYM_MAP.items():
            if normalized in synonyms:
                mapping[col] = internal_field
                break
    return mapping


def apply_mapping(row: dict[str, str], mapping: dict[str, str]) -> dict[str, str]:
    """Re-key a row so that uploaded column names become internal field names."""
    return {mapping.get(k, k): v for k, v in row.items()}


def check_required_columns(mapping: dict[str, str]) -> list[str]:
    """Return a list of required internal fields that were not mapped."""
    mapped_fields = set(mapping.values())
    return [f for f in sorted(REQUIRED_FIELDS) if f not in mapped_fields]
