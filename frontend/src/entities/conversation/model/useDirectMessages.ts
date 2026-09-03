import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dmApi } from '../api/dm';
import { subscribeConversation, unsubscribeConversation } from '@processes/realtime';
import { useAuth } from '@shared/lib/auth/useAuth';
import type { Conversation, DirectMessage } from "@shared/types";

const EMPTY_MESSAGES: DirectMessage[] = [];
const EMPTY_CONVERSATIONS: Conversation[] = [];

export function useConversations(workspaceSlug: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['conversations', workspaceSlug];

  const query = useQuery({
    queryKey,
    queryFn: () => dmApi.listConversations(workspaceSlug!),
    enabled: !!workspaceSlug,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  const findOrCreateMutation = useMutation({
    mutationFn: (targetUserId: number) => dmApi.findOrCreate(workspaceSlug!, targetUserId),
    onSuccess: (newConv) => {
      queryClient.setQueryData<Conversation[]>(queryKey, (old) => {
        if (!old) return [];
        if (old.find((c) => c.id === newConv.id)) {
          queryClient.invalidateQueries({ queryKey });
          return old;
        }
        const partial: Conversation = {
          id: newConv.id,
          other_user: newConv.other_user,
          other_user_last_read_at: null,
          last_message: null,
          unread_count: 0,
          local_name: null,
          local_note: null,
        };
        queryClient.invalidateQueries({ queryKey });
        return [partial, ...old];
      });
    },
  });

  return {
    conversations: query.data ?? EMPTY_CONVERSATIONS,
    isLoading: query.isLoading,
    findOrCreate: (targetUserId: number) => findOrCreateMutation.mutateAsync(targetUserId),
    isFindingOrCreating: findOrCreateMutation.isPending,
  };
}

/**
 * DM messages hook — pure React Query consumer.
 * WebSocket subscription is managed by the singleton realtimeManager.
 */
export function useDirectMessages(conversationId: number | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const messagesQueryKey = ['dm-messages', conversationId];

  const messagesQuery = useQuery({
    queryKey: messagesQueryKey,
    queryFn: () => dmApi.listMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  // Subscribe to DM private channel via the singleton realtimeManager
  useEffect(() => {
    if (!conversationId || !user) return;
    subscribeConversation(conversationId, user.id, queryClient);
    return () => { unsubscribeConversation(conversationId); };
  }, [conversationId, user, queryClient]);

  const editMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: string }) =>
      dmApi.updateMessage(conversationId!, id, body),
    onSuccess: (updated) => {
      queryClient.setQueryData<DirectMessage[]>(messagesQueryKey, (old) =>
        old ? old.map((m) => (m.id === updated.id ? updated : m)) : [updated]
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => dmApi.deleteMessage(conversationId!, id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<DirectMessage[]>(messagesQueryKey, (old) =>
        old ? old.filter((m) => m.id !== id) : []
      );
    },
  });

  const sendMutation = useMutation({
    mutationFn: ({
      body, replyToId, attachment,
    }: { body: string; replyToId?: number | null; attachment?: File | null }) =>
      dmApi.send(conversationId!, body, replyToId, attachment),
    onMutate: async ({ body, attachment }) => {
      if (attachment || !user) return undefined;
      await queryClient.cancelQueries({ queryKey: messagesQueryKey });
      const prev = queryClient.getQueryData<DirectMessage[]>(messagesQueryKey);
      const tempId = -Date.now();
      const tempMsg: DirectMessage = {
        id: tempId,
        conversation_id: conversationId!,
        body,
        is_edited: false,
        reply_to_id: null,
        reply_to: null,
        attachment_url: null,
        attachment_name: null,
        attachment_type: null,
        created_at: new Date().toISOString(),
        user: { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url },
      };
      queryClient.setQueryData<DirectMessage[]>(messagesQueryKey, (old) => [...(old ?? []), tempMsg]);
      return { prev, tempId };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev !== undefined) {
        queryClient.setQueryData<DirectMessage[]>(messagesQueryKey, context.prev);
      }
    },
    onSuccess: (msg, _vars, context) => {
      queryClient.setQueryData<DirectMessage[]>(messagesQueryKey, (old) => {
        if (!old) return [msg];
        const filtered = context?.tempId !== undefined
          ? old.filter((m) => m.id !== context.tempId)
          : old;
        if (filtered.find((m) => m.id === msg.id)) return filtered;
        return [...filtered, msg];
      });

      // Patched locally rather than invalidated: the conversations endpoint is
      // the heaviest read in the app and we already hold everything that changed.
      queryClient.setQueriesData<Conversation[]>(
        { queryKey: ['conversations'], exact: false },
        (old) => {
          if (!old) return old;
          const updated = old.map((c) =>
            c.id === conversationId ? { ...c, last_message: msg } : c,
          );
          return [
            ...updated.filter((c) => c.id === conversationId),
            ...updated.filter((c) => c.id !== conversationId),
          ];
        },
      );
    },
  });

  const markRead = useCallback(() => {
    if (!conversationId) return;
    dmApi.markRead(conversationId).catch(() => {/* silent */});
  }, [conversationId]);

  // Destructured because `mutate` is stable while the mutation object is not.
  const { mutate: sendMutate } = sendMutation;
  const { mutate: editMutate } = editMutation;
  const { mutate: deleteMutate } = deleteMutation;

  const sendMessage = useCallback(
    (body: string, replyToId?: number | null, attachment?: File | null) =>
      sendMutate({ body, replyToId, attachment }),
    [sendMutate],
  );

  const editMessage = useCallback(
    (id: number, body: string) => editMutate({ id, body }),
    [editMutate],
  );

  const deleteMessage = useCallback(
    (id: number) => deleteMutate(id),
    [deleteMutate],
  );

  return {
    messages: messagesQuery.data ?? EMPTY_MESSAGES,
    isLoading: messagesQuery.isLoading,
    sendMessage,
    isSending: sendMutation.isPending,
    editMessage,
    deleteMessage,
    markRead,
  };
}
