import apiClient from '@shared/lib/api/client';
import type {
  ApiListResponse,
  ApiResponse,
  CreateWorkspacePayload,
  Workspace,
} from "@shared/types";

export const workspacesApi = {
  list: async (): Promise<Workspace[]> => {
    const { data } = await apiClient.get<ApiListResponse<Workspace>>(
      '/workspaces',
    );
    return data.data;
  },

  get: async (slug: string): Promise<Workspace> => {
    const { data } = await apiClient.get<ApiResponse<Workspace>>(
      `/workspaces/${slug}`,
    );
    return data.data;
  },

  create: async (payload: CreateWorkspacePayload): Promise<Workspace> => {
    const { data } = await apiClient.post<ApiResponse<Workspace>>(
      '/workspaces',
      payload,
    );
    return data.data;
  },

  update: async (
    slug: string,
    payload: Partial<CreateWorkspacePayload>,
  ): Promise<Workspace> => {
    const { data } = await apiClient.patch<ApiResponse<Workspace>>(
      `/workspaces/${slug}`,
      payload,
    );
    return data.data;
  },

  sendInvite: async (
    slug: string,
    payload: { invites: { email: string; role: string }[] },
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.post(
      `/workspaces/${slug}/invites`,
      payload,
    );
    return data;
  },

  generateInviteLink: async (
    slug: string,
  ): Promise<{ url: string }> => {
    const { data } = await apiClient.post(
      `/workspaces/${slug}/invite-links`
    );
    return data;
  },

  delete: async (slug: string): Promise<void> => {
    await apiClient.delete(`/workspaces/${slug}`);
  },
};
