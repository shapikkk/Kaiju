import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/api/chat';
import { createEchoInstance } from '@shared/lib/websocket/echo';
import { useAuth } from '@/hooks/useAuth';
import type { Channel, CreateChannelPayload, UpdateChannelPayload, WorkspaceMessage } from "@shared/types";

export interface OnlineMember {
  id: number;
  name: string;
  avatar_url: string | null;
}

/** Fetch and list channels for a workspace. */
export function useChannels(workspaceSlug: string | undefined) {
  return useQuery<Channel[]>({
    queryKey: ['channels', workspaceSlug],
    queryFn: () => chatApi.listChannels(workspaceSlug!),
    enabled: !!workspaceSlug,
    staleTime: 30_000,
  });
}

/** Channel management: create / rename / delete. */
export function useChannelManagement(workspaceSlug: string | undefined) {
  const qc = useQueryClient();
  const queryKey = ['channels', workspaceSlug];

  const createMutation = useMutation({
    mutationFn: (payload: CreateChannelPayload) =>
      chatApi.createChannel(workspaceSlug!, payload),
    onSuccess: (channel) => {
      qc.setQueryData<Channel[]>(queryKey, (old) =>
        old ? [...old, channel] : [channel]
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateChannelPayload }) =>
      chatApi.updateChannel(workspaceSlug!, id, payload),
    onSuccess: (updated) => {
      qc.setQueryData<Channel[]>(queryKey, (old) =>
        old ? old.map((ch) => (ch.id === updated.id ? updated : ch)) : [updated]
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => chatApi.deleteChannel(workspaceSlug!, id),
    onSuccess: (_, id) => {
      qc.setQueryData<Channel[]>(queryKey, (old) =>
        old ? old.filter((ch) => ch.id !== id) : []
      );
    },
  });

  return {
    createChannel: (payload: CreateChannelPayload) => createMutation.mutateAsync(payload),
    isCreating: createMutation.isPending,
    updateChannel: (id: number, payload: UpdateChannelPayload) =>
      updateMutation.mutateAsync({ id, payload }),
    isUpdating: updateMutation.isPending,
    deleteChannel: (id: number) => deleteMutation.mutateAsync(id),
    isDeleting: deleteMutation.isPending,
  };
}

/** Real-time channel chat hook. Subscribes to `channel.{channelId}` presence channel. */
export function useChannelChat(channelId: number | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([]);

  const queryKey = ['channel-messages', channelId];

  const messagesQuery = useQuery({
    queryKey,
    queryFn: () => chatApi.listByChannel(channelId!),
    enabled: !!channelId,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  useEffect(() => {
    if (!channelId || !user) return;

    const echo = createEchoInstance();
    const ch = echo.join(`channel.${channelId}`);

    ch
      .here((members: OnlineMember[]) => setOnlineMembers(members))
      .joining((member: OnlineMember) => {
        setOnlineMembers((prev) =>
          prev.find((m) => m.id === member.id) ? prev : [...prev, member]
        );
      })
      .leaving((member: OnlineMember) => {
        setOnlineMembers((prev) => prev.filter((m) => m.id !== member.id));
      })
      .listen('.message.sent', (payload: WorkspaceMessage) => {
        queryClient.setQueryData<WorkspaceMessage[]>(queryKey, (old) => {
          if (!old) return [payload];
          if (old.find((m) => m.id === payload.id)) return old;
          return [...old, payload];
        });
      })
      .listen('.message.updated', (payload: WorkspaceMessage) => {
        queryClient.setQueryData<WorkspaceMessage[]>(queryKey, (old) =>
          old ? old.map((m) => (m.id === payload.id ? payload : m)) : [payload]
        );
      })
      .listen('.message.deleted', (payload: { id: number }) => {
        queryClient.setQueryData<WorkspaceMessage[]>(queryKey, (old) =>
          old ? old.filter((m) => m.id !== payload.id) : []
        );
      });

    return () => {
      echo.leave(`channel.${channelId}`);
      echo.disconnect();
    };
  }, [channelId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMutation = useMutation({
    mutationFn: ({
      body, replyToId, attachment,
    }: { body: string; replyToId?: number | null; attachment?: File | null }) =>
      chatApi.sendToChannel(channelId!, body, replyToId, attachment),
    onMutate: async ({ body, attachment }) => {
      if (attachment || !user) return undefined;
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<WorkspaceMessage[]>(queryKey);
      const tempId = -Date.now();
      const tempMsg: WorkspaceMessage = {
        id: tempId,
        channel_id: channelId!,
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
      queryClient.setQueryData<WorkspaceMessage[]>(queryKey, (old) => [...(old ?? []), tempMsg]);
      return { prev, tempId };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev !== undefined) {
        queryClient.setQueryData<WorkspaceMessage[]>(queryKey, context.prev);
      }
    },
    onSuccess: (msg, _vars, context) => {
      queryClient.setQueryData<WorkspaceMessage[]>(queryKey, (old) => {
        if (!old) return [msg];
        const filtered = context?.tempId !== undefined
          ? old.filter((m) => m.id !== context.tempId)
          : old;
        if (filtered.find((m) => m.id === msg.id)) return filtered;
        return [...filtered, msg];
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: string }) =>
      chatApi.updateInChannel(channelId!, id, body),
    onSuccess: (updated) => {
      queryClient.setQueryData<WorkspaceMessage[]>(queryKey, (old) =>
        old ? old.map((m) => (m.id === updated.id ? updated : m)) : [updated]
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => chatApi.deleteFromChannel(channelId!, id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<WorkspaceMessage[]>(queryKey, (old) =>
        old ? old.filter((m) => m.id !== id) : []
      );
    },
  });

  return {
    messages: messagesQuery.data ?? [] as WorkspaceMessage[],
    isLoading: messagesQuery.isLoading,
    isError: messagesQuery.isError,
    onlineMembers,
    sendMessage: (body: string, replyToId?: number | null, attachment?: File | null) =>
      sendMutation.mutate({ body, replyToId, attachment }),
    isSending: sendMutation.isPending,
    editMessage: (id: number, body: string) => editMutation.mutate({ id, body }),
    deleteMessage: (id: number) => deleteMutation.mutate(id),
  };
}
