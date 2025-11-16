import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as AuthContext from '../../contexts/AuthContext';

import { Login } from './Login';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../contexts/AuthContext');

describe('Login', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      login: mockLogin,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      register: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('should render login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>,
    );

    expect(screen.getByText('FinTrack')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Логин')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Пароль')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
    expect(screen.getByText('Создать аккаунт')).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    mockLogin.mockResolvedValue(undefined);

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>,
    );

    const usernameInput = screen.getByPlaceholderText('Логин');
    const passwordInput = screen.getByPlaceholderText('Пароль');
    const submitButton = screen.getByRole('button', { name: 'Войти' });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should display error message on login failure', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>,
    );

    const usernameInput = screen.getByPlaceholderText('Логин');
    const passwordInput = screen.getByPlaceholderText('Пароль');
    const submitButton = screen.getByRole('button', { name: 'Войти' });

    fireEvent.change(usernameInput, { target: { value: 'wrong' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should display generic error for non-Error objects', async () => {
    mockLogin.mockRejectedValue('String error');

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('Логин'), { target: { value: 'test' } });
    fireEvent.change(screen.getByPlaceholderText('Пароль'), { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(screen.getByText('Ошибка входа')).toBeInTheDocument();
    });
  });

  it('should show loading state during login', async () => {
    mockLogin.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('Логин'), { target: { value: 'test' } });
    fireEvent.change(screen.getByPlaceholderText('Пароль'), { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('Вход...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Войти')).toBeInTheDocument();
    });
  });

  it('should have link to register page', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>,
    );

    const registerLink = screen.getByText('Создать аккаунт');
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('should clear error message on new submission', async () => {
    mockLogin.mockRejectedValueOnce(new Error('First error'));

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('Логин'), { target: { value: 'test' } });
    fireEvent.change(screen.getByPlaceholderText('Пароль'), { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument();
    });

    mockLogin.mockResolvedValueOnce(undefined);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
    });
  });
});
