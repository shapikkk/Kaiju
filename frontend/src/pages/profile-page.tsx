import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  useUserProfile,
  useUpdateProfile,
  useUploadAvatar,
  useUploadBanner,
} from '@/hooks/useProfile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Textarea } from '@shared/ui/textarea';
import { Badge } from '@shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { Skeleton } from '@shared/ui/skeleton';
import { Separator } from '@shared/ui/separator';
import {
  MapPin,
  Briefcase,
  Building2,
  Pencil,
  Camera,
  ImagePlus,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  CalendarRange,
} from 'lucide-react';
import type { UpdateProfilePayload, Experience } from "@shared/types";

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();
  const parsedId = Number(userId);

  const { data: profileUser, isLoading, isError } = useUserProfile(parsedId);
  const uploadAvatar = useUploadAvatar();
  const uploadBanner = useUploadBanner();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);

  const isOwnProfile = currentUser?.id === parsedId;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatar.mutate(file, { onSuccess: () => refreshUser() });
    e.target.value = '';
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadBanner.mutate(file, { onSuccess: () => refreshUser() });
    e.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto bg-transparent [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
        <Skeleton className="h-[320px] w-full rounded-none" />

        <div className="mx-auto max-w-5xl px-6">
          <div className="relative z-10 flex flex-col sm:flex-row items-end gap-6 -mt-44 pb-6 text-left">
            <Skeleton className="h-32 w-32 shrink-0 rounded-full border-4 border-background" />
            
            <div className="space-y-2 pb-2">
              <Skeleton className="h-8 w-64" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 pb-12">
            <div className="col-span-2 space-y-6">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !profileUser) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <p className="text-lg font-medium">User not found</p>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go back
        </Button>
      </div>
    );
  }

  const initials = getInitials(profileUser.name);
  const bannerGradient = 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 50%, #1a8c7c 100%)';

  return (
    <div className="flex-1 overflow-auto bg-transparent [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">

      <div className="relative w-full">
        <div className="relative h-[320px] w-full overflow-hidden">
          <div className="absolute inset-0">
            {profileUser.banner_url ? (
              <img
                src={profileUser.banner_url}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover object-center"
              />
            ) : (
              <div className="h-full w-full" style={{ background: bannerGradient }} />
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-6 pt-4">
            <button
              onClick={() => navigate(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              {isOwnProfile && (
                <>
                  <button
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={uploadBanner.isPending}
                    className="flex items-center gap-1.5 rounded-lg bg-black/30 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/50 disabled:opacity-60"
                  >
                    {uploadBanner.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ImagePlus className="h-3.5 w-3.5" />
                    )}
                    Change Cover
                  </button>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleBannerChange}
                  />
                  <button
                    onClick={() => setEditOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-black/30 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-6">
          <div className="relative z-10 flex flex-col sm:flex-row items-end gap-6 -mt-44 pb-6 text-left">
            <div className="relative mb-2 shrink-0 sm:mb-0">
              <Avatar className="h-32 w-32 border-4 border-background bg-background shadow-xl">
                <AvatarImage src={profileUser.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/20 text-4xl font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadAvatar.isPending}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition-all hover:bg-black/40 hover:opacity-100 disabled:cursor-not-allowed"
                    title="Change avatar"
                  >
                    {uploadAvatar.isPending ? (
                      <Loader2 className="h-7 w-7 animate-spin text-white" />
                    ) : (
                      <Camera className="h-7 w-7 text-white" />
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </>
              )}
            </div>

            <div className="space-y-1.5 pb-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">
                {profileUser.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {profileUser.job_title && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 shrink-0" />
                    {profileUser.job_title}
                  </span>
                )}
                {profileUser.department && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    {profileUser.department}
                  </span>
                )}
                {profileUser.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {profileUser.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-12 pt-6">

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            {(profileUser.bio || isOwnProfile) && (
              <section className="rounded-xl border bg-card p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  About
                </h2>
                {profileUser.bio ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {profileUser.bio}
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    No bio yet.{' '}
                    {isOwnProfile && (
                      <button
                        className="underline underline-offset-2 hover:text-foreground"
                        onClick={() => setEditOpen(true)}
                      >
                        Add one
                      </button>
                    )}
                  </p>
                )}
              </section>
            )}

            {(profileUser.experience?.length > 0 || isOwnProfile) && (
              <section className="rounded-xl border bg-card p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Experience
                </h2>
                {profileUser.experience?.length > 0 ? (
                  <ol className="space-y-5">
                    {profileUser.experience.map((exp: Experience, i: number) => (
                      <li key={i} className="flex gap-3">
                        <div className="mt-1 flex flex-col items-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-primary/20" />
                          {i < profileUser.experience.length - 1 && (
                            <div className="mt-1 w-px flex-1 bg-border" />
                          )}
                        </div>
                        <div className="pb-2">
                          <p className="text-sm font-semibold leading-tight">{exp.title}</p>
                          <p className="text-sm text-muted-foreground">{exp.company}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground/70">
                            <CalendarRange className="h-3 w-3" />
                            {formatDate(exp.start_date)} –{' '}
                            {exp.current ? 'Present' : formatDate(exp.end_date)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    No experience listed.{' '}
                    {isOwnProfile && (
                      <button
                        className="underline underline-offset-2 hover:text-foreground"
                        onClick={() => setEditOpen(true)}
                      >
                        Add yours
                      </button>
                    )}
                  </p>
                )}
              </section>
            )}
          </div>

          <div className="space-y-6">
            <section className="rounded-xl border bg-card p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Skills
              </h2>
              {profileUser.skills?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profileUser.skills.map((skill: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  No skills listed.{' '}
                  {isOwnProfile && (
                    <button
                      className="underline underline-offset-2 hover:text-foreground"
                      onClick={() => setEditOpen(true)}
                    >
                      Add some
                    </button>
                  )}
                </p>
              )}
            </section>

            <section className="rounded-xl border bg-card p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Details
              </h2>
              <dl className="space-y-2 text-sm">
                {profileUser.email && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Email</dt>
                    <dd className="truncate">{profileUser.email}</dd>
                  </div>
                )}
                {profileUser.job_title && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Title</dt>
                    <dd>{profileUser.job_title}</dd>
                  </div>
                )}
                {profileUser.department && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Department</dt>
                    <dd>{profileUser.department}</dd>
                  </div>
                )}
                {profileUser.location && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Location</dt>
                    <dd>{profileUser.location}</dd>
                  </div>
                )}
              </dl>
            </section>
          </div>
        </div>
      </div>

      {isOwnProfile && (
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          user={profileUser}
          onSaved={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: NonNullable<ReturnType<typeof useUserProfile>['data']>;
  onSaved: () => void;
}

function EditProfileDialog({ open, onOpenChange, user, onSaved }: EditProfileDialogProps) {
  const { refreshUser } = useAuth();
  const updateProfile = useUpdateProfile();

  const [bio, setBio] = useState(user.bio ?? '');
  const [jobTitle, setJobTitle] = useState(user.job_title ?? '');
  const [department, setDepartment] = useState(user.department ?? '');
  const [location, setLocation] = useState(user.location ?? '');
  const [skillsRaw, setSkillsRaw] = useState((user.skills ?? []).join(', '));

  const [experience, setExperience] = useState<Experience[]>(user.experience ?? []);

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setErr('');

    const skills = skillsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: UpdateProfilePayload = {
      bio: bio || null,
      job_title: jobTitle || null,
      department: department || null,
      location: location || null,
      skills,
      experience,
    };

    updateProfile.mutate(payload, {
      onSuccess: async (data) => {
        setMsg(data.message);
        await refreshUser();
        setTimeout(() => {
          onSaved();
        }, 800);
      },
      onError: () => {
        setErr('Failed to save profile. Please try again.');
      },
    });
  };

  const addExperience = () =>
    setExperience((prev) => [
      ...prev,
      { company: '', title: '', start_date: '', end_date: null, current: false },
    ]);

  const removeExperience = (idx: number) =>
    setExperience((prev) => prev.filter((_, i) => i !== idx));

  const updateExp = (idx: number, field: keyof Experience, value: string | boolean | null) =>
    setExperience((prev) =>
      prev.map((exp, i) => (i === idx ? { ...exp, [field]: value } : exp)),
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your public profile information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {msg && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {msg}
            </div>
          )}
          {err && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {err}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="ep-bio">Bio</Label>
            <Textarea
              id="ep-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your team a little about yourself…"
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ep-job-title">Job Title</Label>
              <Input
                id="ep-job-title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Engineer"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ep-department">Department</Label>
              <Input
                id="ep-department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ep-location">Location</Label>
            <Input
              id="ep-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Tel Aviv, Israel"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ep-skills">Skills</Label>
            <Input
              id="ep-skills"
              value={skillsRaw}
              onChange={(e) => setSkillsRaw(e.target.value)}
              placeholder="e.g. React, TypeScript, Laravel"
            />
            <p className="text-xs text-muted-foreground">Comma-separated list of skills</p>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Experience</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addExperience}>
                + Add
              </Button>
            </div>

            {experience.map((exp, idx) => (
              <div
                key={idx}
                className="space-y-2 rounded-lg border bg-muted/30 p-3"
              >
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={exp.title}
                      onChange={(e) => updateExp(idx, 'title', e.target.value)}
                      placeholder="e.g. Lead Developer"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Company</Label>
                    <Input
                      value={exp.company}
                      onChange={(e) => updateExp(idx, 'company', e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      value={exp.start_date}
                      onChange={(e) => updateExp(idx, 'start_date', e.target.value)}
                      placeholder="e.g. Jan 2022"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">End Date</Label>
                    <Input
                      value={exp.current ? '' : (exp.end_date ?? '')}
                      onChange={(e) => updateExp(idx, 'end_date', e.target.value || null)}
                      placeholder={exp.current ? 'Present' : 'e.g. Mar 2024'}
                      disabled={exp.current}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={exp.current}
                      onChange={(e) => {
                        updateExp(idx, 'current', e.target.checked);
                        if (e.target.checked) updateExp(idx, 'end_date', null);
                      }}
                      className="accent-primary"
                    />
                    Currently working here
                  </label>
                  <button
                    type="button"
                    onClick={() => removeExperience(idx)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
