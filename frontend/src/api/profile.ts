import apiClient from './client';
import type { User, UpdateProfilePayload } from '@/types';

interface ProfileResponse {
  message: string;
  user: User;
}

export const profileApi = {
  /** Fetch public profile of any user by ID. */
  getUser: async (userId: number): Promise<ProfileResponse> => {
    const { data } = await apiClient.get(`/users/${userId}`);
    return data;
  },

  /** Update authenticated user's name and/or email. */
  update: async (payload: {
    name?: string;
    email?: string;
  }): Promise<ProfileResponse> => {
    const { data } = await apiClient.patch('/profile', payload);
    return data;
  },

  /** Update authenticated user's profile fields (bio, skills, experience, etc.). */
  updateProfile: async (payload: UpdateProfilePayload): Promise<ProfileResponse> => {
    const { data } = await apiClient.patch('/user/profile', payload);
    return data;
  },

  /** Update authenticated user's password. */
  updatePassword: async (payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string }> => {
    const { data } = await apiClient.patch('/profile/password', payload);
    return data;
  },

  /** Upload a new avatar image. */
  uploadAvatar: async (file: File): Promise<ProfileResponse> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await apiClient.post('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /** Upload a new banner image. */
  uploadBanner: async (file: File): Promise<ProfileResponse> => {
    const formData = new FormData();
    formData.append('banner', file);
    const { data } = await apiClient.post('/user/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /** Update notification preferences. */
  updateNotificationPreferences: async (prefs: {
    email?: boolean;
    push?: boolean;
    assigned?: boolean;
    comments?: boolean;
    due_date?: boolean;
  }): Promise<ProfileResponse> => {
    const { data } = await apiClient.patch('/profile/notifications', prefs);
    return data;
  },
};

