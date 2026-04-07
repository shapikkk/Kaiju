import type { QueryClient } from '@tanstack/react-query';
import type { Conversation, DirectMessage } from '@shared/types';
import { dmApi } from '@entities/conversation';

/**
 * Attaches all DM event listeners to a Laravel Echo private channel.
 * Updates the React Query cache directly.
 */
export function dmSocketHandler(
  queryClient: QueryClient,
  conversationId: number,
  currentUserId: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  echoChannel: any,
): void {
  const msgKey = ['dm-messages', conversationId];

  echoChannel.listen('.dm.sent', (payload: DirectMessage) => {
    // Append message to local cache (deduplicated)
    queryClient.setQueryData<DirectMessage[]>(msgKey, (old) => {
      if (!old) return [payload];
      if (old.find((m) => m.id === payload.id)) return old;
      return [...old, payload];
    });

    if (payload.user.id !== currentUserId) {
      // Auto-mark read for the current viewer and refresh conversations list
      queryClient.setQueriesData<Conversation[]>(
        { queryKey: ['conversations'], exact: false },
        (old) =>
          old?.map((c) =>
            c.id === conversationId ? { ...c, unread_count: 0 } : c,
          ) ?? old,
      );
      dmApi
        .markRead(conversationId)
        .then(() =>
          queryClient.invalidateQueries({ queryKey: ['conversations'] }),
        )
        .catch(() =>
          queryClient.invalidateQueries({ queryKey: ['conversations'] }),
        );
    } else {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  echoChannel.listen(
    '.conversation.read',
    (payload: {
      conversation_id: number;
      read_by_user_id: number;
      read_at: string;
    }) => {
      // Update the other user's read receipt timestamp
      if (payload.read_by_user_id === currentUserId) return;

      queryClient.setQueriesData<Conversation[]>(
        { queryKey: ['conversations'], exact: false },
        (old) =>
          old?.map((c) =>
            c.id === payload.conversation_id
              ? { ...c, other_user_last_read_at: payload.read_at }
              : c,
          ) ?? old,
      );
    },
  );
}
