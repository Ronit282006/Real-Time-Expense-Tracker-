from sqlalchemy.orm import Session

from app.models.tables import Transaction, Create_Account_Table
from app.schemas.transaction import CreateTransaction, UpdateTransaction
from app.crud.transaction import (
    create_transaction as crud_create_transaction,
    get_transactions as crud_get_transactions,
    get_transaction as crud_get_transaction,
    update_transaction as crud_update_transaction,
    delete_transaction as crud_delete_transaction,
)


def create_transaction(
    db: Session,
    transaction: CreateTransaction,
    current_user: Create_Account_Table,
) -> Transaction:
    return crud_create_transaction(db, transaction, user_id=current_user.id)


def get_transactions(
    db: Session,
    current_user: Create_Account_Table,
    skip: int = 0,
    limit: int = 100,
):
    return crud_get_transactions(db, user_id=current_user.id, skip=skip, limit=limit)


def get_transaction(
    db: Session,
    transaction_id: int,
    current_user: Create_Account_Table,
) -> Transaction:
    return crud_get_transaction(db, transaction_id, user_id=current_user.id)


def update_transaction(
    db: Session,
    transaction_id: int,
    transaction: UpdateTransaction,
    current_user: Create_Account_Table,
) -> Transaction:
    return crud_update_transaction(
        db, transaction_id, transaction, user_id=current_user.id
    )


def delete_transaction(
    db: Session,
    transaction_id: int,
    current_user: Create_Account_Table,
) -> Transaction:
    return crud_delete_transaction(db, transaction_id, user_id=current_user.id)
