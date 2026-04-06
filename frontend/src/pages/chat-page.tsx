import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@entities/user/model/useAuth';
import { useChannelChat, useChannels, useChannelManagement } from '@entities/channel/model/useChannelChat';
import { useConversations, useDirectMessages } from '@entities/conversation/model/useDirectMessages';
import { useWorkspaces } from '@shared/lib/api/useApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dmApi } from '@entities/conversation/api/dm';
import apiClient from '@shared/lib/api/client';
import { ChatInput } from '@/components/chat-input';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { LightBox } from '@shared/ui/lightbox';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@shared/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu';
import { cn } from '@shared/lib/utils';
import {
  Hash,
  Search,
  Users,
  MessageSquarePlus,
  FileText,
  ImageIcon,
  Reply,
  Pencil,
  Trash2,
  Check,
  CheckCheck,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  Settings2,
  Copy,
  Download,
} from 'lucide-react';
import type { Channel, WorkspaceMessage, DirectMessage, Conversation, WorkspaceMember } from "@shared/types";
import { UserMiniProfile } from '@/components/user-mini-profile';
import { DMProfileModal } from '@/components/dm-profile-modal';
import { CreateChannelDialog, EditChannelDialog } from '@/components/channel-manage-dialog';
type ChatMsg = WorkspaceMessage | DirectMessage;
type ActiveChat =
  | { type: 'channel'; channel: Channel }
  | { type: 'dm'; conv: Conversation };

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function truncate(text: string, max = 60) {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function AttachmentRenderer({ url, name, type, isMine, onDelete, onImageLoad }: { url: string; name: string | null; type: 'image' | 'file'; isMine: boolean; onDelete?: () => void; onImageLoad?: () => void }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleLoad = () => {
    setLoaded(true);
    onImageLoad?.();
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name ?? 'image';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url)
      .then(() => toast.success('Image URL copied'))
      .catch(() => {});
  };

  if (type === 'image') {
    return (
      <>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <button onClick={() => setLightboxOpen(true)} className="mt-1.5 block focus:outline-none">
              <div className="relative overflow-hidden rounded-xl bg-muted" style={{ aspectRatio: '4/3', width: '240px', maxWidth: '100%' }}>
                {!loaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                )}
                <img
                  src={url}
                  alt={name ?? 'image'}
                  className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                  loading="lazy"
                  onLoad={handleLoad}
                />
              </div>
            </button>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            <ContextMenuItem className="gap-2" onClick={handleCopyUrl}>
              <Copy className="h-3.5 w-3.5" /> Copy Image URL
            </ContextMenuItem>
            <ContextMenuItem className="gap-2" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" /> Download
            </ContextMenuItem>
            {isMine && onDelete && (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem
                  className="gap-2 text-destructive focus:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </ContextMenuItem>
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>
        <LightBox images={[url]} index={lightboxOpen ? 0 : null} onClose={() => setLightboxOpen(false)} />
      </>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1.5 flex min-w-0 max-w-[220px] items-center gap-3 rounded-xl border bg-background px-3 py-2.5 shadow-sm transition-colors hover:bg-muted/60"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-medium leading-tight">{name ?? 'File'}</p>
        <p className="text-[10px] text-muted-foreground">Open file</p>
      </div>
    </a>
  );
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="rounded-full border bg-muted/60 px-3 py-0.5 text-[10px] font-medium text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

interface BubbleMenuProps {
  children: React.ReactNode;
  msg: ChatMsg;
  isMine: boolean;
  onReply: (msg: ChatMsg) => void;
  onEdit?: (msg: ChatMsg) => void;
  onDelete?: (id: number) => void;
}

function BubbleMenu({ children, msg, isMine, onReply, onEdit, onDelete }: BubbleMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        <ContextMenuItem className="gap-2" onClick={() => onReply(msg)}>
          <Reply className="h-3.5 w-3.5" /> Reply
        </ContextMenuItem>
        {isMine && onEdit && onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem className="gap-2" onClick={() => onEdit(msg)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </ContextMenuItem>
            <ContextMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onClick={() => onDelete(msg.id)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface BubbleProps {
  msg: ChatMsg;
  isMine: boolean;
  isConsecutive: boolean;
  onReply: (msg: ChatMsg) => void;
  onEdit?: (msg: ChatMsg) => void;
  onDelete?: (id: number) => void;
  onScrollTo: (id: number) => void;
  onImageLoad?: () => void;
  idPrefix?: string;
  otherUserLastReadAt?: string | null;
}

function MessageBubble({ msg, isMine, isConsecutive, onReply, onEdit, onDelete, onScrollTo, onImageLoad, idPrefix = 'chat', otherUserLastReadAt }: BubbleProps) {
  const initials = getInitials(msg.user.name);
  const hasText = !!msg.body;
  const hasAttachment = !!msg.attachment_url;

  let receiptIcon: React.ReactNode = null;
  if (isMine && otherUserLastReadAt !== undefined) {
    const isRead = otherUserLastReadAt
      ? new Date(otherUserLastReadAt) >= new Date(msg.created_at)
      : false;
    receiptIcon = isRead
      ? <CheckCheck className="h-3 w-3 text-primary" />
      : <Check className="h-3 w-3 text-muted-foreground/60" />;
  }

  const avatarNode = (
    <Avatar className="h-7 w-7 shrink-0 self-end cursor-pointer">
      <AvatarImage src={msg.user.avatar_url ?? undefined} />
      <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
    </Avatar>
  );

  return (
    <div
      id={`${idPrefix}-${msg.id}`}
      className={`flex w-full items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} ${isConsecutive ? 'mt-1' : 'mt-4'}`}
    >
      {!isConsecutive ? (
        isMine ? avatarNode : (
          <UserMiniProfile userId={msg.user.id} userName={msg.user.name} userAvatar={msg.user.avatar_url} side="right">
            {avatarNode}
          </UserMiniProfile>
        )
      ) : (
        <div className="h-7 w-7 shrink-0" />
      )}

      <div className={`flex min-w-0 max-w-[80%] flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
        {!isConsecutive && (
          <span className="px-1 text-[10px] text-muted-foreground">
            {isMine ? 'You' : (
              <UserMiniProfile userId={msg.user.id} userName={msg.user.name} userAvatar={msg.user.avatar_url} side="top">
                <button className="hover:underline focus:outline-none">{msg.user.name}</button>
              </UserMiniProfile>
            )} · {formatTime(msg.created_at)}
          </span>
        )}

        {msg.reply_to && (
          <button
            onClick={() => onScrollTo(msg.reply_to!.id)}
            className={`mb-0.5 w-full cursor-pointer rounded-xl border-l-2 border-primary/50 bg-muted/40 px-3 py-1.5 text-left transition-colors hover:bg-muted ${isMine ? 'rounded-br-none' : 'rounded-bl-none'}`}
          >
            <p className="text-[10px] font-semibold text-primary">{msg.reply_to.user.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{truncate(msg.reply_to.body ?? '', 80)}</p>
          </button>
        )}

        {hasText && (
          <BubbleMenu msg={msg} isMine={isMine} onReply={onReply} onEdit={onEdit} onDelete={onDelete}>
            <div
              className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm whitespace-pre-wrap cursor-default select-text ${
                isMine
                  ? 'rounded-br-sm bg-primary text-primary-foreground'
                  : 'rounded-bl-sm border bg-muted/50 text-foreground'
              }`}
            >
              {msg.body}
              {'is_edited' in msg && msg.is_edited && <span className="ml-1.5 text-[10px] opacity-60">(edited)</span>}
            </div>
          </BubbleMenu>
        )}

        {hasAttachment && (
          <BubbleMenu msg={msg} isMine={isMine} onReply={onReply} onEdit={onEdit} onDelete={onDelete}>
            <div className="min-w-0">
              <AttachmentRenderer
                url={msg.attachment_url!}
                name={msg.attachment_name}
                type={msg.attachment_type!}
                isMine={isMine}
                onDelete={onDelete ? () => onDelete(msg.id) : undefined}
                onImageLoad={onImageLoad}
              />
            </div>
          </BubbleMenu>
        )}

        {isMine && receiptIcon && (
          <div className="flex items-center gap-0.5 pr-1 pt-0.5">
            {receiptIcon}
          </div>
        )}
      </div>
    </div>
  );
}

interface MessageListProps {
  messages: ChatMsg[];
  currentUserId: number | undefined;
  onReply: (msg: ChatMsg) => void;
  onEdit?: (msg: ChatMsg) => void;
  onDelete?: (id: number) => void;
  onScrollTo: (id: number) => void;
  idPrefix?: string;
  emptyLabel?: string;
  otherUserLastReadAt?: string | null;
}

function MessageList({
  messages, currentUserId, onReply, onEdit, onDelete, onScrollTo,
  idPrefix = 'chat', emptyLabel = 'No messages yet', otherUserLastReadAt,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(messages.length);

  const handleImageLoad = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distFromBottom < 300) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const prevLen = prevLenRef.current;
    const newLen = messages.length;
    prevLenRef.current = newLen;
    if (newLen <= prevLen) return;
    if (prevLen === 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
      return;
    }
    const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distFromBottom < 300) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  useEffect(() => {
    prevLenRef.current = 0;
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [idPrefix]);

  return (
    <div
      ref={scrollRef}
      className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-6 pt-4 pb-[180px]"
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold">{emptyLabel}</p>
          <p className="mt-1 text-xs text-muted-foreground">Be the first to send a message!</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {messages.map((msg, index) => {
            const isMine = msg.user.id === currentUserId;
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const isConsecutive = !!prevMsg && prevMsg.user.id === msg.user.id && !msg.reply_to_id;
            const showDateSep = !prevMsg || !isSameDay(msg.created_at, prevMsg.created_at);
            return (
              <div key={msg.id}>
                {showDateSep && <DateSeparator label={formatDateLabel(msg.created_at)} />}
                <MessageBubble
                  msg={msg}
                  isMine={isMine}
                  isConsecutive={showDateSep ? false : isConsecutive}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onScrollTo={onScrollTo}
                  onImageLoad={handleImageLoad}
                  idPrefix={idPrefix}
                  otherUserLastReadAt={otherUserLastReadAt}
                />
              </div>
            );
          })}
          <div ref={bottomRef} className="h-[1px] shrink-0" />
        </div>
      )}
    </div>
  );
}

function scrollToMsg(id: number, prefix = 'chat') {
  const el = document.getElementById(`${prefix}-${id}`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('ring-2', 'ring-primary/40', 'rounded-2xl', 'transition-all');
  setTimeout(() => el.classList.remove('ring-2', 'ring-primary/40', 'rounded-2xl', 'transition-all'), 1500);
}

function useWorkspaceMembers(workspaceSlug: string | undefined) {
  return useQuery({
    queryKey: ['members', workspaceSlug],
    queryFn: async () => {
      const res = await apiClient.get<{ data: WorkspaceMember[] }>(`/workspaces/${workspaceSlug}/members`);
      return res.data.data;
    },
    enabled: !!workspaceSlug,
    staleTime: 60_000,
  });
}

function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (convId: number) => dmApi.markRead(convId),
    onSuccess: (_, convId) => {
      qc.setQueriesData<Conversation[]>(
        { queryKey: ['conversations'], exact: false },
        (old) => old?.map((c) => c.id === convId ? { ...c, unread_count: 0 } : c) ?? old
      );
    },
  });
}

function ChannelChatPane({ channel, workspaceSlug }: {
  channel: Channel;
  workspaceSlug: string;
}) {
  const { user } = useAuth();
  const { messages, onlineMembers, sendMessage, isSending, editMessage, deleteMessage } =
    useChannelChat(channel.id);
  const { data: members = [] } = useWorkspaceMembers(workspaceSlug);
  const [replyingTo, setReplyingTo] = useState<ChatMsg | null>(null);
  const [editingMsg, setEditingMsg] = useState<ChatMsg | null>(null);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-1.5 border-b bg-muted/20 px-6 py-1.5 text-xs text-muted-foreground">
        <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
        <Users className="h-3.5 w-3.5" />
        <span>{onlineMembers.length} online</span>
      </div>

      <MessageList
        messages={messages}
        currentUserId={user?.id}
        onReply={setReplyingTo}
        onEdit={(msg) => { setEditingMsg(msg); setReplyingTo(null); }}
        onDelete={deleteMessage}
        onScrollTo={(id) => scrollToMsg(id, `ch-${channel.id}`)}
        idPrefix={`ch-${channel.id}`}
        emptyLabel={`No messages in #${channel.name} yet`}
      />

      <div className="absolute bottom-0 left-0 w-full z-10 pointer-events-none px-4 pb-6 pt-2">
        <div className="pointer-events-auto">
          <ChatInput
            replyingTo={replyingTo}
            editingMsg={editingMsg}
            members={members}
            onCancelReply={() => setReplyingTo(null)}
            onCancelEdit={() => setEditingMsg(null)}
            onSend={(body, replyToId, file) => sendMessage(body, replyToId, file)}
            onEdit={(id, body) => editMessage(id, body)}
            isSending={isSending}
          />
        </div>
      </div>
    </div>
  );
}

