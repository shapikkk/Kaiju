import type { ReactNode } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { Button } from '@shared/ui/button';
import { Briefcase, MapPin, Mail, MessageCircle } from 'lucide-react';
import { useUserProfile } from '../model/useProfile';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface UserMiniProfileProps {
  userId: number;
  userName: string;
  userAvatar?: string | null;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  onMessageClick?: () => void;
}


export function UserMiniProfile({
  userId,
  userName,
  userAvatar,
  children,
  side = 'top',
  onMessageClick,
}: UserMiniProfileProps) {
  const { data: profile } = useUserProfile(userId);

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={side}
        align="start"
        className="w-72 p-0 overflow-hidden rounded-2xl border border-white/5 bg-background/80 backdrop-blur-2xl shadow-2xl shadow-black/50"
        sideOffset={8}
      >
        {/* Ambient glow header — no hard edge */}
        <div className="relative pt-12 pb-5 flex flex-col items-center px-4">
          {/* Floating glow that dissipates downward */}
          <div className="absolute top-0 left-0 w-full h-44 bg-gradient-to-b from-primary/25 to-transparent -z-10 backdrop-blur-xl rounded-t-xl" />
          <div className="inline-flex rounded-full p-[3px] bg-background/80 backdrop-blur-md shadow-xl">
            <Avatar className="h-14 w-14">
              <AvatarImage src={userAvatar ?? profile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-sm font-bold bg-primary/15 text-primary">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="mt-2.5 text-center">
            <p className="text-sm font-bold leading-tight tracking-tight">{userName}</p>
            {profile?.email && (
              <p className="mt-0.5 text-[11px] text-muted-foreground/70">{profile.email}</p>
            )}
          </div>

          {(profile?.bio || profile?.job_title || profile?.location || profile?.email) && (
            <div className="mt-3 w-full space-y-2">
              {profile?.bio && (
                <p className="text-[11px] leading-relaxed text-muted-foreground/90 italic line-clamp-2">
                  {profile.bio}
                </p>
              )}

              <div className="space-y-1.5">
                {profile?.job_title && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Briefcase className="h-3 w-3" />
                    </span>
                    <span className="leading-none">
                      {profile.job_title}{profile.department ? ` · ${profile.department}` : ''}
                    </span>
                  </div>
                )}
                {profile?.location && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-rose-500/10 text-rose-400">
                      <MapPin className="h-3 w-3" />
                    </span>
                    <span className="leading-none">{profile.location}</span>
                  </div>
                )}
                {profile?.email && !profile?.job_title && !profile?.bio && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-sky-500/10 text-sky-400">
                      <Mail className="h-3 w-3" />
                    </span>
                    <span className="leading-none">{profile.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {onMessageClick && (
            <div className="mt-4 pt-3 w-full border-t border-white/5">
              <Button
                size="sm"
                className="w-full h-8 rounded-xl text-xs font-semibold gap-1.5"
                onClick={onMessageClick}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Send Message
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
