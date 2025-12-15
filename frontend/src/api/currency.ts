import { api } from './client';

export interface CurrencyRates {
  base: string;
  date: string;
  rates: {
    RUB: number;
    USD: number;
    EUR: number;
    CNY: number;
  };
}

export interface CurrencyConvertResult {
  amount: number;
  from: string;
  to: string;
  converted: number;
}

export const currencyApi = {
  getRates: (): Promise<CurrencyRates> => api.get<CurrencyRates>('/currency/rates'),

  convert: (amount: number, from: string, to: string): Promise<CurrencyConvertResult> =>
    api.get<CurrencyConvertResult>('/currency/convert', {
      params: { amount, from_currency: from, to_currency: to },
    }),
};

