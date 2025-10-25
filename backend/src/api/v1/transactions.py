from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_user
from src.models.category import Category
from src.models.transaction import Transaction
from src.models.user import User
from src.schemas.transaction import TransactionCreate, TransactionResponse, TransactionUpdate

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_data: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if transaction_data.category_id:
        result = await db.execute(
            select(Category).filter(
                Category.id == transaction_data.category_id,
                Category.user_id == current_user.id,
            )
        )
        category = result.scalar_one_or_none()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )

    new_transaction = Transaction(
        **transaction_data.model_dump(),
        user_id=current_user.id,
    )

    db.add(new_transaction)
    await db.commit()
    await db.refresh(new_transaction)

    return new_transaction


@router.get("", response_model=list[TransactionResponse])
async def get_transactions(
    skip: int = 0,
    limit: int = 100,
    transaction_type: str | None = Query(None, pattern="^(income|expense)$"),
    category_id: int | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Transaction).filter(Transaction.user_id == current_user.id)

    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type)

    if category_id:
        query = query.filter(Transaction.category_id == category_id)

    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)

    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)

    result = await db.execute(query.offset(skip).limit(limit))
    transactions = result.scalars().all()
    return transactions


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Transaction).filter(
            Transaction.id == transaction_id, Transaction.user_id == current_user.id
        )
    )
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    return transaction


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: int,
    transaction_update: TransactionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Transaction).filter(
            Transaction.id == transaction_id, Transaction.user_id == current_user.id
        )
    )
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    update_data = transaction_update.model_dump(exclude_unset=True)

    if update_data.get("category_id"):
        result = await db.execute(
            select(Category).filter(
                Category.id == update_data["category_id"],
                Category.user_id == current_user.id,
            )
        )
        category = result.scalar_one_or_none()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )

    for field, value in update_data.items():
        setattr(transaction, field, value)

    await db.commit()
    await db.refresh(transaction)

    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Transaction).filter(
            Transaction.id == transaction_id, Transaction.user_id == current_user.id
        )
    )
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    await db.delete(transaction)
    await db.commit()
