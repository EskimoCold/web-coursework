import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

import { CurrencyProvider, useCurrency } from './CurrencyContext';

const TestComponent = () => {
  const { currency, setCurrency, convert, format, formatAmount } = useCurrency();

  return (
    <div>
      <div data-testid="currency">{currency}</div>
      <div data-testid="converted">{convert(1000)}</div>
      <div data-testid="formatted">{format(1000)}</div>
      <div data-testid="formatted-amount">{formatAmount(1000)}</div>
      <button onClick={() => setCurrency('USD')}>Set USD</button>
      <button onClick={() => setCurrency('EUR')}>Set EUR</button>
      <button onClick={() => setCurrency('CNY')}>Set CNY</button>
      <button onClick={() => setCurrency('RUB')}>Set RUB</button>
    </div>
  );
};

describe('CurrencyContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should default to RUB when no stored currency', () => {
    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>,
    );

    expect(screen.getByTestId('currency')).toHaveTextContent('RUB');
  });

  it('should load currency from localStorage', () => {
    localStorage.setItem('app_currency', 'USD');

    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>,
    );

    expect(screen.getByTestId('currency')).toHaveTextContent('USD');
  });

  it('should update currency when setCurrency is called', async () => {
    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>,
    );

    expect(screen.getByTestId('currency')).toHaveTextContent('RUB');

    fireEvent.click(screen.getByText('Set USD'));

    await waitFor(() => {
      expect(screen.getByTestId('currency')).toHaveTextContent('USD');
    });

    expect(localStorage.getItem('app_currency')).toBe('USD');
  });

  it('should convert amounts correctly', () => {
    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>,
    );

    const converted = screen.getByTestId('converted').textContent;
    expect(converted).toBe('1000');
  });

  it('should format amounts correctly', () => {
    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>,
    );

    const formatted = screen.getByTestId('formatted').textContent;
    expect(formatted).toContain('1 000');
    expect(formatted).toContain('₽');
  });

  it('should update conversion when currency changes', async () => {
    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>,
    );

    fireEvent.click(screen.getByText('Set USD'));

    await waitFor(() => {
      const converted = screen.getByTestId('converted').textContent;
      expect(parseFloat(converted || '0')).toBeCloseTo(11, 1);
    });
  });

  it('should persist currency to localStorage', async () => {
    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>,
    );

    fireEvent.click(screen.getByText('Set EUR'));

    await waitFor(() => {
      expect(localStorage.getItem('app_currency')).toBe('EUR');
    });
  });

  it('should handle invalid stored currency', () => {
    localStorage.setItem('app_currency', 'INVALID');

    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>,
    );

    expect(screen.getByTestId('currency')).toHaveTextContent('RUB');
  });
});
