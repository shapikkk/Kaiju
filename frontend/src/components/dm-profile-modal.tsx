import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { Input } from '@shared/ui/input';
import { Textarea } from '@shared/ui/textarea';
import { Button } from '@shared/ui/button';
import {
  Mail,
  AtSign,
  Share2,
  Pencil,
  Trash2,
  ShieldOff,
  Shield,
  ImageIcon,
  FileText,
  Video,
  Link2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Copy,
  Download,
  MessageSquare,
} from 'lucide-react';
import { LightBox } from '@shared/ui/lightbox';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@shared/ui/context-menu';
import { dmApi, type ConversationAttachment } from '@/api/dm';
import type { Conversation } from "@shared/types";
import { toast } from 'sonner';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
}

function formatMonthYear(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isCurrentYear = date.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: isCurrentYear ? undefined : 'numeric',
  }).format(date);
}

function groupAttachmentsByMonth(items: ConversationAttachment[]): Record<string, ConversationAttachment[]> {
  const groups: Record<string, ConversationAttachment[]> = {};
  items.forEach(item => {
    const monthKey = formatMonthYear(item.created_at);
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(item);
  });
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });
  return groups;
}

type AttachTab = 'image' | 'video' | 'file' | 'link';

const TAB_CONFIG: { key: AttachTab; label: string; icon: React.ElementType }[] = [
  { key: 'image', label: 'Photos', icon: ImageIcon },
  { key: 'video', label: 'Videos', icon: Video },
  { key: 'file', label: 'Files', icon: FileText },
  { key: 'link', label: 'Links', icon: Link2 },
];

const TAB_STYLE: Record<AttachTab, { bg: string; text: string }> = {
  image: { bg: 'bg-rose-500/15',   text: 'text-rose-400'   },
  video: { bg: 'bg-amber-500/15',  text: 'text-amber-400'  },
  file:  { bg: 'bg-sky-500/15',    text: 'text-sky-400'    },
  link:  { bg: 'bg-violet-500/15', text: 'text-violet-400' },
};

interface DMProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conv: Conversation;
  onDeleted?: () => void;
}

interface AttachmentViewProps {
  items: ConversationAttachment[];
  type: AttachTab;
  onBack: () => void;
  convId: number;
  currentUserId: number | undefined;
  onShowInChat?: (messageId: number) => void;
}

