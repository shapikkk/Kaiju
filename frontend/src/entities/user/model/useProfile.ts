import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../api/profile';
import type { UpdateProfilePayload } from '@shared/types';

export const profileKeys = {
  all: ['profile'] as const,
  user: (userId: number) => ['profile', 'user', userId] as const,
};

/** Fetch the public profile of any user by ID. */
export function useUserProfile(userId: number) {
  return useQuery({
    queryKey: profileKeys.user(userId),
    queryFn: () => profileApi.getUser(userId),
    enabled: !!userId,
    select: (data) => data.user,
  });
}

/** Update authenticated user's name/email (basic fields). */
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name?: string; email?: string }) =>
      profileApi.update(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

/** Update authenticated user's extended profile fields (bio, job_title, etc.). */
export function useUpdateProfileDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      profileApi.updateProfile(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: profileKeys.user(data.user.id) });
      qc.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

/** Update authenticated user's password. */
export function useUpdatePassword() {
  return useMutation({
    mutationFn: (payload: { current_password: string; password: string; password_confirmation: string }) =>
      profileApi.updatePassword(payload),
  });
}

/** Upload a new avatar image. */
export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: profileKeys.user(data.user.id) });
      qc.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

/** Upload a new banner image. */
export function useUploadBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => profileApi.uploadBanner(file),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: profileKeys.user(data.user.id) });
      qc.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

/** Update notification preferences. */
export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: {
      email?: boolean;
      push?: boolean;
      assigned?: boolean;
      comments?: boolean;
      due_date?: boolean;
    }) => profileApi.updateNotificationPreferences(prefs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
