import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '@widgets/app-layout';

const ChatPage = lazy(() =>
  import('@pages/chat').then((m) => ({ default: m.ChatPage })),
);
const BoardPage = lazy(() =>
  import('@pages/board').then((m) => ({ default: m.BoardPage })),
);
const ProfilePage = lazy(() =>
  import('@pages/profile').then((m) => ({ default: m.ProfilePage })),
);
const SettingsPage = lazy(() =>
  import('@pages/settings').then((m) => ({ default: m.SettingsPage })),
);
const LoginPage = lazy(() =>
  import('@pages/auth').then((m) => ({ default: m.LoginPage })),
);
const SignupPage = lazy(() =>
  import('@pages/auth').then((m) => ({ default: m.SignupPage })),
);
const VerifyEmailPage = lazy(() =>
  import('@pages/auth').then((m) => ({ default: m.VerifyEmailPage })),
);
const InviteAcceptPage = lazy(() =>
  import('@pages/invite-accept').then((m) => ({ default: m.InviteAcceptPage })),
);
const AcceptInvitePage = lazy(() =>
  import('@pages/invite-accept').then((m) => ({ default: m.AcceptInvitePage })),
);
const WorkspacePage = lazy(() =>
  import('@pages/workspace').then((m) => ({ default: m.WorkspacePage })),
);
const WorkspaceIndex = lazy(() =>
  import('@pages/workspace').then((m) => ({ default: m.WorkspaceIndex })),
);

function RouteFallback() {
  return (
    <div className="flex h-full flex-1 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth pages (no sidebar) */}
        <Route path="/login" element={<Lazy><LoginPage /></Lazy>} />
        <Route path="/signup" element={<Lazy><SignupPage /></Lazy>} />

        {/* Invitation acceptance (standalone page, no sidebar) */}
        <Route path="/invites/:token" element={<Lazy><InviteAcceptPage /></Lazy>} />
        <Route path="/invite/:token" element={<Lazy><AcceptInvitePage /></Lazy>} />

        {/* Email verification (standalone page, no sidebar) */}
        <Route path="/verify-email" element={<Lazy><VerifyEmailPage /></Lazy>} />

        {/* App layout with sidebar */}
        <Route element={<AppLayout />}>
          <Route index element={<Lazy><WorkspaceIndex /></Lazy>} />
          <Route path="settings" element={<Lazy><SettingsPage /></Lazy>} />
          <Route path="profile/:userId" element={<Lazy><ProfilePage /></Lazy>} />
          <Route path=":workspaceSlug/chat" element={<Lazy><ChatPage /></Lazy>} />
          <Route path=":workspaceSlug" element={<Lazy><WorkspacePage /></Lazy>} />
          <Route
            path=":workspaceSlug/:boardSlug"
            element={<Lazy><BoardPage /></Lazy>}
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
