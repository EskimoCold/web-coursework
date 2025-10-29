import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { categoriesApi } from '../../api/categories';
import { Category, useCategories } from '../../contexts/CategoriesContext';

import { CategoryForm } from './CategoryForm';

// --- Mocks ---
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

// --- Shared test helpers ---
const mockSetCategories = vi.fn();
const mockSetOpen = vi.fn();

const mockCategory: Category = {
  id: 1,
  name: 'Test Category',
  description: 'Test Description',
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

const renderComponent = (props = {}, token = 'mock-token') => {
  mockLocalStorage.getItem.mockImplementation((key) => {
    if (key === 'access_token' || key === 'token') return token;
    return null;
  });

  (useCategories as unknown as vi.Mock).mockReturnValue({
    setCategories: mockSetCategories,
  });

  return render(<CategoryForm {...defaultProps} {...props} />);
};

// --- Tests ---
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

    // two empty fields: [name input, description textarea]
    const [nameInput, descriptionTextarea] = screen.getAllByDisplayValue('');

    fireEvent.change(nameInput, { target: { value: 'New Category' } });
    fireEvent.change(descriptionTextarea, { target: { value: 'New Description' } });

    expect(nameInput).toHaveValue('New Category');
    expect(descriptionTextarea).toHaveValue('New Description');
  });

  it('marks icon as selected when clicked (default already selected)', () => {
    renderComponent();

    // all icons are "sample.png"; at least one should be selected by default
    const firstIcon = screen.getAllByTestId('icon-sample.png')[0];
    expect(firstIcon).toHaveClass('selected');

    // Clicking again keeps it selected
    fireEvent.click(firstIcon);
    expect(firstIcon).toHaveClass('selected');
  });

  it('submits successfully for new category', async () => {
    const newCategory: Category = {
      id: 2,
      name: 'New Category',
      description: 'New Description',
    };

    (categoriesApi.addCategory as vi.Mock).mockResolvedValueOnce(newCategory);

    renderComponent();

    const [nameInput, descriptionTextarea] = screen.getAllByDisplayValue('');

    fireEvent.change(nameInput, { target: { value: 'New Category' } });
    fireEvent.change(descriptionTextarea, { target: { value: 'New Description' } });

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(categoriesApi.addCategory).toHaveBeenCalledWith('New Category', 'New Description');
    });

    await waitFor(() => {
      expect(mockSetCategories).toHaveBeenCalledTimes(1);
    });
  });

  it('submits successfully for category modification', async () => {
    const updated: Category = { ...mockCategory }; // component replaces by returned value
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
    // With empty name, isSubmittable=false
    expect(submitButton).toBeDisabled();

    // Even clicking should not call API
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(categoriesApi.addCategory).not.toHaveBeenCalled();
    });
  });

  it('submits even if icon is not explicitly clicked (default icon present)', async () => {
    const newCategory: Category = {
      id: 3,
      name: 'Only Name',
      description: '',
    };
    (categoriesApi.addCategory as vi.Mock).mockResolvedValueOnce(newCategory);

    renderComponent();

    const [nameInput] = screen.getAllByDisplayValue('');
    fireEvent.change(nameInput, { target: { value: 'Only Name' } });

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(categoriesApi.addCategory).toHaveBeenCalledWith('Only Name', '');
      expect(mockSetCategories).toHaveBeenCalledTimes(1);
    });
  });

  it('handles API error on submit', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    (categoriesApi.addCategory as vi.Mock).mockRejectedValueOnce(new Error('API Error'));

    renderComponent();

    const [nameInput] = screen.getAllByDisplayValue('');
    fireEvent.change(nameInput, { target: { value: 'New Category' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
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
