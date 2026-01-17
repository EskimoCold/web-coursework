import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { currencyApi } from '../../api/currency';
import { AuthProvider } from '../../contexts/AuthContext';
import { CurrencyProvider } from '../../contexts/CurrencyContext';

import { SettingsPage } from './SettingsPage';

vi.mock('../../api/currency', () => ({
  currencyApi: {
    getRates: vi.fn().mockResolvedValue({
      base: 'RUB',
      date: '2024-01-01',
      rates: { RUB: 1, USD: 0.011, EUR: 0.01, AED: 0.04 },
    }),
    convert: vi.fn(),
  },
}));

const mockCurrencyApi = vi.mocked(currencyApi);

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrencyApi.getRates.mockResolvedValue({
      base: 'RUB',
      date: '2024-01-01',
      rates: { RUB: 1, USD: 0.011, EUR: 0.01, AED: 0.04 },
    });
  });

  it('renders all settings navigation items', () => {
    render(
      <AuthProvider>
        <CurrencyProvider>
          <SettingsPage />
        </CurrencyProvider>
      </AuthProvider>,
    );

    expect(screen.getAllByText('Безопасность').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Данные').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Внешний вид').length).toBeGreaterThan(0);
  });

  it('renders security section content by default', () => {
    render(
      <AuthProvider>
        <CurrencyProvider>
          <SettingsPage />
        </CurrencyProvider>
      </AuthProvider>,
    );

    expect(screen.getByText('Смена пароля')).toBeInTheDocument();
    expect(screen.getByText('Удаление аккаунта')).toBeInTheDocument();
  });

  it('switches between sections correctly', () => {
    render(
      <AuthProvider>
        <CurrencyProvider>
          <SettingsPage />
        </CurrencyProvider>
      </AuthProvider>,
    );

    expect(screen.getByText('Смена пароля')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Данные'));
    expect(screen.getByText('Экспорт данных')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Внешний вид'));
    expect(screen.getByText('Тема оформления')).toBeInTheDocument();
    expect(screen.getByText('Валюта')).toBeInTheDocument();
  });
});
