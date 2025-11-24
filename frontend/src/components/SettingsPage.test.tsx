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
      // Находим селект валюты по тексту заголовка и структуре DOM
      const currencyHeading = screen.getByText('Валюта');
      const currencySection = currencyHeading.closest('.settings-item');
      const currencySelect = currencySection?.querySelector('select');

      expect(currencySelect).toBeInTheDocument();
      if (currencySelect) {
        fireEvent.change(currencySelect, { target: { value: 'EUR' } });
      }
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('EUR')).toBeInTheDocument();
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
      const currencyHeading = screen.getByText('Валюта');
      const currencySection = currencyHeading.closest('.settings-item');
      const currencySelect = currencySection?.querySelector('select');

      expect(currencySelect).toBeInTheDocument();
      if (currencySelect) {
        fireEvent.change(currencySelect, { target: { value: 'UNKNOWN' } });
      }
    });

    // Проверяем, что компонент не упал
    expect(screen.getByText(/внешний вид/i)).toBeInTheDocument();
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
      // Проверяем наличие основных элементов
      expect(screen.getByText('Внешний вид')).toBeInTheDocument();
      expect(screen.getByText('Валюта')).toBeInTheDocument();

      // Проверяем, что селект валюты существует
      const currencyHeading = screen.getByText('Валюта');
      const currencySection = currencyHeading.closest('.settings-item');
      const currencySelect = currencySection?.querySelector('select');
      expect(currencySelect).toBeInTheDocument();
    });
  });
});
