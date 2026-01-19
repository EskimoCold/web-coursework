import { describe, expect, it, vi, beforeEach } from 'vitest';

import { api } from './client';
import { currencyApi } from './currency';

vi.mock('./client', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('currencyApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get rates', async () => {
    const mockRates = {
      base: 'RUB',
      date: '2024-01-01',
      rates: { RUB: 1, USD: 0.011, EUR: 0.01, AED: 0.04 },
    };

    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockRates);

    const result = await currencyApi.getRates();

    expect(api.get).toHaveBeenCalledWith('/currency/rates');
    expect(result).toEqual(mockRates);
  });

  it('should convert currency', async () => {
    const mockConvertResult = {
      amount: 1000,
      from: 'RUB',
      to: 'USD',
      converted: 11,
    };

    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockConvertResult);

    const result = await currencyApi.convert(1000, 'RUB', 'USD');

    expect(api.get).toHaveBeenCalledWith('/currency/convert', {
      params: { amount: 1000, from_currency: 'RUB', to_currency: 'USD' },
    });
    expect(result).toEqual(mockConvertResult);
  });
});
