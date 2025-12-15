import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import { useAuth } from '../../contexts/AuthContext';
import { useAuthFormStore } from '../../stores/authFormStore';
import './auth.css';

export const Register: React.FC = () => {
  const {
    register: { username, password, confirmPassword, error, isLoading },
    setRegisterField,
    setRegisterError,
    setRegisterLoading,
    resetRegister,
  } = useAuthFormStore(
    useShallow((state) => ({
      register: state.register,
      setRegisterField: state.setRegisterField,
      setRegisterError: state.setRegisterError,
      setRegisterLoading: state.setRegisterLoading,
      resetRegister: state.resetRegister,
    })),
  );
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    resetRegister();
  }, [resetRegister]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (password !== confirmPassword) {
      setRegisterError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setRegisterError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setRegisterLoading(true);

    try {
      await register({ username, password });
      navigate('/');
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setRegisterLoading(false);
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
            onChange={(e) => setRegisterField('username', e.target.value)}
            className="auth-input"
            required
            autoComplete="username"
          />

          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setRegisterField('password', e.target.value)}
            className="auth-input"
            required
            autoComplete="new-password"
          />

          <input
            type="password"
            placeholder="Подтвердите пароль"
            value={confirmPassword}
            onChange={(e) => setRegisterField('confirmPassword', e.target.value)}
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
