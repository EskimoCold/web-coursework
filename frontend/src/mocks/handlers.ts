import { http, HttpResponse } from 'msw';

interface Category {
  id: number | string;
  name: string;
  description?: string;
  icon: string;
  type: number;
}

interface AddCategoryRequest {
  name: string;
  description?: string;
  icon: string;
  type: number;
  id?: number | string;
}

interface DeleteCategoryRequest {
  id: number | string;
}

export const handlers = [
  http.options('*/api/v1/*', () => {
    return new HttpResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }),

  http.post('*/api/v1/auth/refresh', () => {
    return HttpResponse.json({ detail: 'Token refresh failed' }, { status: 401 });
  }),

  http.get('*/api/v1/currency/rates', () => {
    return HttpResponse.json({
      base: 'RUB',
      date: '2024-01-01',
      rates: {
        RUB: 1,
        USD: 0.011,
        EUR: 0.01,
        CNY: 0.08,
      },
    });
  }),

  http.get('*/api/v1/transactions', () => {
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

  http.get('*/api/v1/categories', () => {
    return HttpResponse.json([
      { id: 1, name: 'Продукты' },
      { id: 2, name: 'Зарплата' },
      { id: 3, name: 'Транспорт' },
    ]);
  }),
  http.get('*/api/cat/list', () => {
    return HttpResponse.json(
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        name: `${i + Math.random().toFixed(5)}`,
        icon: 'sample.png',
        description: 'Sample of category',
        type: Math.round(Math.random()),
      })),
    );
  }),
  http.post('*/api/cat/add', async ({ request }) => {
    const data = (await request.json()) as AddCategoryRequest;
    const { name, description, icon, type, id } = data;

    if (!name || !icon) {
      return HttpResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
    }

    const newCategory: Category = {
      id: id && id.toString().length > 0 ? id : Date.now(),
      name,
      description,
      icon,
      type,
    };

    return HttpResponse.json(
      { message: 'Категория добавлена', category: newCategory },
      { status: 201 },
    );
  }),
  http.delete('*/api/cat/delete', async ({ request }) => {
    const data = (await request.json()) as DeleteCategoryRequest;
    const { id } = data;

    if (id === null || id === undefined) {
      return HttpResponse.json({ error: 'Неверный ID' }, { status: 400 });
    }

    return HttpResponse.json({ message: `Категория с ID ${id} удалена` }, { status: 200 });
  }),
];
