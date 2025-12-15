import json
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


# Важно: более специфичные маршруты должны быть определены ПЕРЕД общими
# Например, /me/export должен быть ПЕРЕД /me


@router.get("/me/export")
async def export_user_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Экспорт всех данных пользователя в JSON формате"""
    # Получаем все транзакции пользователя
    transactions_result = await db.execute(
        select(Transaction).filter(Transaction.user_id == current_user.id)
    )
    transactions = transactions_result.scalars().all()

    # Получаем все категории пользователя
    categories_result = await db.execute(
        select(Category).filter(Category.user_id == current_user.id)
    )
    categories = categories_result.scalars().all()

    # Формируем данные для экспорта
    export_data = {
        "version": "1.0",
        "export_date": datetime.now(UTC).isoformat(),
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
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
                "transaction_date": txn.transaction_date.isoformat() if txn.transaction_date else None,
                "created_at": txn.created_at.isoformat() if txn.created_at else None,
            }
            for txn in transactions
        ],
    }

    # Возвращаем JSON как файл
    json_content = json.dumps(export_data, ensure_ascii=False, indent=2)
    filename = f"fintrack_export_{datetime.now(UTC).strftime('%Y%m%d_%H%M%S')}.json"

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
    """Импорт данных пользователя из JSON файла"""
    try:
        # Читаем содержимое файла
        content = await file.read()
        try:
            import_data = json.loads(content.decode("utf-8"))
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid JSON file: {str(e)}",
            )
        # Валидация структуры данных
        if "version" not in import_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid import file format: missing version",
            )

        imported_categories = 0
        imported_transactions = 0
        errors = []

        # Импорт категорий
        if "categories" in import_data and isinstance(import_data["categories"], list):
            existing_categories = await db.execute(
                select(Category).filter(Category.user_id == current_user.id)
            )
            existing_category_names = {cat.name: cat.id for cat in existing_categories.scalars().all()}

            for cat_data in import_data["categories"]:
                try:
                    if not isinstance(cat_data, dict) or "name" not in cat_data:
                        continue

                    # Проверяем, существует ли категория с таким именем
                    if cat_data["name"] in existing_category_names:
                        continue  # Пропускаем существующие категории

                    new_category = Category(
                        name=cat_data["name"],
                        description=cat_data.get("description"),
                        icon=cat_data.get("icon", "1"),
                        user_id=current_user.id,
                    )
                    db.add(new_category)
                    imported_categories += 1
                except Exception as e:
                    errors.append(f"Error importing category {cat_data.get('name', 'unknown')}: {str(e)}")

        # Импорт транзакций
        if "transactions" in import_data and isinstance(import_data["transactions"], list):
            # Получаем все категории пользователя для маппинга
            all_categories = await db.execute(
                select(Category).filter(Category.user_id == current_user.id)
            )
            category_map = {cat.id: cat.id for cat in all_categories.scalars().all()}
            category_name_map = {cat.name: cat.id for cat in all_categories.scalars().all()}

            for txn_data in import_data["transactions"]:
                try:
                    if not isinstance(txn_data, dict):
                        continue

                    # Валидация обязательных полей
                    if "amount" not in txn_data or "transaction_type" not in txn_data:
                        continue

                    # Обработка category_id
                    category_id = None
                    if "category_id" in txn_data and txn_data["category_id"]:
                        # Если category_id есть в мапе, используем его
                        if txn_data["category_id"] in category_map:
                            category_id = category_map[txn_data["category_id"]]
                    elif "category_name" in txn_data and txn_data["category_name"]:
                        # Пытаемся найти по имени
                        if txn_data["category_name"] in category_name_map:
                            category_id = category_name_map[txn_data["category_name"]]

                    # Парсинг даты
                    transaction_date = datetime.now(UTC)
                    if "transaction_date" in txn_data and txn_data["transaction_date"]:
                        try:
                            transaction_date = datetime.fromisoformat(
                                txn_data["transaction_date"].replace("Z", "+00:00")
                            )
                        except (ValueError, AttributeError):
                            pass

                    new_transaction = Transaction(
                        amount=float(txn_data["amount"]),
                        description=txn_data.get("description"),
                        transaction_type=txn_data["transaction_type"],
                        category_id=category_id,
                        transaction_date=transaction_date,
                        user_id=current_user.id,
                    )
                    db.add(new_transaction)
                    imported_transactions += 1
                except Exception as e:
                    errors.append(f"Error importing transaction: {str(e)}")

        await db.commit()

        return {
            "message": "Import completed",
            "imported_categories": imported_categories,
            "imported_transactions": imported_transactions,
            "errors": errors if errors else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error importing data: {str(e)}",
        )


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
        result = await db.execute(
            select(User).filter(
                User.username == update_data["username"], User.id != current_user.id
            )
        )
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already in use",
            )

    # Deprecated: Password update should use /me/password endpoint
    # Keeping this logic for now but it should ideally be removed or restricted
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
    if not verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password",
        )

    current_user.hashed_password = get_password_hash(password_data.new_password)

    db.add(current_user)
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
