// src/api/client.ts
import { tokenStore } from './tokenStore';

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const token = tokenStore.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      ...headers,
      ...(init?.headers || {}),
    },
  });

  if (res.status === 401) {
    // Ошибка авторизации - нужно логиниться
    throw new Error('Authentication required');
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText.substring(0, 100)}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
};
