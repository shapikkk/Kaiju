import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks';
import type { CreateTaskPayload, MoveTaskPayload, UpdateTaskPayload } from '@shared/types';

export function useTasks(boardId: number) {
  return useQuery({
    queryKey: ['tasks', boardId],
    queryFn: () => tasksApi.list(boardId),
    enabled: !!boardId,
  });
}

export function useTask(taskId: number | null) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksApi.get(taskId!),
    enabled: taskId !== null,
  });
}

export function useCreateTask(
  boardId: number,
  workspaceSlug: string,
  boardSlug: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) =>
      tasksApi.create(boardId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board', workspaceSlug, boardSlug] });
    },
  });
}

export function useUpdateTask(boardQueryKey: unknown[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: number;
      payload: UpdateTaskPayload;
    }) => tasksApi.update(taskId, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['task', variables.taskId] });
      qc.invalidateQueries({ queryKey: boardQueryKey });
    },
  });
}

/**
 * No onSuccess by design: KanbanBoard already applies the move to the board
 * cache optimistically, so refetching would only discard that work and re-pull
 * the full board once per drag. On error we resync.
 */
export function useMoveTask(boardQueryKey: unknown[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: number;
      payload: MoveTaskPayload;
    }) => tasksApi.move(taskId, payload),
    onError: () => {
      qc.invalidateQueries({ queryKey: boardQueryKey });
    },
  });
}

export function useDeleteTask(boardQueryKey: unknown[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: number) => tasksApi.destroy(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardQueryKey });
    },
  });
}
