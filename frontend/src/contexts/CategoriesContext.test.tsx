import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { categoriesApi } from '../api/categories';

import { CategoriesProvider, useCategories } from './CategoriesContext';

vi.mock('../api/categories');

// Define proper type for mocked API
interface MockCategoriesApi {
  getCategories: ReturnType<typeof vi.fn>;
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
