import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chat';

import type { WorkspaceMessage } from "@shared/types";
import type { OnlineMember } from './useChannelChat';

/**
 * Workspace-wide chat hook — pure React Query consumer.
 * WebSocket subscription is managed by the singleton realtimeManager.
 */
export function useWorkspaceChat(workspaceSlug: string | undefined) {
  const queryClient = useQueryClient();


  const queryKey = ['messages', workspaceSlug];

  const messagesQuery = useQuery({
    queryKey,
    queryFn: () => chatApi.list(workspaceSlug!),
    enabled: !!workspaceSlug,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  // Online members are seeded by the widget-layer WebSocket subscription
  const { data: onlineMembers = [] } = useQuery<OnlineMember[]>({
    queryKey: ['workspace-online', workspaceSlug],
    queryFn: () => [],
    enabled: !!workspaceSlug,
    staleTime: Infinity,
  });

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
