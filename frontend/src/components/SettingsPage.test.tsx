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

    // Найти вкладку "Внешний вид" и кликнуть на нее
    const appearanceTab = screen.getByText('Внешний вид');
    fireEvent.click(appearanceTab);

    await waitFor(() => {
      // Исправлено: находим select по роли и имени
      const currencySelect = screen.getByRole('combobox', { name: /валюта/i });
      fireEvent.change(currencySelect, { target: { value: 'EUR' } });
    });

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

    // Найти вкладку "Внешний вид"
    const appearanceTab = screen.getByText('Внешний вид');
    fireEvent.click(appearanceTab);

    await waitFor(() => {
      const currencySelect = screen.getByRole('combobox', { name: /валюта/i });
      fireEvent.change(currencySelect, { target: { value: 'UNKNOWN' } });
    });

    expect(screen.getByText(/настройки/i)).toBeInTheDocument();
  });

  it('displays current currency settings', async () => {
    render(
      <CurrencyProvider>
        <SettingsPage />
      </CurrencyProvider>,
    );

    // Перейти на вкладку "Внешний вид"
    const appearanceTab = screen.getByText('Внешний вид');
    fireEvent.click(appearanceTab);

    await waitFor(() => {
      // Исправлено: используем более точный селектор для заголовка
      expect(screen.getByRole('heading', { name: 'Внешний вид' })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /валюта/i })).toBeInTheDocument();
    });
  });
});
