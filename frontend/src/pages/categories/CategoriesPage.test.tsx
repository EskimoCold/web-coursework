import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { Category, useCategories } from '../../contexts/CategoriesContext';
import { resetCategoriesPageStore } from './categoriesPageStore';

import { CategoriesPage } from './CategoriesPage';

vi.mock('./CategoryCard', () => ({
  CategoryCard: ({ cat, handleClick }: { cat: Category; handleClick: () => void }) => (
    <div data-testid={`category-card-${cat.id}`} onClick={handleClick}>
      {cat.name}
    </div>
  ),
}));

vi.mock('./CategoryWindow', () => ({
  CategoryWindow: ({ cat, setOpen }: { cat: Category; setOpen: (open: boolean) => void }) => (
    <div data-testid="category-window">
      <div data-testid="window-category-name">{cat.name}</div>
      <button onClick={() => setOpen(false)}>Close Window</button>
    </div>
  ),
}));

vi.mock('./СategoryForm', () => ({
  CategoryForm: ({ label, modify, submit }: { label: string; modify: boolean; submit: string }) => (
    <div data-testid="cat-form">
      <div data-testid="form-label">{label}</div>
      <div data-testid="form-modify">{modify ? 'true' : 'false'}</div>
      <div data-testid="form-submit">{submit}</div>
    </div>
  ),
}));

vi.mock('../../contexts/CategoriesContext', () => ({
  useCategories: vi.fn(),
}));

const mockCategories: Category[] = [
  {
    id: 1,
    name: 'Food',
    icon: 'food-icon',
    description: 'Food expenses',
  },
  {
    id: 2,
    name: 'Salary',
    icon: 'salary-icon',
    description: 'Salary income',
  },
  {
    id: 3,
    name: 'Entertainment',
    icon: 'entertainment-icon',
    description: 'Entertainment expenses',
  },
];

const mockIcons = ['1.svg', '2.svg', '3.svg'];

const renderComponent = (categories: Category[] = mockCategories, icons: string[] = mockIcons) => {
  (useCategories as vi.Mock).mockReturnValue({
    categories,
    icons,
  });

  return render(<CategoriesPage />);
};

describe('Categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCategoriesPageStore();
  });

  it('should render all categories by default', () => {
    renderComponent();

    expect(screen.getByTestId('category-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-3')).toBeInTheDocument();
  });

  it('should render search input and filters', () => {
    renderComponent();

    expect(screen.getByPlaceholderText('Поиск')).toBeInTheDocument();
    // expect(screen.getByText('Все')).toBeInTheDocument();
    // expect(screen.getByText('Доходы')).toBeInTheDocument();
    // expect(screen.getByText('Расходы')).toBeInTheDocument();
  });

  it('should filter categories by search query', () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText('Поиск');
    fireEvent.change(searchInput, { target: { value: 'Food' } });

    expect(screen.getByTestId('category-card-1')).toBeInTheDocument();
    expect(screen.queryByTestId('category-card-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('category-card-3')).not.toBeInTheDocument();
  });

  // it('should filter categories by type - income', () => {
  //   renderComponent();

  //   const incomeButton = screen.getByText('Доходы');
  //   fireEvent.click(incomeButton);

  //   expect(screen.queryByTestId('category-card-1')).not.toBeInTheDocument();
  //   expect(screen.getByTestId('category-card-2')).toBeInTheDocument();
  //   expect(screen.queryByTestId('category-card-3')).not.toBeInTheDocument();
  // });

  // it('should filter categories by type - expense', () => {
  //   renderComponent();

  //   const expenseButton = screen.getByText('Расходы');
  //   fireEvent.click(expenseButton);

  //   expect(screen.getByTestId('category-card-1')).toBeInTheDocument();
  //   expect(screen.queryByTestId('category-card-2')).not.toBeInTheDocument();
  //   expect(screen.getByTestId('category-card-3')).toBeInTheDocument();
  // });

  // it('should show all categories when "all" filter is selected', () => {
  //   renderComponent();

  //   fireEvent.click(screen.getByText('Доходы'));
  //   expect(screen.queryByTestId('category-card-1')).not.toBeInTheDocument();

  //   fireEvent.click(screen.getByText('Все'));
  //   expect(screen.getByTestId('category-card-1')).toBeInTheDocument();
  //   expect(screen.getByTestId('category-card-2')).toBeInTheDocument();
  //   expect(screen.getByTestId('category-card-3')).toBeInTheDocument();
  // });

  it('should open category window when category card is clicked', () => {
    renderComponent();

    const categoryCard = screen.getByTestId('category-card-1');
    fireEvent.click(categoryCard);

    expect(screen.getByTestId('category-window')).toBeInTheDocument();
    expect(screen.getByTestId('window-category-name')).toHaveTextContent('Food');
  });

  it('should close category window when close button is clicked', async () => {
    renderComponent();

    fireEvent.click(screen.getByTestId('category-card-1'));
    expect(screen.getByTestId('category-window')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close Window'));

    await waitFor(() => {
      expect(screen.queryByTestId('category-window')).not.toBeInTheDocument();
    });
  });

  it('should handle empty categories list', () => {
    renderComponent([]);

    expect(screen.queryByTestId('category-card-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('category-card-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('category-card-3')).not.toBeInTheDocument();
  });

  // it('should apply active class to selected filter', () => {
  //   renderComponent();

  //   const allButton = screen.getByText('Все');
  //   const incomeButton = screen.getByText('Доходы');

  //   expect(allButton).toHaveClass('cat-filter-active');
  //   expect(incomeButton).not.toHaveClass('cat-filter-active');

  //   fireEvent.click(incomeButton);

  //   expect(allButton).not.toHaveClass('cat-filter-active');
  //   expect(incomeButton).toHaveClass('cat-filter-active');
  // });

  it('should handle case insensitive search', () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText('Поиск');
    fireEvent.change(searchInput, { target: { value: 'FOOD' } });

    expect(screen.getByTestId('category-card-1')).toBeInTheDocument();
    expect(screen.queryByTestId('category-card-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('category-card-3')).not.toBeInTheDocument();
  });
});
