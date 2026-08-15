from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class TransactionSchema(BaseModel):
    id: int
    user_id: int
    type: str  # e.g., 'income', 'expense'
    amount: float
    category: str
    note: Optional[str] = None
    transaction_datetime: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class MonthlySummarySchema(BaseModel):
    month: str # e.g., '2023-10'
    income: float
    expense: float

class CategoryExpenseSchema(BaseModel):
    category: str
    amount: float

class DashboardResponse(BaseModel):
    total_income: float
    total_expense: float
    current_balance: float
    transaction_count: int
    monthly_income: float
    monthly_expense: float
    top_expense_category: Optional[str] = None
    recent_transactions: List[TransactionSchema]
    monthly_summary: List[MonthlySummarySchema]
    expense_by_category: List[CategoryExpenseSchema]
