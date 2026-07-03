from pydantic import BaseModel, ConfigDict
from datetime import date, time, datetime
from typing import Optional, List, Literal

class Add_Transaction(BaseModel):
    type: Literal["income", "expense"]
    amount: int
    category: str
    note: Optional[str] = None
    date: date
    time: time

class Update_Transaction(BaseModel):
    transaction_id: int
    type: Literal["income", "expense"]
    amount: int
    category: str
    note: Optional[str] = None
    date: date
    time: time

class Delete_Transaction(BaseModel):
    transaction_id: int

class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    type: Literal["income", "expense"]
    amount: int
    category: str
    note: Optional[str] = None
    transaction_datetime: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None

class PaginatedTransactionResponse(BaseModel):
    page: int
    limit: int
    total_records: int
    total_pages: int
    items: List[TransactionResponse]
