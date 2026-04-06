import apiClient from './client';
import type { ApiListResponse, ApiResponse, Channel, CreateChannelPayload, UpdateChannelPayload, WorkspaceMessage } from '@/types';

export const chatApi = {
  list: async (workspaceSlug: string): Promise<WorkspaceMessage[]> => {
    const response = await apiClient.get<ApiListResponse<WorkspaceMessage>>(
      `/workspaces/${workspaceSlug}/messages`
    );
    return response.data.data;
  },

  send: async (
    workspaceSlug: string,
    body: string,
    replyToId?: number | null,
    attachment?: File | null
  ): Promise<WorkspaceMessage> => {
    const form = new FormData();
    if (body.trim()) form.append('body', body.trim());
    if (replyToId != null) form.append('reply_to_id', String(replyToId));
    if (attachment) form.append('attachment', attachment);

    const response = await apiClient.post<ApiResponse<WorkspaceMessage>>(
      `/workspaces/${workspaceSlug}/messages`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  },

  update: async (
    workspaceSlug: string,
    messageId: number,
    body: string
  ): Promise<WorkspaceMessage> => {
    const response = await apiClient.patch<ApiResponse<WorkspaceMessage>>(
      `/workspaces/${workspaceSlug}/messages/${messageId}`,
      { body }
    );
    return response.data.data;
  },

  delete: async (workspaceSlug: string, messageId: number): Promise<void> => {
    await apiClient.delete(`/workspaces/${workspaceSlug}/messages/${messageId}`);
  },

  listChannels: async (workspaceSlug: string): Promise<Channel[]> => {
    const response = await apiClient.get<ApiListResponse<Channel>>(
      `/workspaces/${workspaceSlug}/channels`
    );
    return response.data.data;
  },

  createChannel: async (workspaceSlug: string, payload: CreateChannelPayload): Promise<Channel> => {
    const response = await apiClient.post<ApiResponse<Channel>>(
      `/workspaces/${workspaceSlug}/channels`,
      payload
    );
    return response.data.data;
  },

  updateChannel: async (workspaceSlug: string, channelId: number, payload: UpdateChannelPayload): Promise<Channel> => {
    const response = await apiClient.patch<ApiResponse<Channel>>(
      `/workspaces/${workspaceSlug}/channels/${channelId}`,
      payload
    );
    return response.data.data;
  },

  deleteChannel: async (workspaceSlug: string, channelId: number): Promise<void> => {
    await apiClient.delete(`/workspaces/${workspaceSlug}/channels/${channelId}`);
  },

  listByChannel: async (channelId: number): Promise<WorkspaceMessage[]> => {
    const response = await apiClient.get<ApiListResponse<WorkspaceMessage>>(
      `/channels/${channelId}/messages`
    );
    return response.data.data;
  },

  sendToChannel: async (
    channelId: number,
    body: string,
    replyToId?: number | null,
    attachment?: File | null
  ): Promise<WorkspaceMessage> => {
    const form = new FormData();
    if (body.trim()) form.append('body', body.trim());
    if (replyToId != null) form.append('reply_to_id', String(replyToId));
    if (attachment) form.append('attachment', attachment);

    const response = await apiClient.post<ApiResponse<WorkspaceMessage>>(
      `/channels/${channelId}/messages`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  },

  updateInChannel: async (
    channelId: number,
    messageId: number,
    body: string
  ): Promise<WorkspaceMessage> => {
    const response = await apiClient.patch<ApiResponse<WorkspaceMessage>>(
      `/channels/${channelId}/messages/${messageId}`,
      { body }
    );
    return response.data.data;
  },

  deleteFromChannel: async (channelId: number, messageId: number): Promise<void> => {
    await apiClient.delete(`/channels/${channelId}/messages/${messageId}`);
  },
};
