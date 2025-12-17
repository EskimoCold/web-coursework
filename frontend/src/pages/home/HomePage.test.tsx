import { render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

import { CurrencyProvider } from '../../contexts/CurrencyContext';

import { HomePage } from './HomePage';
import { resetHomeStore } from './homeStore';

// Mock CSS files
vi.mock('./home.css', () => ({}));

// Mock the modules that are causing issues
vi.mock('../../api/transactions', () => ({
  transactionsApi: {
    getTransactions: vi.fn(() =>
      Promise.resolve([
        {
          id: 1,
          amount: 1500,
          transaction_type: 'expense',
          transaction_date: '2024-01-15T00:00:00Z',
          description: 'Продукты в супермаркете',
          category: { id: 1, name: 'Продукты' },
        },
        {
          id: 2,
          amount: 50000,
          transaction_type: 'income',
          transaction_date: '2024-01-10T00:00:00Z',
          description: 'Зарплата за январь',
          category: { id: 2, name: 'Зарплата' },
        },
      ]),
    ),
    getCategories: vi.fn(() => Promise.resolve([])),
    createTransaction: vi.fn(),
  },
}));

// Mock categories API to avoid authorization errors
vi.mock('../../api/categories', () => ({
  categoriesApi: {
    getCategories: vi.fn(() => Promise.resolve([])),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHomeStore();
  });

  test('renders without crashing', async () => {
    render(
      <CurrencyProvider>
        <HomePage />
      </CurrencyProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Дашборд финансов')).toBeInTheDocument();
    });
  });

  test('displays transactions correctly', async () => {
    render(
      <CurrencyProvider>
        <HomePage />
      </CurrencyProvider>,
    );

    // Wait for loading to complete and data to be displayed
    await waitFor(() => {
      const productElements = screen.queryAllByText('Продукты в супермаркете');
      expect(productElements.length).toBeGreaterThan(0);

      const salaryElements = screen.queryAllByText('Зарплата за январь');
      expect(salaryElements.length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      // Текст разбит на несколько элементов: "+", "50 000", "₽"
      // Используем более гибкий поиск
      // "Доходы" и "Расходы" встречаются несколько раз (в карточках и кнопках фильтров)
      // Используем getAllByText и находим карточки по классу
      const incomeCards = screen.getAllByText('Доходы');
      const expenseCards = screen.getAllByText('Расходы');

      expect(incomeCards.length).toBeGreaterThan(0);
      expect(expenseCards.length).toBeGreaterThan(0);

      // Находим карточки по классу summary-card
      const incomeCard = document.querySelector('.summary-card.income');
      const expenseCard = document.querySelector('.summary-card.expense');

      expect(incomeCard).toBeInTheDocument();
      expect(expenseCard).toBeInTheDocument();

      // Проверяем суммы в элементах .amount внутри карточек (не весь textContent карточки)
      const incomeAmount = incomeCard?.querySelector('.amount');
      const expenseAmount = expenseCard?.querySelector('.amount');

      expect(incomeAmount).toBeInTheDocument();
      expect(expenseAmount).toBeInTheDocument();

      // Проверяем, что суммы присутствуют (могут быть разбиты на элементы)
      expect(incomeAmount?.textContent).toContain('50 000');
      expect(incomeAmount?.textContent).toContain('₽');
      expect(expenseAmount?.textContent).toContain('1 500');
      expect(expenseAmount?.textContent).toContain('₽');
    });

    expect(screen.getAllByText('Доходы').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Расходы').length).toBeGreaterThan(0);
    expect(screen.getByText('Баланс')).toBeInTheDocument();
  });
});
