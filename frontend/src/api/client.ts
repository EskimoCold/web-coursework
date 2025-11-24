// src/api/client.ts
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Определите интерфейс для данных, которые могут быть отправлены в API
interface ApiData {
  [key: string]: unknown;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Добавляем Authorization header если есть токен
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...init,
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

  // Для статуса 204 No Content возвращаем undefined
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, data?: ApiData, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'POST', body: JSON.stringify(data) }),

  put: <T>(path: string, data?: ApiData, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'PUT', body: JSON.stringify(data) }),

  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'DELETE' }),

  patch: <T>(path: string, data?: ApiData, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(data) }),
};
