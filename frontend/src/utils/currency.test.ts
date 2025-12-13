import { describe, it, expect } from 'vitest';
import { convertCurrency, formatCurrency, formatCurrencyAmount, EXCHANGE_RATES, CURRENCY_SYMBOLS } from './currency';
import type { Currency } from './currency';

describe('currency utils', () => {
  describe('convertCurrency', () => {
    it('should return same amount for RUB', () => {
      expect(convertCurrency(100, 'RUB')).toBe(100);
    });

    it('should convert RUB to USD correctly', () => {
      const amount = 1000;
      const expected = amount * EXCHANGE_RATES.USD;
      expect(convertCurrency(amount, 'USD')).toBeCloseTo(expected, 2);
    });

    it('should convert RUB to EUR correctly', () => {
      const amount = 1000;
      const expected = amount * EXCHANGE_RATES.EUR;
      expect(convertCurrency(amount, 'EUR')).toBeCloseTo(expected, 2);
    });

    it('should convert RUB to CNY correctly', () => {
      const amount = 1000;
      const expected = amount * EXCHANGE_RATES.CNY;
      expect(convertCurrency(amount, 'CNY')).toBeCloseTo(expected, 2);
    });

    it('should handle zero amount', () => {
      expect(convertCurrency(0, 'USD')).toBe(0);
    });

    it('should handle negative amount', () => {
      const amount = -100;
      const expected = amount * EXCHANGE_RATES.USD;
      expect(convertCurrency(amount, 'USD')).toBeCloseTo(expected, 2);
    });
  });

  describe('formatCurrency', () => {
    it('should format RUB correctly', () => {
      const result = formatCurrency(1000, 'RUB');
      expect(result).toContain('1 000');
      expect(result).toContain(CURRENCY_SYMBOLS.RUB);
    });

    it('should format USD correctly', () => {
      const result = formatCurrency(1000, 'USD');
      expect(result).toContain('1 000');
      expect(result).toContain(CURRENCY_SYMBOLS.USD);
    });

    it('should format EUR correctly', () => {
      const result = formatCurrency(1000, 'EUR');
      expect(result).toContain('1 000');
      expect(result).toContain(CURRENCY_SYMBOLS.EUR);
    });

    it('should format CNY correctly', () => {
      const result = formatCurrency(1000, 'CNY');
      expect(result).toContain('1 000');
      expect(result).toContain(CURRENCY_SYMBOLS.CNY);
    });

    it('should handle decimal amounts', () => {
      const result = formatCurrency(1234.56, 'RUB');
      expect(result).toContain('1 234.56');
    });

    it('should use absolute value', () => {
      const result = formatCurrency(-1000, 'RUB');
      expect(result).toContain('1 000');
    });
  });

  describe('formatCurrencyAmount', () => {
    it('should format positive amount', () => {
      const result = formatCurrencyAmount(1000, 'RUB');
      expect(result).toContain('1 000');
      expect(result).toContain(CURRENCY_SYMBOLS.RUB);
    });

    it('should format negative amount', () => {
      const result = formatCurrencyAmount(-1000, 'RUB');
      expect(result).toContain('-1 000');
    });

    it('should format zero', () => {
      const result = formatCurrencyAmount(0, 'USD');
      expect(result).toContain('0');
      expect(result).toContain(CURRENCY_SYMBOLS.USD);
    });
  });
});

