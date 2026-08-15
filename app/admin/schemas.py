from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.tables import TransactionType


class AdminMe(BaseModel):
    profile_id: int
    name: str
    email: str
    role: str


class UserStats(BaseModel):
    profile_id: int
    name: str
    email: str
    mobile_number: str
    role: str
    is_active: bool
    created_at: Optional[datetime] = None
    total_income: float
    total_expense: float
    transaction_count: int


class UserListResponse(BaseModel):
    total: int
    users: List[UserStats]


class UpdateUserStatus(BaseModel):
    is_active: bool


class UpdateUserRole(BaseModel):
    role: str


class ResetPasswordRequest(BaseModel):
    new_password: str = Field(min_length=6)


class AdminTransactionOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_email: str
    type: TransactionType
    amount: int
    category: str
    note: Optional[str] = None
    transaction_datetime: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AdminTransactionListResponse(BaseModel):
    total: int
    transactions: List[AdminTransactionOut]


class AdminTransactionUpdate(BaseModel):
    type: Optional[TransactionType] = None
    amount: Optional[int] = Field(None, gt=0)
    category: Optional[str] = Field(None, max_length=50)
    note: Optional[str] = Field(None, max_length=255)
    transaction_datetime: Optional[datetime] = None


class SuspiciousTransactionOut(BaseModel):
    transaction: AdminTransactionOut
    reason: str
    threshold: float


class SuspiciousListResponse(BaseModel):
    threshold: float
    count: int
    transactions: List[SuspiciousTransactionOut]


class CategoryAnalyticsItem(BaseModel):
    category: str
    count: int
    total_amount: float
    income_amount: float
    expense_amount: float


class CategoryOut(BaseModel):
    id: int
    name: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    is_active: Optional[bool] = None


class MonthlyCount(BaseModel):
    month: str
    count: int


class TopSpender(BaseModel):
    profile_id: int
    name: str
    email: str
    total_income: float
    total_expense: float
    transaction_count: int


class PlatformStats(BaseModel):
    total_users: int
    active_users: int
    inactive_users: int
    total_transactions: int
    total_income: float
    total_expense: float
    platform_balance: float
    avg_income_per_user: float
    avg_expense_per_user: float
    new_users_per_month: List[MonthlyCount]
    usage_trends: List[MonthlyCount]
    top_spenders: List[TopSpender]
    top_categories: List[CategoryAnalyticsItem]
