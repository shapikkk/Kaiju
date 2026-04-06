import apiClient from './client';
import type { ApiListResponse, ApiResponse, Conversation, DirectMessage } from '@/types';

export interface ConversationAttachment {
  id: number;
  message_id?: number;
  url: string;
  name: string | null;
  type: string;
  created_at: string;
  user: { id: number; name: string; avatar_url: string | null };
}

export const dmApi = {
  listConversations: async (workspaceSlug: string): Promise<Conversation[]> => {
    const response = await apiClient.get<ApiListResponse<Conversation>>(
      `/workspaces/${workspaceSlug}/conversations`
    );
    return response.data.data;
  },

  findOrCreate: async (
    workspaceSlug: string,
    targetUserId: number
  ): Promise<{ id: number; other_user: Conversation['other_user'] }> => {
    const response = await apiClient.post<ApiResponse<{ id: number; other_user: Conversation['other_user'] }>>(
      `/workspaces/${workspaceSlug}/conversations`,
      { user_id: targetUserId }
    );
    return response.data.data;
  },

  listMessages: async (conversationId: number): Promise<DirectMessage[]> => {
    const response = await apiClient.get<ApiListResponse<DirectMessage>>(
      `/conversations/${conversationId}/messages`
    );
    return response.data.data;
  },

  markRead: async (conversationId: number): Promise<void> => {
    await apiClient.patch(`/conversations/${conversationId}/read`);
  },

  getAttachments: async (
    conversationId: number,
    type: 'all' | 'image' | 'video' | 'file' | 'audio' | 'voice' | 'link' | 'gif'
  ): Promise<ConversationAttachment[]> => {
    const response = await apiClient.get<ApiListResponse<ConversationAttachment>>(
      `/conversations/${conversationId}/attachments?type=${type}`
    );
    return response.data.data;
  },

  deleteConversation: async (conversationId: number): Promise<void> => {
    await apiClient.delete(`/conversations/${conversationId}`);
  },

  updateContactName: async (
    conversationId: number,
    payload: { local_name: string | null; local_note?: string | null }
  ): Promise<void> => {
    await apiClient.patch(`/conversations/${conversationId}/contact-name`, payload);
  },

  blockUser: async (userId: number): Promise<void> => {
    await apiClient.post(`/users/${userId}/block`);
  },

  unblockUser: async (userId: number): Promise<void> => {
    await apiClient.delete(`/users/${userId}/block`);
  },

  checkBlock: async (userId: number): Promise<boolean> => {
    const response = await apiClient.get<{ blocked: boolean }>(`/users/${userId}/block`);
    return response.data.blocked;
  },

  updateMessage: async (conversationId: number, messageId: number, body: string): Promise<DirectMessage> => {
    const response = await apiClient.patch<ApiResponse<DirectMessage>>(
      `/conversations/${conversationId}/messages/${messageId}`,
      { body }
    );
    return response.data.data;
  },

  deleteMessage: async (conversationId: number, messageId: number): Promise<void> => {
    await apiClient.delete(`/conversations/${conversationId}/messages/${messageId}`);
  },

  send: async (
    conversationId: number,
    body: string,
    replyToId?: number | null,
    attachment?: File | null
  ): Promise<DirectMessage> => {
    const form = new FormData();
    if (body.trim()) form.append('body', body.trim());
    if (replyToId != null) form.append('reply_to_id', String(replyToId));
    if (attachment) form.append('attachment', attachment);

    const response = await apiClient.post<ApiResponse<DirectMessage>>(
      `/conversations/${conversationId}/messages`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  },
};
