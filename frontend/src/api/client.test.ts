import { vi, expect, it, describe } from 'vitest';
import { api } from './client';

describe('api.client', () => {
  it('performs GET request and returns JSON', async () => {
    const data = [{ id: 1, title: 'hello' }];
    const fetchMock = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => data,
    } as any);

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
    vi.spyOn(globalThis, 'fetch' as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as any);

    await expect(api.get('/todos')).rejects.toThrow('HTTP 500');
  });
});
