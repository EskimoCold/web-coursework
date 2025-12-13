// src/components/SettingsPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';

import { SettingsPage } from './SettingsPage';
import { CurrencyProvider } from '../contexts/CurrencyContext';
import { transactionsApi } from '../api/transactions';
import { categoriesApi } from '../api/categories';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CurrencyProvider>{children}</CurrencyProvider>
);

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders all settings navigation items', () => {
    render(<SettingsPage />, { wrapper });

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
    render(<SettingsPage />, { wrapper });

    expect(screen.getByText('Смена пароля')).toBeInTheDocument();
    expect(screen.getByText('Удаление аккаунта')).toBeInTheDocument();
  });

  it('switches between sections correctly', () => {
    render(<SettingsPage />, { wrapper });

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
    render(<SettingsPage />, { wrapper });

    fireEvent.click(screen.getByText('О приложении'));
    // Find all "Открыть" buttons and click the one for privacy policy
    const buttons = screen.getAllByText('Открыть');
    // The first "Открыть" button should be for privacy policy (before "Условия использования")
    fireEvent.click(buttons[0]);

    expect(screen.getByText('Политика конфиденциальности')).toBeInTheDocument();
    expect(screen.getByText('1. Сбор информации')).toBeInTheDocument();
    expect(screen.getByText('2. Использование информации')).toBeInTheDocument();
  });

  it('closes privacy policy modal when close button is clicked', async () => {
    render(<SettingsPage />, { wrapper });

    fireEvent.click(screen.getByText('О приложении'));
    const buttons = screen.getAllByText('Открыть');
    fireEvent.click(buttons[0]);

    expect(screen.getByText('Политика конфиденциальности')).toBeInTheDocument();

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('1. Сбор информации')).not.toBeInTheDocument();
    });
  });

  it('allows currency selection and updates localStorage', () => {
    render(<SettingsPage />, { wrapper });

    fireEvent.click(screen.getByText('Внешний вид'));
    // Find select by role
    const selects = screen.getAllByRole('combobox');
    const currencySelect = selects.find((select) => {
      const parent = select.closest('.settings-item');
      return parent?.textContent?.includes('Валюта');
    }) as HTMLSelectElement;

    expect(currencySelect).toBeDefined();
    fireEvent.change(currencySelect, { target: { value: 'USD' } });

    expect(currencySelect.value).toBe('USD');
    expect(localStorage.getItem('currency')).toBe('USD');
  });

  it('displays all currency options', () => {
    render(<SettingsPage />, { wrapper });

    fireEvent.click(screen.getByText('Внешний вид'));
    const selects = screen.getAllByRole('combobox');
    const currencySelect = selects.find((select) => {
      const parent = select.closest('.settings-item');
      return parent?.textContent?.includes('Валюта');
    }) as HTMLSelectElement;

    expect(currencySelect).toBeDefined();
    expect(currencySelect.querySelector('option[value="RUB"]')).toBeInTheDocument();
    expect(currencySelect.querySelector('option[value="USD"]')).toBeInTheDocument();
    expect(currencySelect.querySelector('option[value="EUR"]')).toBeInTheDocument();
    expect(currencySelect.querySelector('option[value="CNY"]')).toBeInTheDocument();
  });

  describe('Data Management', () => {
    const mockTransactions = [
      {
        id: 1,
        amount: 1000,
        transaction_type: 'income' as const,
        transaction_date: '2024-01-01T00:00:00Z',
        description: 'Test transaction',
        category_id: 1,
      },
    ];

    const mockCategories = [
      { id: 1, name: 'Test Category', description: 'Test description' },
    ];

    beforeEach(() => {
      vi.clearAllMocks();
      // Mock URL.createObjectURL and URL.revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
    });

    it('renders data management section', () => {
      render(<SettingsPage />, { wrapper });
      fireEvent.click(screen.getByText('Управление данными'));

      expect(screen.getByText('Экспорт данных')).toBeInTheDocument();
      expect(screen.getByText('Импорт данных')).toBeInTheDocument();
    });

    it('exports data successfully', async () => {
      vi.spyOn(transactionsApi, 'getTransactions').mockResolvedValue(mockTransactions);
      vi.spyOn(categoriesApi, 'getCategories').mockResolvedValue(mockCategories);

      // Mock createElement for download link
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'a') {
          return mockLink as unknown as HTMLElement;
        }
        return document.createElement(tag);
      });
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as unknown as Node);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as unknown as Node);

      render(<SettingsPage />, { wrapper });
      fireEvent.click(screen.getByText('Управление данными'));

      const exportButton = screen.getByText('JSON');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(transactionsApi.getTransactions).toHaveBeenCalled();
        expect(categoriesApi.getCategories).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText(/Данные успешно экспортированы/i)).toBeInTheDocument();
      });

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('handles export error', async () => {
      vi.spyOn(transactionsApi, 'getTransactions').mockRejectedValue(new Error('Export failed'));

      render(<SettingsPage />, { wrapper });
      fireEvent.click(screen.getByText('Управление данными'));

      const exportButton = screen.getByText('JSON');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/Ошибка экспорта/i)).toBeInTheDocument();
      });
    });

    it('opens file input when import button is clicked', () => {
      render(<SettingsPage />, { wrapper });
      fireEvent.click(screen.getByText('Управление данными'));

      const fileInput = screen.getByTestId('import-file-input') as HTMLInputElement;
      const importButton = screen.getByText('Выбрать файл');

      const clickSpy = vi.spyOn(fileInput, 'click');
      fireEvent.click(importButton);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('imports data successfully', async () => {
      const importData = {
        transactions: mockTransactions,
        categories: mockCategories,
        exportDate: new Date().toISOString(),
        version: '1.0',
      };

      const file = new File([JSON.stringify(importData)], 'test.json', {
        type: 'application/json',
      });

      vi.spyOn(categoriesApi, 'getCategories').mockResolvedValue([]);
      vi.spyOn(categoriesApi, 'addCategory').mockResolvedValue(mockCategories[0]);
      vi.spyOn(transactionsApi, 'createTransaction').mockResolvedValue(mockTransactions[0]);

      render(<SettingsPage />, { wrapper });
      fireEvent.click(screen.getByText('Управление данными'));

      const fileInput = screen.getByTestId('import-file-input') as HTMLInputElement;

      // Simulate file selection
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(categoriesApi.getCategories).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText(/Импортировано/i)).toBeInTheDocument();
      });
    });

    it('handles import file error', async () => {
      const invalidFile = new File(['invalid json'], 'test.json', {
        type: 'application/json',
      });

      render(<SettingsPage />, { wrapper });
      fireEvent.click(screen.getByText('Управление данными'));

      const fileInput = screen.getByTestId('import-file-input') as HTMLInputElement;

      Object.defineProperty(fileInput, 'files', {
        value: [invalidFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText(/Ошибка импорта/i)).toBeInTheDocument();
      });
    });

    it('handles invalid import data format', async () => {
      const invalidData = { invalid: 'data' };
      const file = new File([JSON.stringify(invalidData)], 'test.json', {
        type: 'application/json',
      });

      render(<SettingsPage />, { wrapper });
      fireEvent.click(screen.getByText('Управление данными'));

      const fileInput = screen.getByTestId('import-file-input') as HTMLInputElement;

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText(/Неверный формат файла/i)).toBeInTheDocument();
      });
    });

    it('skips existing categories during import', async () => {
      const importData = {
        transactions: [],
        categories: mockCategories,
        exportDate: new Date().toISOString(),
        version: '1.0',
      };

      const file = new File([JSON.stringify(importData)], 'test.json', {
        type: 'application/json',
      });

      // Mock that category already exists
      vi.spyOn(categoriesApi, 'getCategories').mockResolvedValue(mockCategories);

      render(<SettingsPage />, { wrapper });
      fireEvent.click(screen.getByText('Управление данными'));

      const fileInput = screen.getByTestId('import-file-input') as HTMLInputElement;

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(categoriesApi.getCategories).toHaveBeenCalled();
      });

      // Should not call addCategory since category exists
      await waitFor(() => {
        expect(screen.getByText(/Пропущено категорий/i)).toBeInTheDocument();
      });
    });
  });
});
