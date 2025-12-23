import React, { useEffect, useMemo, useCallback, useState } from 'react';
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

import { Transaction } from '../../api/transactions';
import { Category } from '../../contexts/CategoriesContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { ExpenseForecastPoint } from '../../ml/expensePredictor';

import { FilterOption } from './analyticsStore';

const COLORS = ['#00C49F', '#0088FE', '#FFBB28', '#FF8042', '#8884D8'];
type NormalizedTransaction = Omit<Transaction, 'transaction_date'> & { transaction_date: Date };
const FILTERS: [FilterOption, string][] = [
  ['week', 'Неделя'],
  ['month', 'Месяц'],
  ['year', 'Год'],
  ['all', 'Все время'],
];

export const AnalyticsPage: React.FC = () => {
  const { convertAmount, getCurrencySymbol } = useCurrency();
  const [transactions] = useState<Transaction[]>([]);
  const [categories] = useState<Category[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [expenseForecast] = useState<ExpenseForecastPoint[]>([]);
  const [isForecasting] = useState(false);
  const [forecastError] = useState<string | null>(null);

  useEffect(() => {}, []);

  const categoryNameById = useMemo(
    () => Object.fromEntries((categories ?? []).map((c) => [String(c.id), c.name])),
    [categories],
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
        (acc, curVal) =>
          acc + (curVal.transaction_type === 'income' ? convertAmount(curVal.amount) : 0),
        0,
      ),
      filteredTransactions.reduce(
        (acc, curVal) =>
          acc + (curVal.transaction_type === 'expense' ? convertAmount(curVal.amount) : 0),
        0,
      ),
    ],
    [filteredTransactions, convertAmount],
  );

  const dailyIncomeExpense = useMemo(() => {
    const totals = new Map<number, { income: number; expense: number }>();

    filteredTransactions.forEach((transaction) => {
      const day = new Date(transaction.transaction_date);
      day.setHours(0, 0, 0, 0);
      const key = day.getTime();

      const current = totals.get(key) ?? { income: 0, expense: 0 };
      if (transaction.transaction_type === 'income') {
        current.income += convertAmount(transaction.amount);
      } else if (transaction.transaction_type === 'expense') {
        current.expense += convertAmount(transaction.amount);
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
  }, [filteredTransactions, convertAmount]);

  useEffect(() => {
    // runForecast(dailyIncomeExpense); // TODO: Implement runForecast
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyIncomeExpense]);

  const incomeByCategory = useMemo(() => {
    const imp = new Map<string, number>();
    filteredTransactions
      .filter((t) => t.transaction_type === 'income')
      .forEach((t) => {
        const name = categoryNameById[String(t.category_id)] ?? t.category?.name ?? 'Без категории';
        imp.set(name, (imp.get(name) || 0) + convertAmount(t.amount));
      });

    return Array.from(imp, ([name, value]) => ({ name, value }));
  }, [filteredTransactions, categoryNameById, convertAmount]);

  const expenseByCategory = useMemo(() => {
    const imp = new Map<string, number>();
    filteredTransactions
      .filter((t) => t.transaction_type === 'expense')
      .forEach((t) => {
        const name = categoryNameById[String(t.category_id)] ?? t.category?.name ?? 'Без категории';
        imp.set(name, (imp.get(name) || 0) + convertAmount(t.amount));
      });

    return Array.from(imp, ([name, value]) => ({ name, value }));
  }, [filteredTransactions, categoryNameById, convertAmount]);

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
      const convertedPredicted = convertAmount(predictedExpense);

      if (existing) {
        byDate.set(ts, { ...existing, predictedExpense: convertedPredicted });
      } else {
        byDate.set(ts, {
          date: label,
          income: 0,
          expense: 0,
          predictedExpense: convertedPredicted,
        });
      }
    });

    return Array.from(byDate.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, value]) => value);
  }, [dailyIncomeExpense, expenseForecast, formatDate, convertAmount]);

  const tooltipFormatter = useCallback(
    (value: number, name: string) => {
      const symbol = getCurrencySymbol();
      if (name === 'income') return [`${value.toLocaleString('ru-RU')} ${symbol}`, 'Доход'];
      if (name === 'expense') return [`${value.toLocaleString('ru-RU')} ${symbol}`, 'Расход'];
      if (name === 'predictedExpense')
        return [`${value.toLocaleString('ru-RU')} ${symbol}`, 'Прогноз расхода'];
      return [`${value.toLocaleString('ru-RU')} ${symbol}`, name];
    },
    [getCurrencySymbol],
  );

  return (
    <div className="anal-main">
      <div className="anal-filters">
        {FILTERS.map((f) => (
          <button
            key={f[0]}
            className={'anal-filters-btn ' + (filter === f[0] ? 'anal-filter-active' : '')}
            onClick={() => setFilter(f[0])}
          >
            {f[1]}
          </button>
        ))}
      </div>

      <div className="anal-info-grid">
        <div>
          <p className="anal-label">Общий баланс</p>
          <p className="anal-value total">
            {(incomes - expenses).toLocaleString('ru-RU')} {getCurrencySymbol()}
          </p>
        </div>
        <div>
          <p className="anal-label">Доходы</p>
          <p className="anal-value income">
            {incomes.toLocaleString('ru-RU')} {getCurrencySymbol()}
          </p>
        </div>
        <div>
          <p className="anal-label">Расходы</p>
          <p className="anal-value expense">
            {expenses.toLocaleString('ru-RU')} {getCurrencySymbol()}
          </p>
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
                  label={(props: { name?: string; value?: number }) => {
                    // eslint-disable-next-line react/prop-types
                    const name = props.name || '';
                    // eslint-disable-next-line react/prop-types
                    const value = typeof props.value === 'number' ? props.value : 0;
                    return `${name}: ${value.toLocaleString('ru-RU')} ${getCurrencySymbol()}`;
                  }}
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