function DMChatPane({ conv, onBack }: {
  conv: Conversation;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const { messages, isSending, sendMessage, editMessage, deleteMessage } = useDirectMessages(conv.id);
  const markRead = useMarkRead();
  const [replyingTo, setReplyingTo] = useState<ChatMsg | null>(null);
  const [editingMsg, setEditingMsg] = useState<ChatMsg | null>(null);
  const displayName = conv.local_name ?? conv.other_user?.name ?? 'Direct Message';

  useEffect(() => {
    markRead.mutate(conv.id);
  }, [conv.id]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b bg-muted/20 px-6 py-2 md:hidden">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{displayName}</span>
      </div>

      <MessageList
        messages={messages}
        currentUserId={user?.id}
        onReply={setReplyingTo}
        onEdit={(msg) => { setEditingMsg(msg); setReplyingTo(null); }}
        onDelete={deleteMessage}
        onScrollTo={(id) => scrollToMsg(id, `dm-${conv.id}`)}
        idPrefix={`dm-${conv.id}`}
        emptyLabel="Start a conversation"
        otherUserLastReadAt={conv.other_user_last_read_at}
      />

      <div className="absolute bottom-0 left-0 w-full z-10 pointer-events-none px-4 pb-6 pt-2">
        <div className="pointer-events-auto">
          <ChatInput
            replyingTo={replyingTo}
            editingMsg={editingMsg}
            members={conv.other_user ? [conv.other_user as WorkspaceMember] : []}
            onCancelReply={() => setReplyingTo(null)}
            onCancelEdit={() => setEditingMsg(null)}
            onSend={(body, replyToId, file) => sendMessage(body, replyToId, file)}
            onEdit={(id, body) => editMessage(id, body)}
            isSending={isSending}
          />
        </div>
      </div>
    </div>
  );
}

interface ChannelButtonProps {
  ch: Channel;
  isActive: boolean;
  onSelect: () => void;
  onEdit?: (ch: Channel) => void;
}

function ChannelButton({ ch, isActive, onSelect, onEdit }: ChannelButtonProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
      className={cn(
        'group flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
        isActive
          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      )}
    >
      <Hash className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 text-left font-medium">{ch.name}</span>
      {onEdit && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(ch); }}
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded transition-opacity',
            'opacity-0 group-hover:opacity-100',
            isActive
              ? 'hover:bg-sidebar-primary-foreground/20'
              : 'hover:bg-sidebar-accent-foreground/10',
          )}
          title="Channel settings"
        >
          <Settings2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

