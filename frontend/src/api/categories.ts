import { Category } from '../contexts/CategoriesContext';

const API_URL = import.meta.env.BACKEND_API || 'http://localhost:8000/api/v1';

export const categoriesApi = {
  async getCategories() {
    const response = await fetch(`${API_URL}/categories`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Cannot get categories');
    }

    return response.json();
  },

  async addCategory(name: string, description: string) {
    const response = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        description: description,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Cannot add category');
    }

    return response.json();
  },

  async updateCategory(category: Category) {
    const response = await fetch(`${API_URL}/categories/${category.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: category.name,
        description: category.description,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `Cannot update category ${category.id}`);
    }

    return response.json();
  },

  async deleteCategory(id: number) {
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `Cannot delete category ${id}`);
    }

    return response.json();
  },
};
