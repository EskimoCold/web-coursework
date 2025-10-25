// src/components/HomePage.tsx
import { useState, useEffect } from 'react';
import { transactionsApi, Transaction, Category } from '../api/transactions';
import './home.css';

interface TransactionSummary {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
}

// Мок-данные для fallback
const MOCK_TRANSACTIONS: Transaction[] = [
    {
        id: 1,
        amount: 1500,
        transaction_type: 'expense',
        transaction_date: '2024-01-15T00:00:00Z',
        description: 'Продукты в супермаркете',
        category: { id: 1, name: 'Продукты' }
    },
    {
        id: 2,
        amount: 50000,
        transaction_type: 'income',
        transaction_date: '2024-01-10T00:00:00Z',
        description: 'Зарплата за январь',
        category: { id: 2, name: 'Зарплата' }
    },
    {
        id: 3,
        amount: 800,
        transaction_type: 'expense',
        transaction_date: '2024-01-08T00:00:00Z',
        description: 'Проездной на метро',
        category: { id: 3, name: 'Транспорт' }
    },
];

const MOCK_CATEGORIES: Category[] = [
    { id: 1, name: 'Продукты' },
    { id: 2, name: 'Зарплата' },
    { id: 3, name: 'Транспорт' },
];

export function HomePage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [useBackend, setUseBackend] = useState(true);
    const [backendError, setBackendError] = useState<string | null>(null);
    const itemsPerPage = 5;

    // Загрузка данных
    useEffect(() => {
        loadData();
    }, [filter, useBackend]);

    const loadData = async () => {
        try {
            setLoading(true);
            setBackendError(null);

            if (useBackend) {
                try {
                    const [transactionsData, categoriesData] = await Promise.all([
                        transactionsApi.getTransactions(),
                        transactionsApi.getCategories(),
                    ]);
                    applyData(transactionsData, categoriesData, true);
                } catch (error) {
                    setBackendError(`Бэкенд недоступен: ${error.message}`);
                    setUseBackend(false);
                }
            } else {
                applyData(MOCK_TRANSACTIONS, MOCK_CATEGORIES, false);
            }
        } catch (err: any) {
            setBackendError(`Ошибка: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const applyData = (transactionsData: Transaction[], categoriesData: Category[], fromBackend: boolean) => {
        const filteredTransactions = filter === 'all'
            ? transactionsData
            : transactionsData.filter(t => t.transaction_type === filter);

        setTransactions(filteredTransactions);
        setCategories(categoriesData);

        if (fromBackend) {
            setBackendError(null);
        }
    };

    // Расчет сводки
    const getSummary = (): TransactionSummary => {
        const totalIncome = transactions
            .filter(t => t.transaction_type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = transactions
            .filter(t => t.transaction_type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = totalIncome - totalExpenses;

        return { totalIncome, totalExpenses, balance };
    };

    // Пагинация
    const totalPages = Math.ceil(transactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

    const summary = getSummary();

    if (loading) {
        return (
            <div className="home-page">
                <div className="loading">Загрузка данных...</div>
            </div>
        );
    }

    return (
        <div className="home-page">
            {/* Header */}
            <header className="header">
                <h1>FinTrack</h1>
            </header>

            {backendError && (
                <div className="backend-error">
                    ⚠️ {backendError}
                </div>
            )}

            {/* Сводка */}
            <div className="summary-cards">
                <div className="summary-card balance">
                    <h3>Общий баланс</h3>
                    <div className="amount">{summary.balance.toLocaleString('ru-RU')} ₽</div>
                </div>

                <div className="summary-card income">
                    <h3>Доходы</h3>
                    <div className="amount">+{summary.totalIncome.toLocaleString('ru-RU')} ₽</div>
                </div>

                <div className="summary-card expense">
                    <h3>Расходы</h3>
                    <div className="amount">-{summary.totalExpenses.toLocaleString('ru-RU')} ₽</div>
                </div>
            </div>

            {/* Фильтры */}
            <div className="filters-section">
                <div className="filters">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        Все
                    </button>
                    <button
                        className={`filter-btn ${filter === 'income' ? 'active' : ''}`}
                        onClick={() => setFilter('income')}
                    >
                        Доходы
                    </button>
                    <button
                        className={`filter-btn ${filter === 'expense' ? 'active' : ''}`}
                        onClick={() => setFilter('expense')}
                    >
                        Расходы
                    </button>
                </div>

                <div className="table-info">
                    Показано {paginatedTransactions.length} из {transactions.length} операций
                </div>
            </div>

            {/* Таблица */}
            <div className="transactions-table-container">
                <table className="transactions-table">
                    <thead>
                    <tr>
                        <th>Категория</th>
                        <th>Дата</th>
                        <th>Сумма</th>
                        <th>Описание</th>
                        <th>Тип</th>
                    </tr>
                    </thead>
                    <tbody>
                    {paginatedTransactions.map(transaction => (
                        <tr key={transaction.id}>
                            <td className="category-cell">
                                <span className="category-badge">
                                    {transaction.category?.name || 'Без категории'}
                                </span>
                            </td>
                            <td>{new Date(transaction.transaction_date).toLocaleDateString('ru-RU')}</td>
                            <td className={`amount-cell ${transaction.transaction_type}`}>
                                {transaction.transaction_type === 'income' ? '+' : '-'}
                                {transaction.amount.toLocaleString('ru-RU')} ₽
                            </td>
                            <td className="description-cell">{transaction.description}</td>
                            <td>
                                <span className={`type-badge ${transaction.transaction_type}`}>
                                    {transaction.transaction_type === 'income' ? 'Доход' : 'Расход'}
                                </span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {transactions.length === 0 && (
                    <div className="empty-state">
                        Нет транзакций для отображения
                    </div>
                )}
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="pagination-btn"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        Назад
                    </button>

                    <div className="pagination-numbers">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button
                        className="pagination-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        Вперед
                    </button>
                </div>
            )}
        </div>
    );
}