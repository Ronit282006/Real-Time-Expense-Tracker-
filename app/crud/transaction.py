from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.tables import Transaction
from app.schemas.transaction import CreateTransaction, UpdateTransaction


def create_transaction(
    db: Session, transaction: CreateTransaction, user_id: int
) -> Transaction:
    db_transaction = Transaction(
        user_id=user_id,
        type=transaction.type,
        amount=transaction.amount,
        category=transaction.category,
        note=transaction.note,
        transaction_datetime=transaction.transaction_datetime,
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def get_transactions(
    db: Session, user_id: int, skip: int = 0, limit: int = 100
):
    return (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_transaction(
    db: Session, transaction_id: int, user_id: int
) -> Transaction:
    transaction = (
        db.query(Transaction)
        .filter(
            Transaction.id == transaction_id,
            Transaction.user_id == user_id,
        )
        .first()
    )
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )
    return transaction


def update_transaction(
    db: Session,
    transaction_id: int,
    transaction: UpdateTransaction,
    user_id: int,
) -> Transaction:
    db_transaction = get_transaction(db, transaction_id, user_id)
    update_data = transaction.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_transaction, field, value)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def delete_transaction(
    db: Session, transaction_id: int, user_id: int
) -> Transaction:
    db_transaction = get_transaction(db, transaction_id, user_id)
    db.delete(db_transaction)
    db.commit()
    return db_transaction
