import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { authApi } from "@/api/auth"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@shared/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@shared/ui/field"
import { Input } from "@shared/ui/input"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirmation) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.register({ 
        name, 
        email, 
        password, 
        password_confirmation: passwordConfirmation 
      });
      await refreshUser();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error registration. Check your data.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Input id="confirm-password" type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} required />
            </Field>
            
            {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

            <FieldGroup>
              <Field>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
                <FieldDescription className="px-6 text-center mt-2">
                  Already have an account? <Link to="/login" className="underline underline-offset-4 hover:text-primary">Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
