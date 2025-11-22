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
    const date = new Date(t);
    return formatter.format(date);
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
        .map((t) => {
          return {
            ...t,
            transaction_date: new Date(t.transaction_date),
          };
        })
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
        (acc, curVal) => acc + (curVal.transaction_type === 'income' ? curVal.amount : 0),
        0,
      ),
      filteredTransactions.reduce(
        (acc, curVal) => acc + (curVal.transaction_type === 'expense' ? curVal.amount : 0),
        0,
      ),
    ],
    [filteredTransactions],
  );

  const incomeExpenseData = useMemo(() => {
    const ied = new Map<string, Array<number>>([]);
    filteredTransactions.forEach((transaction) => {
      const dts = transaction.transaction_date;
      let num = ied.get(dts);
      const ind = transaction.transaction_type === 'income' ? 0 : 1;

      if (!num) {
        num = [0, 0];
        num[ind] = num[ind] + transaction.amount;
        ied.set(dts, num);
      } else {
        num[ind] = num[ind] + transaction.amount;
      }
    });

    const res: { date: string; income: number; expense: number }[] = [];
    ied.forEach((num, date) =>
      res.push({
        date: date,
        income: num[0],
        expense: num[1],
      }),
    );

    return res.sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [filteredTransactions]);

  const incomeByCategory = useMemo(() => {
    const imp = new Map<string, number>();
    filteredTransactions
      .filter((t) => t.transaction_type === 'income')
      .forEach((t) => {
        const name = categoryNameById[String(t.category_id)] ?? t.category?.name ?? 'Без категории';
        imp.set(name, (imp.get(name) || 0) + t.amount);
      });

    return Array.from(imp, ([name, value]) => ({ name, value }));
  }, [filteredTransactions, categoryNameById]);

  const expenseByCategory = useMemo(() => {
    const imp = new Map<string, number>();
    filteredTransactions
      .filter((t) => t.transaction_type === 'expense')
      .forEach((t) => {
        const name = categoryNameById[String(t.category_id)] ?? t.category?.name ?? 'Без категории';
        imp.set(name, (imp.get(name) || 0) + t.amount);
      });

    return Array.from(imp, ([name, value]) => ({ name, value }));
  }, [filteredTransactions, categoryNameById]);

  const formatTooltipValue = (value: number) => {
    return formatAmount(value);
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
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatTooltipValue(value),
                  name === 'income' ? 'Доход' : 'Расход',
                ]}
              />
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
                <Tooltip formatter={(value: number) => formatTooltipValue(value)} />
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
                <Tooltip formatter={(value: number) => formatTooltipValue(value)} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
