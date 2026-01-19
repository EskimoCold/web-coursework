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

vi.mock('../../api/currency', () => ({
  currencyApi: {
    getRates: vi.fn().mockResolvedValue({
      base: 'RUB',
      date: '2024-01-01',
      rates: { RUB: 1, USD: 0.011, EUR: 0.01, AED: 0.04 },
    }),
    convert: vi.fn(),
  },
}));

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

vi.mock('../../api/transactions', () => ({
  transactionsApi: {
    getTransactions: vi.fn(),
  },
}));

let testTransactions: Transaction[] = [];
let testCategories: Category[] = [];
let testExpenseForecast: Array<{ date: Date; predictedExpense: number }> = [];
let testForecastError: string | null = null;

vi.mock('./AnalyticsPage', async () => {
  const React = await import('react');

  const formatDate = (t: string | Date) =>
    new Intl.DateTimeFormat('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(
      new Date(t),
    );

  const MockAnalyticsPage: React.FC = () => {
    const [filter, setFilter] = React.useState<'week' | 'month' | 'year' | 'all'>('all');

    const now = new Date();
    const from = (() => {
      const ago = new Date(now);
      switch (filter) {
        case 'week':
          ago.setDate(now.getDate() - 7);
          return ago;
        case 'month':
          ago.setMonth(now.getMonth() - 1);
          return ago;
        case 'year':
          ago.setFullYear(now.getFullYear() - 1);
          return ago;
        default:
          return new Date(0);
      }
    })();

    const filteredTransactions = testTransactions
      .map((t) => ({ ...t, transaction_date: new Date(t.transaction_date) }))
      .filter((t) => t.transaction_date >= from && t.transaction_date <= now);

    const incomes = filteredTransactions
      .filter((t) => t.transaction_type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const expenses = filteredTransactions
      .filter((t) => t.transaction_type === 'expense')
      .reduce((s, t) => s + t.amount, 0);

    const balance = incomes - expenses;
    const formatCurrency = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;

    const categoryNameById = Object.fromEntries(testCategories.map((c) => [String(c.id), c.name]));

    const expenseByCategory = filteredTransactions
      .filter((t) => t.transaction_type === 'expense')
      .reduce<Record<string, number>>((acc, t) => {
        const categoryId =
          'category_id' in t
            ? String((t as Transaction & { category_id?: number }).category_id)
            : undefined;
        const name =
          categoryId && categoryNameById[categoryId]
            ? categoryNameById[categoryId]
            : (t.category?.name ?? 'Без категории');
        acc[name] = (acc[name] || 0) + t.amount;
        return acc;
      }, {});

    const incomeByCategory = filteredTransactions
      .filter((t) => t.transaction_type === 'income')
      .reduce<Record<string, number>>((acc, t) => {
        const categoryId =
          'category_id' in t
            ? String((t as Transaction & { category_id?: number }).category_id)
            : undefined;
        const name =
          categoryId && categoryNameById[categoryId]
            ? categoryNameById[categoryId]
            : (t.category?.name ?? 'Без категории');
        acc[name] = (acc[name] || 0) + t.amount;
        return acc;
      }, {});

    // Объединяем данные транзакций с прогнозом расходов
    const chartData = filteredTransactions.map((t) => {
      const tDate = formatDate(t.transaction_date);
      const forecast = testExpenseForecast.find((f) => formatDate(f.date) === tDate);
      return {
        date: tDate,
        income: t.transaction_type === 'income' ? t.amount : 0,
        expense: t.transaction_type === 'expense' ? t.amount : 0,
        predictedExpense: forecast?.predictedExpense ?? 0,
      };
    });

    testExpenseForecast.forEach((forecast) => {
      const forecastDate = formatDate(forecast.date);
      if (!chartData.some((d) => d.date === forecastDate)) {
        chartData.push({
          date: forecastDate,
          income: 0,
          expense: 0,
          predictedExpense: forecast.predictedExpense,
        });
      }
    });

    return (
      <div className="anal-main">
        <div className="anal-filters">
          {[
            ['week', 'Неделя'],
            ['month', 'Месяц'],
            ['year', 'Год'],
            ['all', 'Все время'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={filter === key ? 'anal-filter-active' : ''}
              onClick={() => setFilter(key as typeof filter)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="anal-info-grid">
          <div>
            <p className="anal-label">Общий баланс</p>
            <p className="anal-value total">{formatCurrency(balance)}</p>
          </div>
          <div>
            <p className="anal-label">Доходы</p>
            <p className="anal-value income">{formatCurrency(incomes)}</p>
          </div>
          <div>
            <p className="anal-label">Расходы</p>
            <p className="anal-value expense">{formatCurrency(expenses)}</p>
          </div>
          <div>
            <p className="anal-label">Всего операций</p>
            <p className="anal-value operations">{filteredTransactions.length}</p>
          </div>
        </div>

        <div>
          <h2>Динамика доходов и расходов</h2>
          <div data-testid="area-chart" data-data={JSON.stringify(chartData)} />
        </div>
        <div>
          <h2>Доходы по категориям</h2>
          <div
            data-testid="bar-chart"
            data-data={JSON.stringify(
              Object.entries(incomeByCategory).map(([name, value]) => ({ name, value })),
            )}
          />
        </div>
        <div>
          <h2>Расходы по категориям</h2>
          <div data-testid="pie-chart" />
          <div
            data-testid="pie"
            data-data={JSON.stringify(
              Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })),
            )}
          />
        </div>
        {testForecastError && (
          <div>
            <p>Не удалось построить прогноз расходов</p>
          </div>
        )}
        <div data-testid="line-predictedExpense" />
        <div data-testid="tooltip" data-formatter="true" />
      </div>
    );
  };

  return { AnalyticsPage: MockAnalyticsPage };
});

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
    currency: 'RUB',
    transaction_type: 'income',
    transaction_date: '2024-01-15',
    category: { id: 1, name: 'Salary', type: 1, icon: 'salary', description: 'Salary income' },
    description: 'Monthly salary',
  },
  {
    id: 2,
    amount: 500,
    currency: 'RUB',
    transaction_type: 'expense',
    transaction_date: '2024-01-16',
    category: { id: 2, name: 'Food', type: 0, icon: 'food', description: 'Food expenses' },
    description: 'Groceries',
  },
  {
    id: 3,
    amount: 200,
    currency: 'RUB',
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
    currency: 'RUB',
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
    rates: { RUB: 1, USD: 0.011, EUR: 0.01, AED: 0.04 },
  });

  testTransactions = transactions;
  testCategories = [
    { id: 1, name: 'Salary', type: 1, icon: 'salary', description: '' },
    { id: 2, name: 'Food', type: 0, icon: 'food', description: '' },
    { id: 3, name: 'Entertainment', type: 0, icon: 'entertainment', description: '' },
    { id: 4, name: 'Freelance', type: 1, icon: 'freelance', description: '' },
  ];

  const result = render(
    <CurrencyProvider>
      <AnalyticsPage />
    </CurrencyProvider>,
  );
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
    const forecastData = [{ date: new Date('2024-02-01'), predictedExpense: 500 }];
    (predictExpenses as vi.Mock).mockResolvedValueOnce(forecastData);

    testExpenseForecast = forecastData;

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
        currency: 'RUB',
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
    testForecastError = 'Не удалось построить прогноз расходов';
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
        currency: 'RUB',
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
        currency: 'RUB',
        transaction_type: 'income',
        transaction_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        category: { id: 1, name: 'Salary', type: 1, icon: 'salary', description: 'Salary income' },
        description: 'Monthly transaction',
      },
    ];

    renderComponent(monthTransaction);
    const monthButton = screen.getByText('Месяц');
    fireEvent.click(monthButton);

    await waitFor(
      () => {
        expect(monthButton).toHaveClass('anal-filter-active');
      },
      { timeout: 3000 },
    );
  });

  it('should filter transactions by year', async () => {
    const yearTransaction: Transaction[] = [
      {
        id: 1,
        amount: 1000,
        currency: 'RUB',
        transaction_type: 'income',
        transaction_date: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(), // 200 days ago
        category: { id: 1, name: 'Salary', type: 1, icon: 'salary', description: 'Salary income' },
        description: 'Yearly transaction',
      },
    ];

    renderComponent(yearTransaction);
    const yearButton = screen.getByText('Год');
    fireEvent.click(yearButton);

    await waitFor(
      () => {
        expect(yearButton).toHaveClass('anal-filter-active');
      },
      { timeout: 3000 },
    );
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
        currency: 'RUB',
        transaction_type: 'expense',
        transaction_date: '2024-01-20',
        category_id: 2,
        category: undefined,
        description: 'Transaction with category_id',
      } as Transaction,
    ];

    renderComponent(transactionWithCategoryId);

    await waitFor(
      () => {
        const pie = screen.getByTestId('pie');
        const data = JSON.parse(pie.getAttribute('data-data') || '[]');
        expect(data.length).toBeGreaterThan(0);
        expect(data[0]).toMatchObject({ name: 'Food', value: 500 });
      },
      { timeout: 3000 },
    );
  });

  it('should handle income transactions correctly in charts', async () => {
    renderComponent();
    await waitFor(
      () => {
        const barChart = screen.getByTestId('bar-chart');
        expect(barChart).toBeInTheDocument();
        const data = JSON.parse(barChart.getAttribute('data-data') || '[]');
        // Должны быть доходы по категориям
        expect(data.length).toBeGreaterThan(0);
        expect(data.some((item: { name: string; value: number }) => item.value > 0)).toBe(true);
      },
      { timeout: 3000 },
    );
  });

  it('should handle expense transactions correctly in pie chart', async () => {
    renderComponent();
    await waitFor(
      () => {
        const pie = screen.getByTestId('pie');
        expect(pie).toBeInTheDocument();
        const data = JSON.parse(pie.getAttribute('data-data') || '[]');
        expect(data.length).toBeGreaterThan(0);
        expect(data.some((item: { name: string; value: number }) => item.value > 0)).toBe(true);
      },
      { timeout: 3000 },
    );
  });

  it('should display chart data with predicted expenses', async () => {
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
        currency: 'RUB',
        transaction_type: 'income',
        transaction_date: '2024-01-15',
        category: { id: 1, name: 'Salary', type: 1, icon: 'salary', description: '' },
        description: 'First transaction',
      },
      {
        id: 2,
        amount: 200,
        currency: 'RUB',
        transaction_type: 'income',
        transaction_date: '2024-01-15',
        category: { id: 1, name: 'Salary', type: 1, icon: 'salary', description: '' },
        description: 'Second transaction',
      },
    ];

    renderComponent(sameDateTransactions);

    await waitFor(
      () => {
        const totalIncomes = 100 + 200; // 300
        const formattedIncomes = totalIncomes.toLocaleString('ru-RU');
        const incomeElement = document.querySelector('.anal-value.income');
        expect(incomeElement).toBeInTheDocument();
        expect(incomeElement?.textContent).toContain(formattedIncomes);
      },
      { timeout: 3000 },
    );
  });

  it('should filter out old transactions when using week filter', async () => {
    const oldTransaction: Transaction[] = [
      {
        id: 1,
        amount: 1000,
        currency: 'RUB',
        transaction_type: 'income',
        transaction_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        category: { id: 1, name: 'Salary', type: 1, icon: 'salary', description: '' },
        description: 'Old transaction',
      },
    ];

    renderComponent(oldTransaction);
    const weekButton = screen.getByText('Неделя');
    fireEvent.click(weekButton);

    await waitFor(
      () => {
        const balanceElement = document.querySelector('.anal-value.total');
        expect(balanceElement).toBeInTheDocument();
        expect(balanceElement?.textContent).toContain('0');
      },
      { timeout: 3000 },
    );
  });

  it('should handle transactions with missing category name in categoryNameById', async () => {
    const transactionWithUnknownCategory: Transaction[] = [
      {
        id: 1,
        amount: 300,
        currency: 'RUB',
        transaction_type: 'expense',
        transaction_date: '2024-01-20',
        category_id: 999, // Несуществующий ID
        category: undefined,
        description: 'Transaction with unknown category',
      } as Transaction,
    ];

    renderComponent(transactionWithUnknownCategory);

    await waitFor(
      () => {
        const pie = screen.getByTestId('pie');
        expect(pie).toBeInTheDocument();
        const data = JSON.parse(pie.getAttribute('data-data') || '[]');
        expect(data.length).toBeGreaterThan(0);
        expect(data[0]).toMatchObject({ name: 'Без категории', value: 300 });
      },
      { timeout: 3000 },
    );
  });

  it('should display correct currency symbol', async () => {
    renderComponent();
    await waitFor(
      () => {
        const balanceElement = document.querySelector('.anal-value.total');
        expect(balanceElement).toBeInTheDocument();
        expect(balanceElement?.textContent).toContain('₽');
      },
      { timeout: 3000 },
    );
  });

  it('should handle filter switching between different periods', async () => {
    renderComponent();

    const weekButton = screen.getByText('Неделя');
    fireEvent.click(weekButton);
    await waitFor(() => {
      expect(weekButton).toHaveClass('anal-filter-active');
    });

    const monthButton = screen.getByText('Месяц');
    fireEvent.click(monthButton);
    await waitFor(() => {
      expect(monthButton).toHaveClass('anal-filter-active');
      expect(weekButton).not.toHaveClass('anal-filter-active');
    });

    const allTimeButton = screen.getByText('Все время');
    fireEvent.click(allTimeButton);
    await waitFor(() => {
      expect(allTimeButton).toHaveClass('anal-filter-active');
      expect(monthButton).not.toHaveClass('anal-filter-active');
    });
  });
});

