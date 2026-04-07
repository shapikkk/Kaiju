import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@widgets/app-layout';
import { ChatPage } from '@pages/chat';
import { BoardPage } from '@pages/board';
import { ProfilePage } from '@pages/profile';
import { SettingsPage } from '@pages/settings';
import { LoginPage, SignupPage, VerifyEmailPage } from '@pages/auth';
import { InviteAcceptPage, AcceptInvitePage } from '@pages/invite-accept';
import { WorkspacePage, WorkspaceIndex } from '@pages/workspace';

export function AppRouter() {
  return (
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
  );
}
