// src/api/transactions.ts
import { api } from './client';

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

export const transactionsApi = {
    getTransactions: () => api.get<Transaction[]>('/v1/transactions'),
    getCategories: () => api.get<Category[]>('/v1/categories'),
};