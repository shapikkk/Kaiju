import type { QueryClient } from '@tanstack/react-query';
import type { WorkspaceMessage } from '@shared/types';
import type { OnlineMember } from './channelSocketHandler';

/**
 * Attaches all message event listeners to a Laravel Echo presence channel
 * for the workspace-wide chat. Updates the React Query cache directly.
 */
export function workspaceSocketHandler(
  queryClient: QueryClient,
  workspaceSlug: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  echoChannel: any,
): void {
  const msgKey = ['messages', workspaceSlug];
  const onlineKey = ['workspace-online', workspaceSlug];

  echoChannel
    .here((members: OnlineMember[]) => {
      queryClient.setQueryData<OnlineMember[]>(onlineKey, members);
    })
    .joining((member: OnlineMember) => {
      queryClient.setQueryData<OnlineMember[]>(onlineKey, (old) => {
        if (!old) return [member];
        return old.find((m) => m.id === member.id) ? old : [...old, member];
      });
    })
    .leaving((member: OnlineMember) => {
      queryClient.setQueryData<OnlineMember[]>(onlineKey, (old) =>
        old ? old.filter((m) => m.id !== member.id) : [],
      );
    })
    .listen('.message.sent', (payload: WorkspaceMessage) => {
      queryClient.setQueryData<WorkspaceMessage[]>(msgKey, (old) => {
        if (!old) return [payload];
        if (old.find((m) => m.id === payload.id)) return old;
        return [...old, payload];
      });
    })
    .listen('.message.updated', (payload: WorkspaceMessage) => {
      queryClient.setQueryData<WorkspaceMessage[]>(msgKey, (old) =>
        old ? old.map((m) => (m.id === payload.id ? payload : m)) : [payload],
      );
    })
    .listen('.message.deleted', (payload: { id: number }) => {
      queryClient.setQueryData<WorkspaceMessage[]>(msgKey, (old) =>
        old ? old.filter((m) => m.id !== payload.id) : [],
      );
    });
}
