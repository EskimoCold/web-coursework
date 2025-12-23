from src.api.v1.auth import router as auth_router
from src.api.v1.categories import router as categories_router
from src.api.v1.currency import router as currency_router
from src.api.v1.transactions import router as transactions_router
from src.api.v1.users import router as users_router

__all__ = [
    "auth_router",
    "categories_router",
    "currency_router",
    "transactions_router",
    "users_router",
]
