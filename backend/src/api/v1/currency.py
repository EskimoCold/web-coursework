"""API для получения курсов валют"""

from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status
import httpx

router = APIRouter(prefix="/currency", tags=["Currency"])

CBR_API = "https://www.cbr-xml-daily.ru"
FALLBACK_EXCHANGE_RATE_API = "https://open.er-api.com/v6/latest"
BASE_CURRENCY = "RUB"
SUPPORTED_CURRENCIES = ("RUB", "USD", "EUR", "AED")
HTTP_OK = 200


def _normalize_date(date: str | None) -> str | None:
    if not date:
        return None
    try:
        parsed = datetime.fromisoformat(date).date()
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD",
        ) from err

    today = datetime.now(UTC).date()
    if parsed > today:
        return None
    return parsed.isoformat()


def _build_response(data: dict) -> dict:
    if "Valute" in data:
        valute = data.get("Valute", {})
        rates = {}
        for code in ("USD", "EUR", "AED"):
            info = valute.get(code)
            if not info:
                rates[code] = 0
                continue
            nominal = info.get("Nominal") or 1
            value = info.get("Value") or 0
            rates[code] = nominal / value if value else 0

        raw_date = data.get("Date")
        date = raw_date
        if raw_date:
            try:
                date = datetime.fromisoformat(raw_date).date().isoformat()
            except ValueError:
                date = datetime.now(UTC).date().isoformat()
        else:
            date = datetime.now(UTC).date().isoformat()

        base = BASE_CURRENCY
    else:
        rates = data.get("rates", {})
        base = data.get("base") or data.get("base_code") or BASE_CURRENCY
        date = data.get("date") or datetime.now(UTC).date().isoformat()

    return {
        "base": base,
        "date": date,
        "rates": {
            "RUB": 1.0,
            "USD": rates.get("USD", 0),
            "EUR": rates.get("EUR", 0),
            "AED": rates.get("AED", 0),
        },
    }


@router.get("/rates")
async def get_currency_rates(date: str | None = None):
    """Получение курсов валют относительно RUB (возможна историческая дата)"""
    try:
        endpoint = _normalize_date(date)
        async with httpx.AsyncClient(timeout=10.0) as client:
            cbr_url = (
                f"{CBR_API}/daily_json.js"
                if not endpoint
                else f"{CBR_API}/archive/{endpoint.replace('-', '/')}/daily_json.js"
            )
            response = await client.get(cbr_url)
            if response.status_code == HTTP_OK:
                return _build_response(response.json())

            fallback = await client.get(f"{FALLBACK_EXCHANGE_RATE_API}/{BASE_CURRENCY}")
            if fallback.status_code == HTTP_OK:
                return _build_response(fallback.json())

            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Currency service unavailable",
            )
    except httpx.TimeoutException as err:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Currency service timeout",
        ) from err
    except HTTPException:
        raise
    except Exception as err:
        error_msg = str(err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching currency rates: {error_msg}",
        ) from err


@router.get("/convert")
async def convert_currency(
    amount: float,
    from_currency: str,
    to_currency: str,
    date: str | None = None,
):
    """Конвертация суммы из одной валюты в другую (по дате, если указана)"""
    if from_currency == to_currency:
        return {"amount": amount, "from": from_currency, "to": to_currency, "converted": amount}

    try:
        rates_data = await get_currency_rates(date)
        rates = rates_data["rates"]

        if from_currency not in rates or to_currency not in rates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported currency. Supported: {list(rates.keys())}",
            )
        if not rates[from_currency] or not rates[to_currency]:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Currency rate unavailable for requested currency",
            )

        if from_currency == "RUB":
            converted = amount * rates[to_currency]
        elif to_currency == "RUB":
            converted = amount / rates[from_currency]
        else:
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
    except Exception as err:
        error_msg = str(err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error converting currency: {error_msg}",
        ) from err
