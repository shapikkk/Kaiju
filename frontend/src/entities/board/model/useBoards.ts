import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardsApi } from '../api/boards';
import type { CreateBoardPayload } from '@shared/types';

export function useBoards(workspaceSlug: string) {
  return useQuery({
    queryKey: ['boards', workspaceSlug],
    queryFn: () => boardsApi.list(workspaceSlug),
    enabled: !!workspaceSlug,
  });
}

export function useBoard(workspaceSlug: string, boardSlug: string) {
  return useQuery({
    queryKey: ['board', workspaceSlug, boardSlug],
    queryFn: () => boardsApi.get(workspaceSlug, boardSlug),
    enabled: !!workspaceSlug && !!boardSlug,
  });
}

export function useCreateBoard(workspaceSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBoardPayload) =>
      boardsApi.create(workspaceSlug, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['boards', workspaceSlug] }),
  });
}
