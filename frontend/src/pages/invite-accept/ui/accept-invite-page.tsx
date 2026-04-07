import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAcceptInviteLink } from '@features/invite-member';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { useAuth } from '@shared/lib/auth/useAuth';

export function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const acceptMutation = useAcceptInviteLink();

  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (token && acceptMutation.isIdle) {
      acceptMutation.mutate(token, {
        onSuccess: (data) => {
          navigate('/' + data.slug, { replace: true });
        },
      });
    }
  }, [token, acceptMutation, navigate]);

  if (isAuthLoading || acceptMutation.isPending || acceptMutation.isIdle) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {isAuthLoading ? 'Checking authentication...' : 'Joining workspace...'}
          </p>
        </div>
      </div>
    );
  }

  if (acceptMutation.isError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <h2 className="text-xl font-semibold">Invalid or Expired Link</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            {acceptMutation.error instanceof Error
              ? (acceptMutation.error as { response?: { data?: { message?: string } } }).response?.data?.message || acceptMutation.error.message
              : 'This invitation link is invalid or has expired.'}
          </p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
