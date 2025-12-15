import { Category } from '../types/category';

import { tokenStore } from './tokenStore';

const API_URL = import.meta.env.BACKEND_API || 'http://localhost:8000/api/v1';

const getAuthToken = (): string | null => {
  return tokenStore.getAccessToken();
};

export const categoriesApi = {
  async getCategories() {
    const token = getAuthToken();
    if (!token) throw new Error('Authorization failed');

    const response = await fetch(`${API_URL}/categories`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Cannot get categories');
    }

    return response.json();
  },

  async addCategory(name: string, description: string, icon: string) {
    const token = getAuthToken();
    if (!token) throw new Error('Authorization failed');

    const response = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ name, description, icon }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Cannot add category');
    }

    return response.json();
  },

  async updateCategory(category: Category) {
    const token = getAuthToken();
    if (!token) throw new Error('Authorization failed');

    const response = await fetch(`${API_URL}/categories/${category.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({
        name: category.name,
        description: category.description,
        icon: category.icon,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Cannot update category ${category.id}`);
    }

    return response.json();
  },

  async deleteCategory(id: number) {
    const token = getAuthToken();
    if (!token) throw new Error('Authorization failed');

    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Cannot delete category ${id}`);
    }

    try {
      return await response.json();
    } catch {
      return { ok: true };
    }
  },
};
