import { BASE_URL } from './client';
import { tokenStore } from './tokenStore';

const getAuthToken = (): string | null => {
  return tokenStore.getAccessToken();
};

export interface UserData {
  id: number;
  username: string;
  created_at?: string;
}

export interface ExportData {
  version: string;
  export_date: string;
  user: UserData;
  categories: Array<{
    id: number;
    name: string;
    description?: string;
    icon: string;
    created_at?: string;
  }>;
  transactions: Array<{
    id: number;
    amount: number;
    description?: string;
    transaction_type: 'income' | 'expense';
    category_id?: number;
    transaction_date?: string;
    created_at?: string;
  }>;
}

export interface ImportResult {
  message: string;
  imported_categories: number;
  imported_transactions: number;
  errors?: string[] | null;
}

export const usersApi = {
  exportData: async (): Promise<Blob> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(BASE_URL + '/users/me/export', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.blob();
  },

  importData: async (file: File): Promise<ImportResult> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(BASE_URL + '/users/me/import', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};
