// src/api/client.ts
const BASE_URL = '/api';

// Функция для получения токена (нужно будет реализовать)
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init?.headers || {}),
  };

  // Добавляем Authorization header если есть токен
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...init,
    headers,
  });

  if (res.status === 401) {
    // Ошибка авторизации - нужно логиниться
    console.error('❌ Authentication required');
    throw new Error('Authentication required');
  }

  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ API Error:', errorText);
    throw new Error(`HTTP ${res.status}: ${errorText.substring(0, 100)}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
};
