import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invitesApi } from '../api/invites';

export function useAcceptInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => invitesApi.accept(token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useAcceptInviteLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => invitesApi.acceptLink(token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
