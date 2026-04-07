import apiClient from '@shared/lib/api/client';
import type { User } from '@shared/types';

/** Low-level auth API — shared concern, lives in shared/lib/auth */
export const authApi = {
  register: async (payload: { name: string; email: string; password: string; password_confirmation: string }) => {
    const { data } = await apiClient.post<{ token: string; message: string; user: User }>(
      '/auth/register',
      payload,
    );
    localStorage.setItem('auth_token', data.token);
    return data;
  },

  login: async (payload: { email: string; password: string }) => {
    const { data } = await apiClient.post<{ token: string; message: string; user: User }>(
      '/auth/login',
      payload,
    );
    localStorage.setItem('auth_token', data.token);
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('auth_token');
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get<{ data: User }>('/auth/me');
    return data.data;
  },
};
