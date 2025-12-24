import { api } from './client';
import { tokenStore } from './tokenStore';

export interface Transaction {
  id: number;
  amount: number;
  transaction_type: 'income' | 'expense';
  transaction_date: string;
  description: string;
  category_id?: number;
  category?: {
    id: number;
    name: string;
  };
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface TransactionCreate {
  amount: number;
  description: string;
  transaction_type: 'income' | 'expense';
  category_id?: number | null;
  transaction_date: string;
}

const getAuthToken = (): string | null => {
  return tokenStore.getAccessToken();
};

export const transactionsApi = {
  getTransactions: () => api.get<Transaction[]>('/transactions'),
  getCategories: () => api.get<Category[]>('/categories'),
  createTransaction: (data: TransactionCreate) => {
    const token = getAuthToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    return api.post<Transaction>('/transactions', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  deleteTransaction: (id: number) => {
    const token = getAuthToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    return api.delete<Response>(`/transactions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
