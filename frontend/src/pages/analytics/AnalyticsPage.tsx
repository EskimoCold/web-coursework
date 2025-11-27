import React, { useState, useEffect, useMemo } from 'react';
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
} from 'recharts';

import './analytics.css';
import { categoriesApi } from '../../api/categories';
import { Transaction, transactionsApi } from '../../api/transactions';
import { Category } from '../../contexts/CategoriesContext';
import { useCurrency } from '../../contexts/CurrencyContext';

const COLORS = ['#00C49F', '#0088FE', '#FFBB28', '#FF8042', '#8884D8'];

// Правильный тип для payload Recharts
interface ChartPayload {
  name: string;
  value: number;
  color?: string;
}

export const AnalyticsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const { formatAmount } = useCurrency();

  useEffect(() => {
    (async () => {
      const [tx, cats] = await Promise.all([
        transactionsApi.getTransactions(),
        categoriesApi.getCategories(),
      ]);
      setTransactions(tx);
      setCategories(cats);
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

  const formatDate = (t: string | Date) => {
    const formatter = new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date(t));
  };

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

  const filteredTransactions = useMemo(
    () =>
      transactions
        .map((t) => ({
          ...t,
          transaction_date: new Date(t.transaction_date),
        }))
        .filter((t) => t.transaction_date >= from)
        .filter((t) => t.transaction_date <= to)
        .map((t) => ({
          ...t,
          transaction_date: formatDate(t.transaction_date),
        })),
    [transactions, from, to],
  );

  const [incomes, expenses] = useMemo(
    () => [
      filteredTransactions.reduce(
        (acc, t) => acc + (t.transaction_type === 'income' ? t.amount : 0),
        0,
      ),
      filteredTransactions.reduce(
        (acc, t) => acc + (t.transaction_type === 'expense' ? t.amount : 0),
        0,
      ),
    ],
    [filteredTransactions],
  );

  const incomeExpenseData = useMemo(() => {
    const map = new Map<string, [number, number]>();

    filteredTransactions.forEach((t) => {
      const date = t.transaction_date;
      if (!map.has(date)) map.set(date, [0, 0]);
      const arr = map.get(date)!;

      if (t.transaction_type === 'income') arr[0] += t.amount;
      else arr[1] += t.amount;
    });

    return Array.from(map, ([date, [income, expense]]) => ({
      date,
      income,
      expense,
    })).sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [filteredTransactions]);

  const incomeByCategory = useMemo(() => {
    const map = new Map<string, number>();

    filteredTransactions
      .filter((t) => t.transaction_type === 'income')
      .forEach((t) => {
        const name = categoryNameById[String(t.category_id)] ?? t.category?.name ?? 'Без категории';
        map.set(name, (map.get(name) || 0) + t.amount);
      });

    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [filteredTransactions, categoryNameById]);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();

    filteredTransactions
      .filter((t) => t.transaction_type === 'expense')
      .forEach((t) => {
        const name = categoryNameById[String(t.category_id)] ?? t.category?.name ?? 'Без категории';
        map.set(name, (map.get(name) || 0) + t.amount);
      });

    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [filteredTransactions, categoryNameById]);

  // === FIXED TOOLTIP TYPES ===
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: ChartPayload[];
    label?: string | number;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{label}</p>
          {payload.map((entry, i) => (
            <p key={i} style={{ color: entry.color }}>
              {entry.name}: {formatAmount(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: ChartPayload[];
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p>
            {payload[0].name}: {formatAmount(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

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
          <ResponsiveContainer width="100%" height="70%">
            <AreaChart data={incomeExpenseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="expense"
                stackId="1"
                stroke="#FF8042"
                fill="#FF8042"
                fillOpacity={0.3}
                name="Расходы"
              />
              <Area
                type="monotone"
                dataKey="income"
                stackId="1"
                stroke="#00C49F"
                fill="#00C49F"
                fillOpacity={0.3}
                name="Доходы"
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
                  label={({ name, value }) => `${name}: ${formatAmount(value)}`}
                >
                  {expenseByCategory.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
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
                <Tooltip content={<CustomPieTooltip />} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
