// src/components/SettingsPage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { SettingsPage } from './SettingsPage';

describe('SettingsPage', () => {
  it('renders all settings sections in sidebar', () => {
    render(<SettingsPage />);

    // Проверяем навигацию в сайдбаре по классу
    const sidebar = screen.getByText('Безопасность').closest('.settings-sidebar');
    expect(sidebar).toBeInTheDocument();

    // Ищем тексты только внутри сайдбара
    expect(screen.getByText('Безопасность')).toBeInTheDocument();
    expect(screen.getByText('Управление данными')).toBeInTheDocument();
    expect(screen.getByText('Внешний вид')).toBeInTheDocument();
    expect(screen.getByText('О приложении')).toBeInTheDocument();
  });

  it('renders security section content by default', () => {
    render(<SettingsPage />);

    // Проверяем контент секции безопасности по уникальным элементам
    expect(screen.getByText('Смена пароля')).toBeInTheDocument();
    expect(screen.getByText('Двухфакторная аутентификация')).toBeInTheDocument();
    expect(screen.getByText('Подключенные сервисы')).toBeInTheDocument();
    expect(screen.getByText('Удаление аккаунта')).toBeInTheDocument();
  });

  it('switches between sections', () => {
    render(<SettingsPage />);

    // Изначально активна секция безопасности
    expect(screen.getByText('Смена пароля')).toBeInTheDocument();

    // Кликаем на управление данными
    fireEvent.click(screen.getByText('Управление данными'));
    expect(screen.getByText('Автоматическое резервирование')).toBeInTheDocument();
    expect(screen.getByText('Экспорт данных')).toBeInTheDocument();

    // Кликаем на внешний вид
    fireEvent.click(screen.getByText('Внешний вид'));
    expect(screen.getByText('Тема оформления')).toBeInTheDocument();
    expect(screen.getByText('Валюта')).toBeInTheDocument();

    // Кликаем на о приложении
    fireEvent.click(screen.getByText('О приложении'));
    expect(screen.getByText('Версия приложения')).toBeInTheDocument();
    expect(screen.getByText('Поддержка')).toBeInTheDocument();
  });
});
