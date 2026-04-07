import { useQueryClient, useMutation } from '@tanstack/react-query';
import { dmApi } from '../api/dm';
import type { Conversation } from '@shared/types';

/**
 * Mutation that marks a DM conversation as read and updates the unread
 * count optimistically in the conversations list cache.
 * Extracted from the inline hook in chat-page.tsx.
 */
export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (convId: number) => dmApi.markRead(convId),
    onSuccess: (_, convId) => {
      qc.setQueriesData<Conversation[]>(
        { queryKey: ['conversations'], exact: false },
        (old) => old?.map((c) => c.id === convId ? { ...c, unread_count: 0 } : c) ?? old
      );
    },
  });
}
