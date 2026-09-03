import { useState } from 'react';
import { useTheme } from '@app/providers/theme-provider';
import { useAppearance } from '@shared/hooks/useAppearance';
import type { AccentTheme, BaseTheme } from '@shared/hooks/useAppearance';
import { useActiveWorkspace } from '@entities/channel/model/useActiveWorkspace';
import { useAuth } from '@shared/lib/auth/useAuth';
import {
  useWorkspace, useUpdateWorkspace, useDeleteWorkspace,
} from '@entities/workspace';
import {
  useUpdateProfile, useUpdateProfileDetails,
  useUpdatePassword, useUpdateNotificationPreferences,
} from '@entities/user';
import { cn } from '@shared/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Label } from '@shared/ui/label';
import { Input } from '@shared/ui/input';
import { Textarea } from '@shared/ui/textarea';
import { Button } from '@shared/ui/button';
import { Switch } from '@shared/ui/switch';
import { Separator } from '@shared/ui/separator';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@shared/ui/dialog';
import {
  User, Palette, Building2, Bell, Sun, Moon, Monitor,
  Upload, AlertTriangle, Loader2, CheckCircle2, Lock,
} from 'lucide-react';

// ─── Types & constants ────────────────────────────────────────────────────────

type SettingsTab = 'profile' | 'appearance' | 'workspace' | 'notifications';

const NAV_ITEMS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile',       label: 'Profile',       icon: <User className="h-4 w-4" /> },
  { id: 'appearance',    label: 'Appearance',    icon: <Palette className="h-4 w-4" /> },
  { id: 'workspace',     label: 'Workspace',     icon: <Building2 className="h-4 w-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
];

const ACCENT_OPTIONS: { value: AccentTheme; label: string; color: string }[] = [
  { value: 'neutral', label: 'Neutral', color: 'oklch(0.556 0 0)' },
  { value: 'amber',   label: 'Amber',   color: 'oklch(0.769 0.189 75)' },
  { value: 'blue',    label: 'Blue',    color: 'oklch(0.627 0.265 264.052)' },
  { value: 'cyan',    label: 'Cyan',    color: 'oklch(0.695 0.17 197)' },
  { value: 'emerald', label: 'Emerald', color: 'oklch(0.696 0.17 162.48)' },
  { value: 'fuchsia', label: 'Fuchsia', color: 'oklch(0.72 0.218 313)' },
  { value: 'green',   label: 'Green',   color: 'oklch(0.696 0.17 145)' },
  { value: 'indigo',  label: 'Indigo',  color: 'oklch(0.673 0.234 274)' },
  { value: 'lime',    label: 'Lime',    color: 'oklch(0.75 0.2 120)' },
  { value: 'orange',  label: 'Orange',  color: 'oklch(0.75 0.183 55.934)' },
  { value: 'pink',    label: 'Pink',    color: 'oklch(0.712 0.218 340)' },
  { value: 'purple',  label: 'Purple',  color: 'oklch(0.692 0.234 308)' },
  { value: 'red',     label: 'Red',     color: 'oklch(0.704 0.191 22.216)' },
  { value: 'rose',    label: 'Rose',    color: 'oklch(0.645 0.246 16.439)' },
  { value: 'sky',     label: 'Sky',     color: 'oklch(0.693 0.21 210)' },
  { value: 'teal',    label: 'Teal',    color: 'oklch(0.685 0.163 180)' },
  { value: 'violet',  label: 'Violet',  color: 'oklch(0.606 0.25 292.717)' },
  { value: 'yellow',  label: 'Yellow',  color: 'oklch(0.78 0.18 93)' },
];

const BASE_OPTIONS: { value: BaseTheme; label: string; bg: string; border: string }[] = [
  { value: 'neutral', label: 'Neutral', bg: 'oklch(0.12 0 0)',        border: 'oklch(0.245 0 0)' },
  { value: 'stone',   label: 'Stone',   bg: 'oklch(0.128 0.004 63)',  border: 'oklch(0.248 0.005 63)' },
  { value: 'zinc',    label: 'Zinc',    bg: 'oklch(0.145 0 0)',        border: 'oklch(0.269 0 0)' },
  { value: 'mauve',   label: 'Mauve',   bg: 'oklch(0.13 0.015 300)',  border: 'oklch(0.255 0.01 300)' },
  { value: 'olive',   label: 'Olive',   bg: 'oklch(0.128 0.012 130)', border: 'oklch(0.25 0.008 130)' },
  { value: 'mist',    label: 'Mist',    bg: 'oklch(0.13 0.01 220)',   border: 'oklch(0.252 0.007 220)' },
  { value: 'taupe',   label: 'Taupe',   bg: 'oklch(0.13 0.008 45)',   border: 'oklch(0.252 0.005 45)' },
];

