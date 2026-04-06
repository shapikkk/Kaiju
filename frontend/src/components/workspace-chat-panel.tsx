import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { LightBox } from '@/components/ui/lightbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { ChatInput } from './chat-input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useChannels, useChannelChat } from '@/hooks/useChannelChat';
import { useConversations, useDirectMessages } from '@/hooks/useDirectMessages';
import apiClient from '@/api/client';
import { dmApi } from '@/api/dm';
import {
  Users, Reply, FileText,
  ImageIcon, Pencil, Trash2, MessageSquarePlus, ArrowLeft,
  Check, CheckCheck, Copy, Download
} from 'lucide-react';
import { UserMiniProfile } from '@/components/user-mini-profile';
import { Button } from '@/components/ui/button';
import type { WorkspaceMessage, DirectMessage, Conversation, WorkspaceMember } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string | undefined;
}

type ChatMsg = WorkspaceMessage | DirectMessage;

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
    navigator.clipboard.writeText(url).catch(() => {});
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

function MessageBubble({ msg, isMine, isConsecutive, onReply, onEdit, onDelete, onScrollTo, onImageLoad, idPrefix = 'msg', otherUserLastReadAt }: BubbleProps) {
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

  const BubbleMenu = ({ children }: { children: React.ReactNode }) => (
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

  const avatarNode = (
    <Avatar className="h-7 w-7 shrink-0 self-end cursor-pointer">
      <AvatarImage src={msg.user.avatar_url ?? undefined} />
      <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
    </Avatar>
  );

  return (
    <div
      id={`${idPrefix}-${msg.id}`}
      className={`flex w-full items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} ${
        isConsecutive ? 'mt-1' : 'mt-4'
      }`}
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

      <div className={`flex min-w-0 max-w-[85%] flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
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
            className={`mb-0.5 w-full cursor-pointer rounded-xl border-l-2 border-primary/50 bg-muted/40 px-3 py-1.5 text-left transition-colors hover:bg-muted ${
              isMine ? 'rounded-br-none' : 'rounded-bl-none'
            }`}
          >
            <p className="text-[10px] font-semibold text-primary">{msg.reply_to.user.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{truncate(msg.reply_to.body ?? '', 80)}</p>
          </button>
        )}

        {hasText && (
          <BubbleMenu>
            <div
              className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm whitespace-pre-wrap cursor-default select-text ${
                isMine
                  ? 'rounded-br-sm bg-primary text-primary-foreground'
                  : 'rounded-bl-sm border bg-muted/50 text-foreground'
              }`}
            >
              {msg.body}
              {msg.is_edited && <span className="ml-1.5 text-[10px] opacity-60">(edited)</span>}
            </div>
          </BubbleMenu>
        )}

        {hasAttachment && (
          <BubbleMenu>
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

interface ChatMessageListProps {
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

function ChatMessageList({
  messages, currentUserId, onReply, onEdit, onDelete, onScrollTo,
  idPrefix = 'msg', emptyLabel = 'No messages yet', otherUserLastReadAt,
}: ChatMessageListProps) {
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
    const newLen = messages.length;
    const didGrow = newLen > prevLenRef.current;
    prevLenRef.current = newLen;
    if (didGrow) {
      const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distFromBottom < 300) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [idPrefix]);

  return (
    <div
      ref={scrollRef}
      className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full"
      onWheel={(e) => e.stopPropagation()}
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">{emptyLabel}</p>
          <p className="mt-1 text-xs text-muted-foreground">Be the first to say something!</p>
        </div>
      ) : (
        <div className="flex flex-col pb-2">
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

function scrollToMsg(id: number, prefix = 'msg') {
  const el = document.getElementById(`${prefix}-${id}`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('ring-2', 'ring-primary/40', 'rounded-2xl', 'transition-all');
  setTimeout(() => el.classList.remove('ring-2', 'ring-primary/40', 'rounded-2xl', 'transition-all'), 1500);
}

function TeamChatTab({ workspaceSlug, open }: { workspaceSlug: string | undefined; open: boolean }) {
  const { user } = useAuth();
  const { data: channels = [] } = useChannels(open ? workspaceSlug : undefined);
  const generalChannel = channels[0];
  const { messages, onlineMembers, sendMessage, isSending, editMessage, deleteMessage } =
    useChannelChat(generalChannel?.id);
  const { data: members = [] } = useWorkspaceMembers(open ? workspaceSlug : undefined);
  const [replyingTo, setReplyingTo] = useState<ChatMsg | null>(null);
  const [editingMsg, setEditingMsg] = useState<ChatMsg | null>(null);

  return (
    <>
      <div className="flex shrink-0 items-center gap-1.5 border-b px-5 py-2 text-xs text-muted-foreground">
        <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
        <Users className="h-3.5 w-3.5" />
        <span>{onlineMembers.length} Online</span>
      </div>
      <ChatMessageList
        messages={messages}
        currentUserId={user?.id}
        onReply={setReplyingTo}
        onEdit={(msg) => { setEditingMsg(msg); setReplyingTo(null); }}
        onDelete={deleteMessage}
        onScrollTo={(id) => scrollToMsg(id, 'msg')}
        idPrefix="msg"
      />
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
    </>
  );
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
        (old) => old?.map((c) => c.id === convId ? { ...c, unread_count: 0 } : c) ?? old,
      );
    },
  });
}

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  onSelect: (conv: Conversation) => void;
  onNew: (userId: number) => Promise<{ id: number; other_user: Conversation['other_user'] }>;
  isFindingOrCreating: boolean;
  members: WorkspaceMember[];
}

function ConversationList({ conversations, isLoading, onSelect, onNew, isFindingOrCreating, members }: ConversationListProps) {
  const { user } = useAuth();
  const otherMembers = useMemo(() => members.filter((m) => m.id !== user?.id), [members, user]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-3 py-2.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 border-dashed text-xs text-muted-foreground hover:text-foreground"
              disabled={isFindingOrCreating}
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              New conversation
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            {otherMembers.length === 0 && (
              <DropdownMenuItem disabled>No other members</DropdownMenuItem>
            )}
            {otherMembers.map((member) => (
              <DropdownMenuItem
                key={member.id}
                className="gap-2.5"
                onSelect={async () => {
                  const conv = await onNew(member.id);
                  const existing = conversations.find((c) => c.id === conv.id);
                  onSelect(existing ?? {
                    id: conv.id,
                    other_user: conv.other_user,
                    other_user_last_read_at: null,
                    last_message: null,
                    unread_count: 0,
                    local_name: null,
                    local_note: null,
                  });
                }}
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={member.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[9px]">{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{member.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">Loading…</div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <MessageSquarePlus className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No conversations yet</p>
          <p className="text-xs text-muted-foreground">Start one above!</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              className="flex w-full items-center justify-between space-x-4 rounded-md p-2 hover:bg-muted/50 transition-all text-left group"
              onClick={() => onSelect(conv)}
            >
              <div className="flex items-center space-x-4 min-w-0">
                <div className="relative shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conv.other_user?.avatar_url ?? undefined} />
                    <AvatarFallback className="font-semibold bg-primary/5 text-primary">
                      {getInitials(conv.other_user?.name ?? '?')}
                    </AvatarFallback>
                  </Avatar>
                  {conv.unread_count > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background">
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </span>
                  )}
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                    {conv.local_name ?? conv.other_user?.name ?? 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                    {conv.last_message?.body || 'No messages yet'}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-[11px] text-muted-foreground self-start mt-1">
                {conv.last_message ? formatTime(conv.last_message.created_at) : ''}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ActiveConversation({
  conv, onBack,
}: { conv: Conversation; onBack: () => void }) {
  const { user } = useAuth();
  const { messages, isSending, sendMessage, editMessage, deleteMessage } = useDirectMessages(conv.id);
  const markRead = useMarkRead();
  const [replyingTo, setReplyingTo] = useState<ChatMsg | null>(null);
  const [editingMsg, setEditingMsg] = useState<ChatMsg | null>(null);

  useEffect(() => {
    markRead.mutate(conv.id);
  }, [conv.id]); 

  return (
    <>
      <div className="flex shrink-0 items-center gap-2.5 border-b px-3 py-2.5">
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-lg" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={conv.other_user?.avatar_url ?? undefined} />
          <AvatarFallback className="text-[10px]">{getInitials(conv.other_user?.name ?? '?')}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold leading-none">{conv.local_name ?? conv.other_user?.name ?? 'Direct Message'}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Direct message</p>
        </div>
      </div>

      <ChatMessageList
        messages={messages}
        currentUserId={user?.id}
        onReply={setReplyingTo}
        onEdit={(msg) => { setEditingMsg(msg); setReplyingTo(null); }}
        onDelete={deleteMessage}
        onScrollTo={(id) => scrollToMsg(id, `dm-${conv.id}`)}
        idPrefix={`dm-${conv.id}`}
        emptyLabel="No messages yet"
        otherUserLastReadAt={conv.other_user_last_read_at}
      />
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
    </>
  );
}

function DMTab({ workspaceSlug }: { workspaceSlug: string | undefined }) {
  const { conversations, isLoading, findOrCreate, isFindingOrCreating } = useConversations(workspaceSlug);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const { data: members = [] } = useWorkspaceMembers(workspaceSlug);

  useEffect(() => {
    if (activeConv) {
      const fresh = conversations.find((c) => c.id === activeConv.id);
      if (fresh) setActiveConv(fresh);
    }
  }, [conversations, activeConv]); 

  if (activeConv) {
    return <ActiveConversation conv={activeConv} onBack={() => setActiveConv(null)} />;
  }

  return (
    <ConversationList
      conversations={conversations}
      isLoading={isLoading}
      onSelect={setActiveConv}
      onNew={findOrCreate}
      isFindingOrCreating={isFindingOrCreating}
      members={members}
    />
  );
}

export function WorkspaceChatPanel({ open, onOpenChange, workspaceSlug }: Props) {
  const { conversations } = useConversations(open ? workspaceSlug : undefined);
  const totalUnread = useMemo(() => conversations.reduce((sum, c) => sum + c.unread_count, 0), [conversations]);
  const [activeTab, setActiveTab] = useState<'team' | 'direct'>('team');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-[420px] flex-col gap-0 p-0 sm:max-w-[460px]">
        <SheetHeader className="shrink-0 border-b px-5 py-3.5 pr-12">
          <SheetTitle className="text-sm font-semibold">Chat</SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'team' | 'direct')} className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 px-4 pt-3">
            <TabsList className="w-full">
              <TabsTrigger value="team" className="flex-1">Team</TabsTrigger>
              <TabsTrigger value="direct" className="relative flex-1">
                Direct Messages
                {totalUnread > 0 && (
                  <span className="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="team" className="flex min-h-0 flex-1 flex-col mt-0 data-[state=inactive]:hidden">
            <TeamChatTab workspaceSlug={workspaceSlug} open={open} />
          </TabsContent>

          <TabsContent value="direct" className="flex min-h-0 flex-1 flex-col mt-0 data-[state=inactive]:hidden">
            <DMTab workspaceSlug={workspaceSlug} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

export function useTotalUnreadDMs(workspaceSlug: string | undefined) {
  const { conversations } = useConversations(workspaceSlug);
  return useMemo(() => conversations.reduce((sum, c) => sum + c.unread_count, 0), [conversations]);
}
