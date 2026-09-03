import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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

export function useDeleteBoard(workspaceSlug: string) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (boardSlug: string) =>
      boardsApi.destroy(workspaceSlug, boardSlug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boards', workspaceSlug] });
      // The deleted board's route no longer resolves; fall back to the
      // workspace, which redirects to whichever board is left.
      navigate(`/${workspaceSlug}`, { replace: true });
    },
  });
}
