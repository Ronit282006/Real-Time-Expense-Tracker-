from sqlalchemy import insert
from sqlalchemy.orm import Session

from app.models.tables import Transaction


def bulk_insert_transactions(
    db: Session,
    user_id: int,
    rows: list[dict],
) -> int:
    values: list[dict] = []
    for row in rows:
        values.append({
            "user_id": user_id,
            "type": row["type"],
            "amount": int(row["amount"]),
            "category": row["category"],
            "note": row.get("note"),
            "transaction_datetime": row["transaction_datetime"],
        })

    stmt = insert(Transaction.__table__)
    db.execute(stmt, values)
    db.commit()
    return len(values)
