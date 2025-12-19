import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as AuthContext from '../../contexts/AuthContext';
import { resetAuthFormStore } from '../../stores/authFormStore';

import { Register } from './Register';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Register', () => {
  const mockRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthFormStore();
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      register: mockRegister,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('should render registration form', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>,
    );

    expect(screen.getByText('FinTrack')).toBeInTheDocument();
    expect(screen.getByText('Создать аккаунт')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Логин')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Пароль')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Подтвердите пароль')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Зарегистрироваться' })).toBeInTheDocument();
  });

  it('should handle successful registration', async () => {
    mockRegister.mockResolvedValue(undefined);

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('Логин'), {
      target: { value: 'newuser' },
    });
    fireEvent.change(screen.getByPlaceholderText('Пароль'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Подтвердите пароль'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        username: 'newuser',
        password: 'password123',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should show error when passwords do not match', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('Логин'), {
      target: { value: 'newuser' },
    });
    fireEvent.change(screen.getByPlaceholderText('Пароль'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Подтвердите пароль'), {
      target: { value: 'different' },
    });
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Пароли не совпадают')).toBeInTheDocument();
    });

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should show error when password is too short', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('Логин'), {
      target: { value: 'newuser' },
    });
    fireEvent.change(screen.getByPlaceholderText('Пароль'), {
      target: { value: '12345' },
    });
    fireEvent.change(screen.getByPlaceholderText('Подтвердите пароль'), {
      target: { value: '12345' },
    });
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Пароль должен содержать минимум 6 символов')).toBeInTheDocument();
    });

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should display error message on registration failure', async () => {
    mockRegister.mockRejectedValue(new Error('Username already exists'));

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('Логин'), {
      target: { value: 'existing' },
    });
    fireEvent.change(screen.getByPlaceholderText('Пароль'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Подтвердите пароль'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Username already exists')).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should display generic error for non-Error objects', async () => {
    mockRegister.mockRejectedValue('String error');

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('Логин'), { target: { value: 'test' } });
    fireEvent.change(screen.getByPlaceholderText('Пароль'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Подтвердите пароль'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Ошибка регистрации')).toBeInTheDocument();
    });
  });

  it('should show loading state during registration', async () => {
    mockRegister.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('Логин'), { target: { value: 'test' } });
    fireEvent.change(screen.getByPlaceholderText('Пароль'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Подтвердите пароль'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('Регистрация...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('button')).not.toBeDisabled();
      expect(screen.getByText('Зарегистрироваться')).toBeInTheDocument();
    });
  });

  it('should have link to login page', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>,
    );

    const loginLink = screen.getByText('Уже есть аккаунт? Войти');
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
