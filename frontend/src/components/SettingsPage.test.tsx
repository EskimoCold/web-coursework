// src/components/SettingsPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';

import { CurrencyProvider } from '../contexts/CurrencyContext';

import { SettingsPage } from './SettingsPage';

const renderWithProviders = (component: React.ReactElement) => {
  return render(<CurrencyProvider>{component}</CurrencyProvider>);
};

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders all settings navigation items', () => {
    renderWithProviders(<SettingsPage />);

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
    renderWithProviders(<SettingsPage />);

    expect(screen.getByText('Смена пароля')).toBeInTheDocument();
    expect(screen.getByText('Удаление аккаунта')).toBeInTheDocument();
  });

  it('switches between sections correctly', () => {
    renderWithProviders(<SettingsPage />);

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

  it('opens privacy policy modal when button is clicked', () => {
    renderWithProviders(<SettingsPage />);

    fireEvent.click(screen.getByText('О приложении'));

    const privacyButton = screen.getByText('Открыть', { selector: 'button' });
    fireEvent.click(privacyButton);

    expect(screen.getByText('Политика конфиденциальности')).toBeInTheDocument();
    expect(screen.getByText('1. Общие положения')).toBeInTheDocument();
  });

  it('closes privacy policy modal when close button is clicked', async () => {
    renderWithProviders(<SettingsPage />);

    fireEvent.click(screen.getByText('О приложении'));

    const privacyButton = screen.getAllByText('Открыть', { selector: 'button' })[0];
    fireEvent.click(privacyButton);

    expect(screen.getByText('Политика конфиденциальности')).toBeInTheDocument();

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('1. Общие положения')).not.toBeInTheDocument();
    });
  });

  it('allows currency selection', async () => {
    renderWithProviders(<SettingsPage />);

    fireEvent.click(screen.getByText('Внешний вид'));

    const currencySelect = screen.getByDisplayValue('RUB');
    fireEvent.change(currencySelect, { target: { value: 'USD' } });

    await waitFor(() => {
      expect(localStorage.getItem('app_currency')).toBe('USD');
    });
  });

  it('displays all currency options', () => {
    renderWithProviders(<SettingsPage />);

    fireEvent.click(screen.getByText('Внешний вид'));

    const currencySelect = screen.getByDisplayValue('RUB') as HTMLSelectElement;
    const options = Array.from(currencySelect.options).map((opt) => opt.value);

    expect(options).toContain('RUB');
    expect(options).toContain('USD');
    expect(options).toContain('EUR');
    expect(options).toContain('CNY');
  });
});
