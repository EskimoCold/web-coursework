// src/components/TransactionForm.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { transactionsApi, categoriesApi, TransactionCreate, Category } from '../api/transactions';
import './transaction-form.css';

export function TransactionForm() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TransactionCreate>({
    amount: 0,
    description: '',
    transaction_type: 'expense',
    category_id: null,
    transaction_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await categoriesApi.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

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
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (name === 'category_id') {
      setFormData((prev) => ({ ...prev, [name]: value ? parseInt(value) : null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
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
