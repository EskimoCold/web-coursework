import { describe, expect, it, vi, beforeEach } from 'vitest';

import { categoriesApi } from './categories';
import { api } from './client';
import { tokenStore } from './tokenStore';

vi.mock('./client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('./tokenStore', () => ({
  tokenStore: {
    getAccessToken: vi.fn(),
  },
}));

describe('categoriesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (tokenStore.getAccessToken as ReturnType<typeof vi.fn>).mockReturnValue('test-token');
  });

  it('should get categories', async () => {
    const mockCategories = [
      { id: 1, name: 'Food', type: 0, icon: 'food', description: 'Food category' },
      { id: 2, name: 'Salary', type: 1, icon: 'salary', description: 'Salary category' },
    ];

    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockCategories);

    const result = await categoriesApi.getCategories();

    expect(api.get).toHaveBeenCalledWith('/categories', {
      headers: { Authorization: 'Bearer test-token' },
    });
    expect(result).toEqual(mockCategories);
  });

  it('should throw error when no token for getCategories', async () => {
    (tokenStore.getAccessToken as ReturnType<typeof vi.fn>).mockReturnValue(null);

    await expect(categoriesApi.getCategories()).rejects.toThrow('Authorization failed');
  });

  it('should add category', async () => {
    const createdCategory = { id: 3, name: 'New Category', type: 0, icon: 'new-icon', description: 'New category description' };

    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(createdCategory);

    const result = await categoriesApi.addCategory('New Category', 'New category description', 'new-icon');

    expect(api.post).toHaveBeenCalledWith(
      '/categories',
      { name: 'New Category', description: 'New category description', icon: 'new-icon' },
      { headers: { Authorization: 'Bearer test-token' } },
    );
    expect(result).toEqual(createdCategory);
  });

  it('should throw error when no token for addCategory', async () => {
    (tokenStore.getAccessToken as ReturnType<typeof vi.fn>).mockReturnValue(null);

    await expect(categoriesApi.addCategory('Test', 'Desc', 'icon')).rejects.toThrow('Authorization failed');
  });

  it('should update category', async () => {
    const updatedCategory = {
      id: 1,
      name: 'Updated Food',
      type: 0,
      icon: 'food',
      description: 'Updated description',
    };

    (api.put as ReturnType<typeof vi.fn>).mockResolvedValue(updatedCategory);

    const result = await categoriesApi.updateCategory(updatedCategory);

    expect(api.put).toHaveBeenCalledWith(
      `/categories/${updatedCategory.id}`,
      { name: updatedCategory.name, description: updatedCategory.description, icon: updatedCategory.icon },
      { headers: { Authorization: 'Bearer test-token' } },
    );
    expect(result).toEqual(updatedCategory);
  });

  it('should delete category', async () => {
    const categoryId = 1;
    const mockResponse = { ok: true };

    (api.delete as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const result = await categoriesApi.deleteCategory(categoryId);

    expect(api.delete).toHaveBeenCalledWith(`/categories/${categoryId}`, {
      headers: { Authorization: 'Bearer test-token' },
    });
    expect(result).toEqual(mockResponse);
  });
});

