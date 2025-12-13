import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';

import { CurrencyProvider, useCurrency, Currency } from './CurrencyContext';

describe('CurrencyContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CurrencyProvider>{children}</CurrencyProvider>
  );

  beforeEach(() => {
    localStorage.clear();
  });

  it('should provide default currency RUB', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });
    expect(result.current.currency).toBe('RUB');
  });

  it('should load currency from localStorage', () => {
    localStorage.setItem('currency', 'USD');
    const { result } = renderHook(() => useCurrency(), { wrapper });
    expect(result.current.currency).toBe('USD');
  });

  it('should update currency and save to localStorage', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });

    act(() => {
      result.current.setCurrency('EUR');
    });

    expect(result.current.currency).toBe('EUR');
    expect(localStorage.getItem('currency')).toBe('EUR');
  });

  it('should convert amounts correctly', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });

    // Test RUB to USD conversion (1 RUB = 0.011 USD, so 100 RUB = 1.1 USD)
    act(() => {
      result.current.setCurrency('USD');
    });

    const converted = result.current.convertAmount(100);
    expect(converted).toBeCloseTo(1.1, 1);
  });

  it('should return same amount when converting to same currency', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });

    act(() => {
      result.current.setCurrency('RUB');
    });

    const converted = result.current.convertAmount(100);
    expect(converted).toBe(100);
  });

  it('should format amounts correctly', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });

    act(() => {
      result.current.setCurrency('RUB');
    });

    const formatted = result.current.formatAmount(1234.56);
    expect(formatted).toMatch(/1[\s,]234[.,]56/);
  });

  it('should return correct currency symbols', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });

    const symbols: Record<Currency, string> = {
      RUB: '₽',
      USD: '$',
      EUR: '€',
      CNY: '¥',
    };

    Object.entries(symbols).forEach(([currency, symbol]) => {
      act(() => {
        result.current.setCurrency(currency as Currency);
      });
      expect(result.current.getCurrencySymbol()).toBe(symbol);
    });
  });

  it('should throw error when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useCurrency());
    }).toThrow('useCurrency must be used within CurrencyProvider');
    consoleError.mockRestore();
  });
});

