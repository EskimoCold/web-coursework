import { http, HttpResponse } from 'msw';
import { Category } from '../contexts/CategoriesContext';

export const handlers = [
  http.get('/api/todos', () => {
    return HttpResponse.json([
      { id: 1, title: 'Buy coffee beans' },
      { id: 2, title: 'Write unit tests' },
    ]);
  }),
  http.get('/api/cat/list', () => {
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
  http.post('/api/cat/add', async ({ request }) => {
    const { name, description, icon, type, id } = await request.json();

    if (!name || !icon) {
      return HttpResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
    }

    const newCategory = {
      id: id ? id : Date.now(),
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
  http.delete('/api/cat/delete', async ({ request }) => {
    const { id } = await request.json();

    if (id === null || id === undefined) {
      return HttpResponse.json({ error: 'Неверный ID' }, { status: 400 });
    }

    return HttpResponse.json({ message: `Категория с ID ${id} удалена` }, { status: 200 });
  }),
];
