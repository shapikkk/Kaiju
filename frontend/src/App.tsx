import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@app/providers/theme-provider';
import { TooltipProvider } from '@shared/ui/tooltip';
import { AuthProvider } from '@entities/user/model/useAuth';
import { AppLayout } from '@widgets/app-layout/ui/app-layout';
import { ParticlesBackground } from '@shared/ui/particles-background';
import { Toaster } from '@shared/ui/sonner';
import { BoardPage } from '@/pages/board-page';
import { WorkspacePage } from '@/pages/workspace-page';
import { WorkspaceIndex } from '@/pages/workspace-index';
import { LoginPage } from '@/pages/login-page';
import { SignupPage } from '@/pages/signup-page';
import { InviteAcceptPage } from '@/pages/invite-accept-page';
import { VerifyEmailPage } from '@/pages/verify-email-page';
import { ProfilePage } from '@/pages/profile-page';
import { AcceptInvitePage } from '@/pages/accept-invite-page';
import { SettingsPage } from '@/pages/settings-page';
import { ChatPage } from '@/pages/chat-page';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Toaster
          closeButton
          position="bottom-right"
          toastOptions={{
            style: {
              marginBottom: '80px',
            },
          }}
        />
        <ParticlesBackground />
        <TooltipProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Auth pages (no sidebar) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* Invitation acceptance (standalone page, no sidebar) */}
                <Route path="/invites/:token" element={<InviteAcceptPage />} />
                <Route path="/invite/:token" element={<AcceptInvitePage />} />

                {/* Email verification (standalone page, no sidebar) */}
                <Route path="/verify-email" element={<VerifyEmailPage />} />

                {/* App layout with sidebar */}
                <Route element={<AppLayout />}>
                  <Route index element={<WorkspaceIndex />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="profile/:userId" element={<ProfilePage />} />
                  <Route path=":workspaceSlug/chat" element={<ChatPage />} />
                  <Route path=":workspaceSlug" element={<WorkspacePage />} />
                  <Route
                    path=":workspaceSlug/:boardSlug"
                    element={<BoardPage />}
                  />
                </Route>


                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;