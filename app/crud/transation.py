from sqlalchemy.orm import Session
from app.models.tables import Transaction
from app.models.transation_schema import Add_Transaction, Update_Transaction, Delete_Transaction
from datetime import date
from fastapi.security import OAuth2PasswordBearer
from fastapi import HTTPException , Depends
from app.Auth.auth import create_token,verify_token
from app.Auth.utils import get_user,verify_password
import math
from datetime import datetime
from typing import Optional
from sqlalchemy import asc, desc, or_



def add_transaction(db:Session , transaction:Add_Transaction, token:str):
    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    if transaction.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    

    transaction_datetime = datetime.combine(transaction.date, transaction.time)

    transaction_data = Transaction(
        user_id = int(token_data.get("sub")), # Automatically use the logged-in user's ID
        type = transaction.type,
        amount = transaction.amount,
        category = transaction.category,
        note = transaction.note,
        transaction_datetime = transaction_datetime
    )    
    db.add(transaction_data)
    db.commit()
    db.refresh(transaction_data)
    return transaction_data  





from sqlalchemy import asc, desc
import math
from typing import Optional

def get_transaction(
    db: Session,
    token: str,
    page: int = 1,
    limit: int = 20,
    category: Optional[str] = None,
    transaction_type: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None,
    sort_by: str = "date",
    order: str = "desc"
):
    """
    Get transactions with filtering, searching,
    sorting and pagination.
    """

    # ----------------------------------
    # Verify JWT
    # ----------------------------------
    token_data = verify_token(token)

    if not token_data:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    # ----------------------------------
    # Pagination Validation
    # ----------------------------------

    if page < 1:
        raise HTTPException(
            status_code=400,
            detail="Page must be greater than 0"
        )

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 100"
        )

    # ----------------------------------
    # Amount Validation
    # ----------------------------------

    if (
        min_amount is not None
        and max_amount is not None
        and min_amount > max_amount
    ):
        raise HTTPException(
            status_code=400,
            detail="min_amount cannot be greater than max_amount"
        )

    # ----------------------------------
    # Date Validation
    # ----------------------------------

    if (
        start_date is not None
        and end_date is not None
        and start_date > end_date
    ):
        raise HTTPException(
            status_code=400,
            detail="start_date cannot be greater than end_date"
        )

    # ----------------------------------
    # Sorting Validation
    # ----------------------------------

    sort_columns = {
        "amount": Transaction.amount,
        "date": Transaction.transaction_datetime,
        "category": Transaction.category,
        "type": Transaction.type,
    }

    if sort_by not in sort_columns:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sort_by. Allowed values: {list(sort_columns.keys())}"
        )

    if order.lower() not in ["asc", "desc"]:
        raise HTTPException(
            status_code=400,
            detail="Order must be either 'asc' or 'desc'"
        )

    # ----------------------------------
    # Base Query
    # ----------------------------------

    query = db.query(Transaction).filter(
        Transaction.user_id == int(token_data.get("sub"))
    )

    # ----------------------------------
    # Filters
    # ----------------------------------

    if category:
        query = query.filter(
            Transaction.category.ilike(category)
        )

    if transaction_type:
        query = query.filter(
            Transaction.type == transaction_type
        )

    if min_amount is not None:
        query = query.filter(
            Transaction.amount >= min_amount
        )

    if max_amount is not None:
        query = query.filter(
            Transaction.amount <= max_amount
        )

    if start_date:
        query = query.filter(
            Transaction.transaction_datetime >= start_date
        )

    if end_date:
        query = query.filter(
            Transaction.transaction_datetime <= end_date
        )

    # ----------------------------------
    # Search
    # ----------------------------------

    if search:
        query = query.filter(
            or_(
                Transaction.note.ilike(f"%{search}%"),
                Transaction.category.ilike(f"%{search}%")
            )
        )

    # ----------------------------------
    # Total Records
    # ----------------------------------

    total_records = query.count()

    # ----------------------------------
    # Sorting
    # ----------------------------------

    sort_column = sort_columns[sort_by]

    if order.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    # ----------------------------------
    # Pagination
    # ----------------------------------

    offset = (page - 1) * limit

    transactions = (
        query
        .offset(offset)
        .limit(limit)
        .all()
    )

    total_pages = math.ceil(total_records / limit)

    # ----------------------------------
    # Response
    # ----------------------------------

    return {
        "page": page,
        "limit": limit,
        "total_records": total_records,
        "total_pages": total_pages,
        "items": transactions
    }


def Update_transation(db:Session , transaction:Update_Transaction, token:str):
    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    if transaction.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    
    # Find the transaction AND ensure it belongs to the logged-in user
    user_id = int(token_data.get("sub"))
    transaction_data = db.query(Transaction).filter(
        Transaction.id == transaction.transaction_id,
        Transaction.user_id == user_id
    ).first()
    
    if not transaction_data:
        raise HTTPException(status_code=404, detail="Transaction not found or you don't have permission to modify it")
    transaction_data.type = transaction.type
    transaction_data.amount = transaction.amount
    transaction_data.category = transaction.category
    transaction_data.note = transaction.note
    
    transaction_data.transaction_datetime = datetime.combine(transaction.date, transaction.time)
    
    db.commit()
    db.refresh(transaction_data)
    return transaction_data



def delete_transation(db:Session , transaction:Delete_Transaction, token:str):
    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Find the transaction AND ensure it belongs to the logged-in user
    user_id = int(token_data.get("sub"))
    transaction_data = db.query(Transaction).filter(
        Transaction.id == transaction.transaction_id,
        Transaction.user_id == user_id
    ).first()
    
    if not transaction_data:
        raise HTTPException(status_code=404, detail="Transaction not found or you don't have permission to delete it")
    db.delete(transaction_data)
    db.commit()
    return transaction_data
