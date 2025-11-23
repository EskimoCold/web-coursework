import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// Mock the API properly before importing the context
vi.mock('../api/categories', () => ({
  categoriesApi: {
    getCategories: vi.fn(),
  },
}));

// Import after mocking
import { categoriesApi } from '../api/categories';

import { CategoriesProvider, useCategories } from './CategoriesContext';

// Define proper types for mocked API
interface MockApiFunction {
  mockResolvedValue: (value: unknown) => void;
  mockResolvedValueOnce: (value: unknown) => void;
  mockRejectedValueOnce: (error: Error) => void;
}

interface MockCategoriesApi {
  getCategories: MockApiFunction;
}

const mockCategoriesApi = categoriesApi as MockCategoriesApi;

const TestComponent: React.FC = () => {
  const { categories, loading, error } = useCategories();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {categories.map((cat) => (
        <div key={cat.id}>{cat.name}</div>
      ))}
    </div>
  );
};

describe('CategoriesContext Error Handling', () => {
  it('handles API errors in CategoriesContext', async () => {
    mockCategoriesApi.getCategories.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <CategoriesProvider>
        <TestComponent />
      </CategoriesProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });
});
