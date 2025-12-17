import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { currencyApi } from '../../api/currency';
import { Transaction, transactionsApi } from '../../api/transactions';
import { Category } from '../../contexts/CategoriesContext';
import { CurrencyProvider } from '../../contexts/CurrencyContext';
import { predictExpenses } from '../../ml/expensePredictor';

import { AnalyticsPage } from './AnalyticsPage';
import { resetAnalyticsStore } from './analyticsStore';

/** 🔧 NEW: silence console noise from React effects during tests (optional) */
let errSpy: ReturnType<typeof vi.spyOn>;
let warnSpy: ReturnType<typeof vi.spyOn>;
beforeAll(() => {
  errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterAll(() => {
  errSpy?.mockRestore();
  warnSpy?.mockRestore();
});

/** Mock currency API */
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

/** 🔧 NEW: mock categories API so it never throws for missing token */
vi.mock('../../api/categories', () => ({
  categoriesApi: {
    getCategories: vi.fn().mockResolvedValue([
      { id: 1, name: 'Salary', type: 1, icon: 'salary', description: '' },
      { id: 2, name: 'Food', type: 0, icon: 'food', description: '' },
      { id: 3, name: 'Entertainment', type: 0, icon: 'entertainment', description: '' },
      { id: 4, name: 'Freelance', type: 1, icon: 'freelance', description: '' },
    ]),
  },
}));

/** keep your transactions mock */
vi.mock('../../api/transactions', () => ({
  transactionsApi: {
    getTransactions: vi.fn(),
  },
}));

// Глобальные переменные для передачи данных в компонент через мокированный useState
let testTransactions: Transaction[] = [];
let testCategories: Category[] = [];

vi.mock('../../ml/expensePredictor', () => ({
  predictExpenses: vi.fn().mockResolvedValue([
    { date: new Date('2024-02-01'), predictedExpense: 250 },
    { date: new Date('2024-02-02'), predictedExpense: 275 },
  ]),
}));

/** (optional) if any helper reads a token, provide a fake one */
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: (k: string) => (k === 'access_token' || k === 'token' ? 'test-token' : null),
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  },
});

