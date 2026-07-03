from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database.database import base


class TransactionType(str, enum.Enum):
    income = "income"
    expense = "expense"


class Create_Account_Table(base):
    __tablename__ = "Account"

    profile_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), nullable=False)
    email = Column(String(20), nullable=False)
    password = Column(String(20), nullable=False)
    mobile_number = Column(String(20), nullable=False)
    re_enter_password = Column(String(20), nullable=False)

    transactions = relationship("Transaction", back_populates="user")

    @property
    def id(self):
        return self.profile_id


class Transaction(base):
    __tablename__ = "Transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("Account.profile_id"),
        nullable=False,
        index=True,
    )
    type = Column(SQLEnum(TransactionType), nullable=False)
    amount = Column(Integer, nullable=False)
    category = Column(String(50), nullable=False)
    note = Column(String(255), nullable=True)
    transaction_datetime = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, onupdate=func.now(), nullable=True)

    user = relationship("Create_Account_Table", back_populates="transactions")