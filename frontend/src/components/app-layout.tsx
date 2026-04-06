import { Outlet, Navigate } from 'react-router-dom';
import { SidebarInset, SidebarProvider } from '@shared/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { TitleBar } from '@/components/title-bar';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export function AppLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.email_verified_at) {
    return <Navigate to="/verify-email" replace />;
  }

  return (
    <SidebarProvider className="min-h-0 flex-1">
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-transparent">
        <TitleBar />
        <div className="relative z-0 flex min-h-0 flex-1 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background/10">
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <Outlet />
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
