import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { epicsApi, tagsApi } from '../api/epics-tags';
import type { CreateEpicPayload, CreateTagPayload } from '@shared/types';

export function useEpics(workspaceSlug: string) {
  return useQuery({
    queryKey: ['epics', workspaceSlug],
    queryFn: () => epicsApi.list(workspaceSlug),
    enabled: !!workspaceSlug,
  });
}

export function useCreateEpic(workspaceSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEpicPayload) =>
      epicsApi.create(workspaceSlug, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['epics', workspaceSlug] });
    },
  });
}

export function useTags(workspaceSlug: string) {
  return useQuery({
    queryKey: ['tags', workspaceSlug],
    queryFn: () => tagsApi.list(workspaceSlug),
    enabled: !!workspaceSlug,
  });
}

export function useCreateTag(workspaceSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTagPayload) =>
      tagsApi.create(workspaceSlug, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags', workspaceSlug] });
    },
  });
}
