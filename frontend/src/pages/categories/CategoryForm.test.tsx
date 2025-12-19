import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { categoriesApi } from '../../api/categories';
import { Category, useCategories } from '../../contexts/CategoriesContext';

import { CategoryForm } from './CategoryForm';

vi.mock('../../components/Icon', () => ({
  Icon: ({ source, className }: { source: string; size: number; className: string }) => (
    <div data-testid={`icon-${source}`} className={className}>
      Icon: {source}
    </div>
  ),
}));

vi.mock('../../contexts/CategoriesContext', () => ({
  useCategories: vi.fn(),
}));

vi.mock('./categories.css', () => ({}));

vi.mock('../../api/categories', () => ({
  categoriesApi: {
    addCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

const mockSetCategories = vi.fn();
const mockSetOpen = vi.fn();

const mockCategory: Category = {
  id: 1,
  name: 'Test Category',
  description: 'Test Description',
  icon: 'sample.png', // Добавлено поле icon
};

const defaultProps = {
  label: 'Test Form',
  submit: 'Submit',
  modify: false,
};

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

const mockIcons = ['icon1.png', 'icon2.png', 'sample.png']; // Добавлен массив иконок

const renderComponent = (props = {}, token = 'mock-token') => {
  mockLocalStorage.getItem.mockImplementation((key) => {
    if (key === 'access_token' || key === 'token') return token;
    return null;
  });

  (useCategories as unknown as vi.Mock).mockReturnValue({
    setCategories: mockSetCategories,
    icons: mockIcons, // Добавлено возвращение иконок
  });

  return render(<CategoryForm {...defaultProps} {...props} />);
};

describe('CategoryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form for new category', () => {
    renderComponent();

    expect(screen.getByText('Test Form')).toBeInTheDocument();
    expect(screen.getByText('Название категории')).toBeInTheDocument();
    expect(screen.getByText('Описание')).toBeInTheDocument();
    expect(screen.getByText('Выберите иконку')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Удалить' })).not.toBeInTheDocument();
  });

  it('renders form with placeholder data for modification', () => {
    renderComponent({
      modify: true,
      placeholder: {
        category: mockCategory,
        setOpen: mockSetOpen,
      },
    });

    expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Удалить' })).toBeInTheDocument();
  });

  it('updates form fields on user input', () => {
    renderComponent();

    const [nameInput, descriptionTextarea] = screen.getAllByDisplayValue('');

    fireEvent.change(nameInput, { target: { value: 'New Category' } });
    fireEvent.change(descriptionTextarea, { target: { value: 'New Description' } });

    expect(nameInput).toHaveValue('New Category');
    expect(descriptionTextarea).toHaveValue('New Description');
  });

  it('marks icon as selected when clicked', () => {
    renderComponent();

    const firstIcon = screen.getByTestId('icon-icon1.png');
    expect(firstIcon).not.toHaveClass('selected');

    fireEvent.click(firstIcon);
    expect(firstIcon).toHaveClass('selected');
  });

  it('submits successfully for new category', async () => {
    const newCategory: Category = {
      id: 2,
      name: 'New Category',
      description: 'New Description',
      icon: 'icon1.png',
    };

    (categoriesApi.addCategory as vi.Mock).mockResolvedValueOnce(newCategory);

    renderComponent();

    const [nameInput, descriptionTextarea] = screen.getAllByDisplayValue('');

    fireEvent.change(nameInput, { target: { value: 'New Category' } });
    fireEvent.change(descriptionTextarea, { target: { value: 'New Description' } });

    // Выбираем иконку перед отправкой
    const firstIcon = screen.getByTestId('icon-icon1.png');
    fireEvent.click(firstIcon);

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(categoriesApi.addCategory).toHaveBeenCalledWith(
        'New Category',
        'New Description',
        'icon1.png',
      );
    });

    await waitFor(() => {
      expect(mockSetCategories).toHaveBeenCalledTimes(1);
    });
  });

  it('submits successfully for category modification', async () => {
    const updated: Category = { ...mockCategory };
    (categoriesApi.updateCategory as vi.Mock).mockResolvedValueOnce(updated);

    renderComponent({
      modify: true,
      placeholder: {
        category: mockCategory,
        setOpen: mockSetOpen,
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(categoriesApi.updateCategory).toHaveBeenCalledWith({
        id: 1,
        name: 'Test Category',
        description: 'Test Description',
        icon: 'sample.png',
      });
    });

    await waitFor(() => {
      expect(mockSetCategories).toHaveBeenCalledTimes(1);
      expect(mockSetOpen).toHaveBeenCalledWith(false);
    });
  });

  it('does not submit when name is empty (button disabled)', async () => {
    renderComponent();

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    expect(submitButton).toBeDisabled();

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(categoriesApi.addCategory).not.toHaveBeenCalled();
    });
  });

  it('does not submit when icon is not selected (button disabled)', async () => {
    renderComponent();

    const [nameInput] = screen.getAllByDisplayValue('');
    fireEvent.change(nameInput, { target: { value: 'Only Name' } });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    expect(submitButton).toBeDisabled();

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(categoriesApi.addCategory).not.toHaveBeenCalled();
    });
  });

  it('handles API error on submit', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    (categoriesApi.addCategory as vi.Mock).mockRejectedValueOnce(new Error('API Error'));

    renderComponent();

    const [nameInput] = screen.getAllByDisplayValue('');
    fireEvent.change(nameInput, { target: { value: 'New Category' } });

    const firstIcon = screen.getByTestId('icon-icon1.png');
    fireEvent.click(firstIcon);

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(consoleSpy).toBeCalledTimes(0);
    });

    consoleSpy.mockRestore();
  });

  it('handles delete for category modification', async () => {
    (categoriesApi.deleteCategory as vi.Mock).mockResolvedValueOnce({});

    renderComponent({
      modify: true,
      placeholder: {
        category: mockCategory,
        setOpen: mockSetOpen,
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));

    await waitFor(() => {
      expect(categoriesApi.deleteCategory).toHaveBeenCalledWith(1);
      expect(mockSetCategories).toHaveBeenCalledTimes(1);
      expect(mockSetOpen).toHaveBeenCalledWith(false);
    });
  });
});
