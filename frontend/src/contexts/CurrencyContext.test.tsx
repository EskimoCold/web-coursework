import { render, screen } from '@testing-library/react';
import React from 'react';

import { CurrencyProvider, useCurrency } from './CurrencyContext';

const TestComponent: React.FC = () => {
  const { formatAmount, currency } = useCurrency();

  return (
    <div>
      <div>Currency: {currency}</div>
      <div>Formatted: {formatAmount(1234.56)}</div>
    </div>
  );
};

describe('CurrencyContext', () => {
  it('formats amounts with different currencies', () => {
    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>,
    );

    expect(screen.getByText('Currency: USD')).toBeInTheDocument();
    expect(screen.getByText('Formatted: $1234.56')).toBeInTheDocument();
  });
});
