import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '../api/members';

export function useWorkspaceMembers(workspaceSlug: string | undefined) {
  return useQuery({
    queryKey: ['members', workspaceSlug],
    queryFn: () => membersApi.list(workspaceSlug!),
    enabled: !!workspaceSlug,
    staleTime: 60_000,
  });
}

export function useUpdateMemberRole(workspaceSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      membersApi.updateRole(workspaceSlug, userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members', workspaceSlug] });
    },
  });
}

export function useRemoveMember(workspaceSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) =>
      membersApi.remove(workspaceSlug, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members', workspaceSlug] });
    },
  });
}
