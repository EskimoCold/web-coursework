import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CategoryForm } from './CategoryForm';
import { Category, useCategories } from '../../contexts/CategoriesContext';

vi.mock('../../components/Icon', () => ({
  Icon: ({ source, size, className }: { source: string; size: number; className: string }) => (
    <div data-testid={`icon-${source}`} className={className}>
      Icon: {source}
    </div>
  ),
}));

vi.mock('../../contexts/CategoriesContext', () => ({
  useCategories: vi.fn(),
}));

vi.mock('./categories.css', () => ({}));

const mockSetCategories = vi.fn();
const mockSetOpen = vi.fn();

const mockCategory: Category = {
  id: 1,
  name: 'Test Category',
  description: 'Test Description',
  icon: 'test-icon.png',
  type: 1,
};

const defaultProps = {
  label: 'Test Form',
  submit: 'Submit',
  modify: false,
};

const renderComponent = (props = {}) => {
  (useCategories as vi.Mock).mockReturnValue({
    setCategories: mockSetCategories,
  });

  return render(<CategoryForm {...defaultProps} {...props} />);
};

describe('CategoryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should render form with all elements for new category', () => {
    renderComponent();

    expect(screen.getByText('Test Form')).toBeInTheDocument();
    expect(screen.getByText('Название категории')).toBeInTheDocument();
    expect(screen.getByText('Описание')).toBeInTheDocument();
    expect(screen.getByText('Выберите иконку')).toBeInTheDocument();
    expect(screen.getByText('Тип')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Удалить' })).not.toBeInTheDocument();
  });

  it('should render form with placeholder data for modification', () => {
    renderComponent({
      modify: true,
      placeholder: {
        category: mockCategory,
        setOpen: mockSetOpen,
      },
    });

    expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Доход')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Удалить' })).toBeInTheDocument();
  });

  it('should update form fields when user interacts', () => {
    renderComponent();

    const [nameInput, descriptionTextarea] = screen.queryAllByDisplayValue('');

    fireEvent.change(nameInput, { target: { value: 'New Category' } });
    fireEvent.change(descriptionTextarea, { target: { value: 'New Description' } });

    expect(nameInput).toHaveValue('New Category');
    expect(descriptionTextarea).toHaveValue('New Description');
  });

  it('should toggle category type when type button is clicked', () => {
    renderComponent();

    const typeButton = screen.getByText('Доход');
    fireEvent.click(typeButton);

    expect(screen.getByText('Расход')).toBeInTheDocument();
  });

  it('should select icon when icon is clicked', () => {
    renderComponent();

    const firstIcon = screen.queryAllByTestId('icon-sample.png')[0];
    fireEvent.click(firstIcon);

    expect(firstIcon).toHaveClass('selected');
  });

  it('should submit form successfully for new category', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        category: {
          id: 2,
          name: 'New Category',
          description: 'New Description',
          icon: 'sample.png',
          type: 1,
        },
      }),
    };

    (global.fetch as vi.Mock).mockResolvedValueOnce(mockResponse);

    renderComponent();

    const [nameInput, descriptionTextarea] = screen.queryAllByDisplayValue('');

    fireEvent.change(nameInput, { target: { value: 'New Category' } });
    fireEvent.change(descriptionTextarea, { target: { value: 'New Description' } });
    fireEvent.click(screen.queryAllByTestId('icon-sample.png')[0]);

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/cat/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Category',
          description: 'New Description',
          icon: 'sample.png',
          type: 1,
        }),
      });
    });

    await waitFor(() => {
      expect(mockSetCategories).toHaveBeenCalled();
    });
  });


  it('should not submit form when name is empty', async () => {
    renderComponent();

    fireEvent.change(screen.queryAllByDisplayValue('')[1], { target: { value: 'New Description' } });
    fireEvent.click(screen.queryAllByTestId('icon-sample.png')[0]);

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it('should not submit form when icon is not selected', async () => {
    renderComponent();

    fireEvent.change(screen.queryAllByDisplayValue('')[0], { target: { value: 'New Category' } });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

   it('should handle API error on submit', async () => {
     const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

     (global.fetch as vi.Mock).mockRejectedValueOnce(new Error('API Error'));

     renderComponent();

     fireEvent.change(screen.queryAllByDisplayValue('')[0], { target: { value: 'New Category' } });
     fireEvent.click(screen.queryAllByTestId('icon-sample.png')[0]);
     fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

     await waitFor(() => {
       expect(consoleSpy).toHaveBeenCalled();
     });

     consoleSpy.mockRestore();
   });

  it('should handle delete for category modification', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({}),
    };

    (global.fetch as vi.Mock).mockResolvedValueOnce(mockResponse);

    renderComponent({
      modify: true,
      placeholder: {
        category: mockCategory,
        setOpen: mockSetOpen,
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/cat/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 1,
        }),
      });
    });

    await waitFor(() => {
      expect(mockSetCategories).toHaveBeenCalled();
      expect(mockSetOpen).toHaveBeenCalledWith(false);
    });
  });
});