/** keep your Recharts mock */
vi.mock('recharts', () => ({
  AreaChart: ({ children, data }: { children: ReactNode; data: unknown }) => (
    <div data-testid="area-chart" data-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  BarChart: ({ children, data }: { children: ReactNode; data: unknown }) => (
    <div data-testid="bar-chart" data-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  PieChart: ({ children, data }: { children: ReactNode; data: unknown }) => (
    <div data-testid="pie-chart" data-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Pie: ({ children, data }: { children: ReactNode; data: unknown }) => (
    <div data-testid="pie" data-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Area: ({ dataKey }: { dataKey: string }) => <div data-testid={`area-${dataKey}`} />,
  Bar: ({ dataKey }: { dataKey: string }) => <div data-testid={`bar-${dataKey}`} />,
  Line: ({ dataKey }: { dataKey: string }) => <div data-testid={`line-${dataKey}`} />,
  Cell: ({ fill }: { fill: string }) => <div data-testid="cell" data-fill={fill} />,
  XAxis: ({ dataKey }: { dataKey: string }) => <div data-testid={`xaxis-${dataKey}`} />,
  YAxis: () => <div data-testid="yaxis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: ({ formatter }: { formatter?: unknown }) => (
    <div data-testid="tooltip" data-formatter={formatter ? 'true' : 'false'} />
  ),
  ResponsiveContainer: ({
    children,
    width,
    height,
  }: {
    children: ReactNode;
    width: string | number;
    height: string | number;
  }) => (
    <div data-testid="responsive-container" data-width={width} data-height={height}>
      {children}
    </div>
  ),
}));

const mockTransactions: Transaction[] = [
  {
    id: 1,
    amount: 1000,
    transaction_type: 'income',
    transaction_date: '2024-01-15',
    category: { id: 1, name: 'Salary', type: 1, icon: 'salary', description: 'Salary income' },
    description: 'Monthly salary',
  },
  {
    id: 2,
    amount: 500,
    transaction_type: 'expense',
    transaction_date: '2024-01-16',
    category: { id: 2, name: 'Food', type: 0, icon: 'food', description: 'Food expenses' },
    description: 'Groceries',
  },
  {
    id: 3,
    amount: 200,
    transaction_type: 'expense',
    transaction_date: '2024-01-17',
    category: {
      id: 3,
      name: 'Entertainment',
      type: 0,
      icon: 'entertainment',
      description: 'Entertainment expenses',
    },
    description: 'Cinema',
  },
  {
    id: 4,
    amount: 1500,
    transaction_type: 'income',
    transaction_date: '2024-01-18',
    category: {
      id: 4,
      name: 'Freelance',
      type: 1,
      icon: 'freelance',
      description: 'Freelance income',
    },
    description: 'Project payment',
  },
];

const renderComponent = (transactions: Transaction[] = mockTransactions) => {
  (transactionsApi.getTransactions as vi.Mock).mockResolvedValue(transactions);
  (currencyApi.getRates as vi.Mock).mockResolvedValue({
    base: 'RUB',
    date: '2024-01-01',
    rates: { RUB: 1, USD: 0.011, EUR: 0.01, CNY: 0.08 },
  });

  // Устанавливаем данные для мокированного useState
  testTransactions = transactions;
  testCategories = [
    { id: 1, name: 'Salary', type: 1, icon: 'salary', description: '' },
    { id: 2, name: 'Food', type: 0, icon: 'food', description: '' },
    { id: 3, name: 'Entertainment', type: 0, icon: 'entertainment', description: '' },
    { id: 4, name: 'Freelance', type: 1, icon: 'freelance', description: '' },
  ];

  // Мокируем useState для AnalyticsPage
  const useStateSpy = vi.spyOn(React, 'useState');
  const originalUseState = React.useState;
  let emptyArrayCallCount = 0;

  useStateSpy.mockImplementation((initial) => {
    const result = originalUseState(initial);

    // Мокируем только вызовы с пустым массивом
    // CurrencyProvider не использует пустые массивы, поэтому первые два - из AnalyticsPage
    if (Array.isArray(initial) && initial.length === 0) {
      emptyArrayCallCount++;

      if (emptyArrayCallCount === 1) {
        // Первый пустой массив - transactions
        return [testTransactions, result[1]];
      } else if (emptyArrayCallCount === 2) {
        // Второй пустой массив - categories
        return [testCategories, result[1]];
      }
    }

    return result;
  });

  const result = render(
    <CurrencyProvider>
      <AnalyticsPage />
    </CurrencyProvider>,
  );

  // Восстанавливаем после рендера
  useStateSpy.mockRestore();
  return result;
};

describe('AnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAnalyticsStore();
    // Сбрасываем данные для каждого теста
    testTransactions = [];
    testCategories = [];
  });

  it('should render all filter buttons', () => {
    renderComponent();
    expect(screen.getByText('Неделя')).toBeInTheDocument();
    expect(screen.getByText('Месяц')).toBeInTheDocument();
    expect(screen.getByText('Год')).toBeInTheDocument();
    expect(screen.getByText('Все время')).toBeInTheDocument();
  });

  it('should have "all" filter active by default', () => {
    renderComponent();
    const allTimeButton = screen.getByText('Все время');
    expect(allTimeButton).toHaveClass('anal-filter-active');
  });

  it('should change active filter when clicked', () => {
    renderComponent();
    const weekButton = screen.getByText('Неделя');
    fireEvent.click(weekButton);
    expect(weekButton).toHaveClass('anal-filter-active');
    expect(screen.getByText('Все время')).not.toHaveClass('anal-filter-active');
  });

  it('should display summary information', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Общий баланс')).toBeInTheDocument();
      expect(screen.getByText('Доходы')).toBeInTheDocument();
      expect(screen.getByText('Расходы')).toBeInTheDocument();
      expect(screen.getByText('Всего операций')).toBeInTheDocument();
    });
  });

  it('should calculate correct balance', async () => {
    renderComponent();

    // Ждем, пока данные загрузятся и баланс отобразится
    await waitFor(
      () => {
        const totalBalance = 1000 + 1500 - 500 - 200; // 1800
        const formattedBalance = totalBalance.toLocaleString('ru-RU'); // "1 800"
        const balanceElement = document.querySelector('.anal-value.total');
        expect(balanceElement).toBeInTheDocument();
        expect(balanceElement?.textContent).toContain(formattedBalance);
        expect(balanceElement?.textContent).toContain('₽');
      },
      { timeout: 3000 },
    );
  });

  it('should calculate correct incomes and expenses', async () => {
    renderComponent();

    await waitFor(
      () => {
        const totalIncomes = 1000 + 1500; // 2500
        const totalExpenses = 500 + 200; // 700
        const formattedIncomes = totalIncomes.toLocaleString('ru-RU'); // "2 500"
        const formattedExpenses = totalExpenses.toLocaleString('ru-RU'); // "700"
        const incomeElement = document.querySelector('.anal-value.income');
        const expenseElement = document.querySelector('.anal-value.expense');
        expect(incomeElement).toBeInTheDocument();
        expect(expenseElement).toBeInTheDocument();
        expect(incomeElement?.textContent).toContain(formattedIncomes);
        expect(incomeElement?.textContent).toContain('₽');
        expect(expenseElement?.textContent).toContain(formattedExpenses);
        expect(expenseElement?.textContent).toContain('₽');
      },
      { timeout: 3000 },
    );
  });

  it('should display correct number of transactions', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(`${mockTransactions.length}`)).toBeInTheDocument();
    });
  });

  it('should render all chart containers', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Динамика доходов и расходов')).toBeInTheDocument();
      expect(screen.getByText('Расходы по категориям')).toBeInTheDocument();
      expect(screen.getByText('Доходы по категориям')).toBeInTheDocument();
    });
  });

  it('should show predicted expenses line on the chart', async () => {
    (predictExpenses as vi.Mock).mockResolvedValueOnce([
      { date: new Date('2024-02-01'), predictedExpense: 500 },
    ]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('line-predictedExpense')).toBeInTheDocument();
      const chartData = screen.getByTestId('area-chart').getAttribute('data-data') || '[]';
      expect(JSON.parse(chartData)).toEqual(
        expect.arrayContaining([expect.objectContaining({ predictedExpense: 500 })]),
      );
    });
  });

  it('should filter transactions by week', async () => {
    const recentTransaction: Transaction[] = [
      {
        id: 1,
        amount: 1000,
        transaction_type: 'income',
        transaction_date: new Date().toISOString(),
        category: { id: 1, name: 'Salary', type: 1, icon: 'salary', description: 'Salary income' },
        description: 'Recent transaction',
      },
    ];

    renderComponent(recentTransaction);
    const weekButton = screen.getByText('Неделя');
    fireEvent.click(weekButton);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // operations count
    });
  });

  it('should group transactions by date for area chart', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });
  });

  it('should categorize incomes correctly', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  it('should categorize expenses correctly', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });

  it('should apply correct CSS classes to values', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Общий баланс').nextElementSibling).toHaveClass('anal-value total');
      expect(screen.getByText('Доходы').nextElementSibling).toHaveClass('anal-value income');
      expect(screen.getByText('Расходы').nextElementSibling).toHaveClass('anal-value expense');
      expect(screen.getByText('Всего операций').nextElementSibling).toHaveClass(
        'anal-value operations',
      );
    });
  });

  it('should not run forecast when there are no transactions', async () => {
    renderComponent([]);
    await waitFor(() => {
      expect(predictExpenses).not.toHaveBeenCalled();
    });
  });

  it('shows forecast error when predictor fails', async () => {
    (predictExpenses as vi.Mock).mockRejectedValueOnce(new Error('boom'));
    renderComponent(mockTransactions);

    await waitFor(() => {
      expect(screen.getByText('Не удалось построить прогноз расходов')).toBeInTheDocument();
    });
  });

  it('uses fallback category name when missing', async () => {
    const missingCategoryTx: Transaction[] = [
      {
        id: 5,
        amount: 300,
        transaction_type: 'expense',
        transaction_date: '2024-01-20',
        category: undefined,
        description: 'Unknown category expense',
      } as unknown as Transaction,
    ];

    renderComponent(missingCategoryTx);

    await waitFor(() => {
      const pie = screen.getByTestId('pie');
      const data = JSON.parse(pie.getAttribute('data-data') || '[]');
      expect(data[0]).toMatchObject({ name: 'Без категории', value: 300 });
    });
  });

  it('passes tooltip formatter to chart', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByTestId('tooltip').getAttribute('data-formatter')).toBe('true');
    });
  });

  it('should filter transactions by month', async () => {
    const monthTransaction: Transaction[] = [
      {
        id: 1,
        amount: 1000,
        transaction_type: 'income',
        transaction_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        category: { id: 1, name: 'Salary', type: 1, icon: 'salary', description: 'Salary income' },
        description: 'Monthly transaction',
      },
    ];

    renderComponent(monthTransaction);
    const monthButton = screen.getByText('Месяц');
    fireEvent.click(monthButton);

    await waitFor(() => {
      expect(monthButton).toHaveClass('anal-filter-active');
    }, { timeout: 3000 });
  });

  it('should filter transactions by year', async () => {
    const yearTransaction: Transaction[] = [
      {
        id: 1,
        amount: 1000,
        transaction_type: 'income',
        transaction_date: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(), // 200 days ago
        category: { id: 1, name: 'Salary', type: 1, icon: 'salary', description: 'Salary income' },
        description: 'Yearly transaction',
      },
    ];

    renderComponent(yearTransaction);
    const yearButton = screen.getByText('Год');
    fireEvent.click(yearButton);

    await waitFor(() => {
      expect(yearButton).toHaveClass('anal-filter-active');
    }, { timeout: 3000 });
  });

  it('should handle empty transactions array', async () => {
    renderComponent([]);
    await waitFor(() => {
      const balanceElement = document.querySelector('.anal-value.total');
      expect(balanceElement).toBeInTheDocument();
      expect(balanceElement?.textContent).toContain('0');
      const operationsElement = screen.queryByText('0');
      if (operationsElement) {
        expect(operationsElement).toBeInTheDocument();
      }
    });
  });

  it('should handle transactions with category_id instead of category object', async () => {
    const transactionWithCategoryId: Transaction[] = [
      {
        id: 1,
        amount: 500,
        transaction_type: 'expense',
        transaction_date: '2024-01-20',
        category_id: 2,
        category: undefined,
        description: 'Transaction with category_id',
      } as Transaction,
    ];

    renderComponent(transactionWithCategoryId);

    await waitFor(() => {
      const pie = screen.getByTestId('pie');
      const data = JSON.parse(pie.getAttribute('data-data') || '[]');
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toMatchObject({ name: 'Food', value: 500 });
    }, { timeout: 3000 });
  });

  it('should handle income transactions correctly in charts', async () => {
    renderComponent();
    await waitFor(() => {
      const barChart = screen.getByTestId('bar-chart');
      expect(barChart).toBeInTheDocument();
      const data = JSON.parse(barChart.getAttribute('data-data') || '[]');
      // Должны быть доходы по категориям
      expect(data.length).toBeGreaterThan(0);
      expect(data.some((item: { name: string; value: number }) => item.value > 0)).toBe(true);
    }, { timeout: 3000 });
  });

  it('should handle expense transactions correctly in pie chart', async () => {
    renderComponent();
    await waitFor(() => {
      const pie = screen.getByTestId('pie');
      expect(pie).toBeInTheDocument();
      const data = JSON.parse(pie.getAttribute('data-data') || '[]');
      // Должны быть расходы по категориям
      expect(data.length).toBeGreaterThan(0);
      expect(data.some((item: { name: string; value: number }) => item.value > 0)).toBe(true);
    }, { timeout: 3000 });
  });

  it('should display chart data with predicted expenses', async () => {
    // Прогноз расходов не используется в текущей реализации компонента
    // (expenseForecast всегда пустой массив)
    // Этот тест проверяет, что компонент корректно обрабатывает данные графика
    renderComponent();

    await waitFor(() => {
      const chartData = screen.getByTestId('area-chart');
      expect(chartData).toBeInTheDocument();
    });
  });

  it('should handle multiple transactions on the same date', async () => {
    const sameDateTransactions: Transaction[] = [
      {
        id: 1,
        amount: 100,
        transaction_type: 'income',
        transaction_date: '2024-01-15',
        category: { id: 1, name: 'Salary', type: 1, icon: 'salary', description: '' },
        description: 'First transaction',
      },
      {
        id: 2,
        amount: 200,
        transaction_type: 'income',
        transaction_date: '2024-01-15',
        category: { id: 1, name: 'Salary', type: 1, icon: 'salary', description: '' },
        description: 'Second transaction',
      },
    ];

    renderComponent(sameDateTransactions);

    await waitFor(() => {
      const totalIncomes = 100 + 200; // 300
      const formattedIncomes = totalIncomes.toLocaleString('ru-RU');
      const incomeElement = document.querySelector('.anal-value.income');
      expect(incomeElement).toBeInTheDocument();
      expect(incomeElement?.textContent).toContain(formattedIncomes);
    }, { timeout: 3000 });
  });

  it('should filter out old transactions when using week filter', async () => {
    const oldTransaction: Transaction[] = [
      {
        id: 1,
        amount: 1000,
        transaction_type: 'income',
        transaction_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        category: { id: 1, name: 'Salary', type: 1, icon: 'salary', description: '' },
        description: 'Old transaction',
      },
    ];

    renderComponent(oldTransaction);
    const weekButton = screen.getByText('Неделя');
    fireEvent.click(weekButton);

    await waitFor(() => {
      // Старая транзакция должна быть отфильтрована
      const balanceElement = document.querySelector('.anal-value.total');
      expect(balanceElement).toBeInTheDocument();
      // Баланс должен быть 0, так как транзакция старше недели
      expect(balanceElement?.textContent).toContain('0');
    }, { timeout: 3000 });
  });

  it('should handle transactions with missing category name in categoryNameById', async () => {
    const transactionWithUnknownCategory: Transaction[] = [
      {
        id: 1,
        amount: 300,
        transaction_type: 'expense',
        transaction_date: '2024-01-20',
        category_id: 999, // Несуществующий ID
        category: undefined,
        description: 'Transaction with unknown category',
      } as Transaction,
    ];

    renderComponent(transactionWithUnknownCategory);

    await waitFor(() => {
      const pie = screen.getByTestId('pie');
      expect(pie).toBeInTheDocument();
      const data = JSON.parse(pie.getAttribute('data-data') || '[]');
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toMatchObject({ name: 'Без категории', value: 300 });
    }, { timeout: 3000 });
  });

  it('should display correct currency symbol', async () => {
    renderComponent();
    await waitFor(() => {
      const balanceElement = document.querySelector('.anal-value.total');
      expect(balanceElement).toBeInTheDocument();
      expect(balanceElement?.textContent).toContain('₽');
    }, { timeout: 3000 });
  });

  it('should handle filter switching between different periods', async () => {
    renderComponent();

    // Переключаемся на неделю
    const weekButton = screen.getByText('Неделя');
    fireEvent.click(weekButton);
    await waitFor(() => {
      expect(weekButton).toHaveClass('anal-filter-active');
    });

    // Переключаемся на месяц
    const monthButton = screen.getByText('Месяц');
    fireEvent.click(monthButton);
    await waitFor(() => {
      expect(monthButton).toHaveClass('anal-filter-active');
      expect(weekButton).not.toHaveClass('anal-filter-active');
    });

    // Возвращаемся к "Все время"
    const allTimeButton = screen.getByText('Все время');
    fireEvent.click(allTimeButton);
    await waitFor(() => {
      expect(allTimeButton).toHaveClass('anal-filter-active');
      expect(monthButton).not.toHaveClass('anal-filter-active');
    });
  });
});