const THEME_OPTIONS: { value: 'light' | 'dark' | 'system'; label: string; description: string; icon: React.ReactNode; preview: React.ReactNode }[] = [
  {
    value: 'light', label: 'Light', description: 'Clean white interface', icon: <Sun className="h-5 w-5" />,
    preview: (
      <div className="h-10 w-full rounded-md border bg-white">
        <div className="flex h-3 items-center gap-1 border-b bg-gray-50 px-2">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-300" /><span className="h-1.5 w-1.5 rounded-full bg-gray-300" /><span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
        </div>
        <div className="flex gap-1 p-1.5">
          <span className="h-3 w-6 rounded bg-gray-200" /><span className="h-3 w-10 rounded bg-gray-100" /><span className="h-3 w-8 rounded bg-gray-100" />
        </div>
      </div>
    ),
  },
  {
    value: 'dark', label: 'Dark', description: 'Easy on the eyes', icon: <Moon className="h-5 w-5" />,
    preview: (
      <div className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900">
        <div className="flex h-3 items-center gap-1 border-b border-zinc-700 bg-zinc-800 px-2">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" /><span className="h-1.5 w-1.5 rounded-full bg-zinc-600" /><span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
        </div>
        <div className="flex gap-1 p-1.5">
          <span className="h-3 w-6 rounded bg-zinc-700" /><span className="h-3 w-10 rounded bg-zinc-800" /><span className="h-3 w-8 rounded bg-zinc-800" />
        </div>
      </div>
    ),
  },
  {
    value: 'system', label: 'System', description: 'Follows your OS setting', icon: <Monitor className="h-5 w-5" />,
    preview: (
      <div className="h-10 w-full overflow-hidden rounded-md border">
        <div className="flex h-full"><div className="flex-1 bg-white" /><div className="flex-1 bg-zinc-900" /></div>
      </div>
    ),
  },
];

// ─── Tab components ───────────────────────────────────────────────────────────

