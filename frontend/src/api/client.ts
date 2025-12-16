import axios, {
  AxiosError,
  isAxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { tokenStore } from './tokenStore';

export const BASE_URL =
  import.meta.env.VITE_API_URL || import.meta.env.BACKEND_API || 'http://localhost:8000/api/v1';

type ApiRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
  skipAuth?: boolean;
};

const http = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

const refreshHttp = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await refreshHttp.post<{ access_token: string; token_type: string }>(
          '/auth/refresh',
          undefined,
          { headers: { 'X-Skip-Auth': '1' } },
        );
        tokenStore.setAccessToken(res.data.access_token);
        return res.data.access_token;
      } catch {
        tokenStore.clearAccessToken();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const cfg = config as InternalAxiosRequestConfig & ApiRequestConfig;
  const headers = cfg.headers as unknown as Record<string, unknown>;

  const skipAuth = cfg.skipAuth || headers['X-Skip-Auth'] === '1';
  if (skipAuth) return config;

  const token = tokenStore.getAccessToken();
  const hasAuthHeader = headers.Authorization || headers.authorization;

  if (token && !hasAuthHeader) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const cfg = (error.config ?? {}) as ApiRequestConfig;

    const url = typeof cfg.url === 'string' ? cfg.url : '';
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout');

    if (status === 401 && !cfg._retry && !isAuthEndpoint) {
      cfg._retry = true;
      const newToken = await refreshAccessToken();
      if (!newToken) {
        throw new Error('Authentication required');
      }
      cfg.headers = {
        ...(cfg.headers ?? {}),
        Authorization: `Bearer ${newToken}`,
      };
      return http.request(cfg);
    }

    throw error;
  },
);

async function request<T>(config: string | ApiRequestConfig): Promise<T> {
  try {
    const finalConfig: ApiRequestConfig =
      typeof config === 'string' ? { url: config, method: 'GET' } : config;

    const res: AxiosResponse<T> = await http.request<T>(finalConfig);
    return res.data;
  } catch (err) {
    if (isAxiosError(err)) {
      const status = err.response?.status;
      const data = err.response?.data as unknown;

      if (data && typeof data === 'object' && 'detail' in (data as Record<string, unknown>)) {
        const detail = (data as { detail?: unknown }).detail;
        if (typeof detail === 'string' && detail.trim().length > 0) throw new Error(detail);
      }

      if (status === 401) {
        throw new Error('Authentication required');
      }

      if (typeof data === 'string' && status) {
        throw new Error(`HTTP ${status}: ${data.substring(0, 100)}`);
      }

      if (status) throw new Error(`HTTP ${status}`);
    }

    throw err;
  }
}

export const api = {
  get: <T>(
    path: string,
    options?: {
      params?: Record<string, string | number>;
      headers?: AxiosRequestConfig['headers'];
      skipAuth?: boolean;
    },
  ) => {
    let url = path;
    if (options?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      url += `?${searchParams.toString()}`;
    }

    return request<T>({
      url,
      method: 'GET',
      headers: options?.headers,
      skipAuth: options?.skipAuth,
    });
  },

  post: <T>(
    path: string,
    data?: unknown,
    options?: {
      headers?: AxiosRequestConfig['headers'];
      skipAuth?: boolean;
    },
  ) => {
    return request<T>({
      url: path,
      method: 'POST',
      data,
      headers: options?.headers,
      skipAuth: options?.skipAuth,
    });
  },

  delete: <T>(
    path: string,
    options?: {
      headers?: AxiosRequestConfig['headers'];
      skipAuth?: boolean;
    },
  ) => {
    return request<T>({
      url: path,
      method: 'DELETE',
      headers: options?.headers,
      skipAuth: options?.skipAuth,
    });
  },
};
