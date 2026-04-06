import apiClient from '@shared/lib/api/client';
import type {
  ApiListResponse,
  ApiResponse,
  Board,
  CreateBoardPayload,
} from "@shared/types";

export const boardsApi = {
  list: async (workspaceSlug: string): Promise<Board[]> => {
    const { data } = await apiClient.get<ApiListResponse<Board>>(
      `/workspaces/${workspaceSlug}/boards`,
    );
    return data.data;
  },

  get: async (workspaceSlug: string, boardSlug: string): Promise<Board> => {
    const { data } = await apiClient.get<ApiResponse<Board>>(
      `/workspaces/${workspaceSlug}/boards/${boardSlug}`,
    );
    return data.data;
  },

  create: async (
    workspaceSlug: string,
    payload: CreateBoardPayload,
  ): Promise<Board> => {
    const { data } = await apiClient.post<ApiResponse<Board>>(
      `/workspaces/${workspaceSlug}/boards`,
      payload,
    );
    return data.data;
  },

  update: async (
    boardId: number,
    payload: Partial<CreateBoardPayload>,
  ): Promise<Board> => {
    const { data } = await apiClient.patch<ApiResponse<Board>>(
      `/boards/${boardId}`,
      payload,
    );
    return data.data;
  },

  destroy: async (
    workspaceSlug: string,
    boardSlug: string,
  ): Promise<void> => {
    await apiClient.delete(
      `/workspaces/${workspaceSlug}/boards/${boardSlug}`,
    );
  },
};
