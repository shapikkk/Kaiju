import type { QueryClient } from '@tanstack/react-query';
import type { Conversation, DirectMessage } from '@shared/types';
// Not `dmApi` from @entities/conversation: that barrel also exports
// useDirectMessages, which imports @processes/realtime — an import cycle that
// Rollup splits across chunks and warns will break execution order.
import apiClient from '@shared/lib/api/client';

/** Coalesces the mark-read POST so a burst of messages sends one request. */
const pendingMarkRead = new Map<number, ReturnType<typeof setTimeout>>();

const MARK_READ_DEBOUNCE_MS = 800;

function scheduleMarkRead(conversationId: number): void {
  const existing = pendingMarkRead.get(conversationId);
  if (existing) clearTimeout(existing);

  pendingMarkRead.set(
    conversationId,
    setTimeout(() => {
      pendingMarkRead.delete(conversationId);
      apiClient
        .patch(`/conversations/${conversationId}/read`)
        .catch(() => {
          /* best-effort; the next open of the thread will mark it read */
        });
    }, MARK_READ_DEBOUNCE_MS),
  );
}

/** Apply locally what a refetch of the conversations list would have produced. */
function patchConversations(
  queryClient: QueryClient,
  conversationId: number,
  message: DirectMessage,
): void {
  queryClient.setQueriesData<Conversation[]>(
    { queryKey: ['conversations'], exact: false },
    (old) => {
      if (!old) return old;

      let seen = false;

      const next = old.map((c) => {
        if (c.id !== conversationId) return c;
        seen = true;
        // The viewer has this thread open, so anything arriving is read.
        return { ...c, last_message: message, unread_count: 0 };
      });

      // First message from someone new: not in cache, so refetch for that case.
      if (!seen) {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        return old;
      }

      // Mirror the endpoint's `order by updated_at desc`.
      const moved = next.filter((c) => c.id === conversationId);
      const rest = next.filter((c) => c.id !== conversationId);

      return [...moved, ...rest];
    },
  );
}

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

    const isFromMe = payload.user.id === currentUserId;

    patchConversations(queryClient, conversationId, payload);

    if (!isFromMe) {
      scheduleMarkRead(conversationId);
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
