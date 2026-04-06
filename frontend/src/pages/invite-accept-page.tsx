import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAcceptInvite } from '@/hooks/useApi';
import { Button } from '@shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserPlus,
  Kanban,
} from 'lucide-react';
import type { AxiosError } from 'axios';
import { useState } from 'react';

export function InviteAcceptPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const acceptInvite = useAcceptInvite();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');

  const handleAccept = () => {
    setErrorMsg('');
    acceptInvite.mutate(token, {
      onSuccess: (data) => {
        setSuccessMsg(data.message);
        setWorkspaceSlug(data.workspace_slug);
      },
      onError: (error: Error) => {
        const axiosErr = error as AxiosError<{ message?: string }>;
        const msg =
          axiosErr.response?.data?.message ||
          'Something went wrong. Please try again.';
        setErrorMsg(msg);
      },
    });
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Kanban className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">Workspace Invitation</CardTitle>
            <CardDescription className="text-balance">
              You must be logged in to accept this invitation. Please
              log in with the email address the invitation was sent to,
              or create a new account.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link to={`/login?redirect=/invites/${token}`}>
                <LogIn className="mr-2 h-4 w-4" />
                Log In
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to={`/signup?redirect=/invites/${token}`}>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (successMsg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">You're In!</CardTitle>
            <CardDescription className="text-balance">
              {successMsg}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() =>
                navigate(workspaceSlug ? `/${workspaceSlug}` : '/')
              }
            >
              Go to Workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Kanban className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Workspace Invitation</CardTitle>
          <CardDescription className="text-balance">
            You've been invited to join a workspace. Click the button
            below to accept and get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleAccept}
            disabled={acceptInvite.isPending}
          >
            {acceptInvite.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Accept Invitation
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Logged in as <strong>{user.email}</strong>. The invitation
            must match this email address.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
