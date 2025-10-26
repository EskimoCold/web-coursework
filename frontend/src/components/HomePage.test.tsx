// src/components/HomePage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { transactionsApi } from '../api/transactions';

import { HomePage } from './HomePage';

// Мокаем API модуль
vi.mock('../api/transactions', () => ({
  transactionsApi: {
    getTransactions: vi.fn(),
    getCategories: vi.fn(),
  },
}));

const mockTransactions = [
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
  {
    id: 3,
    amount: 800,
    transaction_type: 'expense',
    transaction_date: '2024-01-08T00:00:00Z',
    description: 'Проездной на метро',
    category: { id: 3, name: 'Транспорт' },
  },
];

const mockCategories = [
  { id: 1, name: 'Продукты' },
  { id: 2, name: 'Зарплата' },
  { id: 3, name: 'Транспорт' },
];

describe('HomePage', () => {
  beforeEach(() => {
    // Сбрасываем моки перед каждым тестом
    vi.clearAllMocks();
  });

  it('renders summary cards with correct data', async () => {
    // Мокаем успешный ответ от API
    vi.mocked(transactionsApi.getTransactions).mockResolvedValue(mockTransactions);
    vi.mocked(transactionsApi.getCategories).mockResolvedValue(mockCategories);

    render(<HomePage />);

    // Ждем пока данные загрузятся
    await waitFor(() => {
      expect(screen.getByText('Общий баланс')).toBeInTheDocument();
    });

    expect(screen.getByText('Доходы')).toBeInTheDocument();
    expect(screen.getByText('Расходы')).toBeInTheDocument();

    // Проверяем что суммы отображаются
    expect(screen.getByText('50,800 ₽')).toBeInTheDocument(); // баланс
    expect(screen.getByText('+50,000 ₽')).toBeInTheDocument(); // доходы
    expect(screen.getByText('-2,300 ₽')).toBeInTheDocument(); // расходы
  });

  it('filters transactions by type', async () => {
    vi.mocked(transactionsApi.getTransactions).mockResolvedValue(mockTransactions);
    vi.mocked(transactionsApi.getCategories).mockResolvedValue(mockCategories);

    render(<HomePage />);

    // Ждем загрузки данных
    await waitFor(() => {
      expect(screen.getByText('Продукты')).toBeInTheDocument();
    });

    // Изначально показываются все транзакции
    expect(screen.getByText('Продукты')).toBeInTheDocument();
    expect(screen.getByText('Зарплата')).toBeInTheDocument();
    expect(screen.getByText('Транспорт')).toBeInTheDocument();

    // Фильтруем по доходам
    fireEvent.click(screen.getByText('Доходы'));

    await waitFor(() => {
      expect(screen.getByText('Зарплата')).toBeInTheDocument();
      expect(screen.queryByText('Продукты')).not.toBeInTheDocument();
      expect(screen.queryByText('Транспорт')).not.toBeInTheDocument();
    });

    // Фильтруем по расходам
    fireEvent.click(screen.getByText('Расходы'));

    await waitFor(() => {
      expect(screen.getByText('Продукты')).toBeInTheDocument();
      expect(screen.getByText('Транспорт')).toBeInTheDocument();
      expect(screen.queryByText('Зарплата')).not.toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    vi.mocked(transactionsApi.getTransactions).mockImplementation(
      () => new Promise(() => {}), // Бесконечный промис для симуляции загрузки
    );
    vi.mocked(transactionsApi.getCategories).mockImplementation(() => new Promise(() => {}));

    render(<HomePage />);

    expect(screen.getByText('Загрузка данных...')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Мокаем ошибку API
    vi.mocked(transactionsApi.getTransactions).mockRejectedValue(new Error('Network error'));
    vi.mocked(transactionsApi.getCategories).mockRejectedValue(new Error('Network error'));

    render(<HomePage />);

    // Ждем пока компонент переключится на моковые данные
    await waitFor(
      () => {
        expect(screen.getByText('Продукты')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Проверяем что моковые данные отображаются
    expect(screen.getByText('Продукты')).toBeInTheDocument();
    expect(screen.getByText('Зарплата')).toBeInTheDocument();
  });

  it('paginates transactions when there are many', async () => {
    // Создаем много транзакций для тестирования пагинации
    const manyTransactions = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      amount: 1000 + i * 100,
      transaction_type: i % 2 === 0 ? 'income' : 'expense',
      transaction_date: '2024-01-01T00:00:00Z',
      description: `Transaction ${i + 1}`,
      category: { id: 1, name: i % 2 === 0 ? 'Зарплата' : 'Продукты' },
    }));

    vi.mocked(transactionsApi.getTransactions).mockResolvedValue(manyTransactions);
    vi.mocked(transactionsApi.getCategories).mockResolvedValue(mockCategories);

    render(<HomePage />);

    // Ждем загрузки данных
    await waitFor(() => {
      expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    });

    // Проверяем что есть пагинация (3 страницы для 15 транзакций по 5 на страницу)
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // Проверяем что на первой странице 5 транзакций
    expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    expect(screen.getByText('Transaction 5')).toBeInTheDocument();
    expect(screen.queryByText('Transaction 6')).not.toBeInTheDocument();

    // Переходим на вторую страницу
    fireEvent.click(screen.getByText('2'));

    await waitFor(() => {
      expect(screen.getByText('Transaction 6')).toBeInTheDocument();
      expect(screen.getByText('Transaction 10')).toBeInTheDocument();
      expect(screen.queryByText('Transaction 5')).not.toBeInTheDocument();
    });
  });
});
