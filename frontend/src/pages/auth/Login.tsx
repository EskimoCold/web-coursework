import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import { useAuth } from '../../contexts/AuthContext';
import { useAuthFormStore } from '../../stores/authFormStore';
import './auth.css';

export const Login: React.FC = () => {
  const {
    login: { username, password, error, isLoading },
    setLoginField,
    setLoginError,
    setLoginLoading,
    resetLogin,
  } = useAuthFormStore(
    useShallow((state) => ({
      login: state.login,
      setLoginField: state.setLoginField,
      setLoginError: state.setLoginError,
      setLoginLoading: state.setLoginLoading,
      resetLogin: state.resetLogin,
    })),
  );
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    resetLogin();
  }, [resetLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      await login({ username, password });
      navigate('/');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon"></div>
        </div>
        <h1 className="auth-title">FinTrack</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="Логин"
            value={username}
            onChange={(e) => setLoginField('username', e.target.value)}
            className="auth-input"
            required
            autoComplete="username"
          />

          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setLoginField('password', e.target.value)}
            className="auth-input"
            required
            autoComplete="current-password"
          />

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/register" className="auth-link">
            Создать аккаунт
          </Link>
        </div>
      </div>
    </div>
  );
};
