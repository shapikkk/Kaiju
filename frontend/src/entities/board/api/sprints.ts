import apiClient from '@shared/lib/api/client';
import type {
  ApiListResponse,
  ApiResponse,
  CreateSprintPayload,
  Sprint,
  UpdateSprintPayload,
} from "@shared/types";

export const sprintsApi = {
  list: async (boardId: number): Promise<Sprint[]> => {
    const { data } = await apiClient.get<ApiListResponse<Sprint>>(
      `/boards/${boardId}/sprints`,
    );
    return data.data;
  },

  create: async (
    boardId: number,
    payload: CreateSprintPayload,
  ): Promise<Sprint> => {
    const { data } = await apiClient.post<ApiResponse<Sprint>>(
      `/boards/${boardId}/sprints`,
      payload,
    );
    return data.data;
  },

  update: async (
    sprintId: number,
    payload: UpdateSprintPayload,
  ): Promise<Sprint> => {
    const { data } = await apiClient.patch<ApiResponse<Sprint>>(
      `/sprints/${sprintId}`,
      payload,
    );
    return data.data;
  },
};
