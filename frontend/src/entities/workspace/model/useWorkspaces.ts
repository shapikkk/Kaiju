import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { workspacesApi } from '../api/workspaces';
import type { CreateWorkspacePayload } from '@shared/types';

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: workspacesApi.list,
  });
}

export function useWorkspace(slug: string) {
  return useQuery({
    queryKey: ['workspaces', slug],
    queryFn: () => workspacesApi.get(slug),
    enabled: !!slug,
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWorkspacePayload) =>
      workspacesApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  });
}

export function useUpdateWorkspace(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreateWorkspacePayload>) =>
      workspacesApi.update(slug, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      qc.invalidateQueries({ queryKey: ['workspaces', slug] });
    },
  });
}

export function useDeleteWorkspace() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (slug: string) => workspacesApi.delete(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      navigate('/');
    },
  });
}

export function useLeaveWorkspace() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (slug: string) => workspacesApi.leave(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      navigate('/', { replace: true });
    },
  });
}

export function useSendInvite(workspaceSlug: string) {
  return useMutation({
    mutationFn: (payload: { invites: { email: string; role: string }[] }) =>
      workspacesApi.sendInvite(workspaceSlug, payload),
  });
}

export function useGenerateInviteLink(workspaceSlug: string) {
  return useMutation({
    mutationFn: () => workspacesApi.generateInviteLink(workspaceSlug),
  });
}