function AttachmentView({ items, type, onBack, convId, currentUserId, onShowInChat }: AttachmentViewProps) {
  const qc = useQueryClient();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const grouped = useMemo(() => groupAttachmentsByMonth(items), [items]);
  const sortedMonths = useMemo(() => {
    return Object.keys(grouped).sort((a, b) => {
      const dateA = new Date(grouped[a][0]?.created_at ?? 0);
      const dateB = new Date(grouped[b][0]?.created_at ?? 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [grouped]);

  const allImages = useMemo(() => {
    if (type !== 'image') return [] as string[];
    return sortedMonths.flatMap((month) => grouped[month].map((item) => item.url));
  }, [type, sortedMonths, grouped]);

  const imageIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    let idx = 0;
    sortedMonths.forEach((month) => { grouped[month].forEach((item) => { map.set(item.id, idx++); }); });
    return map;
  }, [sortedMonths, grouped]);

  const deleteMsgMutation = useMutation({
    mutationFn: (messageId: number) => dmApi.deleteMessage(convId, messageId),
    onSuccess: (_, messageId) => {
      qc.setQueryData<ConversationAttachment[]>(
        ['conv-attachments', convId],
        (old) => old?.filter((a) => a.message_id !== messageId) ?? old
      );
    },
  });

  const tabMeta = TAB_CONFIG.find(t => t.key === type);
  const Icon = tabMeta?.icon ?? FileText;
  const label = tabMeta?.label ?? 'Items';
  const style = TAB_STYLE[type];

  if (items.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex shrink-0 items-center gap-3 border-b border-white/5 bg-background/80 backdrop-blur-xl px-4 py-3">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-all hover:bg-muted/80 active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">{label}</span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className={`mb-3 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${style.bg}`}>
              <Icon className={`h-6 w-6 ${style.text}`} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No {label.toLowerCase()} yet</p>
            <p className="mt-1 text-xs text-muted-foreground/50">Shared {label.toLowerCase()} will appear here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex shrink-0 items-center gap-3 border-b border-white/5 bg-background/80 backdrop-blur-xl px-4 py-3">
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-all hover:bg-muted/80 active:scale-95"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{label}</span>
          <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
            {items.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedMonths.map(month => (
          <div key={month}>
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {month}
              </span>
            </div>

            {type === 'image' ? (
              <div className="grid grid-cols-3 gap-1.5 px-4 pb-3">
                {grouped[month].map((item) => (
                  <ContextMenu key={item.id}>
                    <ContextMenuTrigger asChild>
                      <button
                        onClick={() => setLightboxIndex(imageIndexMap.get(item.id) ?? 0)}
                        className="aspect-square overflow-hidden rounded-xl bg-muted/50 focus:outline-none transition-all active:scale-95"
                      >
                        <img
                          src={item.url}
                          alt={item.name ?? 'media'}
                          className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                          loading="lazy"
                        />
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      {item.message_id && onShowInChat && (
                        <ContextMenuItem className="gap-2" onClick={() => onShowInChat(item.message_id!)}>
                          <MessageSquare className="h-3.5 w-3.5" /> Show in chat
                        </ContextMenuItem>
                      )}
                      <ContextMenuItem className="gap-2" onClick={() => navigator.clipboard.writeText(item.url).catch(() => {})}>
                        <Copy className="h-3.5 w-3.5" /> Copy Image URL
                      </ContextMenuItem>
                      <ContextMenuItem className="gap-2" onClick={() => {
                        const a = document.createElement('a');
                        a.href = item.url;
                        a.download = item.name ?? 'image';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}>
                        <Download className="h-3.5 w-3.5" /> Download
                      </ContextMenuItem>
                      {item.user.id === currentUserId && item.message_id && (
                        <>
                          <ContextMenuSeparator />
                          <ContextMenuItem
                            className="gap-2 text-destructive focus:text-destructive"
                            onClick={() => deleteMsgMutation.mutate(item.message_id!)}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </ContextMenuItem>
                        </>
                      )}
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </div>
            ) : (
              <div className="space-y-0.5 px-3 pb-3">
                {grouped[month].map((item) => {
                  const RowIcon = type === 'video' ? Video : type === 'link' ? Link2 : FileText;
                  return (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-muted/50 active:scale-[0.98]"
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.bg} ${style.text}`}>
                        <RowIcon className="h-[18px] w-[18px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.name ?? 'File'}</p>
                        <p className="text-xs text-muted-foreground/70">{formatDate(item.created_at)}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <LightBox
        images={allImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </div>
  );
}

interface EditContactViewProps {
  conv: Conversation;
  onBack: () => void;
}

function EditContactView({ conv, onBack }: EditContactViewProps) {
  const qc = useQueryClient();
  const otherUser = conv.other_user;

  const nameParts = (conv.local_name ?? '').trim().split(/\s+/);
  const [firstName, setFirstName] = useState(nameParts[0] ?? '');
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' '));
  const [note, setNote] = useState(conv.local_note ?? '');

  const saveMutation = useMutation({
    mutationFn: () => {
      const combined = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || null;
      return dmApi.updateContactName(conv.id, { local_name: combined, local_note: note.trim() || null });
    },
    onSuccess: () => {
      const newName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || null;
      qc.setQueriesData<Conversation[]>(
        { queryKey: ['conversations'], exact: false },
        (old) => old?.map((c) =>
          c.id === conv.id ? { ...c, local_name: newName, local_note: note.trim() || null } : c
        ) ?? old
      );
      onBack();
    },
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-white/5 bg-background/80 backdrop-blur-xl px-4 py-3">
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-all hover:bg-muted/80 active:scale-95"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">Edit Contact</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-full p-[3px] bg-background/80 backdrop-blur-md shadow-xl">
            <Avatar className="h-24 w-24">
              <AvatarImage src={otherUser?.avatar_url ?? undefined} />
              <AvatarFallback className="text-2xl font-bold bg-primary/15 text-primary">
                {getInitials(otherUser?.name ?? '?')}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">First name</label>
            <Input
              autoFocus
              placeholder={otherUser?.name.split(' ')[0] ?? 'First name'}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveMutation.mutate()}
              className="rounded-xl bg-muted/30 border-white/10 focus-visible:border-primary/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Last name</label>
            <Input
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveMutation.mutate()}
              className="rounded-xl bg-muted/30 border-white/10 focus-visible:border-primary/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Note <span className="font-normal normal-case text-muted-foreground/50">(only visible to you)</span>
            </label>
            <Textarea
              placeholder="Add a private note about this contact…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="resize-none rounded-xl bg-muted/30 border-white/10 focus-visible:border-primary/40"
            />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-2 border-t border-white/5 px-4 py-3">
        <Button variant="ghost" className="rounded-xl" onClick={onBack}>Cancel</Button>
        <Button className="rounded-xl" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  );
}

type DmScreen = 'main' | 'edit-contact' | { tab: AttachTab };

export function DMProfileModal({ open, onOpenChange, conv, onDeleted }: DMProfileModalProps) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [screen, setScreen] = useState<DmScreen>('main');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScreen('main');
      setConfirmDelete(false);
    }
  }, [open]);

  const otherUser = conv.other_user;
  const displayName = conv.local_name ?? otherUser?.name ?? 'Unknown';

  const { data: allAttachments = [] } = useQuery<ConversationAttachment[]>({
    queryKey: ['conv-attachments', conv.id],
    queryFn: () => dmApi.getAttachments(conv.id, 'all'),
    enabled: open,
    staleTime: 30_000,
  });

  const attachmentCounts = useMemo(() => {
    const counts: Record<AttachTab, number> = { image: 0, video: 0, file: 0, link: 0 };
    allAttachments.forEach((a) => {
      const t = a.type ?? '';
      if (t === 'image' || t.startsWith('image/')) counts.image++;
      else if (t === 'video' || t === 'audio' || t.startsWith('video/')) counts.video++;
      else if (t === 'link') counts.link++;
      else counts.file++;
    });
    return counts;
  }, [allAttachments]);

  const filteredAttachments = useMemo(() => {
    if (screen === 'main' || screen === 'edit-contact') return [];
    const tab = (screen as { tab: AttachTab }).tab;
    return allAttachments.filter((a) => {
      const t = a.type ?? '';
      if (tab === 'image') return t === 'image' || t.startsWith('image/');
      if (tab === 'video') return t === 'video' || t === 'audio' || t.startsWith('video/');
      if (tab === 'link') return t === 'link';
      return t !== 'image' && !t.startsWith('image/') && t !== 'video' && t !== 'audio' && !t.startsWith('video/') && t !== 'link';
    });
  }, [allAttachments, screen]);

  const handleShowInChat = useCallback((messageId: number) => {
    onOpenChange(false);
    setTimeout(() => {
      const el = document.getElementById(`dm-${conv.id}-${messageId}`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary/40', 'rounded-2xl', 'transition-all');
      setTimeout(() => el.classList.remove('ring-2', 'ring-primary/40', 'rounded-2xl', 'transition-all'), 1500);
    }, 300);
  }, [conv.id, onOpenChange]);

  const { data: isBlocked = false, refetch: refetchBlock } = useQuery<boolean>({
    queryKey: ['block-status', otherUser?.id],
    queryFn: () => dmApi.checkBlock(otherUser!.id),
    enabled: open && !!otherUser?.id,
    staleTime: 30_000,
  });

  const deleteConvMutation = useMutation({
    mutationFn: () => dmApi.deleteConversation(conv.id),
    onSuccess: () => {
      qc.setQueriesData<Conversation[]>(
        { queryKey: ['conversations'], exact: false },
        (old) => old?.filter((c) => c.id !== conv.id) ?? old
      );
      toast.success('Conversation deleted');
      onOpenChange(false);
      onDeleted?.();
    },
  });

  const blockMutation = useMutation({
    mutationFn: () => (isBlocked ? dmApi.unblockUser(otherUser!.id) : dmApi.blockUser(otherUser!.id)),
    onSuccess: () => {
      toast.success(isBlocked ? 'User unblocked' : 'User blocked');
      refetchBlock();
    },
  });

  if (!otherUser) return null;

  const isAttachScreen = screen !== 'main' && screen !== 'edit-contact';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex h-[min(82vh,640px)] w-full max-w-sm flex-col gap-0 overflow-hidden p-0"
          onInteractOutside={(e) => {
            if (document.getElementById('lightbox-portal')) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (document.getElementById('lightbox-portal')) e.preventDefault();
          }}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Contact Info</DialogTitle>
          </DialogHeader>

          {screen === 'edit-contact' ? (
            <EditContactView conv={conv} onBack={() => setScreen('main')} />
          ) : isAttachScreen ? (
            <AttachmentView
              items={filteredAttachments}
              type={(screen as { tab: AttachTab }).tab}
              onBack={() => setScreen('main')}
              convId={conv.id}
              currentUserId={user?.id}
              onShowInChat={handleShowInChat}
            />
          ) : (
            <>
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-64 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-transparent"></div>
                <div className="absolute -right-8 -top-6 h-48 w-48 rounded-full bg-primary/20 blur-3xl opacity-50"></div>
                <div className="absolute -left-6 top-8 h-36 w-36 rounded-full bg-violet-500/20 blur-3xl opacity-50"></div>
              </div>

              <div className="relative z-10 flex h-full flex-col overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                <div className="shrink-0 flex flex-col items-center pt-10 px-6 pb-2">
                  <div className="inline-flex rounded-full p-[3px] bg-background shadow-2xl shadow-black/40">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={otherUser.avatar_url ?? undefined} />
                      <AvatarFallback className="text-2xl font-bold bg-primary/15 text-primary">
                        {getInitials(otherUser.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="mt-3 text-center">
                    <h2 className="text-[17px] font-bold leading-tight tracking-tight">{displayName}</h2>
                    {conv.local_name && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{otherUser.name}</p>
                    )}
                    {conv.local_note && (
                      <p className="mt-0.5 text-xs italic text-muted-foreground/70">{conv.local_note}</p>
                    )}
                    <p className="mt-1 text-[12px] text-muted-foreground/70">{otherUser.email}</p>
                  </div>

                  <div className="mt-5 mb-3 flex items-start gap-5">
                    <button
                      onClick={() => setScreen('edit-contact')}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-foreground shadow-sm transition-all hover:bg-muted/80 active:scale-95">
                        <Pencil className="h-[18px] w-[18px]" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">Edit</span>
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(`${otherUser.name} · ${otherUser.email ?? ''}`).then(() => toast.success('Contact info copied to clipboard')).catch(() => {})}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-foreground shadow-sm transition-all hover:bg-muted/80 active:scale-95">
                        <Share2 className="h-[18px] w-[18px]" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">Share</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 px-4 pb-6 pt-2 space-y-3">

                  <div className="overflow-hidden rounded-2xl border border-white/5 bg-muted/20">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <span className="break-all text-sm">{otherUser.email}</span>
                    </div>
                    <div className="mx-4 h-px bg-border/30" />
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                        <AtSign className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        @{otherUser.name.toLowerCase().replace(/\s+/g, '.')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                      Media &amp; Files
                    </p>
                    <div className="overflow-hidden rounded-2xl border border-white/5 bg-muted/20 p-1">
                      {TAB_CONFIG.map((tab) => {
                        const Icon = tab.icon;
                        const ts = TAB_STYLE[tab.key];
                        return (
                          <button
                            key={tab.key}
                            onClick={() => setScreen({ tab: tab.key })}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-muted/50 active:scale-[0.98]"
                          >
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${ts.bg} ${ts.text}`}>
                              <Icon className="h-[18px] w-[18px]" />
                            </div>
                            <span className="flex-1 text-sm font-medium">{tab.label}</span>
                            <span className="min-w-[22px] rounded-full bg-muted/70 px-2 py-0.5 text-center text-[11px] font-semibold tabular-nums text-muted-foreground">
                              {attachmentCounts[tab.key]}
                            </span>
                            <ChevronRight className="ml-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                      Danger Zone
                    </p>
                    <div className="overflow-hidden rounded-2xl border border-white/5 bg-muted/20 p-1">
                      <button
                        onClick={() => blockMutation.mutate()}
                        disabled={blockMutation.isPending}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all active:scale-[0.98] hover:bg-muted/50"
                      >
                        {isBlocked ? (
                          <>
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                              <Shield className="h-[18px] w-[18px]" />
                            </div>
                            <span className="flex-1 text-sm font-medium text-emerald-400">Unblock User</span>
                          </>
                        ) : (
                          <>
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                              <ShieldOff className="h-[18px] w-[18px]" />
                            </div>
                            <span className="flex-1 text-sm font-medium text-destructive">Block User</span>
                          </>
                        )}
                      </button>
                      <div className="mx-3 h-px bg-destructive/10" />
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-destructive/10 active:scale-[0.98]"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                          <Trash2 className="h-[18px] w-[18px]" />
                        </div>
                        <span className="flex-1 text-sm font-medium text-destructive">Delete Chat</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Delete conversation?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will remove the conversation from your list. The other person can still message you.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteConvMutation.isPending}
              onClick={() => { setConfirmDelete(false); deleteConvMutation.mutate(); }}
            >
              {deleteConvMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
