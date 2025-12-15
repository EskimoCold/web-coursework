// src/components/SettingsPage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import * as AuthContext from '../../contexts/AuthContext';

import { SettingsPage } from './SettingsPage';
import { resetSettingsStore } from './settingsStore';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    resetSettingsStore();
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      accessToken: 'token',
      logout: vi.fn(),
      user: null,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
    });
  });

  it('renders all settings navigation items', () => {
    render(<SettingsPage />);

    expect(screen.getAllByText('Безопасность').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Данные').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Внешний вид').length).toBeGreaterThan(0);
  });

  it('renders security section content by default', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Смена пароля')).toBeInTheDocument();
    expect(screen.getByText('Удаление аккаунта')).toBeInTheDocument();
  });

  it('switches between sections correctly', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Смена пароля')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Данные'));
    expect(screen.getByText('Экспорт данных')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Внешний вид'));
    expect(screen.getByText('Тема оформления')).toBeInTheDocument();
    expect(screen.getByText('Валюта')).toBeInTheDocument();
  });
});
