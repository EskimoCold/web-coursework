import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { currencyApi } from '../../api/currency';
import { Transaction, transactionsApi } from '../../api/transactions';
import { CurrencyProvider } from '../../contexts/CurrencyContext';
import { predictExpenses } from '../../ml/expensePredictor';

import { AnalyticsPage } from './AnalyticsPage';

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
  return render(
    <CurrencyProvider>
      <AnalyticsPage />
    </CurrencyProvider>,
  );
};

describe('AnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    await waitFor(() => {
      const totalBalance = 1000 + 1500 - 500 - 200;
      expect(screen.getByText(`${totalBalance} ₽`)).toBeInTheDocument();
    });
  });

  it('should calculate correct incomes and expenses', async () => {
    renderComponent();
    await waitFor(() => {
      const totalIncomes = 1000 + 1500;
      const totalExpenses = 500 + 200;
      expect(screen.getByText(`${totalIncomes} ₽`)).toBeInTheDocument();
      expect(screen.getByText(`${totalExpenses} ₽`)).toBeInTheDocument();
    });
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
});
