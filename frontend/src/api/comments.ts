import apiClient from './client';
import type {
  ApiListResponse,
  ApiResponse,
  Comment,
  CreateCommentPayload,
} from '@/types';

export const commentsApi = {
  list: async (taskId: number): Promise<Comment[]> => {
    const { data } = await apiClient.get<ApiListResponse<Comment>>(
      `/tasks/${taskId}/comments`,
    );
    return data.data;
  },

  create: async (
    taskId: number,
    payload: CreateCommentPayload,
  ): Promise<Comment> => {
    const { data } = await apiClient.post<ApiResponse<Comment>>(
      `/tasks/${taskId}/comments`,
      payload,
    );
    return data.data;
  },

  update: async (
    commentId: number,
    payload: CreateCommentPayload,
  ): Promise<Comment> => {
    const { data } = await apiClient.patch<ApiResponse<Comment>>(
      `/comments/${commentId}`,
      payload,
    );
    return data.data;
  },

  destroy: async (commentId: number): Promise<void> => {
    await apiClient.delete(`/comments/${commentId}`);
  },
};