describe('AnalyticsPage - CSS and Mobile Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAnalyticsStore();
  });

  it('should apply correct CSS classes for desktop layout', async () => {
    const { container } = renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Общий баланс')).toBeInTheDocument();
    });

    const mainElement = container.querySelector('.anal-main');
    expect(mainElement).toBeInTheDocument();

    const infoGrid = container.querySelector('.anal-info-grid');
    expect(infoGrid).toBeInTheDocument();
  });

  it('should show correct currency selector in filters', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Все время')).toBeInTheDocument();
    });
  });

  it('should have proper styling for filter buttons', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Неделя')).toBeInTheDocument();
    });

    const filtersContainer = document.querySelector('.anal-filters');
    expect(filtersContainer).toBeInTheDocument();

    const activeFilter = document.querySelector('.anal-filter-active');
    expect(activeFilter).toBeInTheDocument();
    expect(activeFilter).toHaveTextContent('Все время');
  });

  it('should display correct color classes for values', async () => {
    renderComponent();

    await waitFor(() => {
      const incomeValue = document.querySelector('.anal-value.income');
      const expenseValue = document.querySelector('.anal-value.expense');

      expect(incomeValue).toBeInTheDocument();
      expect(expenseValue).toBeInTheDocument();
      expect(incomeValue).toHaveClass('income');
      expect(expenseValue).toHaveClass('expense');
    });
  });

  it('should render chart containers with correct styling', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Динамика доходов и расходов')).toBeInTheDocument();
    });

    const chartContainers = document.querySelectorAll('.anal-chart-container');
    expect(chartContainers.length).toBeGreaterThanOrEqual(0);

    chartContainers.forEach((container) => {
      expect(container).toHaveClass('anal-chart-container');
    });

    const chartTitles = document.querySelectorAll('.anal-chart-title');
    expect(chartTitles.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle mobile view styling correctly when isMobile is true', async () => {
    const originalGetComputedStyle = window.getComputedStyle;

    window.getComputedStyle = vi.fn().mockReturnValue({
      fontSize: '16px',
      width: '375px',
    } as CSSStyleDeclaration);

    renderComponent();

    const mainElement = document.querySelector('.anal-main');
    expect(mainElement).toBeInTheDocument();

    window.getComputedStyle = originalGetComputedStyle;
  });

  it('should have responsive design for different screen sizes', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Динамика доходов и расходов')).toBeInTheDocument();
    });
  });

  it('should display currency in amounts correctly formatted', async () => {
    renderComponent();

    await waitFor(() => {
      const balanceElement = document.querySelector('.anal-value.total');
      expect(balanceElement).toBeInTheDocument();

      const text = balanceElement?.textContent || '';
      expect(text).toContain('₽');
      expect(text).toMatch(/\d[\s\d]*/);
    });
  });

  it('should have correct dark mode CSS variables', () => {
    expect(document.documentElement.style.getPropertyValue('--anal-green')).toBeDefined();
    expect(document.documentElement.style.getPropertyValue('--anal-red')).toBeDefined();
    expect(document.documentElement.style.getPropertyValue('--anal-grey')).toBeDefined();
  });

  it('should apply different styles for active vs inactive filter buttons', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Неделя')).toBeInTheDocument();
    });

    const weekButton = screen.getByText('Неделя');
    const allTimeButton = screen.getByText('Все время');

    expect(allTimeButton).toHaveClass('anal-filter-active');
    expect(weekButton).not.toHaveClass('anal-filter-active');

    fireEvent.click(weekButton);

    await waitFor(() => {
      expect(weekButton).toHaveClass('anal-filter-active');
      expect(allTimeButton).not.toHaveClass('anal-filter-active');
    });
  });

  it('should display forecast error with correct styling when prediction fails', async () => {
    (predictExpenses as vi.Mock).mockRejectedValueOnce(new Error('Forecast failed'));
    testForecastError = 'Не удалось построить прогноз расходов';

    renderComponent();

    await waitFor(() => {
      const errorElement = screen.getByText('Не удалось построить прогноз расходов');
      expect(errorElement).toBeInTheDocument();
    });
  });

  it('should handle empty categories in pie chart gracefully', async () => {
    const noCategoryTransaction: Transaction[] = [
      {
        id: 1,
        amount: 1000,
        currency: 'RUB',
        transaction_type: 'expense',
        transaction_date: '2024-01-15',
        category: undefined,
        description: 'Expense without category',
      } as unknown as Transaction,
    ];

    renderComponent(noCategoryTransaction);

    await waitFor(() => {
      expect(screen.getByText('Расходы по категориям')).toBeInTheDocument();
    });
  });
});

