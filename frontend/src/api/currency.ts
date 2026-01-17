import { api } from './client';

export type CurrencyCode = 'RUB' | 'USD' | 'EUR' | 'AED';

export interface CurrencyRates {
  base: CurrencyCode;
  date: string;
  rates: Record<CurrencyCode, number>;
}

export interface CurrencyConvertResult {
  amount: number;
  from: CurrencyCode;
  to: CurrencyCode;
  converted: number;
}

export const currencyApi = {
  getRates: (date?: string): Promise<CurrencyRates> =>
    date
      ? api.get<CurrencyRates>('/currency/rates', { params: { date } })
      : api.get<CurrencyRates>('/currency/rates'),

  convert: (
    amount: number,
    from: CurrencyCode,
    to: CurrencyCode,
    date?: string,
  ): Promise<CurrencyConvertResult> =>
    api.get<CurrencyConvertResult>('/currency/convert', {
      params: { amount, from_currency: from, to_currency: to, ...(date ? { date } : {}) },
    }),
};
