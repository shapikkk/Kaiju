import { SignupForm } from '@features/auth/ui/signup-form';

export function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <SignupForm className="w-full max-w-md" />
    </div>
  );
}
