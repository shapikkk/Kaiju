import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Avatar, AvatarFallback } from '@shared/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Separator } from '@shared/ui/separator';
import { Badge } from '@shared/ui/badge';
import {
  useWorkspaceMembers,
  useUpdateMemberRole,
  useRemoveMember,
} from '@/hooks/useApi';
import { useCurrentUser } from '@/hooks/useAuth';
import { Loader2, Trash2, Shield, ShieldCheck, Crown } from 'lucide-react';
import type { Workspace, WorkspaceMember } from "@shared/types";
import type { AxiosError } from 'axios';
import { useState } from 'react';

interface WorkspaceSettingsDialogProps {
  workspace: Workspace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLE_CONFIG = {
  owner: {
    label: 'Owner',
    icon: Crown,
    color:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  admin: {
    label: 'Admin',
    icon: ShieldCheck,
    color:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  member: {
    label: 'Member',
    icon: Shield,
    color:
      'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400',
  },
} as const;

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function WorkspaceSettingsDialog({
  workspace,
  open,
  onOpenChange,
}: WorkspaceSettingsDialogProps) {
  const currentUser = useCurrentUser();
  const { data: members, isLoading } = useWorkspaceMembers(workspace.slug);
  const updateRole = useUpdateMemberRole(workspace.slug);
  const removeMember = useRemoveMember(workspace.slug);
  const [error, setError] = useState('');

  const handleRoleChange = (member: WorkspaceMember, newRole: string) => {
    setError('');
    updateRole.mutate(
      { userId: member.id, role: newRole },
      {
        onError: (err: Error) => {
          const axiosErr = err as AxiosError<{ message?: string }>;
          setError(
            axiosErr.response?.data?.message || 'Failed to update role.',
          );
        },
      },
    );
  };

  const handleRemove = (member: WorkspaceMember) => {
    setError('');
    removeMember.mutate(member.id, {
      onError: (err: Error) => {
        const axiosErr = err as AxiosError<{ message?: string }>;
        setError(
          axiosErr.response?.data?.message || 'Failed to remove member.',
        );
      },
    });
  };

  const isOwner = (member: WorkspaceMember) =>
    member.role === 'owner' || member.id === workspace.owner?.id;

  const isSelf = (member: WorkspaceMember) => member.id === currentUser?.id;

  const canManage = (member: WorkspaceMember) =>
    !isOwner(member) && !isSelf(member);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Workspace Settings</DialogTitle>
          <DialogDescription>
            Manage members of <strong>{workspace.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">
            Members{' '}
            {members && (
              <span className="text-xs">({members.length})</span>
            )}
          </h4>
        </div>

        <ScrollArea className="max-h-[360px]">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          <div className="space-y-1 pr-3">
            {members?.map((member) => {
              const roleConfig =
                ROLE_CONFIG[
                  isOwner(member) ? 'owner' : (member.role as keyof typeof ROLE_CONFIG)
                ] ?? ROLE_CONFIG.member;

              return (
                <div
                  key={member.id}
                  className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                >
                  {/* Avatar */}
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name + Email */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-tight">
                      {member.name}
                      {isSelf(member) && (
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.email}
                    </p>
                  </div>

                  {/* Role badge or selector */}
                  {isOwner(member) ? (
                    <Badge
                      variant="secondary"
                      className={`shrink-0 gap-1 ${roleConfig.color}`}
                    >
                      <Crown className="h-3 w-3" />
                      Owner
                    </Badge>
                  ) : canManage(member) ? (
                    <Select
                      value={member.role}
                      onValueChange={(val) =>
                        handleRoleChange(member, val)
                      }
                    >
                      <SelectTrigger className="h-7 w-[100px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant="secondary"
                      className={`shrink-0 gap-1 ${roleConfig.color}`}
                    >
                      <roleConfig.icon className="h-3 w-3" />
                      {roleConfig.label}
                    </Badge>
                  )}

                  {/* Remove button */}
                  {canManage(member) ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                      onClick={() => handleRemove(member)}
                      disabled={removeMember.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <div className="h-7 w-7 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
