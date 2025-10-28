// src/components/SettingsPage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { SettingsPage } from './SettingsPage';

describe('SettingsPage', () => {
  it('renders all settings navigation items', () => {
    render(<SettingsPage />);

    // Используем getAllByText и проверяем что элементы найдены
    const securityNav = screen.getAllByText('Безопасность');
    expect(securityNav.length).toBe(2); // Один в сайдбаре, один в контенте

    const dataNav = screen.getAllByText('Управление данными');
    expect(dataNav.length).toBe(1);

    const appearanceNav = screen.getAllByText('Внешний вид');
    expect(appearanceNav.length).toBe(1);

    const aboutNav = screen.getAllByText('О приложении');
    expect(aboutNav.length).toBe(1);
  });

  it('renders security section content by default', () => {
    render(<SettingsPage />);

    // Проверяем уникальные элементы контента безопасности
    expect(screen.getByText('Смена пароля')).toBeInTheDocument();
    expect(screen.getByText('Двухфакторная аутентификация')).toBeInTheDocument();
    expect(screen.getByText('Подключенные сервисы')).toBeInTheDocument();
    expect(screen.getByText('Удаление аккаунта')).toBeInTheDocument();
  });

  it('switches between sections correctly', () => {
    render(<SettingsPage />);

    // Проверяем начальное состояние
    expect(screen.getByText('Смена пароля')).toBeInTheDocument();

    // Переключаемся на управление данными
    fireEvent.click(screen.getByText('Управление данными'));
    expect(screen.getByText('Автоматическое резервирование')).toBeInTheDocument();
    expect(screen.getByText('Экспорт данных')).toBeInTheDocument();

    // Переключаемся на внешний вид
    fireEvent.click(screen.getByText('Внешний вид'));
    expect(screen.getByText('Тема оформления')).toBeInTheDocument();
    expect(screen.getByText('Валюта')).toBeInTheDocument();

    // Переключаемся на о приложении
    fireEvent.click(screen.getByText('О приложении'));
    expect(screen.getByText('Версия приложения')).toBeInTheDocument();
    expect(screen.getByText('Поддержка')).toBeInTheDocument();
  });
});
