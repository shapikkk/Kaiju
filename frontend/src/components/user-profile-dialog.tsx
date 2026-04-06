import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Separator } from '@shared/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import {
  useUpdateProfile,
  useUpdatePassword,
  useUploadAvatar,
} from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Loader2,
  Camera,
  User as UserIcon,
  Lock,
} from 'lucide-react';
import type { AxiosError } from 'axios';

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({
  open,
  onOpenChange,
}: UserProfileDialogProps) {
  const { user } = useAuth();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            Manage your account details and security.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general" className="gap-1.5">
              <UserIcon className="h-3.5 w-3.5" />
              General
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4 space-y-6">
            {user && <GeneralTab user={user} />}
          </TabsContent>

          <TabsContent value="security" className="mt-4">
            <SecurityTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function GeneralTab({ user }: { user: { id: number; name: string; email: string; avatar_url: string | null } }) {
  const { refreshUser } = useAuth();
  const [name, setName] = useState(user.name);
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (!name.trim()) return;

    updateProfile.mutate(
      { name: name.trim() },
      {
        onSuccess: async (data) => {
          toast.success(data.message);
          await refreshUser();
        },
        onError: (error: Error) => {
          const axiosErr = error as AxiosError<{ message?: string }>;
          toast.error(axiosErr.response?.data?.message || 'Failed to update profile.');
        },
      },
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadAvatar.mutate(file, {
      onSuccess: async (data) => {
        toast.success(data.message);
        await refreshUser();
      },
      onError: (error: Error) => {
        const axiosErr = error as AxiosError<{ message?: string }>;
        toast.error(axiosErr.response?.data?.message || 'Failed to upload avatar.');
      },
    });
  };

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-110"
          >
            {uploadAvatar.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-1.5">
        <Label htmlFor="profile-name">Display Name</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={!name.trim() || name === user.name || updateProfile.isPending}
        className="w-full"
      >
        {updateProfile.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Save Changes
      </Button>
    </>
  );
}

function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const updatePassword = useUpdatePassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    updatePassword.mutate(
      {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      },
      {
        onSuccess: (data) => {
          toast.success(data.message);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
        onError: (error: Error) => {
          const axiosErr = error as AxiosError<{ message?: string }>;
          toast.error(
            axiosErr.response?.data?.message || 'Failed to update password.',
          );
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="current-password">Current Password</Label>
        <Input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>

      <Separator />

      <div className="space-y-1.5">
        <Label htmlFor="new-password">New Password</Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Confirm New Password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={8}
          required
        />
      </div>

      <Button
        type="submit"
        disabled={
          !currentPassword ||
          !newPassword ||
          !confirmPassword ||
          updatePassword.isPending
        }
        className="w-full"
      >
        {updatePassword.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Update Password
      </Button>
    </form>
  );
}
