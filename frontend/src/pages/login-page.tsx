import { LoginForm } from '@/components/login-form';

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <LoginForm className="w-full max-w-md" />
    </div>
  );
}
