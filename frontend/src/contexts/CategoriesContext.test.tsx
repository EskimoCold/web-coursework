import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// Mock the API properly before importing the context
vi.mock('../api/categories', () => ({
  categoriesApi: {
    getCategories: vi.fn(),
  },
}));

import { categoriesApi } from '../api/categories';
import { CategoryProvider, useCategories } from '../contexts/CategoriesContext';

// Test component that uses the categories context
const TestComponent = () => {
  const { categories, loading, error } = useCategories();

  if (loading) return <div>Loading categories...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <div>Categories count: {categories.length}</div>
      <ul>
        {categories.map((category) => (
          <li key={category.id}>{category.name}</li>
        ))}
      </ul>
    </div>
  );
};

describe('CategoriesContext Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle API errors when loading categories', async () => {
    // Mock the API to reject with an error
    vi.mocked(categoriesApi.getCategories).mockRejectedValue(
      new Error('Failed to fetch categories'),
    );

    render(
      <CategoryProvider>
        <TestComponent />
      </CategoryProvider>,
    );

    // Should show loading initially
    expect(screen.getByText('Loading categories...')).toBeInTheDocument();

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Error: Failed to fetch categories')).toBeInTheDocument();
    });
  });

  it('should display categories when loaded successfully', async () => {
    // Mock the API to return categories
    const mockCategories = [
      { id: 1, name: 'Food', type: 'expense', color: '#FF0000' },
      { id: 2, name: 'Salary', type: 'income', color: '#00FF00' },
    ];

    vi.mocked(categoriesApi.getCategories).mockResolvedValue(mockCategories);

    render(
      <CategoryProvider>
        <TestComponent />
      </CategoryProvider>,
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Categories count: 2')).toBeInTheDocument();
    });

    // Check that categories are displayed
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('should handle empty categories list', async () => {
    // Mock the API to return empty array
    vi.mocked(categoriesApi.getCategories).mockResolvedValue([]);

    render(
      <CategoryProvider>
        <TestComponent />
      </CategoryProvider>,
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Categories count: 0')).toBeInTheDocument();
    });

    // Should not show error
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
  });
});
