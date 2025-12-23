import { useEffect, useMemo } from 'react';

import { transactionsApi, Transaction, TransactionCreate } from '../../api/transactions';
import { useCurrency } from '../../contexts/CurrencyContext';

import { useHomeStore } from './homeStore';

import './home.css';

interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export function HomePage() {
  const { convertAmount, getCurrencySymbol } = useCurrency();
  const {
    currentPage,
    filter,
    allTransactions,
    categories,
    loading,
    useBackend,
    backendError,
    showAddModal,
    formLoading,
    formData,
    loadData,
    setCurrentPage,
    setFilter,
    setShowAddModal,
    setFormLoading,
    setFormData,
    resetForm,
    addLocalTransaction,
  } = useHomeStore();

  const itemsPerPage = 5;

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') {
      return allTransactions;
    }
    return allTransactions.filter((t) => t.transaction_type === filter);
  }, [allTransactions, filter]);

  const summary = useMemo((): TransactionSummary => {
    const totalIncome = allTransactions
      .filter((t) => t.transaction_type === 'income')
      .reduce((sum, t) => sum + convertAmount(t.amount), 0);

    const totalExpenses = allTransactions
      .filter((t) => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + convertAmount(t.amount), 0);

    const balance = totalIncome - totalExpenses;

    return { totalIncome, totalExpenses, balance };
  }, [allTransactions, convertAmount]);

  const paginatedTransactions = useMemo(() => {
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    return {
      transactions: filteredTransactions.slice(startIndex, startIndex + itemsPerPage),
      totalPages,
    };
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const handleAddTransaction = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    resetForm();
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
        await loadData();
      } else {
        const { category_id, ...transactionData } = submitData;
        const newTransaction: Transaction = {
          id: Math.max(0, ...allTransactions.map((t) => t.id)) + 1,
          ...transactionData,
          category: categories.find((c) => c.id === category_id),
        };
        addLocalTransaction(newTransaction);
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
    setFormData({ ...formData, [name]: value });
  };

  const handleFilterChange = (newFilter: 'all' | 'income' | 'expense') => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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
          <div>
            <h1>Дашборд финансов</h1>
            <p>Быстрый обзор ваших доходов и расходов</p>
          </div>
          <button className="primary-button add-button" onClick={handleAddTransaction}>
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
          транзакций
        </div>
      </div>

      {/* Transactions Table - Desktop */}
      <div className="transactions-table-container">
        {paginatedTransactions.transactions.length === 0 ? (
          <div className="empty-state">
            <p>Нет транзакций для отображения</p>
          </div>
        ) : (
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Описание</th>
                <th>Категория</th>
                <th>Тип</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{formatDate(transaction.transaction_date)}</td>
                  <td>
                    <div className="description-cell">
                      <div className="description-text">{transaction.description}</div>
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">
                      {transaction.category?.name || 'Без категории'}
                    </span>
                  </td>
                  <td>
                    <span className={`type-badge ${transaction.transaction_type}`}>
                      {transaction.transaction_type === 'income' ? 'Доход' : 'Расход'}
                    </span>
                  </td>
                  <td className={`amount-cell ${transaction.transaction_type}`}>
                    {transaction.transaction_type === 'income' ? '+' : '-'}
                    {formatAmount(transaction.amount)} ₽
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
                    {convertAmount(transaction.amount).toLocaleString('ru-RU')}{' '}
                    {getCurrencySymbol()}
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

          <div className="pagination">
            {Array.from({ length: paginatedTransactions.totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={currentPage === i + 1 ? 'active' : ''}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Новая транзакция</h2>
              <button className="close-button" onClick={handleCloseModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label htmlFor="transaction_type">Тип операции</label>
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
                <label htmlFor="amount">Сумма (₽)</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Описание</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Краткое описание транзакции"
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
                <div className="category-hint">Необязательно</div>
              </div>

              <div className="form-group">
                <label htmlFor="transaction_date">Дата операции</label>
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
                  {formLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
