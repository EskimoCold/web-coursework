import { vi, expect, it, describe } from 'vitest';

import { api } from './client';

class MockedFetchResponse implements Partial<Response> {
  ok!: boolean;
  status!: number;
  headers = new Headers();
  redirected = false;
  statusText = '';
  type: ResponseType = 'basic';
  url = '';
  constructor(init: { ok: boolean; status: number; json: () => Promise<unknown> }) {
    this.ok = init.ok;
    this.status = init.status;
    this.json = init.json;
  }
  // minimal surface used by our code/tests
  json!: () => Promise<unknown>;
}

describe('api.client', () => {
  it('performs GET request and returns JSON', async () => {
    const data = [{ id: 1, title: 'hello' }];
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new MockedFetchResponse({ ok: true, status: 200, json: async () => data }) as Response,
      );

    const res = await api.get<typeof data>('/todos');
    expect(res).toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/todos',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
  });

  it('throws on non-2xx response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new MockedFetchResponse({ ok: false, status: 500, json: async () => ({}) }) as Response,
    );

    await expect(api.get('/todos')).rejects.toThrow('HTTP 500');
  });
});
