import { Minus, Square, X, ChevronLeft, ChevronRight, LogOut, User as UserIcon, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, authApi } from '@shared/lib/auth/useAuth';
import { Button } from '@shared/ui/button';
import { GlobalSearch } from '@features/search/ui/global-search';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { SidebarTrigger } from '@shared/ui/sidebar';
import { UserProfileDialog } from '@entities/user/ui/user-profile-dialog';
import { useTotalUnreadDMs } from '@widgets/chat-panel/ui/workspace-chat-panel';
import { useState } from 'react';
import { useActiveWorkspace } from '@entities/channel/model/useActiveWorkspace';

export function TitleBar() {
  const api = window.electronAPI;
  const navigate = useNavigate();
  const workspaceSlug = useActiveWorkspace();
  const { user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const totalUnread = useTotalUnreadDMs(workspaceSlug);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
    } finally {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
  };

  return (
    <>
      <div
        className="relative z-50 flex h-12 shrink-0 items-center justify-between border-b bg-background px-3"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Left Navigation */}
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <div className="mr-4 flex items-center gap-1">
            <SidebarTrigger className="h-8 w-8" />
            <Button variant="ghost" size="icon" className="ml-1 h-7 w-7" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <GlobalSearch />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {/* Chat icon — navigates to full-page chat (no Sheet panel) */}
          {workspaceSlug && (
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => navigate(`/${workspaceSlug}/chat`)}
              title="Open Chat"
            >
              <MessageSquare className="h-4 w-4" />
              {totalUnread > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </Button>
          )}

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url ?? undefined} alt={user.name ?? undefined} />
                    <AvatarFallback>{user.name?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(`/profile/${user.id}`)}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {api && (
            <div className="ml-2 flex h-8 items-center rounded-md border bg-muted/30">
              <button onClick={() => api.minimize()} className="flex h-full w-9 items-center justify-center text-muted-foreground rounded-l-md transition-colors hover:bg-accent hover:text-white">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => api.maximize()} className="flex h-full w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-white">
                <Square className="h-3 w-3" />
              </button>
              <button onClick={() => api.close()} className="flex h-full w-9 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:bg-red-500 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <UserProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
