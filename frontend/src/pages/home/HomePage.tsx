import { useState, useEffect, useCallback, useMemo } from 'react';

import { transactionsApi, Transaction, Category, TransactionCreate } from '../../api/transactions';
import { useCurrency } from '../../contexts/CurrencyContext';
import './home.css';

interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

const MOCK_TRANSACTIONS: Transaction[] = [
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

export function HomePage() {
  const { convertAmount, getCurrencySymbol, currency, rates } = useCurrency();
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [useBackend, setUseBackend] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    transaction_type: 'expense',
    category_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });

  const itemsPerPage = 5;

  // Фильтрация транзакций на клиенте
  const filteredTransactions = useMemo(() => {
    if (filter === 'all') {
      return allTransactions;
    }
    return allTransactions.filter((t) => t.transaction_type === filter);
  }, [allTransactions, filter]);

  // Вычисление summary с пересчетом валюты
  const summary = useMemo((): TransactionSummary => {
    const totalIncome = allTransactions
      .filter((t) => t.transaction_type === 'income')
      .reduce((sum, t) => sum + convertAmount(t.amount), 0);

    const totalExpenses = allTransactions
      .filter((t) => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + convertAmount(t.amount), 0);

    const balance = totalIncome - totalExpenses;

    return { totalIncome, totalExpenses, balance };
  }, [allTransactions, convertAmount, currency, rates]);

  // Пагинация
  const paginatedTransactions = useMemo(() => {
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    return {
      transactions: filteredTransactions.slice(startIndex, startIndex + itemsPerPage),
      totalPages,
    };
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // Загрузка данных один раз при монтировании
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setBackendError(null);

      if (useBackend) {
        try {
          const [transactionsData, categoriesData] = await Promise.all([
            transactionsApi.getTransactions(),
            transactionsApi.getCategories(),
          ]);
          setAllTransactions(transactionsData);
          setCategories(categoriesData);
          setBackendError(null);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
          setBackendError(`Бэкенд недоступен: ${errorMessage}`);
          setUseBackend(false);
          // Переключаемся на моки
          setAllTransactions(MOCK_TRANSACTIONS);
          setCategories([]);
        }
      } else {
        setAllTransactions(MOCK_TRANSACTIONS);
        setCategories([]);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setBackendError(`Ошибка: ${errorMessage}`);
      setAllTransactions(MOCK_TRANSACTIONS);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [useBackend]);

  // Загружаем данные только при монтировании и смене useBackend
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddTransaction = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({
      amount: '',
      description: '',
      transaction_type: 'expense',
      category_id: '',
      transaction_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Пожалуйста, введите корректную сумму');
      return;
    }

    if (!formData.description.trim()) {
      alert('Пожалуйста, введите описание');
      return;
    }

    setFormLoading(true);

    try {
      let categoryId: number | null = null;
      if (formData.category_id && useBackend) {
        const selectedCategory = categories.find(
          (cat) => cat.id.toString() === formData.category_id,
        );
        if (selectedCategory) {
          categoryId = selectedCategory.id;
        }
      }

      const submitData: TransactionCreate = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        transaction_type: formData.transaction_type as 'income' | 'expense',
        category_id: categoryId,
        transaction_date: formData.transaction_date,
      };

      if (useBackend) {
        await transactionsApi.createTransaction(submitData);
        // После успешного создания перезагружаем данные
        await loadData();
      } else {
        const { category_id, ...transactionData } = submitData;
        const newTransaction: Transaction = {
          id: Math.max(0, ...allTransactions.map((t) => t.id)) + 1,
          ...transactionData,
          category: categories.find((c) => c.id === category_id),
        };
        // Добавляем транзакцию локально
        setAllTransactions((prev) => [newTransaction, ...prev]);
      }
      handleCloseModal();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Category not found')) {
          alert(
            'Ошибка: выбранная категория не найдена на сервере. Пожалуйста, выберите другую категорию или создайте транзакцию без категории.',
          );
        } else {
          alert('Ошибка при создании транзакции: ' + error.message);
        }
      } else {
        alert('Неизвестная ошибка при создании транзакции');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (newFilter: 'all' | 'income' | 'expense') => {
    setFilter(newFilter);
    setCurrentPage(1); // Сбрасываем на первую страницу при смене фильтра
  };

  if (loading) {
    return (
      <div className="home-page">
        <div className="loading">Загрузка данных...</div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {backendError && <div className="backend-error">⚠️ {backendError}</div>}

      <div className="summary-section">
        <div className="summary-header">
          <button className="add-button" onClick={handleAddTransaction}>
            + Добавить транзакцию
          </button>
        </div>

        <div className="summary-cards">
          <div className="summary-card balance">
            <h3>Общий баланс</h3>
            <div className="amount">
              {summary.balance.toLocaleString('ru-RU')} {getCurrencySymbol()}
            </div>
          </div>

          <div className="summary-card income">
            <h3>Доходы</h3>
            <div className="amount">
              +{summary.totalIncome.toLocaleString('ru-RU')} {getCurrencySymbol()}
            </div>
          </div>

          <div className="summary-card expense">
            <h3>Расходы</h3>
            <div className="amount">
              -{summary.totalExpenses.toLocaleString('ru-RU')} {getCurrencySymbol()}
            </div>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            Все
          </button>
          <button
            className={`filter-btn ${filter === 'income' ? 'active' : ''}`}
            onClick={() => handleFilterChange('income')}
          >
            Доходы
          </button>
          <button
            className={`filter-btn ${filter === 'expense' ? 'active' : ''}`}
            onClick={() => handleFilterChange('expense')}
          >
            Расходы
          </button>
        </div>

        <div className="table-info">
          Показано {paginatedTransactions.transactions.length} из {filteredTransactions.length}{' '}
          операций
        </div>
      </div>

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
            {paginatedTransactions.transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="category-cell">
                  <span className="category-badge">
                    {categories?.find((c) => Number(c.id) === Number(transaction.category_id))
                      ?.name ?? 'Без категории'}
                  </span>
                </td>
                <td>{new Date(transaction.transaction_date).toLocaleDateString('ru-RU')}</td>
                <td className={`amount-cell ${transaction.transaction_type}`}>
                  {transaction.transaction_type === 'income' ? '+' : '-'}
                  {convertAmount(transaction.amount).toLocaleString('ru-RU')} {getCurrencySymbol()}
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

        {/* Мобильное отображение */}
        <div className="mobile-transactions">
          {paginatedTransactions.transactions.map((transaction) => (
            <div
              key={transaction.id}
              className={`mobile-transaction-card ${transaction.transaction_type}`}
            >
              <div className="mobile-card-header">
                <div className="mobile-card-category">
                  {categories?.find((c) => Number(c.id) === Number(transaction.category_id))
                    ?.name ?? 'Без категории'}
                </div>
                <div className={`mobile-card-amount ${transaction.transaction_type}`}>
                  {transaction.transaction_type === 'income' ? '+' : '-'}
                  {convertAmount(transaction.amount).toLocaleString('ru-RU')} {getCurrencySymbol()}
                </div>
              </div>
              <div className="mobile-card-description">{transaction.description}</div>
              <div className="mobile-card-footer">
                <span>{new Date(transaction.transaction_date).toLocaleDateString('ru-RU')}</span>
                <span className={`type-badge ${transaction.transaction_type}`}>
                  {transaction.transaction_type === 'income' ? 'Доход' : 'Расход'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredTransactions.length === 0 && (
          <div className="empty-state">Нет транзакций для отображения</div>
        )}
      </div>

      {paginatedTransactions.totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Назад
          </button>

          <div className="pagination-numbers">
            {Array.from({ length: paginatedTransactions.totalPages }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ),
            )}
          </div>

          <button
            className="pagination-btn"
            disabled={currentPage === paginatedTransactions.totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Вперед
          </button>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Добавить транзакцию</h2>
              <button className="close-button" onClick={handleCloseModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label htmlFor="transaction_type">Тип операции *</label>
                <select
                  id="transaction_type"
                  name="transaction_type"
                  value={formData.transaction_type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="expense">Расход</option>
                  <option value="income">Доход</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="amount">Сумма *</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  min="0.01"
                  step="0.01"
                  placeholder="Введите сумму"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Описание *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Введите описание транзакции"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category_id">Категория</label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                >
                  <option value="">Без категории</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && useBackend && (
                  <div className="category-hint">
                    На сервере нет созданных категорий. Вы можете создать транзакцию без категории.
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="transaction_date">Дата *</label>
                <input
                  type="date"
                  id="transaction_date"
                  name="transaction_date"
                  value={formData.transaction_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={handleCloseModal}>
                  Отмена
                </button>
                <button type="submit" className="submit-button" disabled={formLoading}>
                  {formLoading ? 'Создание...' : 'Создать транзакцию'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
