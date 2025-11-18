import { Category } from '../contexts/CategoriesContext';

const API_URL = import.meta.env.BACKEND_API || 'http://localhost:8000/api/v1';

const getAuthToken = (): string | null => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  return token;
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
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Cannot get categories');
    }

    return response.json();
  },

  async addCategory(name: string, description: string) {
    const token = getAuthToken();
    if (!token) throw new Error('Authorization failed');

    const response = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description }),
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
      body: JSON.stringify({
        name: category.name,
        description: category.description,
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
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Cannot delete category ${id}`);
    }

    // Some backends return 204 No Content for DELETE:
    try {
      return await response.json();
    } catch {
      return { ok: true };
    }
  },
};