function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const { accent, setAccent, base, setBase } = useAppearance();
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
        <p className="mt-1 text-sm text-muted-foreground">Customize the look and feel of the application.</p>
      </div>
      <div>
        <h3 className="mb-4 text-sm font-medium text-foreground">Theme</h3>
        <div className="grid grid-cols-3 gap-4">
          {THEME_OPTIONS.map((option) => {
            const isActive = theme === option.value;
            return (
              <button key={option.value} type="button" onClick={() => setTheme(option.value)}
                className={cn('flex flex-col gap-3 rounded-xl border-2 p-4 text-left transition-all hover:bg-accent/50', isActive ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-border/80')}>
                {option.preview}
                <div className="flex items-center gap-2">
                  <span className={cn(isActive ? 'text-primary' : 'text-muted-foreground')}>{option.icon}</span>
                  <div>
                    <p className={cn('text-sm font-medium', isActive ? 'text-primary' : 'text-foreground')}>{option.label}</p>
                    <p className="text-[11px] text-muted-foreground">{option.description}</p>
                  </div>
                  {isActive && <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" /></span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium text-foreground">Base Color</h3>
          <p className="mt-1 text-xs text-muted-foreground">Sets the background tone for the entire interface.</p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {BASE_OPTIONS.map((opt) => {
            const isActive = base === opt.value;
            return (
              <button key={opt.value} type="button" onClick={() => setBase(opt.value)}
                className={cn('relative flex flex-col items-start gap-2 rounded-lg border-2 p-3 text-left transition-all hover:border-primary/60', isActive ? 'border-primary shadow-[0_0_0_1px] shadow-primary/30' : 'border-border')}>
                <div className="h-10 w-full rounded-md border" style={{ background: opt.bg, borderColor: opt.border }}>
                  <div className="m-1.5 h-2 w-1/2 rounded-sm opacity-60" style={{ background: opt.border }} />
                  <div className="mx-1.5 h-1.5 w-3/4 rounded-sm opacity-40" style={{ background: opt.border }} />
                </div>
                <span className="text-xs font-medium">{opt.label}</span>
                {isActive && (
                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="none" className="h-2.5 w-2.5">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium text-foreground">Accent Color</h3>
          <p className="mt-1 text-xs text-muted-foreground">Applied to buttons, highlights, and interactive elements.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {ACCENT_OPTIONS.map((opt) => {
            const isActive = accent === opt.value;
            return (
              <button key={opt.value} type="button" title={opt.label} onClick={() => setAccent(opt.value)}
                className="group flex flex-col items-center gap-1.5 focus-visible:outline-none">
                <span className={cn('flex h-9 w-9 items-center justify-center rounded-full transition-all ring-offset-background ring-offset-2', isActive ? 'ring-2 ring-primary scale-110' : 'ring-1 ring-border hover:scale-110 hover:ring-primary/50')} style={{ background: opt.color }}>
                  {isActive && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="none" className="h-3 w-3">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProfileTab() {
  const { user } = useAuth();
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [infoMsg, setInfoMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const updateProfile = useUpdateProfile();
  const updateProfileDetails = useUpdateProfileDetails();
  const updatePassword = useUpdatePassword();

  const effectiveName = name ?? user?.name ?? '';
  const effectiveEmail = email ?? user?.email ?? '';
  const effectiveJobTitle = jobTitle ?? user?.job_title ?? '';
  const effectiveBio = bio ?? user?.bio ?? '';
  const infoChanged = (name !== null && name !== user?.name) || (email !== null && email !== user?.email) || jobTitle !== null || bio !== null;
  const infoIsPending = updateProfile.isPending || updateProfileDetails.isPending;

  const handleSaveInfo = () => {
    setInfoMsg(null);
    const basePayload: { name?: string; email?: string } = {};
    if (name !== null && name.trim() !== user?.name) basePayload.name = name.trim();
    if (email !== null && email.trim() !== user?.email) basePayload.email = email.trim();
    if (Object.keys(basePayload).length > 0) {
      updateProfile.mutate(basePayload, {
        onSuccess: () => setInfoMsg({ type: 'success', text: 'Profile updated successfully.' }),
        onError: () => setInfoMsg({ type: 'error', text: 'Failed to update profile.' }),
      });
    }
    const detailsPayload: Record<string, string | null> = {};
    if (jobTitle !== null) detailsPayload.job_title = jobTitle.trim() || null;
    if (bio !== null) detailsPayload.bio = bio.trim() || null;
    if (Object.keys(detailsPayload).length > 0) {
      updateProfileDetails.mutate(detailsPayload, {
        onSuccess: () => setInfoMsg({ type: 'success', text: 'Profile updated successfully.' }),
        onError: () => setInfoMsg({ type: 'error', text: 'Failed to update profile details.' }),
      });
    }
  };

  const handleChangePassword = () => {
    setPwdMsg(null);
    if (newPwd !== confirmPwd) { setPwdMsg({ type: 'error', text: 'New passwords do not match.' }); return; }
    updatePassword.mutate(
      { current_password: currentPwd, password: newPwd, password_confirmation: confirmPwd },
      {
        onSuccess: () => { setPwdMsg({ type: 'success', text: 'Password updated successfully.' }); setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); },
        onError: (err) => {
          const e = err as { response?: { data?: { errors?: { current_password?: string[] } } } };
          setPwdMsg({ type: 'error', text: e?.response?.data?.errors?.current_password?.[0] ?? 'Incorrect current password.' });
        },
      },
    );
  };

  const msgCls = (type: 'success' | 'error') =>
    cn('flex items-center gap-2 rounded-lg px-3 py-2 text-sm', type === 'success' ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-destructive/10 text-destructive');

  return (
    <div className="space-y-8">
      <div><h2 className="text-xl font-semibold text-foreground">Profile</h2><p className="mt-1 text-sm text-muted-foreground">Manage your personal information and account credentials.</p></div>
      <Card>
        <CardHeader><CardTitle className="text-base">Personal Information</CardTitle><CardDescription>Your name, email, title, and bio are visible to your team.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label htmlFor="pf-name">Full Name</Label><Input id="pf-name" value={effectiveName} onChange={(e) => { setName(e.target.value); setInfoMsg(null); }} placeholder="Your full name" /></div>
            <div className="space-y-1.5"><Label htmlFor="pf-email">Email Address</Label><Input id="pf-email" type="email" value={effectiveEmail} onChange={(e) => { setEmail(e.target.value); setInfoMsg(null); }} placeholder="you@example.com" /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="pf-job">Role / Job Title</Label><Input id="pf-job" value={effectiveJobTitle} onChange={(e) => { setJobTitle(e.target.value); setInfoMsg(null); }} placeholder="e.g. Senior Engineer" /></div>
          <div className="space-y-1.5"><Label htmlFor="pf-bio">Bio</Label><Textarea id="pf-bio" value={effectiveBio} onChange={(e) => { setBio(e.target.value); setInfoMsg(null); }} placeholder="Tell your team a little about yourself…" rows={3} className="resize-none" /></div>
          {infoMsg && <div className={msgCls(infoMsg.type)}><CheckCircle2 className="h-4 w-4 shrink-0" />{infoMsg.text}</div>}
          <div className="flex justify-end border-t pt-4"><Button onClick={handleSaveInfo} disabled={!infoChanged || infoIsPending}>{infoIsPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Lock className="h-4 w-4" />Change Password</CardTitle><CardDescription>Enter your current password, then choose a new one (min. 8 characters).</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="pf-curr-pwd">Current Password</Label><Input id="pf-curr-pwd" type="password" value={currentPwd} onChange={(e) => { setCurrentPwd(e.target.value); setPwdMsg(null); }} autoComplete="current-password" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label htmlFor="pf-new-pwd">New Password</Label><Input id="pf-new-pwd" type="password" value={newPwd} onChange={(e) => { setNewPwd(e.target.value); setPwdMsg(null); }} autoComplete="new-password" /></div>
            <div className="space-y-1.5"><Label htmlFor="pf-confirm-pwd">Confirm New Password</Label><Input id="pf-confirm-pwd" type="password" value={confirmPwd} onChange={(e) => { setConfirmPwd(e.target.value); setPwdMsg(null); }} autoComplete="new-password" /></div>
          </div>
          {pwdMsg && <div className={msgCls(pwdMsg.type)}><CheckCircle2 className="h-4 w-4 shrink-0" />{pwdMsg.text}</div>}
          <div className="flex justify-end border-t pt-4"><Button onClick={handleChangePassword} disabled={!currentPwd || !newPwd || !confirmPwd || updatePassword.isPending}>{updatePassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update Password</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsTab() {
  const { user } = useAuth();
  const updateNotifPrefs = useUpdateNotificationPreferences();
  const prefs = user?.notification_preferences;
  const [emailNotifs, setEmailNotifs] = useState(() => prefs?.email ?? true);
  const [pushNotifs, setPushNotifs] = useState(() => prefs?.push ?? false);
  const [assignedNotif, setAssignedNotif] = useState(() => prefs?.assigned ?? true);
  const [commentsNotif, setCommentsNotif] = useState(() => prefs?.comments ?? true);
  const [dueNotif, setDueNotif] = useState(() => prefs?.due_date ?? true);
  const save = (patch: Parameters<typeof updateNotifPrefs.mutate>[0]) => updateNotifPrefs.mutate(patch);

  return (
    <div className="space-y-8">
      <div><h2 className="text-xl font-semibold text-foreground">Notifications</h2><p className="mt-1 text-sm text-muted-foreground">Control how and when you receive notifications.</p></div>
      <Card>
        <CardHeader><CardTitle className="text-base">Notification Channels</CardTitle><CardDescription>Choose how you receive notifications.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium">Email Notifications</p><p className="text-xs text-muted-foreground">Activity summaries and important updates sent to your inbox.</p></div><Switch checked={emailNotifs} onCheckedChange={(v) => { setEmailNotifs(v); save({ email: v }); }} /></div>
          <Separator />
          <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium">Push Notifications</p><p className="text-xs text-muted-foreground">Real-time alerts in your browser or desktop app.</p></div><Switch checked={pushNotifs} onCheckedChange={(v) => { setPushNotifs(v); save({ push: v }); }} /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Activity Triggers</CardTitle><CardDescription>Choose which events generate a notification for you.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium">Task Assigned to Me</p><p className="text-xs text-muted-foreground">When a task is assigned or re-assigned to you.</p></div><Switch checked={assignedNotif} onCheckedChange={(v) => { setAssignedNotif(v); save({ assigned: v }); }} /></div>
          <Separator />
          <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium">Comments on My Tasks</p><p className="text-xs text-muted-foreground">When someone comments on a task you own or are watching.</p></div><Switch checked={commentsNotif} onCheckedChange={(v) => { setCommentsNotif(v); save({ comments: v }); }} /></div>
          <Separator />
          <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium">Due Date Reminders</p><p className="text-xs text-muted-foreground">Get reminded 24 hours before a task you own is due.</p></div><Switch checked={dueNotif} onCheckedChange={(v) => { setDueNotif(v); save({ due_date: v }); }} /></div>
        </CardContent>
      </Card>
    </div>
  );
}

function WorkspaceTab() {
  const workspaceSlug = useActiveWorkspace();
  const { data: workspace, isLoading } = useWorkspace(workspaceSlug ?? '');
  const [name, setName] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const updateWorkspace = useUpdateWorkspace(workspaceSlug ?? '');
  const deleteWorkspace = useDeleteWorkspace();
  const effectiveName = name ?? workspace?.name ?? '';

  if (!workspaceSlug) {
    return (
      <div className="space-y-4">
        <div><h2 className="text-xl font-semibold text-foreground">Workspace</h2><p className="mt-1 text-sm text-muted-foreground">Manage your workspace settings and preferences.</p></div>
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed"><p className="text-sm text-muted-foreground">Navigate to a workspace first to manage its settings.</p></div>
      </div>
    );
  }
  if (isLoading || !workspace) {
    return <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-8">
      <div><h2 className="text-xl font-semibold text-foreground">Workspace</h2><p className="mt-1 text-sm text-muted-foreground">Manage settings for <strong>{workspace.name}</strong>.</p></div>
      <Card>
        <CardHeader><CardTitle className="text-base">General</CardTitle><CardDescription>Update your workspace name and branding.</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2"><Label htmlFor="ws-name">Workspace Name</Label><Input id="ws-name" value={effectiveName} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Corp" className="max-w-sm" /></div>
          <div className="space-y-2">
            <Label>Workspace Logo</Label>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground"><span className="text-xl font-bold">{workspace.name.slice(0, 2).toUpperCase()}</span></div>
              <div><Button variant="outline" size="sm" type="button" disabled><Upload className="mr-2 h-3.5 w-3.5" />Upload Logo</Button><p className="mt-1 text-[11px] text-muted-foreground">PNG, JPG up to 2 MB. Coming soon.</p></div>
            </div>
          </div>
          <div className="flex justify-end border-t pt-4"><Button onClick={() => updateWorkspace.mutate({ name: effectiveName.trim() })} disabled={!effectiveName.trim() || effectiveName.trim() === workspace.name || updateWorkspace.isPending}>{updateWorkspace.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button></div>
        </CardContent>
      </Card>
      <Card className="border-destructive">
        <CardHeader><CardTitle className="text-base text-destructive">Danger Zone</CardTitle><CardDescription>Irreversible and destructive actions.</CardDescription></CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div><p className="text-sm font-medium">Delete this workspace</p><p className="mt-0.5 text-sm text-muted-foreground">Once deleted, all boards, tasks, and data will be permanently removed. This action cannot be undone.</p></div>
            <Button variant="destructive" size="sm" className="shrink-0" onClick={() => setDeleteOpen(true)}>Delete Workspace</Button>
          </div>
        </CardContent>
      </Card>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />Delete Workspace</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{workspace.name}</strong>? All boards, tasks, and data will be permanently removed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteWorkspace.mutate(workspace.slug)} disabled={deleteWorkspace.isPending}>
              {deleteWorkspace.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── SettingsLayout ───────────────────────────────────────────────────────────

export function SettingsLayout() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar nav */}
      <nav className="w-56 shrink-0 border-r bg-sidebar p-4">
        <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Settings</p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon }) => (
            <li key={id}>
              <button
                onClick={() => setActiveTab(id)}
                className={cn('flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors', activeTab === id ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')}
              >
                {icon}{label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-2xl">
          {activeTab === 'profile'       && <ProfileTab />}
          {activeTab === 'appearance'    && <AppearanceTab />}
          {activeTab === 'workspace'     && <WorkspaceTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
        </div>
      </div>
    </div>
  );
}
