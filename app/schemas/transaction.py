from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

from app.models.tables import TransactionType


class CreateTransaction(BaseModel):
    type: TransactionType
    amount: int = Field(gt=0)
    category: str = Field(max_length=50)
    note: Optional[str] = Field(None, max_length=255)
    transaction_datetime: datetime


class UpdateTransaction(BaseModel):
    type: Optional[TransactionType] = None
    amount: Optional[int] = Field(None, gt=0)
    category: Optional[str] = Field(None, max_length=50)
    note: Optional[str] = Field(None, max_length=255)
    transaction_datetime: Optional[datetime] = None


class TransactionResponse(BaseModel):
    id: int
    user_id: int
    type: TransactionType
    amount: int
    category: str
    note: Optional[str] = None
    transaction_datetime: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
