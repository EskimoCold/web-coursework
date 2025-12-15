import { render } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as AuthContext from '../contexts/AuthContext';
import * as CategoryContext from '../contexts/CategoriesContext';

import App from './App';

vi.mock('../contexts/AuthContext');
vi.mock('../contexts/CategoriesContext');

// Mock для предотвращения ошибок API
vi.mock('../api/client', () => ({
  client: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

describe('App', () => {
  beforeEach(() => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(AuthContext.AuthProvider).mockImplementation(
      ({ children }: { children: React.ReactNode }) => <>{children}</>,
    );
    vi.mocked(CategoryContext.CategoryProvider).mockImplementation(
      ({ children }: { children: React.ReactNode }) => <>{children}</>,
    );
  });

  it('should render without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });
});
