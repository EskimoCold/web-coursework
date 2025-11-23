import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { CurrencyProvider } from '../contexts/CurrencyContext';

import { SettingsPage } from './SettingsPage';

describe('SettingsPage', () => {
  it('renders all settings navigation items', () => {
    render(
      <CurrencyProvider>
        <SettingsPage />
      </CurrencyProvider>,
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
      <CurrencyProvider>
        <SettingsPage />
      </CurrencyProvider>,
    );

    expect(screen.getByText('Смена пароля')).toBeInTheDocument();
    expect(screen.getByText('Удаление аккаунта')).toBeInTheDocument();
  });

  it('switches between sections correctly', () => {
    render(
      <CurrencyProvider>
        <SettingsPage />
      </CurrencyProvider>,
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
