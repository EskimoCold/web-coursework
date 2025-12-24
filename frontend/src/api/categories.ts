import { Category } from '../types/category';

import { api } from './client';
import { tokenStore } from './tokenStore';

const getAuthToken = (): string | null => {
  return tokenStore.getAccessToken();
};

export const categoriesApi = {
  async getCategories() {
    const token = getAuthToken();
    if (!token) throw new Error('Authorization failed');

    return api.get<Category[]>('/categories', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async addCategory(name: string, description: string, icon: string) {
    const token = getAuthToken();
    if (!token) throw new Error('Authorization failed');

    return api.post<Category>(
      '/categories',
      { name, description, icon },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  },

  async updateCategory(category: Category) {
    const token = getAuthToken();
    if (!token) throw new Error('Authorization failed');

    return api.put<Category>(
      `/categories/${category.id}`,
      { name: category.name, description: category.description, icon: category.icon },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  },

  async deleteCategory(id: number) {
    const token = getAuthToken();
    if (!token) throw new Error('Authorization failed');

    return api.delete<{ ok: boolean }>(`/categories/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
