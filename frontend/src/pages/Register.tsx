import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import './auth.css';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsLoading(true);

    try {
      await register({ username, password });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon"></div>
        </div>
        <h1 className="auth-title">FinTrack</h1>
        <p className="auth-subtitle">Создать аккаунт</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="Логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="auth-input"
            required
            autoComplete="username"
          />

          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            required
            autoComplete="new-password"
          />

          <input
            type="password"
            placeholder="Подтвердите пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="auth-input"
            required
            autoComplete="new-password"
          />

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login" className="auth-link">
            Уже есть аккаунт? Войти
          </Link>
        </div>
      </div>
    </div>
  );
};
