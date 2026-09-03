import { useMemo } from 'react';
import { useWorkspaceMembers } from './useWorkspaceMembers';
import { useAuth } from '@shared/lib/auth/useAuth';
import type { WorkspaceRole } from '@shared/types';

interface WorkspaceRoleState {
  role: WorkspaceRole | null;
  isOwner: boolean;
  isAdmin: boolean;
  /** Owners and admins may invite, manage members and delete boards. */
  canManage: boolean;
  isLoading: boolean;
}

/**
 * The signed-in user's role in a workspace.
 *
 * Server-side checks are the real gate; this only decides whether to show a
 * control, so a member is not offered an action that will 403.
 */
export function useWorkspaceRole(workspaceSlug: string | undefined): WorkspaceRoleState {
  const { user } = useAuth();
  const { data: members, isLoading } = useWorkspaceMembers(workspaceSlug);

  return useMemo(() => {
    const me = user && members
      ? members.find((m) => m.id === user.id)
      : undefined;
    const role = me?.role ?? null;

    const isOwner = role === 'owner';
    const isAdmin = role === 'admin';

    return {
      role,
      isOwner,
      isAdmin,
      canManage: isOwner || isAdmin,
      isLoading,
    };
  }, [user, members, isLoading]);
}
