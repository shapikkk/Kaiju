import apiClient from './client';
import type { ApiListResponse, ApiResponse, Attachment } from '@/types';

export const attachmentsApi = {
  list: async (taskId: number): Promise<Attachment[]> => {
    const { data } = await apiClient.get<ApiListResponse<Attachment>>(
      `/tasks/${taskId}/attachments`,
    );
    return data.data;
  },

  upload: async (taskId: number, file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post<ApiResponse<Attachment>>(
      `/tasks/${taskId}/attachments`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return data.data;
  },

  destroy: async (attachmentId: number): Promise<void> => {
    await apiClient.delete(`/attachments/${attachmentId}`);
  },
};
