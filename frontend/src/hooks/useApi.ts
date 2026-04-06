import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { boardsApi } from '@/api/boards';
import { tasksApi } from '@/api/tasks';
import { workspacesApi } from '@/api/workspaces';
import { invitesApi } from '@/api/invites';
import { membersApi } from '@/api/members';
import { verificationApi } from '@/api/verification';
import { profileApi } from '@/api/profile';
import { columnsApi } from '@/api/columns';
import { commentsApi } from '@/api/comments';
import { attachmentsApi } from '@/api/attachments';
import { epicsApi, tagsApi } from '@/api/epics-tags';
import { sprintsApi } from '@/api/sprints';
import { searchApi } from '@/api/search';
import type {
  CreateBoardPayload,
  CreateCommentPayload,
  CreateEpicPayload,
  CreateSprintPayload,
  CreateTagPayload,
  CreateTaskPayload,
  CreateWorkspacePayload,
  MoveTaskPayload,
  SearchResults,
  UpdateProfilePayload,
  UpdateTaskPayload,
} from "@shared/types";

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

export function useWorkspaceMembers(workspaceSlug: string) {
  return useQuery({
    queryKey: ['members', workspaceSlug],
    queryFn: () => membersApi.list(workspaceSlug),
    enabled: !!workspaceSlug,
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

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (params: { id: string; hash: string; expires: string; signature: string }) =>
      verificationApi.verify(params),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: () => verificationApi.resend(),
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (payload: { name?: string; email?: string }) =>
      profileApi.update(payload),
  });
}

export function useUpdateProfileDetails() {
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      profileApi.updateProfile(payload),
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (payload: { current_password: string; password: string; password_confirmation: string }) =>
      profileApi.updatePassword(payload),
  });
}

export function useUploadAvatar() {
  return useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: {
      email?: boolean;
      push?: boolean;
      assigned?: boolean;
      comments?: boolean;
      due_date?: boolean;
    }) => profileApi.updateNotificationPreferences(prefs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useWorkspaceSearch(slug: string, query: string) {
  return useQuery<SearchResults>({
    queryKey: ['search', slug, query],
    queryFn: () => searchApi.workspace(slug, query),
    enabled: !!slug && query.length >= 2,
    staleTime: 30_000,
    placeholderData: { tasks: [], boards: [], users: [] },
  });
}

export function useBoards(workspaceSlug: string) {
  return useQuery({
    queryKey: ['boards', workspaceSlug],
    queryFn: () => boardsApi.list(workspaceSlug),
    enabled: !!workspaceSlug,
  });
}

export function useBoard(workspaceSlug: string, boardSlug: string) {
  return useQuery({
    queryKey: ['board', workspaceSlug, boardSlug],
    queryFn: () => boardsApi.get(workspaceSlug, boardSlug),
    enabled: !!workspaceSlug && !!boardSlug,
  });
}

export function useCreateBoard(workspaceSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBoardPayload) =>
      boardsApi.create(workspaceSlug, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['boards', workspaceSlug] }),
  });
}

export function useTasks(boardId: number) {
  return useQuery({
    queryKey: ['tasks', boardId],
    queryFn: () => tasksApi.list(boardId),
    enabled: !!boardId,
  });
}

export function useTask(taskId: number | null) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksApi.get(taskId!),
    enabled: taskId !== null,
  });
}

export function useCreateTask(
  boardId: number,
  workspaceSlug: string,
  boardSlug: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) =>
      tasksApi.create(boardId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board', workspaceSlug, boardSlug] });
    },
  });
}

export function useUpdateTask(boardQueryKey: unknown[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: number;
      payload: UpdateTaskPayload;
    }) => tasksApi.update(taskId, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['task', variables.taskId] });
      qc.invalidateQueries({ queryKey: boardQueryKey });
    },
  });
}

export function useMoveTask(boardQueryKey: unknown[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: number;
      payload: MoveTaskPayload;
    }) => tasksApi.move(taskId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardQueryKey });
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: boardQueryKey });
    },
  });
}

export function useDeleteTask(boardQueryKey: unknown[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: number) => tasksApi.destroy(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardQueryKey });
    },
  });
}

export function useReorderColumns(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: number[]) =>
      columnsApi.reorder(boardId, orderedIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board'] }),
  });
}

export function useComments(taskId: number) {
  return useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentsApi.list(taskId),
    enabled: !!taskId,
  });
}

export function useCreateComment(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCommentPayload) =>
      commentsApi.create(taskId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useAttachments(taskId: number) {
  return useQuery({
    queryKey: ['attachments', taskId],
    queryFn: () => attachmentsApi.list(taskId),
    enabled: !!taskId,
  });
}

export function useUploadAttachment(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => attachmentsApi.upload(taskId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments', taskId] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });
}

export function useDeleteAttachment(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: number) =>
      attachmentsApi.destroy(attachmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments', taskId] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });
}

export function useUpdateComment(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: number; body: string }) =>
      commentsApi.update(commentId, { body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });
}

export function useDeleteComment(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => commentsApi.destroy(commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
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

export function useSprints(boardId: number) {
  return useQuery({
    queryKey: ['sprints', boardId],
    queryFn: () => sprintsApi.list(boardId),
    enabled: !!boardId,
  });
}

export function useCreateSprint(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSprintPayload) =>
      sprintsApi.create(boardId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints', boardId] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}
