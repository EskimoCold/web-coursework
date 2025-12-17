import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { CategoryProvider, useCategories } from './CategoriesContext';
import { useCategoryStore } from '../stores/categoryStore';
import { useAuthStore } from '../stores/authStore';

vi.mock('../stores/categoryStore', () => ({
  useCategoryStore: vi.fn(),
  resetCategoryStore: vi.fn(),
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

const TestComponent = () => {
  const { categories, icons, fetchCategories } = useCategories();
  return (
    <div>
      <div data-testid="categories-count">{categories.length}</div>
      <div data-testid="icons-count">{icons.length}</div>
      <button onClick={fetchCategories}>Fetch</button>
    </div>
  );
};

describe('CategoriesContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide categories context', () => {
    const mockCategories = [
      { id: 1, name: 'Food', type: 0, icon: 'food', description: '' },
      { id: 2, name: 'Salary', type: 1, icon: 'salary', description: '' },
    ];
    const mockIcons = ['icon1.svg', 'icon2.svg'];
    const mockFetchCategories = vi.fn();
    const mockSetCategories = vi.fn();

    (useCategoryStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const state = {
        categories: mockCategories,
        icons: mockIcons,
        setCategories: mockSetCategories,
        fetchCategories: mockFetchCategories,
      };
      return selector(state);
    });

    (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
      accessToken: 'test-token',
    });

    render(
      <CategoryProvider>
        <TestComponent />
      </CategoryProvider>,
    );

    expect(screen.getByTestId('categories-count')).toHaveTextContent('2');
    expect(screen.getByTestId('icons-count')).toHaveTextContent('2');
  });

  it('should throw error when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const TestComponentWithoutProvider = () => {
      try {
        useCategories();
        return <div>No error</div>;
      } catch (error) {
        return <div>Error: {(error as Error).message}</div>;
      }
    };

    render(<TestComponentWithoutProvider />);

    expect(screen.getByText(/Error:/)).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('should fetch categories when accessToken is available', async () => {
    const mockFetchCategories = vi.fn().mockResolvedValue(undefined);
    const mockSetCategories = vi.fn();

    (useCategoryStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const state = {
        categories: [],
        icons: [],
        setCategories: mockSetCategories,
        fetchCategories: mockFetchCategories,
      };
      return selector(state);
    });

    (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
      accessToken: 'test-token',
    });

    render(
      <CategoryProvider>
        <div>Test</div>
      </CategoryProvider>,
    );

    await waitFor(() => {
      expect(mockFetchCategories).toHaveBeenCalled();
    });
  });
});

