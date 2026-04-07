import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attachmentsApi } from '../api/attachments';

export function useAttachments(taskId: number) {
  return useQuery({
    queryKey: ['attachments', taskId],
    queryFn: () => attachmentsApi.list(taskId),
    enabled: !!taskId,
  });
}

export function useUploadAttachment(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => attachmentsApi.upload(taskId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments', taskId] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });
}

export function useDeleteAttachment(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: number) =>
      attachmentsApi.destroy(attachmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments', taskId] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });
}
