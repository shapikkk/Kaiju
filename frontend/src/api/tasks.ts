import apiClient from './client';
import type {
  ApiListResponse,
  ApiResponse,
  CreateTaskPayload,
  MoveTaskPayload,
  Task,
  UpdateTaskPayload,
} from '@/types';

export const tasksApi = {
  list: async (boardId: number): Promise<Task[]> => {
    const { data } = await apiClient.get<ApiListResponse<Task>>(
      `/boards/${boardId}/tasks`,
    );
    return data.data;
  },

  get: async (taskId: number): Promise<Task> => {
    const { data } = await apiClient.get<ApiResponse<Task>>(
      `/tasks/${taskId}`,
    );
    return data.data;
  },

  create: async (
    boardId: number,
    payload: CreateTaskPayload,
  ): Promise<Task> => {
    const { data } = await apiClient.post<ApiResponse<Task>>(
      `/boards/${boardId}/tasks`,
      payload,
    );
    return data.data;
  },

  update: async (
    taskId: number,
    payload: UpdateTaskPayload,
  ): Promise<Task> => {
    const { data } = await apiClient.patch<ApiResponse<Task>>(
      `/tasks/${taskId}`,
      payload,
    );
    return data.data;
  },

  move: async (taskId: number, payload: MoveTaskPayload): Promise<Task> => {
    const { data } = await apiClient.patch<ApiResponse<Task>>(
      `/tasks/${taskId}/move`,
      payload,
    );
    return data.data;
  },

  destroy: async (taskId: number): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}`);
  },
};