interface ChatListProps {
  workspaceSlug: string;
  active: ActiveChat;
  onSelect: (chat: ActiveChat) => void;
}

function ChatList({ workspaceSlug, active, onSelect, onCreateChannel, onEditChannel }: ChatListProps & { onCreateChannel: () => void; onEditChannel?: (ch: Channel) => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: workspaces = [] } = useWorkspaces();
  const { data: channels = [], isLoading: channelsLoading } = useChannels(workspaceSlug);
  const { conversations, isLoading: convsLoading, findOrCreate, isFindingOrCreating } = useConversations(workspaceSlug);
  const { data: members = [] } = useWorkspaceMembers(workspaceSlug);
  const [search, setSearch] = useState('');
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(true);

  const currentWorkspace = workspaces.find((w) => w.slug === workspaceSlug);
  const otherMembers = useMemo(() => members.filter((m) => m.id !== user?.id), [members, user]);
  const totalUnread = useMemo(() => conversations.reduce((s, c) => s + c.unread_count, 0), [conversations]);

  const filteredConvs = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => {
      const name = (c.local_name ?? c.other_user?.name ?? '').toLowerCase();
      return name.includes(q);
    });
  }, [conversations, search]);

  const activeChannelId = active.type === 'channel' ? active.channel.id : null;
  const activeDmId = active.type === 'dm' ? active.conv.id : null;

  const leakedDMs = useMemo(() => {
    if (dmsOpen) return [];
    return filteredConvs.filter((c) => c.unread_count > 0 || c.id === activeDmId);
  }, [dmsOpen, filteredConvs, activeDmId]);

  const leakedChannel = useMemo(() => {
    if (channelsOpen) return null;
    return channels.find((ch) => ch.id === activeChannelId) ?? null;
  }, [channelsOpen, channels, activeChannelId]);

  const renderConvButton = (conv: Conversation) => {
    const isDmActive = conv.id === activeDmId;
    const displayName = conv.local_name ?? conv.other_user?.name ?? 'Unknown';
    return (
      <button
        key={conv.id}
        onClick={() => onSelect({ type: 'dm', conv })}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors',
          isDmActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        )}
      >
        <div className="relative shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={conv.other_user?.avatar_url ?? undefined} />
            <AvatarFallback className="text-[10px] font-semibold">
              {getInitials(conv.other_user?.name ?? '?')}
            </AvatarFallback>
          </Avatar>
          {conv.unread_count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground ring-2 ring-sidebar">
              {conv.unread_count > 9 ? '9+' : conv.unread_count}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p className={cn('truncate text-[13px] leading-tight', conv.unread_count > 0 && 'font-semibold')}>
              {displayName}
            </p>
            {conv.last_message && (
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {formatTime(conv.last_message.created_at)}
              </span>
            )}
          </div>
          <p className={cn('truncate text-[11px]', conv.unread_count > 0 ? 'font-medium text-foreground' : 'text-muted-foreground')}>
            {conv.last_message?.body || 'Start a conversation'}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-r bg-sidebar">

      <div className="shrink-0 border-b px-2 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between gap-2 px-2 py-1.5 text-sm font-semibold hover:bg-sidebar-accent"
            >
              <span className="truncate">{currentWorkspace?.name ?? workspaceSlug}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            {workspaces.map((w) => (
              <DropdownMenuItem
                key={w.id}
                className="gap-2"
                onSelect={() => w.slug !== workspaceSlug && navigate(`/${w.slug}/chat`)}
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-[10px] font-bold text-primary">
                  {w.name[0]?.toUpperCase() ?? '?'}
                </div>
                <span className={cn('flex-1 truncate text-sm', w.slug === workspaceSlug && 'font-semibold')}>
                  {w.name}
                </span>
                {w.slug === workspaceSlug && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="shrink-0 px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search chats…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">

        <div className="mb-1">
          <div className="flex items-center justify-between px-2 pb-1 pt-3">
            <button
              onClick={() => setChannelsOpen((o) => !o)}
              className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              {channelsOpen
                ? <ChevronDown className="h-3 w-3 shrink-0" />
                : <ChevronRight className="h-3 w-3 shrink-0" />}
              Channels
            </button>
            <button
              onClick={onCreateChannel}
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              title="Add channel"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {channelsOpen ? (
            channelsLoading ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">Loading…</div>
            ) : (
              channels.map((ch) => (
                <ChannelButton
                  key={ch.id}
                  ch={ch}
                  isActive={ch.id === activeChannelId}
                  onSelect={() => onSelect({ type: 'channel', channel: ch })}
                  onEdit={onEditChannel}
                />
              ))
            )
          ) : (
            leakedChannel && (
              <ChannelButton
                key={leakedChannel.id}
                ch={leakedChannel}
                isActive={leakedChannel.id === activeChannelId}
                onSelect={() => onSelect({ type: 'channel', channel: leakedChannel })}
                onEdit={onEditChannel}
              />
            )
          )}
        </div>

        <div>
          <div className="flex items-center justify-between px-2 pb-1 pt-3">
            <button
              onClick={() => setDmsOpen((o) => !o)}
              className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              {dmsOpen
                ? <ChevronDown className="h-3 w-3 shrink-0" />
                : <ChevronRight className="h-3 w-3 shrink-0" />}
              Direct Messages
              {totalUnread > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                  disabled={isFindingOrCreating}
                  title="New message"
                >
                  <MessageSquarePlus className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {otherMembers.length === 0 ? (
                  <DropdownMenuItem disabled>No other members</DropdownMenuItem>
                ) : (
                  otherMembers.map((m) => (
                    <DropdownMenuItem
                      key={m.id}
                      className="gap-2"
                      onSelect={async () => {
                        const newConv = await findOrCreate(m.id);
                        const existing = conversations.find((c) => c.id === newConv.id);
                        onSelect({
                          type: 'dm',
                          conv: existing ?? {
                            id: newConv.id,
                            other_user: newConv.other_user,
                            other_user_last_read_at: null,
                            last_message: null,
                            unread_count: 0,
                            local_name: null,
                            local_note: null,
                          },
                        });
                      }}
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={m.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[9px]">{getInitials(m.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{m.name}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {dmsOpen ? (
            convsLoading ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">Loading…</div>
            ) : filteredConvs.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                {search ? 'No matches found' : 'No conversations yet'}
              </div>
            ) : (
              filteredConvs.map(renderConvButton)
            )
          ) : (
            leakedDMs.length > 0 ? (
              <div>
                {leakedDMs.map(renderConvButton)}
                <p className="px-3 pt-1 text-[10px] text-muted-foreground italic">
                  {filteredConvs.length - leakedDMs.length > 0 && `+${filteredConvs.length - leakedDMs.length} more hidden`}
                </p>
              </div>
            ) : null
          )}
        </div>

      </div>
    </div>
  );
}

function ChatHeader({ active, onDmProfileClick }: { active: ActiveChat; onDmProfileClick?: () => void }) {
  if (active.type === 'channel') {
    const { channel } = active;
    return (
      <div className="flex shrink-0 items-center gap-3 border-b bg-background px-6 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Hash className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">#{channel.name}</p>
          {channel.description && (
            <p className="text-[10px] text-muted-foreground">{channel.description}</p>
          )}
        </div>
      </div>
    );
  }

  const { conv } = active;
  const displayName = conv.local_name ?? conv.other_user?.name ?? 'Direct Message';
  return (
    <div className="flex shrink-0 items-center gap-3 border-b bg-background px-6 py-3">
      <button
        onClick={onDmProfileClick}
        className="flex items-center gap-3 rounded-lg transition-colors hover:bg-muted/40 -ml-2 px-2 py-1"
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={conv.other_user?.avatar_url ?? undefined} />
          <AvatarFallback className="text-[10px]">{getInitials(conv.other_user?.name ?? '?')}</AvatarFallback>
        </Avatar>
        <div className="text-left">
          <p className="text-sm font-semibold leading-tight">{displayName}</p>
          {conv.local_name && (
            <p className="text-[10px] text-muted-foreground">{conv.other_user?.name}</p>
          )}
          {!conv.local_name && (
            <p className="text-[10px] text-muted-foreground">Direct message</p>
          )}
        </div>
      </button>
    </div>
  );
}

function NoChatSelected() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <MessageSquarePlus className="h-7 w-7 text-muted-foreground" />
      </div>
      <div>
        <p className="text-base font-semibold">Select a conversation</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a channel or direct message from the left to start chatting.
        </p>
      </div>
    </div>
  );
}

export function ChatPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const navigate = useNavigate();
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const [dmProfileOpen, setDmProfileOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [editChannelOpen, setEditChannelOpen] = useState(false);
  const [selectedChannelForEdit, setSelectedChannelForEdit] = useState<Channel | null>(null);
  const { createChannel, isCreating, updateChannel, isUpdating, deleteChannel, isDeleting } = useChannelManagement(workspaceSlug);

  const { data: channels = [] } = useChannels(workspaceSlug);
  useEffect(() => {
    if (channels.length > 0 && activeChat === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveChat({ type: 'channel', channel: channels[0] });
    }
  }, [channels]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveChat(null);
    setDmProfileOpen(false);
  }, [workspaceSlug]);

  const { conversations } = useConversations(workspaceSlug);
  useEffect(() => {
    if (activeChat?.type === 'dm') {
      const fresh = conversations.find((c) => c.id === (activeChat as { type: 'dm'; conv: Conversation }).conv.id);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (fresh) setActiveChat((prev) => prev?.type === 'dm' ? { type: 'dm', conv: fresh } : prev);
    }
  }, [conversations]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeChat?.type === 'channel') {
      const fresh = channels.find((ch) => ch.id === (activeChat as { type: 'channel'; channel: Channel }).channel.id);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (fresh) setActiveChat((prev) => prev?.type === 'channel' ? { type: 'channel', channel: fresh } : prev);
    }
  }, [channels]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChannelDeleted = useCallback(() => {
    const deletedId = selectedChannelForEdit?.id ?? -1;
    if (activeChat?.type === 'channel' && activeChat.channel.id === deletedId) {
      const fallback = channels.find((ch) => ch.id !== deletedId);
      setActiveChat(fallback ? { type: 'channel', channel: fallback } : null);
    }
    setEditChannelOpen(false);
  }, [channels, activeChat, selectedChannelForEdit]);

  if (!workspaceSlug) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <p>No workspace selected. <button className="text-primary underline" onClick={() => navigate('/')}>Go home</button></p>
      </div>
    );
  }

  const fallbackChannel = channels[0] ?? { id: 0, name: 'general', description: null, is_default: true, position: 0 };

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <ChatList
        workspaceSlug={workspaceSlug}
        active={activeChat ?? { type: 'channel', channel: fallbackChannel }}
        onSelect={(chat) => { setActiveChat(chat); setDmProfileOpen(false); }}
        onCreateChannel={() => setCreateChannelOpen(true)}
        onEditChannel={(ch) => { setSelectedChannelForEdit(ch); setEditChannelOpen(true); }}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {activeChat == null ? (
          <NoChatSelected />
        ) : (
          <>
            <ChatHeader
              active={activeChat}
              onDmProfileClick={activeChat.type === 'dm' ? () => setDmProfileOpen(true) : undefined}
            />
            {activeChat.type === 'channel' ? (
              <ChannelChatPane
                channel={activeChat.channel}
                workspaceSlug={workspaceSlug}
              />
            ) : (
              <DMChatPane
                conv={activeChat.conv}
                onBack={() => setActiveChat({ type: 'channel', channel: fallbackChannel })}
              />
            )}
          </>
        )}
      </div>

      {activeChat?.type === 'dm' && (
        <DMProfileModal
          open={dmProfileOpen}
          onOpenChange={setDmProfileOpen}
          conv={activeChat.conv}
          onDeleted={() => {
            setActiveChat({ type: 'channel', channel: fallbackChannel });
            setDmProfileOpen(false);
          }}
        />
      )}

      <EditChannelDialog
        open={editChannelOpen}
        onOpenChange={setEditChannelOpen}
        channel={selectedChannelForEdit}
        onUpdate={async (name, description) => {
          if (!selectedChannelForEdit) return;
          try {
            await updateChannel(selectedChannelForEdit.id, { name, description });
            toast.success('Channel updated');
            setEditChannelOpen(false);
          } catch {
            toast.error('Failed to update channel');
          }
        }}
        onDelete={async () => {
          try {
            await deleteChannel(selectedChannelForEdit!.id);
            toast.success('Channel deleted');
            handleChannelDeleted();
          } catch {
            toast.error('Failed to delete channel');
          }
        }}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
      />

      <CreateChannelDialog
        open={createChannelOpen}
        onOpenChange={setCreateChannelOpen}
        onCreate={async (name, description) => {
          try {
            const newChannel = await createChannel({ name, description });
            toast.success('Channel created');
            setActiveChat({ type: 'channel', channel: newChannel });
          } catch {
            toast.error('Failed to create channel');
          }
        }}
        isCreating={isCreating}
      />
    </div>
  );
}
