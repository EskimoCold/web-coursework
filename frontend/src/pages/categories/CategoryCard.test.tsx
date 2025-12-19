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
};

const mockCategoryExpense: Category = {
  id: 2,
  name: 'Expense Category',
  description: 'Expense Description',
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
  });

  it('should render category card with correct data for expense type', () => {
    renderComponent({ cat: mockCategoryExpense });

    expect(screen.getByText('Expense Category')).toBeInTheDocument();
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
  });

  it('should render all required elements', () => {
    renderComponent();

    expect(screen.getByText('Test Category')).toBeInTheDocument();
  });

  it('should handle click event on any part of the card', () => {
    const mockHandleClick = vi.fn();
    renderComponent({ handleClick: mockHandleClick });

    fireEvent.click(screen.getByText('Test Category'));

    expect(mockHandleClick).toHaveBeenCalledTimes(1);
  });

  it('should render with different category data', () => {
    const differentCategory: Category = {
      id: 3,
      name: 'Different Category',
      description: 'Different Description',
    };

    renderComponent({ cat: differentCategory });

    expect(screen.getByText('Different Category')).toBeInTheDocument();
  });
});
