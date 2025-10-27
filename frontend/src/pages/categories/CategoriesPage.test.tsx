import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CategoriesPage } from './CategoriesPage';
import { Category, useCategories } from '../../contexts/CategoriesContext';
import { CategoryWindow } from './CategoryWindow';
import { CategoryForm } from './CategoryForm';

// Mock the components and hooks
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
    type: 0,
    icon: 'food-icon',
    description: 'Food expenses'
  },
  {
    id: 2,
    name: 'Salary',
    type: 1,
    icon: 'salary-icon',
    description: 'Salary income'
  },
  {
    id: 3,
    name: 'Entertainment',
    type: 0,
    icon: 'entertainment-icon',
    description: 'Entertainment expenses'
  }
];

const renderComponent = (categories: Category[] = mockCategories) => {
  (useCategories as vi.Mock).mockReturnValue({
    categories,
  });

  return render(<CategoriesPage />);
};

describe('Categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(screen.getByText('Все')).toBeInTheDocument();
    expect(screen.getByText('Доходы')).toBeInTheDocument();
    expect(screen.getByText('Расходы')).toBeInTheDocument();
  });

  it('should filter categories by search query', () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText('Поиск');
    fireEvent.change(searchInput, { target: { value: 'Food' } });

    expect(screen.getByTestId('category-card-1')).toBeInTheDocument();
    expect(screen.queryByTestId('category-card-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('category-card-3')).not.toBeInTheDocument();
  });

  it('should filter categories by type - income', () => {
    renderComponent();

    const incomeButton = screen.getByText('Доходы');
    fireEvent.click(incomeButton);

    expect(screen.queryByTestId('category-card-1')).not.toBeInTheDocument(); // type 0 - expense
    expect(screen.getByTestId('category-card-2')).toBeInTheDocument(); // type 1 - income
    expect(screen.queryByTestId('category-card-3')).not.toBeInTheDocument(); // type 0 - expense
  });

  it('should filter categories by type - expense', () => {
    renderComponent();

    const expenseButton = screen.getByText('Расходы');
    fireEvent.click(expenseButton);

    expect(screen.getByTestId('category-card-1')).toBeInTheDocument(); // type 0 - expense
    expect(screen.queryByTestId('category-card-2')).not.toBeInTheDocument(); // type 1 - income
    expect(screen.getByTestId('category-card-3')).toBeInTheDocument(); // type 0 - expense
  });

  it('should show all categories when "all" filter is selected', () => {
    renderComponent();

    // First filter by income
    fireEvent.click(screen.getByText('Доходы'));
    expect(screen.queryByTestId('category-card-1')).not.toBeInTheDocument();

    // Then go back to all
    fireEvent.click(screen.getByText('Все'));
    expect(screen.getByTestId('category-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-3')).toBeInTheDocument();
  });

  it('should open category window when category card is clicked', () => {
    renderComponent();

    const categoryCard = screen.getByTestId('category-card-1');
    fireEvent.click(categoryCard);

    expect(screen.getByTestId('category-window')).toBeInTheDocument();
    expect(screen.getByTestId('window-category-name')).toHaveTextContent('Food');
  });

  it('should close category window when close button is clicked', async () => {
    renderComponent();

    // Open window
    fireEvent.click(screen.getByTestId('category-card-1'));
    expect(screen.getByTestId('category-window')).toBeInTheDocument();

    // Close window
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

  it('should apply active class to selected filter', () => {
    renderComponent();

    const allButton = screen.getByText('Все');
    const incomeButton = screen.getByText('Доходы');

    // Initially "all" should be active
    expect(allButton).toHaveClass('cat-filter-active');
    expect(incomeButton).not.toHaveClass('cat-filter-active');

    // Click income button
    fireEvent.click(incomeButton);

    // Now income should be active
    expect(allButton).not.toHaveClass('cat-filter-active');
    expect(incomeButton).toHaveClass('cat-filter-active');
  });

  it('should handle case insensitive search', () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText('Поиск');
    fireEvent.change(searchInput, { target: { value: 'FOOD' } });

    expect(screen.getByTestId('category-card-1')).toBeInTheDocument();
    expect(screen.queryByTestId('category-card-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('category-card-3')).not.toBeInTheDocument();
  });
});