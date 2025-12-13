// Currency conversion utility
// Exchange rates (base: RUB)
// In a real application, these would be fetched from an API
export const EXCHANGE_RATES: Record<string, number> = {
  RUB: 1.0,
  USD: 0.011, // 1 RUB = 0.011 USD (approximately 90 RUB per USD)
  EUR: 0.01, // 1 RUB = 0.010 EUR (approximately 100 RUB per EUR)
  CNY: 0.079, // 1 RUB = 0.079 CNY (approximately 12.6 RUB per CNY)
};

export type Currency = 'RUB' | 'USD' | 'EUR' | 'CNY';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  CNY: '¥',
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  RUB: 'Рубли',
  USD: 'Доллары',
  EUR: 'Евро',
  CNY: 'Юани',
};

/**
 * Converts an amount from RUB to the target currency
 * @param amount Amount in RUB
 * @param targetCurrency Target currency code
 * @returns Converted amount
 */
export function convertCurrency(amount: number, targetCurrency: Currency): number {
  if (targetCurrency === 'RUB') {
    return amount;
  }
  const rate = EXCHANGE_RATES[targetCurrency];
  if (!rate) {
    return amount;
  }
  return amount * rate;
}

/**
 * Formats an amount with currency symbol
 * @param amount Amount to format
 * @param currency Currency code
 * @returns Formatted string
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const formatted = Math.abs(amount).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${symbol}`;
}

/**
 * Formats an amount with currency symbol (without sign)
 * @param amount Amount to format
 * @param currency Currency code
 * @returns Formatted string
 */
export function formatCurrencyAmount(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const formatted = amount.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${symbol}`;
}
