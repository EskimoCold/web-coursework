"""API для получения курсов валют"""
import httpx
from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/currency", tags=["Currency"])

# Используем бесплатный API exchangerate-api.com
# Можно также использовать: https://api.exchangerate-api.com/v4/latest/RUB
EXCHANGE_RATE_API = "https://api.exchangerate-api.com/v4/latest/RUB"


@router.get("/rates")
async def get_currency_rates():
    """Получение актуальных курсов валют относительно RUB"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(EXCHANGE_RATE_API)
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Currency service unavailable",
                )

            data = response.json()
            rates = data.get("rates", {})

            # Возвращаем только нужные валюты
            return {
                "base": "RUB",
                "date": data.get("date"),
                "rates": {
                    "RUB": 1.0,  # Базовая валюта
                    "USD": rates.get("USD", 0),
                    "EUR": rates.get("EUR", 0),
                    "CNY": rates.get("CNY", 0),
                },
            }
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Currency service timeout",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching currency rates: {str(e)}",
        )


@router.get("/convert")
async def convert_currency(amount: float, from_currency: str, to_currency: str):
    """Конвертация суммы из одной валюты в другую"""
    if from_currency == to_currency:
        return {"amount": amount, "from": from_currency, "to": to_currency, "converted": amount}

    try:
        rates_data = await get_currency_rates()
        rates = rates_data["rates"]

        if from_currency not in rates or to_currency not in rates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported currency. Supported: {list(rates.keys())}",
            )

        # API возвращает курсы в формате: rates["USD"] = сколько USD в 1 RUB
        # Например, если rates["USD"] = 0.011, то 1 RUB = 0.011 USD
        # Для конвертации из RUB в USD: amount * rates["USD"]
        # Для конвертации из USD в RUB: amount / rates["USD"]
        
        if from_currency == "RUB":
            # Конвертируем из RUB в другую валюту
            converted = amount * rates[to_currency]
        elif to_currency == "RUB":
            # Конвертируем из другой валюты в RUB
            converted = amount / rates[from_currency]
        else:
            # Конвертируем через RUB: from -> RUB -> to
            # Сначала конвертируем в RUB: amount / rates[fromCurrency]
            # Затем конвертируем из RUB в целевую: (amount / rates[fromCurrency]) * rates[currency]
            amount_in_rub = amount / rates[from_currency]
            converted = amount_in_rub * rates[to_currency]

        return {
            "amount": amount,
            "from": from_currency,
            "to": to_currency,
            "converted": round(converted, 2),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error converting currency: {str(e)}",
        )

