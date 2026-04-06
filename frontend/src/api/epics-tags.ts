import apiClient from './client';
import type {
  ApiListResponse,
  ApiResponse,
  CreateEpicPayload,
  CreateTagPayload,
  Epic,
  Tag,
} from '@/types';

export const epicsApi = {
  list: async (workspaceSlug: string): Promise<Epic[]> => {
    const { data } = await apiClient.get<ApiListResponse<Epic>>(
      `/workspaces/${workspaceSlug}/epics`,
    );
    return data.data;
  },

  create: async (
    workspaceSlug: string,
    payload: CreateEpicPayload,
  ): Promise<Epic> => {
    const { data } = await apiClient.post<ApiResponse<Epic>>(
      `/workspaces/${workspaceSlug}/epics`,
      payload,
    );
    return data.data;
  },

  update: async (
    epicId: number,
    payload: Partial<CreateEpicPayload>,
  ): Promise<Epic> => {
    const { data } = await apiClient.patch<ApiResponse<Epic>>(
      `/epics/${epicId}`,
      payload,
    );
    return data.data;
  },

  destroy: async (epicId: number): Promise<void> => {
    await apiClient.delete(`/epics/${epicId}`);
  },
};

export const tagsApi = {
  list: async (workspaceSlug: string): Promise<Tag[]> => {
    const { data } = await apiClient.get<ApiListResponse<Tag>>(
      `/workspaces/${workspaceSlug}/tags`,
    );
    return data.data;
  },

  create: async (
    workspaceSlug: string,
    payload: CreateTagPayload,
  ): Promise<Tag> => {
    const { data } = await apiClient.post<ApiResponse<Tag>>(
      `/workspaces/${workspaceSlug}/tags`,
      payload,
    );
    return data.data;
  },

  update: async (
    tagId: number,
    payload: Partial<CreateTagPayload>,
  ): Promise<Tag> => {
    const { data } = await apiClient.patch<ApiResponse<Tag>>(
      `/tags/${tagId}`,
      payload,
    );
    return data.data;
  },

  destroy: async (tagId: number): Promise<void> => {
    await apiClient.delete(`/tags/${tagId}`);
  },
};
