from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.models.tables import Transaction, TransactionType

def get_total_income(db: Session, user_id: int) -> float:
    result = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.type == TransactionType.income
    ).scalar()
    return float(result or 0.0)

def get_total_expense(db: Session, user_id: int) -> float:
    result = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.type == TransactionType.expense
    ).scalar()
    return float(result or 0.0)

def get_transaction_count(db: Session, user_id: int) -> int:
    result = db.query(func.count(Transaction.id)).filter(
        Transaction.user_id == user_id
    ).scalar()
    return int(result or 0)

def get_recent_transactions(db: Session, user_id: int, limit: int = 5) -> List[Transaction]:
    return db.query(Transaction).filter(
        Transaction.user_id == user_id
    ).order_by(Transaction.transaction_datetime.desc()).limit(limit).all()

def get_top_expense_category(db: Session, user_id: int) -> Optional[str]:
    result = db.query(Transaction.category).filter(
        Transaction.user_id == user_id,
        Transaction.type == TransactionType.expense
    ).group_by(Transaction.category).order_by(
        func.sum(Transaction.amount).desc()
    ).first()
    return result[0] if result else None

def get_monthly_income(db: Session, user_id: int) -> float:
    # Gets total income for the current month
    current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    result = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.type == TransactionType.income,
        Transaction.transaction_datetime >= current_month
    ).scalar()
    return float(result or 0.0)

def get_monthly_expense(db: Session, user_id: int) -> float:
    # Gets total expense for the current month
    current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    result = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.type == TransactionType.expense,
        Transaction.transaction_datetime >= current_month
    ).scalar()
    return float(result or 0.0)

def get_monthly_summary(db: Session, user_id: int) -> List[dict]:
    # Groups income and expense by YYYY-MM using PostgreSQL to_char
    month_col = func.to_char(Transaction.transaction_datetime, 'YYYY-MM').label('month')
    income_col = func.sum(
        case((Transaction.type == TransactionType.income, Transaction.amount), else_=0)
    ).label('income')
    expense_col = func.sum(
        case((Transaction.type == TransactionType.expense, Transaction.amount), else_=0)
    ).label('expense')

    results = db.query(month_col, income_col, expense_col).filter(
        Transaction.user_id == user_id
    ).group_by(month_col).order_by(month_col).all()

    return [
        {
            "month": row.month,
            "income": float(row.income or 0),
            "expense": float(row.expense or 0)
        }
        for row in results
    ]

def get_expense_by_category(db: Session, user_id: int) -> List[dict]:
    # Groups expenses by category and sums them
    results = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label('amount')
    ).filter(
        Transaction.user_id == user_id,
        Transaction.type == TransactionType.expense
    ).group_by(Transaction.category).order_by(
        func.sum(Transaction.amount).desc()
    ).all()

    return [
        {
            "category": row.category,
            "amount": float(row.amount or 0)
        }
        for row in results
    ]
