import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

import { CurrencyProvider } from '../contexts/CurrencyContext';

import { SettingsPage } from './SettingsPage';

describe('SettingsPage Additional Tests', () => {
  it('changes currency when selected', async () => {
    render(
      <CurrencyProvider>
        <SettingsPage />
      </CurrencyProvider>,
    );

    const currencySelect = screen.getByLabelText(/валюта/i);
    fireEvent.change(currencySelect, { target: { value: 'EUR' } });

    await waitFor(() => {
      expect(screen.getByText(/евро/i)).toBeInTheDocument();
    });
  });

  it('handles currency change with error', async () => {
    render(
      <CurrencyProvider>
        <SettingsPage />
      </CurrencyProvider>,
    );

    const currencySelect = screen.getByLabelText(/валюта/i);
    fireEvent.change(currencySelect, { target: { value: 'UNKNOWN' } });

    // Should not crash and still display the component
    expect(screen.getByText(/настройки/i)).toBeInTheDocument();
  });

  it('displays current currency settings', () => {
    render(
      <CurrencyProvider>
        <SettingsPage />
      </CurrencyProvider>,
    );

    expect(screen.getByText(/настройки валюты/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/валюта/i)).toBeInTheDocument();
  });
});
