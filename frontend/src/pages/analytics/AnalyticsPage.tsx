import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
} from 'recharts';

import './analytics.css';
import { categoriesApi } from '../../api/categories';
import { Transaction, transactionsApi } from '../../api/transactions';
import { Category } from '../../contexts/CategoriesContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { predictExpenses, ExpenseForecastPoint } from '../../ml/expensePredictor';

const COLORS = ['#00C49F', '#0088FE', '#FFBB28', '#FF8042', '#8884D8'];
type NormalizedTransaction = Omit<Transaction, 'transaction_date'> & { transaction_date: Date };

export const AnalyticsPage: React.FC = () => {
  const { convert, formatAmount, currency } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [expenseForecast, setExpenseForecast] = useState<ExpenseForecastPoint[]>([]);
  const [isForecasting, setIsForecasting] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [tx, cats] = await Promise.all([
        transactionsApi.getTransactions(),
        categoriesApi.getCategories(), // +
      ]);
      setTransactions(tx);
      setCategories(cats); // +
    })();
  }, []);

  const categoryNameById = useMemo(
    () => Object.fromEntries((categories ?? []).map((c) => [String(c.id), c.name])),
    [categories],
  );

  const filters = useMemo(
    () => [
      ['week', 'Неделя'],
      ['month', 'Месяц'],
      ['year', 'Год'],
      ['all', 'Все время'],
    ],
    [],
  );

  const formatDate = useCallback((t: string | Date) => {
    const formatter = new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const date = new Date(t);
    return formatter.format(date);
  }, []);

  const from = useMemo(() => {
    const now = new Date();
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
      case 'all':
      default:
        return new Date(0);
    }
  }, [filter]);

  const to = useMemo(() => new Date(), []);

  useEffect(() => {
    const getData = async () => {
      setTransactions(await transactionsApi.getTransactions());
    };

    getData();
  }, []);

  const filteredTransactions = useMemo<NormalizedTransaction[]>(
    () =>
      transactions
        .map<NormalizedTransaction>((t) => ({
          ...t,
          transaction_date: new Date(t.transaction_date),
        }))
        .filter((t) => t.transaction_date >= from && t.transaction_date <= to),
    [transactions, from, to],
  );

  const [incomes, expenses] = useMemo(
    () => [
      filteredTransactions.reduce(
        (acc, curVal) => acc + (curVal.transaction_type === 'income' ? convert(curVal.amount) : 0),
        0,
      ),
      filteredTransactions.reduce(
        (acc, curVal) => acc + (curVal.transaction_type === 'expense' ? convert(curVal.amount) : 0),
        0,
      ),
    ],
    [filteredTransactions, convert, currency],
  );

  const dailyIncomeExpense = useMemo(() => {
    const totals = new Map<number, { income: number; expense: number }>();

    filteredTransactions.forEach((transaction) => {
      const day = new Date(transaction.transaction_date);
      day.setHours(0, 0, 0, 0);
      const key = day.getTime();

      const current = totals.get(key) ?? { income: 0, expense: 0 };
      if (transaction.transaction_type === 'income') {
        current.income += convert(transaction.amount);
      } else if (transaction.transaction_type === 'expense') {
        current.expense += convert(transaction.amount);
      }
      totals.set(key, current);
    });

    return Array.from(totals.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([timestamp, values]) => ({
        date: new Date(timestamp),
        income: values.income,
        expense: values.expense,
      }));
  }, [filteredTransactions, convert, currency]);

  const incomeByCategory = useMemo(() => {
    const imp = new Map<string, number>();
    filteredTransactions
      .filter((t) => t.transaction_type === 'income')
      .forEach((t) => {
        const name = categoryNameById[String(t.category_id)] ?? t.category?.name ?? 'Без категории';
        imp.set(name, (imp.get(name) || 0) + convert(t.amount));
      });

    return Array.from(imp, ([name, value]) => ({ name, value }));
  }, [filteredTransactions, categoryNameById, convert, currency]);

  const expenseByCategory = useMemo(() => {
    const imp = new Map<string, number>();
    filteredTransactions
      .filter((t) => t.transaction_type === 'expense')
      .forEach((t) => {
        const name = categoryNameById[String(t.category_id)] ?? t.category?.name ?? 'Без категории';
        imp.set(name, (imp.get(name) || 0) + convert(t.amount));
      });

    return Array.from(imp, ([name, value]) => ({ name, value }));
  }, [filteredTransactions, categoryNameById, convert, currency]);

  useEffect(() => {
    let cancelled = false;

    const runForecast = async () => {
      if (!dailyIncomeExpense.length) {
        setExpenseForecast([]);
        return;
      }

      setIsForecasting(true);
      setForecastError(null);

      try {
        const expensesOnly = dailyIncomeExpense.filter((p) => p.expense > 0);
        const predictions = await predictExpenses(
          expensesOnly.length ? expensesOnly : dailyIncomeExpense,
        );

        if (!cancelled) {
          setExpenseForecast(predictions);
        }
      } catch (error) {
        if (!cancelled) {
          setExpenseForecast([]);
          setForecastError('Не удалось построить прогноз расходов');
          console.error(error);
        }
      } finally {
        if (!cancelled) {
          setIsForecasting(false);
        }
      }
    };

    runForecast();

    return () => {
      cancelled = true;
    };
  }, [dailyIncomeExpense]);

  const chartData = useMemo(() => {
    const byDate = new Map<
      number,
      { date: string; income: number; expense: number; predictedExpense?: number }
    >();

    dailyIncomeExpense.forEach(({ date, income, expense }) => {
      byDate.set(date.getTime(), {
        date: formatDate(date),
        income,
        expense,
      });
    });

    expenseForecast.forEach(({ date, predictedExpense }) => {
      const ts = date.getTime();
      const existing = byDate.get(ts);
      const label = formatDate(date);

      if (existing) {
        byDate.set(ts, { ...existing, predictedExpense });
      } else {
        byDate.set(ts, { date: label, income: 0, expense: 0, predictedExpense });
      }
    });

    return Array.from(byDate.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, value]) => value);
  }, [dailyIncomeExpense, expenseForecast, formatDate]);

  const tooltipFormatter = useCallback(
    (value: unknown, name: unknown) => {
      const numValue = Number(value);
      const nameStr = String(name);
      if (nameStr === 'income') return [formatAmount(numValue), 'Доход'];
      if (nameStr === 'expense') return [formatAmount(numValue), 'Расход'];
      if (nameStr === 'predictedExpense') return [formatAmount(numValue), 'Прогноз расхода'];
      return [formatAmount(numValue), nameStr];
    },
    [formatAmount],
  );

  return (
    <div className="anal-main">
      <div className="anal-filters">
        {filters.map((f) => (
          <button
            key={f[0]}
            className={filter === f[0] ? 'anal-filter-active' : ''}
            onClick={() => setFilter(f[0])}
          >
            {f[1]}
          </button>
        ))}
      </div>

      <div className="anal-info-grid">
        <div>
          <p className="anal-label">Общий баланс</p>
          <p className="anal-value total">{formatAmount(incomes - expenses)}</p>
        </div>
        <div>
          <p className="anal-label">Доходы</p>
          <p className="anal-value income">{formatAmount(incomes)}</p>
        </div>
        <div>
          <p className="anal-label">Расходы</p>
          <p className="anal-value expense">{formatAmount(expenses)}</p>
        </div>
        <div>
          <p className="anal-label">Всего операций</p>
          <p className="anal-value operations">{filteredTransactions.length}</p>
        </div>
      </div>

      <div className="anal-charts-grid">
        <div className="anal-chart-container">
          <h3 className="anal-chart-title">Динамика доходов и расходов</h3>
          {forecastError && <p className="anal-value expense">{forecastError}</p>}
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={tooltipFormatter} />
              <Area
                type="monotone"
                dataKey="expense"
                stackId="1"
                stroke="#FF8042"
                fill="#FF8042"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="income"
                stackId="1"
                stroke="#00C49F"
                fill="#00C49F"
                fillOpacity={0.3}
              />
              <Line
                type="monotone"
                dataKey="predictedExpense"
                stroke="#6A4BFF"
                strokeWidth={2}
                dot={false}
                strokeDasharray="6 3"
                connectNulls
                isAnimationActive={!isForecasting}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div>
          <div className="anal-chart-container">
            <h3 className="anal-chart-title">Расходы по категориям</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }: { name?: string; value?: number }) =>
                    `${name ?? ''}: ${formatAmount(value ?? 0)}`
                  }
                >
                  {expenseByCategory.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="anal-chart-container">
            <h3 className="anal-chart-title">Доходы по категориям</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={incomeByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
