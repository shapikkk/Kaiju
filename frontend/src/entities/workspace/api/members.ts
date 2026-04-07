import apiClient from '@shared/lib/api/client';
import type { ApiListResponse, WorkspaceMember } from '@shared/types';

export const membersApi = {
  list: async (slug: string): Promise<WorkspaceMember[]> => {
    const { data } = await apiClient.get<ApiListResponse<WorkspaceMember>>(
      `/workspaces/${slug}/members`,
    );
    return data.data;
  },

  updateRole: async (
    slug: string,
    userId: number,
    role: string,
  ): Promise<void> => {
    await apiClient.patch(`/workspaces/${slug}/members/${userId}`, { role });
  },

  remove: async (slug: string, userId: number): Promise<void> => {
    await apiClient.delete(`/workspaces/${slug}/members/${userId}`);
  },
};
