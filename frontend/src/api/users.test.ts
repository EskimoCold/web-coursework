import { describe, expect, it, vi, beforeEach } from 'vitest';

import { BASE_URL } from './client';
import { tokenStore } from './tokenStore';
import { usersApi } from './users';

vi.mock('./tokenStore', () => ({
  tokenStore: {
    getAccessToken: vi.fn(),
  },
}));

vi.mock('./client', () => ({
  BASE_URL: 'http://localhost:8000',
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('usersApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    (tokenStore.getAccessToken as ReturnType<typeof vi.fn>).mockReturnValue('test-token');
  });

  it('should export data', async () => {
    const mockBlob = new Blob(['test data'], { type: 'application/json' });

    mockFetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    const result = await usersApi.exportData();

    expect(mockFetch).toHaveBeenCalledWith(`${BASE_URL}/users/me/export`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer test-token',
      },
      credentials: 'include',
    });
    expect(result).toBe(mockBlob);
  });

  it('should throw error when no token for export', async () => {
    (tokenStore.getAccessToken as ReturnType<typeof vi.fn>).mockReturnValue(null);

    await expect(usersApi.exportData()).rejects.toThrow('No authentication token found');
  });

  it('should throw error when export fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ detail: 'Server error' }),
    });

    await expect(usersApi.exportData()).rejects.toThrow('Server error');
  });

  it('should import data', async () => {
    const mockFile = new File(['test'], 'test.json', { type: 'application/json' });
    const mockResponse = {
      message: 'Data imported successfully',
      imported_categories: 5,
      imported_transactions: 10,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await usersApi.importData(mockFile);

    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/users/me/import`,
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
        },
        credentials: 'include',
      }),
    );
    expect(result).toEqual(mockResponse);
  });

  it('should throw error when no token for import', async () => {
    (tokenStore.getAccessToken as ReturnType<typeof vi.fn>).mockReturnValue(null);
    const mockFile = new File(['test'], 'test.json');

    await expect(usersApi.importData(mockFile)).rejects.toThrow('No authentication token found');
  });

  it('should throw error when import fails', async () => {
    const mockFile = new File(['test'], 'test.json');
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ detail: 'Invalid file format' }),
    });

    await expect(usersApi.importData(mockFile)).rejects.toThrow('Invalid file format');
  });
});
