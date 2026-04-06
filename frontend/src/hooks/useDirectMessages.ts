import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dmApi } from '@/api/dm';
import { createEchoInstance } from '@shared/lib/websocket/echo';
import { useAuth } from '@/hooks/useAuth';
import type { Conversation, DirectMessage } from "@shared/types";

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
    conversations: query.data ?? [] as Conversation[],
    isLoading: query.isLoading,
    findOrCreate: (targetUserId: number) => findOrCreateMutation.mutateAsync(targetUserId),
    isFindingOrCreating: findOrCreateMutation.isPending,
  };
}

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

  useEffect(() => {
    if (!conversationId || !user) return;

    const echo = createEchoInstance();
    const channel = echo.private(`conversation.${conversationId}`);

    channel.listen('.dm.sent', (payload: DirectMessage) => {
      queryClient.setQueryData<DirectMessage[]>(messagesQueryKey, (old) => {
        if (!old) return [payload];
        if (old.find((m) => m.id === payload.id)) return old;
        return [...old, payload];
      });

      if (payload.user.id !== user.id) {
        queryClient.setQueriesData<Conversation[]>(
          { queryKey: ['conversations'], exact: false },
          (old) =>
            old?.map((c) =>
              c.id === conversationId ? { ...c, unread_count: 0 } : c
            ) ?? old
        );
        dmApi.markRead(conversationId)
          .then(() => queryClient.invalidateQueries({ queryKey: ['conversations'] }))
          .catch(() => queryClient.invalidateQueries({ queryKey: ['conversations'] }));
      } else {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    });

    channel.listen('.conversation.read', (payload: {
      conversation_id: number;
      read_by_user_id: number;
      read_at: string;
    }) => {
      if (payload.read_by_user_id === user.id) return;

      queryClient.setQueriesData<Conversation[]>(
        { queryKey: ['conversations'], exact: false },
        (old) => old?.map((c) =>
          c.id === payload.conversation_id
            ? { ...c, other_user_last_read_at: payload.read_at }
            : c
        ) ?? old
      );

      queryClient.invalidateQueries({ queryKey: ['messages'] });
    });

    return () => {
      echo.leave(`conversation.${conversationId}`);
      echo.disconnect();
    };
  }, [conversationId, user]); // eslint-disable-line react-hooks/exhaustive-deps

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
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const markRead = () => {
    if (!conversationId) return;
    dmApi.markRead(conversationId).catch(() => {/* silent */});
  };

  return {
    messages: messagesQuery.data ?? [] as DirectMessage[],
    isLoading: messagesQuery.isLoading,
    sendMessage: (body: string, replyToId?: number | null, attachment?: File | null) =>
      sendMutation.mutate({ body, replyToId, attachment }),
    isSending: sendMutation.isPending,
    editMessage: (id: number, body: string) => editMutation.mutate({ id, body }),
    deleteMessage: (id: number) => deleteMutation.mutate(id),
    markRead,
  };
}