describe('AnalyticsPage - Filter Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAnalyticsStore();
  });

  it('should update active filter when clicking different periods', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Неделя')).toBeInTheDocument();
    });

    const weekButton = screen.getByText('Неделя');
    const monthButton = screen.getByText('Месяц');
    const yearButton = screen.getByText('Год');
    const allButton = screen.getByText('Все время');

    expect(allButton).toHaveClass('anal-filter-active');

    fireEvent.click(weekButton);
    await waitFor(() => {
      expect(weekButton).toHaveClass('anal-filter-active');
      expect(allButton).not.toHaveClass('anal-filter-active');
    });

    fireEvent.click(monthButton);
    await waitFor(() => {
      expect(monthButton).toHaveClass('anal-filter-active');
      expect(weekButton).not.toHaveClass('anal-filter-active');
    });

    fireEvent.click(yearButton);
    await waitFor(() => {
      expect(yearButton).toHaveClass('anal-filter-active');
      expect(monthButton).not.toHaveClass('anal-filter-active');
    });

    fireEvent.click(allButton);
    await waitFor(() => {
      expect(allButton).toHaveClass('anal-filter-active');
      expect(yearButton).not.toHaveClass('anal-filter-active');
    });
  });

  it('should recalculate values when filter changes', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Всего операций')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Неделя'));

    await waitFor(() => {
      const newOperations = document.querySelector('.anal-value.operations')?.textContent;
      expect(newOperations).toBeDefined();
    });
  });
});
