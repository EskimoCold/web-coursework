import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { SettingsPage } from './SettingsPage';

describe('SettingsPage', () => {
  it('renders all settings sections', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Безопасность')).toBeInTheDocument();
    expect(screen.getByText('Управление данными')).toBeInTheDocument();
    expect(screen.getByText('Внешний вид')).toBeInTheDocument();
    expect(screen.getByText('О приложении')).toBeInTheDocument();
  });

  it('switches between sections', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Смена пароля')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Управление данными'));
    expect(screen.getByText('Автоматическое резервирование')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Внешний вид'));
    expect(screen.getByText('Тема оформления')).toBeInTheDocument();
  });

  it('has security settings', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Двухфакторная аутентификация')).toBeInTheDocument();
    expect(screen.getByText('Удаление аккаунта')).toBeInTheDocument();
  });
});
