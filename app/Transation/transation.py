from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.models.transation_schema import (
    Add_Transaction, 
    Update_Transaction, 
    Delete_Transaction,
    TransactionResponse,
    PaginatedTransactionResponse
)
from app.crud.transation import add_transaction, get_transaction, Update_transation, delete_transation
from app.crud.user import oauth2_scheme
from app.database.database import get_db

router = APIRouter()

@router.post("/add-transaction", response_model=TransactionResponse)
async def add_transactions(transaction: Add_Transaction, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    return add_transaction(db, transaction, token)

@router.get("/get-transaction", response_model=PaginatedTransactionResponse)
async def get_transactions(
    page: int = Query(1, ge=1), 
    limit: int = Query(100, ge=1, le=100),
    category: Optional[str] = Query(None),
    transaction_type: Optional[str] = Query(None),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("date", pattern="^(amount|date|category|type)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme)
):
    return get_transaction(
        db, 
        token, 
        page=page, 
        limit=limit,
        category=category,
        transaction_type=transaction_type,
        min_amount=min_amount,
        max_amount=max_amount,
        start_date=start_date,
        end_date=end_date,
        search=search,
        sort_by=sort_by,
        order=order
    )

@router.post("/update-transaction", response_model=TransactionResponse)
async def update_transactions(transaction: Update_Transaction, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    return Update_transation(db, transaction, token)

@router.post("/delete-transaction", response_model=TransactionResponse)
async def delete_transactions(transaction: Delete_Transaction, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    return delete_transation(db, transaction, token)