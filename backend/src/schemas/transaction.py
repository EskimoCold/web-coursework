from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class TransactionBase(BaseModel):
    amount: float = Field(..., gt=0)
    description: Optional[str] = None
    transaction_type: str = Field(..., pattern="^(income|expense)$")
    category_id: Optional[int] = None
    transaction_date: Optional[datetime] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    description: Optional[str] = None
    transaction_type: Optional[str] = Field(None, pattern="^(income|expense)$")
    category_id: Optional[int] = None
    transaction_date: Optional[datetime] = None


class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

