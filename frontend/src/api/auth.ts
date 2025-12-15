import { api } from './client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  username: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PasswordChangeRequest {
  old_password: string;
  new_password: string;
}

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/login', data, {
      headers: { 'X-Skip-Auth': '1' },
      skipAuth: true,
    });
  },

  async register(data: RegisterRequest): Promise<User> {
    return api.post<User>('/auth/register', data, {
      headers: { 'X-Skip-Auth': '1' },
      skipAuth: true,
    });
  },

  async getCurrentUser(token: string): Promise<User> {
    return api.get<User>('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async changePassword(data: PasswordChangeRequest, token: string): Promise<void> {
    await api.post<void>('/users/me/password', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async refreshToken(): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/refresh', undefined, {
      headers: { 'X-Skip-Auth': '1' },
      skipAuth: true,
    });
  },

  async logout(): Promise<void> {
    await api.post<void>('/auth/logout', undefined, {
      headers: { 'X-Skip-Auth': '1' },
      skipAuth: true,
    });
  },

  async deleteAccount(accessToken: string): Promise<void> {
    await api.delete<void>('/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },

  async changePassword(
    data: { old_password: string; new_password: string },
    accessToken: string,
  ): Promise<void> {
    const response = await fetch(`${API_URL}/users/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to change password');
    }
  },
};
