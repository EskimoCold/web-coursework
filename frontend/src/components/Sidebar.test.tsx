import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as AuthContext from '../contexts/AuthContext';

import { Sidebar } from './Sidebar';

vi.mock('../contexts/AuthContext');

describe('Sidebar', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 1, username: 'testuser', is_active: true, created_at: '', updated_at: '' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
    });
  });

  it('renders nav items and active state', () => {
    const onSelect = vi.fn();
    render(<Sidebar active="Категории" onSelect={onSelect} />);
    for (const name of ['Главная', 'Аналитика', 'Категории', 'Настройки']) {
      expect(screen.getByRole('button', { name })).toBeVisible();
    }
    const active = screen.getByRole('button', { name: 'Категории' });
    expect(active).toHaveAttribute('aria-current', 'page');
  });

  it('invokes onSelect when a nav item is clicked', () => {
    const onSelect = vi.fn();
    render(<Sidebar active="Категории" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Главная' }));
    expect(onSelect).toHaveBeenCalledWith('Главная');
  });

  it('has exit button', () => {
    render(<Sidebar active="Категории" onSelect={() => {}} />);
    expect(screen.getByLabelText('Выход')).toBeInTheDocument();
  });

  it('should call logout when exit button is clicked', () => {
    render(<Sidebar active="Категории" onSelect={() => {}} />);
    fireEvent.click(screen.getByLabelText('Выход'));
    expect(mockLogout).toHaveBeenCalled();
  });

  it('should display username', () => {
    render(<Sidebar active="Категории" onSelect={() => {}} />);
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });
});
