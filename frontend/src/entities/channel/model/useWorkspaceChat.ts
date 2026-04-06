import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@entities/channel/api/chat';
import { createEchoInstance } from '@shared/lib/websocket/echo';
import { useAuth } from '@entities/user/model/useAuth';
import type { WorkspaceMessage } from "@shared/types";
import type { OnlineMember } from './useChannelChat';

export function useWorkspaceChat(workspaceSlug: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([]);

  const queryKey = ['messages', workspaceSlug];

  const messagesQuery = useQuery({
    queryKey,
    queryFn: () => chatApi.list(workspaceSlug!),
    enabled: !!workspaceSlug,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  useEffect(() => {
    if (!workspaceSlug || !user) return;

    const echo = createEchoInstance();
    const channel = echo.join(`workspace.${workspaceSlug}`);

    channel
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
      echo.leave(`workspace.${workspaceSlug}`);
      echo.disconnect();
    };
  }, [workspaceSlug, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMutation = useMutation({
    mutationFn: ({
      body, replyToId, attachment,
    }: { body: string; replyToId?: number | null; attachment?: File | null }) =>
      chatApi.send(workspaceSlug!, body, replyToId, attachment),
    onSuccess: (msg) => {
      queryClient.setQueryData<WorkspaceMessage[]>(queryKey, (old) => {
        if (!old) return [msg];
        if (old.find((m) => m.id === msg.id)) return old;
        return [...old, msg];
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: string }) =>
      chatApi.update(workspaceSlug!, id, body),
    onSuccess: (updated) => {
      queryClient.setQueryData<WorkspaceMessage[]>(queryKey, (old) =>
        old ? old.map((m) => (m.id === updated.id ? updated : m)) : [updated]
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => chatApi.delete(workspaceSlug!, id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<WorkspaceMessage[]>(queryKey, (old) =>
        old ? old.filter((m) => m.id !== id) : []
      );
    },
  });

  return {
    messages: messagesQuery.data ?? [],
    isLoading: messagesQuery.isLoading,
    isError: messagesQuery.isError,
    onlineMembers,
    sendMessage: (body: string, replyToId?: number | null, attachment?: File | null) =>
      sendMutation.mutate({ body, replyToId, attachment }),
    isSending: sendMutation.isPending,
    editMessage: (id: number, body: string) => editMutation.mutate({ id, body }),
    isEditing: editMutation.isPending,
    deleteMessage: (id: number) => deleteMutation.mutate(id),
  };
}
