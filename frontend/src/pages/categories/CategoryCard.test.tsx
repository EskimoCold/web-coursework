import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { Category } from '../../contexts/CategoriesContext';

import { CategoryCard } from './CategoryCard';

vi.mock('../../components/Icon', () => ({
  Icon: ({ source, className }: { source: string; size: number; className: string }) => (
    <div data-testid={`icon-${source}`} className={className}>
      Icon: {source}
    </div>
  ),
}));

vi.mock('./categories.css', () => ({}));

const mockCategory: Category = {
  id: 1,
  name: 'Test Category',
  description: 'Test Description',
  icon: 'test-icon.png',
  type: 1,
};

const mockCategoryExpense: Category = {
  id: 2,
  name: 'Expense Category',
  description: 'Expense Description',
  icon: 'expense-icon.png',
  type: 0,
};

const defaultProps = {
  cat: mockCategory,
  handleClick: vi.fn(),
};

const renderComponent = (props = {}) => {
  return render(<CategoryCard {...defaultProps} {...props} />);
};

describe('CategoryCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render category card with correct data for income type', () => {
    renderComponent();

    expect(screen.getByText('Test Category')).toBeInTheDocument();
    expect(screen.getByText('Доход')).toBeInTheDocument();
    expect(screen.getByTestId('icon-test-icon.png')).toBeInTheDocument();
  });

  it('should render category card with correct data for expense type', () => {
    renderComponent({ cat: mockCategoryExpense });

    expect(screen.getByText('Expense Category')).toBeInTheDocument();
    expect(screen.getByText('Расход')).toBeInTheDocument();
    expect(screen.getByTestId('icon-expense-icon.png')).toBeInTheDocument();
  });

  it('should call handleClick when card is clicked', () => {
    const mockHandleClick = vi.fn();
    renderComponent({ handleClick: mockHandleClick });

    const card = screen.getByText('Test Category').closest('.cat-card');
    fireEvent.click(card!);

    expect(mockHandleClick).toHaveBeenCalledTimes(1);
  });

  it('should render icon with correct props', () => {
    renderComponent();

    const icon = screen.getByTestId('icon-test-icon.png');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('cat-card-icon');
  });

  it('should apply correct CSS classes for income type', () => {
    renderComponent();

    const typeTitle = screen.getByText('Доход');
    expect(typeTitle).toHaveClass('cat-card-type-title');
    expect(typeTitle).toHaveClass('green');
    expect(typeTitle).not.toHaveClass('red');
  });

  it('should apply correct CSS classes for expense type', () => {
    renderComponent({ cat: mockCategoryExpense });

    const typeTitle = screen.getByText('Расход');
    expect(typeTitle).toHaveClass('cat-card-type-title');
    expect(typeTitle).toHaveClass('red');
    expect(typeTitle).not.toHaveClass('green');
  });

  it('should render all required elements', () => {
    renderComponent();

    expect(screen.getByText('Test Category')).toBeInTheDocument();
    expect(screen.getByText('Доход')).toBeInTheDocument();
    expect(screen.getByTestId('icon-test-icon.png')).toBeInTheDocument();
  });

  it('should handle click event on any part of the card', () => {
    const mockHandleClick = vi.fn();
    renderComponent({ handleClick: mockHandleClick });

    fireEvent.click(screen.getByText('Test Category'));
    fireEvent.click(screen.getByText('Доход'));
    fireEvent.click(screen.getByTestId('icon-test-icon.png'));

    expect(mockHandleClick).toHaveBeenCalledTimes(3);
  });

  it('should render with different category data', () => {
    const differentCategory: Category = {
      id: 3,
      name: 'Different Category',
      description: 'Different Description',
      icon: 'different-icon.png',
      type: 1,
    };

    renderComponent({ cat: differentCategory });

    expect(screen.getByText('Different Category')).toBeInTheDocument();
    expect(screen.getByText('Доход')).toBeInTheDocument();
    expect(screen.getByTestId('icon-different-icon.png')).toBeInTheDocument();
  });
});
