import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Category } from '../../contexts/CategoriesContext';

import { CategoryWindow } from './CategoryWindow';

type Props = {
  label: string;
  modify: boolean;
  submit: string;
  placeholder?: {
    category: Category;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  };
};

vi.mock('./CategoryForm', () => ({
  CategoryForm: ({ label, modify, submit, placeholder }: Props) => (
    <div data-testid="category-form">
      <div data-testid="form-label">{label}</div>
      <div data-testid="form-modify">{modify ? 'true' : 'false'}</div>
      <div data-testid="form-submit">{submit}</div>
      <div data-testid="form-category-id">{placeholder?.category.id}</div>
      <div data-testid="form-category-name">{placeholder?.category.name}</div>
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

const mockSetOpen = vi.fn();

const defaultProps = {
  cat: mockCategory,
  setOpen: mockSetOpen,
};

const renderComponent = (props = {}) => {
  return render(<CategoryWindow {...defaultProps} {...props} />);
};

describe('CategoryWindow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render CategoryWindow with background and form', () => {
    renderComponent();

    expect(screen.getByTestId('category-form')).toBeInTheDocument();
    expect(screen.getByTestId('form-label')).toHaveTextContent('Изменить категорию');
    expect(screen.getByTestId('form-modify')).toHaveTextContent('true');
    expect(screen.getByTestId('form-submit')).toHaveTextContent('Изменить');
  });

  it('should pass correct category data to CategoryForm', () => {
    renderComponent();

    expect(screen.getByTestId('form-category-id')).toHaveTextContent('1');
    expect(screen.getByTestId('form-category-name')).toHaveTextContent('Test Category');
  });

  it('should call setOpen when background is clicked', () => {
    renderComponent();

    const background = screen
      .getByTestId('category-form')
      .closest('.cat-window')
      ?.querySelector('.cat-window-bg');
    fireEvent.click(background!);

    expect(mockSetOpen).toHaveBeenCalledWith(false);
    expect(mockSetOpen).toHaveBeenCalledTimes(1);
  });

  it('should render with different category data', () => {
    const differentCategory: Category = {
      id: 2,
      name: 'Different Category',
      description: 'Different Description',
      icon: 'different-icon.png',
      type: 0,
    };

    renderComponent({ cat: differentCategory });

    expect(screen.getByTestId('form-category-id')).toHaveTextContent('2');
    expect(screen.getByTestId('form-category-name')).toHaveTextContent('Different Category');
  });

  it('should pass setOpen function to CategoryForm', () => {
    renderComponent();

    expect(screen.getByTestId('form-modify')).toHaveTextContent('true');
  });

  it('should have correct CSS structure', () => {
    renderComponent();

    const windowElement = screen.getByTestId('category-form').closest('.cat-window');
    const backgroundElement = windowElement?.querySelector('.cat-window-bg');

    expect(windowElement).toBeInTheDocument();
    expect(backgroundElement).toBeInTheDocument();
  });

  it('should handle multiple background clicks', () => {
    renderComponent();

    const background = screen
      .getByTestId('category-form')
      .closest('.cat-window')
      ?.querySelector('.cat-window-bg');

    fireEvent.click(background!);
    fireEvent.click(background!);
    fireEvent.click(background!);

    expect(mockSetOpen).toHaveBeenCalledTimes(3);
    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  it('should work with different setOpen functions', () => {
    const differentSetOpen = vi.fn();
    renderComponent({ setOpen: differentSetOpen });

    const background = screen
      .getByTestId('category-form')
      .closest('.cat-window')
      ?.querySelector('.cat-window-bg');
    fireEvent.click(background!);

    expect(differentSetOpen).toHaveBeenCalledWith(false);
    expect(mockSetOpen).not.toHaveBeenCalled();
  });
});
