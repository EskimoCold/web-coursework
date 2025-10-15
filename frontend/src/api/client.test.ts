import { vi, expect, it, describe } from 'vitest';

import { api } from './client';

type MockedFetchResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

describe('api.client', () => {
  it('performs GET request and returns JSON', async () => {
    const data = [{ id: 1, title: 'hello' }];
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => data,
      } as MockedFetchResponse);

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
    vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as MockedFetchResponse);

    await expect(api.get('/todos')).rejects.toThrow('HTTP 500');
  });
});
