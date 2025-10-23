import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import * as AuthContext from '../contexts/AuthContext';

import App from './App';

vi.mock('../contexts/AuthContext');

describe('App', () => {
  it('should render without crashing', () => {
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

    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });
});
