import { api, BASE_URL } from './client';
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

    return fetch(BASE_URL + '/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(data),
    }).then((response) => {
      if (!response.ok) {
        return response
          .json()
          .then((errorData) => {
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
          })
          .catch(() => {
            throw new Error(`HTTP error! status: ${response.status}`);
          });
      }
      return response.json();
    });
  },
};
