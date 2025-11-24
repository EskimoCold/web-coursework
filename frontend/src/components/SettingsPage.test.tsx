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
      // Находим селект валюты по отображаемому тексту
      const currencySelect = screen.getByDisplayValue('Рубли (RUB)');
      fireEvent.change(currencySelect, { target: { value: 'EUR' } });
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Евро (EUR)')).toBeInTheDocument();
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
      const currencySelect = screen.getByDisplayValue('Рубли (RUB)');
      fireEvent.change(currencySelect, { target: { value: 'UNKNOWN' } });
    });

    // Используем более точный селектор для заголовка раздела
    const sectionHeadings = screen.getAllByText('Внешний вид');
    const mainHeading = sectionHeadings.find((element) => element.tagName === 'H2');
    expect(mainHeading).toBeInTheDocument();
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
      // Используем более точный селектор для заголовка раздела
      const sectionHeadings = screen.getAllByText('Внешний вид');
      const mainHeading = sectionHeadings.find((element) => element.tagName === 'H2');
      expect(mainHeading).toBeInTheDocument();

      expect(screen.getByText('Валюта')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Рубли (RUB)')).toBeInTheDocument();
    });
  });
});
