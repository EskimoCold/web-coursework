import json

from contextlib import suppress
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_user
from src.core.security import get_password_hash, verify_password
from src.models.category import Category
from src.models.refresh_token import RefreshToken
from src.models.transaction import Transaction
from src.models.user import User
from src.schemas.user import UserPasswordUpdate, UserResponse, UserUpdate



router = APIRouter(prefix="/users", tags=["Users"])



async def _import_categories(
    categories_data: list,
    db: AsyncSession,
    current_user: User,
) -> tuple[int, list[str]]:
    imported_count = 0
    errors = []

    existing_categories = await db.execute(
        select(Category).filter(Category.user_id == current_user.id)
    )
    existing_category_names = {
        cat.name: cat.id for cat in existing_categories.scalars().all()
    }

    for cat_data in categories_data:
        try:
            if not isinstance(cat_data, dict) or "name" not in cat_data:
                continue

            if cat_data["name"] in existing_category_names:
                continue

            new_category = Category(
                name=cat_data["name"],
                description=cat_data.get("description"),
                icon=cat_data.get("icon", "1"),
                user_id=current_user.id,
            )
            db.add(new_category)
            imported_count += 1
        except Exception as err:
            errors.append(
                f"Error importing category {cat_data.get('name', 'unknown')}: {err}"
            )

    return imported_count, errors


async def _import_transactions(
    transactions_data: list,
    db: AsyncSession,
    current_user: User,
) -> tuple[int, list[str]]:
    imported_count = 0
    errors = []

    all_categories = await db.execute(
        select(Category).filter(Category.user_id == current_user.id)
    )
    categories = all_categories.scalars().all()
    category_id_map = {cat.id: cat.id for cat in categories}
    category_name_map = {cat.name: cat.id for cat in categories}

    for txn_data in transactions_data:
        try:
            if not isinstance(txn_data, dict):
                continue

            if "amount" not in txn_data or "transaction_type" not in txn_data:
                continue

            category_id = None
            if txn_data.get("category_id") in category_id_map:
                category_id = category_id_map[txn_data["category_id"]]
            elif txn_data.get("category_name") in category_name_map:
                category_id = category_name_map[txn_data["category_name"]]

            transaction_date = datetime.now(UTC)
            if txn_data.get("transaction_date"):
                with suppress(ValueError, AttributeError):
                    transaction_date = datetime.fromisoformat(
                        txn_data["transaction_date"].replace("Z", "+00:00")
                    )

            db.add(
                Transaction(
                    amount=float(txn_data["amount"]),
                    description=txn_data.get("description"),
                    transaction_type=txn_data["transaction_type"],
                    category_id=category_id,
                    transaction_date=transaction_date,
                    user_id=current_user.id,
                )
            )
            imported_count += 1
        except Exception as err:
            errors.append(f"Error importing transaction: {err}")

    return imported_count, errors


@router.get("/me/export")
async def export_user_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transactions = (
        await db.execute(
            select(Transaction).filter(Transaction.user_id == current_user.id)
        )
    ).scalars().all()

    categories = (
        await db.execute(select(Category).filter(Category.user_id == current_user.id))
    ).scalars().all()

    export_data = {
        "version": "1.0",
        "export_date": datetime.now(UTC).isoformat(),
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "created_at": (
                current_user.created_at.isoformat()
                if current_user.created_at
                else None
            ),
        },
        "categories": [
            {
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "icon": cat.icon,
                "created_at": cat.created_at.isoformat() if cat.created_at else None,
            }
            for cat in categories
        ],
        "transactions": [
            {
                "id": txn.id,
                "amount": txn.amount,
                "description": txn.description,
                "transaction_type": txn.transaction_type,
                "category_id": txn.category_id,
                "transaction_date": (
                    txn.transaction_date.isoformat()
                    if txn.transaction_date
                    else None
                ),
                "created_at": txn.created_at.isoformat() if txn.created_at else None,
            }
            for txn in transactions
        ],
    }

    json_content = json.dumps(export_data, ensure_ascii=False, indent=2)
    filename = f"fintrack_export_{datetime.now(UTC):%Y%m%d_%H%M%S}.json"

    return Response(
        content=json_content,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/me/import", status_code=status.HTTP_200_OK)
async def import_user_data(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        content = await file.read()
        import_data = json.loads(content.decode("utf-8"))

        if "version" not in import_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid import file format: missing version",
            )

        errors: list[str] = []

        imported_categories = 0
        if isinstance(import_data.get("categories"), list):
            imported_categories, cat_errors = await _import_categories(
                import_data["categories"], db, current_user
            )
            errors.extend(cat_errors)

        imported_transactions = 0
        if isinstance(import_data.get("transactions"), list):
            imported_transactions, txn_errors = await _import_transactions(
                import_data["transactions"], db, current_user
            )
            errors.extend(txn_errors)

        await db.commit()

        return {
            "message": "Import completed",
            "imported_categories": imported_categories,
            "imported_transactions": imported_transactions,
            "errors": errors or None,
        }
    except HTTPException:
        raise
    except Exception as err:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error importing data: {err}",
        ) from err


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = user_update.model_dump(exclude_unset=True)

    if "username" in update_data:
        existing_user = (
            await db.execute(
                select(User).filter(
                    User.username == update_data["username"],
                    User.id != current_user.id,
                )
            )
        ).scalar_one_or_none()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already in use",
            )

    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)

    return current_user


@router.post("/me/password", status_code=status.HTTP_200_OK)
async def change_password(
    password_data: UserPasswordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(
        password_data.old_password, current_user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password",
        )

    current_user.hashed_password = get_password_hash(password_data.new_password)
    await db.commit()

    return {"message": "Password updated successfully"}


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.execute(delete(RefreshToken).where(RefreshToken.user_id == current_user.id))
    await db.delete(current_user)
    await db.commit()
