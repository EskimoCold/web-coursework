// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // ... существующие handlers ...

  // Новые handlers для HomePage
  http.get('/api/v1/transactions', () => {
    return HttpResponse.json([
      {
        id: 1,
        amount: 1500,
        transaction_type: 'expense',
        transaction_date: '2024-01-15T00:00:00Z',
        description: 'Продукты в супермаркете',
        category: { id: 1, name: 'Продукты' },
      },
      {
        id: 2,
        amount: 50000,
        transaction_type: 'income',
        transaction_date: '2024-01-10T00:00:00Z',
        description: 'Зарплата за январь',
        category: { id: 2, name: 'Зарплата' },
      },
      {
        id: 3,
        amount: 800,
        transaction_type: 'expense',
        transaction_date: '2024-01-08T00:00:00Z',
        description: 'Проездной на метро',
        category: { id: 3, name: 'Транспорт' },
      },
    ]);
  }),

  http.get('/api/v1/categories', () => {
    return HttpResponse.json([
      { id: 1, name: 'Продукты' },
      { id: 2, name: 'Зарплата' },
      { id: 3, name: 'Транспорт' },
    ]);
  }),
];
