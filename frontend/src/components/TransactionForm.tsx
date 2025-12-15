// src/components/TransactionForm.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { transactionsApi, TransactionCreate } from '../api/transactions';

import './transaction-form.css';
import { useTransactionFormStore } from './transactionFormStore';

export function TransactionForm() {
  const navigate = useNavigate();
  const { categories, loading, formData, loadCategories, setLoading, setFormField, reset } =
    useTransactionFormStore();

  useEffect(() => {
    loadCategories();
    return () => reset();
  }, [loadCategories, reset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await transactionsApi.createTransaction(formData);
      navigate('/'); // Возвращаемся на главную после успешного создания
    } catch (error) {
      console.error('Ошибка создания транзакции:', error);
      alert('Ошибка при создании транзакции');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    if (name === 'amount') {
      setFormField('amount', parseFloat(value) || 0);
    } else if (name === 'category_id') {
      setFormField('category_id', value ? parseInt(value) : null);
    } else {
      setFormField(name as keyof TransactionCreate, value);
    }
  };

  return (
    <div className="transaction-form-container">
      <div className="transaction-form">
        <div className="form-header">
          <h2>Добавить транзакцию</h2>
          <button className="close-button" onClick={() => navigate('/')}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="transaction_type">Тип операции *</label>
            <select
              id="transaction_type"
              name="transaction_type"
              value={formData.transaction_type}
              onChange={handleChange}
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
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Описание *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category_id">Категория</label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id || ''}
              onChange={handleChange}
            >
              <option value="">Без категории</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="transaction_date">Дата *</label>
            <input
              type="date"
              id="transaction_date"
              name="transaction_date"
              value={formData.transaction_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={() => navigate('/')}>
              Отмена
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Создание...' : 'Создать транзакцию'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
