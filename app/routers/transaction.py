from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_db
from app.dependencies.auth import get_current_user
from app.models.tables import Create_Account_Table
from app.schemas.transaction import (
    CreateTransaction,
    UpdateTransaction,
    TransactionResponse,
)
from app.services.transaction import (
    create_transaction as service_create_transaction,
    get_transactions as service_get_transactions,
    get_transaction as service_get_transaction,
    update_transaction as service_update_transaction,
    delete_transaction as service_delete_transaction,
)

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create(
    transaction: CreateTransaction,
    db: Session = Depends(get_db),
    current_user: Create_Account_Table = Depends(get_current_user),
):
    return service_create_transaction(db, transaction, current_user)


@router.get("/", response_model=List[TransactionResponse])
def list_all(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Create_Account_Table = Depends(get_current_user),
):
    return service_get_transactions(db, current_user, skip=skip, limit=limit)


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: Create_Account_Table = Depends(get_current_user),
):
    return service_get_transaction(db, transaction_id, current_user)


@router.put("/{transaction_id}", response_model=TransactionResponse)
def update(
    transaction_id: int,
    transaction: UpdateTransaction,
    db: Session = Depends(get_db),
    current_user: Create_Account_Table = Depends(get_current_user),
):
    return service_update_transaction(db, transaction_id, transaction, current_user)


@router.delete("/{transaction_id}", response_model=TransactionResponse)
def delete(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: Create_Account_Table = Depends(get_current_user),
):
    return service_delete_transaction(db, transaction_id, current_user)
