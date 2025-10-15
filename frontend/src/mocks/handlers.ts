import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/todos', () => {
    return HttpResponse.json([
      { id: 1, title: 'Buy coffee beans' },
      { id: 2, title: 'Write unit tests' },
    ]);
  }),
];
