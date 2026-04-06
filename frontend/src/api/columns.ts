import apiClient from '@shared/lib/api/client';
import type {
  ApiListResponse,
  ApiResponse,
  Column,
  CreateColumnPayload,
} from "@shared/types";

export const columnsApi = {
  list: async (boardId: number): Promise<Column[]> => {
    const { data } = await apiClient.get<ApiListResponse<Column>>(
      `/boards/${boardId}/columns`,
    );
    return data.data;
  },

  create: async (
    boardId: number,
    payload: CreateColumnPayload,
  ): Promise<Column> => {
    const { data } = await apiClient.post<ApiResponse<Column>>(
      `/boards/${boardId}/columns`,
      payload,
    );
    return data.data;
  },

  update: async (
    columnId: number,
    payload: Partial<CreateColumnPayload>,
  ): Promise<Column> => {
    const { data } = await apiClient.patch<ApiResponse<Column>>(
      `/columns/${columnId}`,
      payload,
    );
    return data.data;
  },

  reorder: async (
    boardId: number,
    orderedIds: number[],
  ): Promise<void> => {
    await apiClient.patch(`/boards/${boardId}/columns/reorder`, {
      ordered_ids: orderedIds,
    });
  },
};
