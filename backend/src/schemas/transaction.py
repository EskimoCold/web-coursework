from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TransactionBase(BaseModel):
    amount: float = Field(..., gt=0)
    description: str | None = None
    transaction_type: str = Field(..., pattern="^(income|expense)$")
    category_id: int | None = None
    transaction_date: datetime | None = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    amount: float | None = Field(None, gt=0)
    description: str | None = None
    transaction_type: str | None = Field(None, pattern="^(income|expense)$")
    category_id: int | None = None
    transaction_date: datetime | None = None


class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
