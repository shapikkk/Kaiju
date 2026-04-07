import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@shared/lib/auth/useAuth';
import { useActiveWorkspace } from '@entities/channel';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
} from '@shared/ui/sidebar';
import { useWorkspaces } from '@entities/workspace';
import { useBoards } from '@entities/board';
import { CreateBoardDialog } from '@features/create-board';
import { CreateWorkspaceDialog } from '@features/create-workspace';
import { InviteMemberDialog } from '@features/invite-member';
import { WorkspaceSettingsDialog } from '@features/workspace-settings';
import {
  LayoutDashboard,
  Plus,
  Kanban,
  Settings,
  LogOut,
  ChevronDown,
  UserPlus,
  User as UserIcon,
  FolderPlus,
  MessageSquare,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu';
import { authApi } from '@shared/lib/auth/useAuth';
import { useTotalUnreadDMs } from '@widgets/chat-panel';

export function AppSidebar() {
  const navigate = useNavigate();
  const { boardSlug } = useParams();
  const workspaceSlug = useActiveWorkspace();
  const { user } = useAuth();
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [inviteMemberOpen, setInviteMemberOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: workspaces, isLoading: wsLoading } = useWorkspaces();
  const activeWorkspace = workspaces?.find((w) => w.slug === workspaceSlug);
  const totalUnread = useTotalUnreadDMs(workspaceSlug);


  const { data: boards, isLoading: boardsLoading } = useBoards(
    workspaceSlug ?? '',
  );

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* token already invalid */
    }
    navigate('/login');
  };

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" className="!top-12 !h-[calc(100svh-3rem)]">
        <SidebarHeader>
          {/* Workspace selector */}
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Kanban className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {activeWorkspace?.name ?? 'Select Workspace'}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        Team Board
                      </span>
                    </div>
                    <ChevronDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                  align="start"
                  sideOffset={4}
                >
                  {wsLoading && (
                    <DropdownMenuItem disabled>Loading…</DropdownMenuItem>
                  )}
                  {workspaces?.map((ws) => (
                    <DropdownMenuItem
                      key={ws.id}
                      onClick={() => navigate(`/${ws.slug}`)}
                    >
                      <LayoutDashboard className="mr-2 size-4" />
                      {ws.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCreateWorkspaceOpen(true)}>
                    <FolderPlus className="mr-2 size-4" />
                    New Workspace
                  </DropdownMenuItem>
                  {activeWorkspace && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setInviteMemberOpen(true)}>
                        <UserPlus className="mr-2 size-4" />
                        Invite Member
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                        <Settings className="mr-2 size-4" />
                        Workspace Settings
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {/* Boards list */}
          <SidebarGroup>
            <SidebarGroupLabel>Boards</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {boardsLoading &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <SidebarMenuItem key={i}>
                      <SidebarMenuSkeleton showIcon />
                    </SidebarMenuItem>
                  ))}

                {boards?.map((board) => (
                  <SidebarMenuItem key={board.id}>
                    <SidebarMenuButton
                      isActive={board.slug === boardSlug}
                      onClick={() =>
                        navigate(`/${workspaceSlug}/${board.slug}`)
                      }
                      tooltip={board.name}
                    >
                      <div
                        className="size-3 shrink-0 rounded-sm"
                        style={{
                          backgroundColor: board.color ?? '#6b7280',
                        }}
                      />
                      <span>{board.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                {!boardsLoading && workspaceSlug && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className="text-muted-foreground"
                      onClick={() => setCreateBoardOpen(true)}
                    >
                      <Plus className="size-4" />
                      <span>New Board</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            {user && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="My Profile"
                  onClick={() => navigate(`/profile/${user.id}`)}
                >
                  <UserIcon className="size-4" />
                  <span>My Profile</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {workspaceSlug && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Chat"
                  onClick={() => navigate(`/${workspaceSlug}/chat`)}
                  className="relative"
                >
                  <MessageSquare className="size-4" />
                  <span>Chat</span>
                  {totalUnread > 0 && (
                    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                      {totalUnread > 9 ? '9+' : totalUnread}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings" onClick={() => navigate('/settings')}>
                <Settings className="size-4" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Logout" onClick={handleLogout}>
                <LogOut className="size-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* Dialogs rendered outside Sidebar to avoid stacking context issues */}
      <CreateBoardDialog
        open={createBoardOpen}
        onOpenChange={setCreateBoardOpen}
      />
      <CreateWorkspaceDialog
        open={createWorkspaceOpen}
        onOpenChange={setCreateWorkspaceOpen}
      />

      {activeWorkspace && (
        <InviteMemberDialog
          workspace={activeWorkspace}
          open={inviteMemberOpen}
          onOpenChange={setInviteMemberOpen}
        />
      )}

      {activeWorkspace && (
        <WorkspaceSettingsDialog
          workspace={activeWorkspace}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
      )}
    </>
  );
}
