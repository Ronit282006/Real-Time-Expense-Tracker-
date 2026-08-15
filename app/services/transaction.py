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


import redis
from app.Dashboard.service import invalidate_dashboard_cache
from app.config import settings

def _invalidate_cache(user_id: int):
    client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        invalidate_dashboard_cache(user_id, client)
    except Exception:
        pass  # Fail gracefully if Redis is down
    finally:
        client.close()

def create_transaction(
    db: Session,
    transaction: CreateTransaction,
    current_user: Create_Account_Table,
) -> Transaction:
    result = crud_create_transaction(db, transaction, user_id=current_user.id)
    _invalidate_cache(current_user.id)
    return result


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
    result = crud_update_transaction(
        db, transaction_id, transaction, user_id=current_user.id
    )
    _invalidate_cache(current_user.id)
    return result


def delete_transaction(
    db: Session,
    transaction_id: int,
    current_user: Create_Account_Table,
) -> Transaction:
    result = crud_delete_transaction(db, transaction_id, user_id=current_user.id)
    _invalidate_cache(current_user.id)
    return result
