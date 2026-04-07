import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sprintsApi } from '../api/sprints';
import type { CreateSprintPayload } from '@shared/types';

export function useSprints(boardId: number) {
  return useQuery({
    queryKey: ['sprints', boardId],
    queryFn: () => sprintsApi.list(boardId),
    enabled: !!boardId,
  });
}

export function useCreateSprint(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSprintPayload) =>
      sprintsApi.create(boardId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints', boardId] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}
