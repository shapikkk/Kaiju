import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useVerifyEmail, useResendVerification } from '@/hooks/useApi';
import { Button } from '@shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/ui/card';
import {
  Loader2,
  CheckCircle2,
  MailOpen,
  RefreshCw,
  Kanban,
} from 'lucide-react';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const verifyEmail = useVerifyEmail();
  const resend = useResendVerification();
  const [resendCooldown, setResendCooldown] = useState(0);

  const id = searchParams.get('id');
  const hash = searchParams.get('hash');
  const expires = searchParams.get('expires');
  const signature = searchParams.get('signature');
  const hasVerificationParams = !!(id && hash && expires && signature);

  useEffect(() => {
    if (hasVerificationParams && user && !verifyEmail.isSuccess && !verifyEmail.isPending) {
      verifyEmail.mutate(
        { id: id!, hash: hash!, expires: expires!, signature: signature! },
        {
          onSuccess: async () => {
            await refreshUser();
            setTimeout(() => navigate('/', { replace: true }), 1500);
          },
        },
      );
    }
  }, [hasVerificationParams, user]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = () => {
    resend.mutate(undefined, {
      onSuccess: () => setResendCooldown(60),
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
            <CardTitle className="text-xl">Email Verification</CardTitle>
            <CardDescription>
              You must be logged in to verify your email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/login">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.email_verified_at && !hasVerificationParams) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">Already Verified</CardTitle>
            <CardDescription>
              Your email is verified. You're all set!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verifyEmail.isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">Email Verified!</CardTitle>
            <CardDescription>
              Your email has been verified successfully. Redirecting…
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verifyEmail.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (verifyEmail.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-white">
              <MailOpen className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">Verification Failed</CardTitle>
            <CardDescription>
              The verification link may be expired or invalid. Please
              request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={handleResend}
              disabled={resend.isPending || resendCooldown > 0}
            >
              {resend.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend Verification Email'}
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
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500 text-white">
            <MailOpen className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Verify Your Email</CardTitle>
          <CardDescription className="text-balance">
            We sent a verification email to{' '}
            <strong className="text-foreground">{user.email}</strong>.
            Please check your inbox and click the link to verify your
            account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full"
            variant="outline"
            onClick={handleResend}
            disabled={resend.isPending || resendCooldown > 0}
          >
            {resend.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend Verification Email'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Didn't receive it? Check your spam folder or click resend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
