// src/components/SettingsPage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { currencyApi } from '../../api/currency';
import { AuthProvider } from '../../contexts/AuthContext';
import { CurrencyProvider } from '../../contexts/CurrencyContext';

import { SettingsPage } from './SettingsPage';

// Моки
vi.mock('../../api/currency', () => ({
  currencyApi: {
    getRates: vi.fn().mockResolvedValue({
      base: 'RUB',
      date: '2024-01-01',
      rates: { RUB: 1, USD: 0.011, EUR: 0.01, CNY: 0.08 },
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
      rates: { RUB: 1, USD: 0.011, EUR: 0.01, CNY: 0.08 },
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

    const securityNav = screen.getAllByText('Безопасность');
    expect(securityNav.length).toBe(2);

    const dataNav = screen.getAllByText('Управление данными');
    expect(dataNav.length).toBe(1);

    const appearanceNav = screen.getAllByText('Внешний вид');
    expect(appearanceNav.length).toBe(1);

    const aboutNav = screen.getAllByText('О приложении');
    expect(aboutNav.length).toBe(1);
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

    fireEvent.click(screen.getByText('Управление данными'));
    expect(screen.getByText('Экспорт данных')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Внешний вид'));
    expect(screen.getByText('Тема оформления')).toBeInTheDocument();
    expect(screen.getByText('Валюта')).toBeInTheDocument();

    fireEvent.click(screen.getByText('О приложении'));
    expect(screen.getByText('Версия приложения')).toBeInTheDocument();
    expect(screen.getByText('Поддержка')).toBeInTheDocument();
  });
});
