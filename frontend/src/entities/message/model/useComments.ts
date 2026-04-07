import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsApi } from '../api/comments';
import type { CreateCommentPayload } from '@shared/types';

export function useComments(taskId: number) {
  return useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentsApi.list(taskId),
    enabled: !!taskId,
  });
}

export function useCreateComment(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCommentPayload) =>
      commentsApi.create(taskId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useUpdateComment(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: number; body: string }) =>
      commentsApi.update(commentId, { body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });
}

export function useDeleteComment(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => commentsApi.destroy(commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });
}
