import { useState, useEffect, useMemo } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@shared/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { ChatInput } from '@features/send-message';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu';
import { useAuth } from '@shared/lib/auth/useAuth';
import { useChannels, useChannelChat } from '@entities/channel';
import { useConversations, useDirectMessages } from '@entities/conversation';
import { useMarkRead } from '@entities/conversation';
import { useWorkspaceMembers } from '@entities/workspace';
import { MessageList } from '@widgets/message-list';
import { scrollToMsg, getInitials, formatTime } from '@shared/lib/chat/formatters';
import { Users, MessageSquarePlus, ArrowLeft } from 'lucide-react';
import { Button } from '@shared/ui/button';
import type { Conversation, WorkspaceMember } from '@shared/types';
import type { ChatMsg } from '@features/send-message';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string | undefined;
}

// ─── Team Chat Tab ────────────────────────────────────────────────────────────

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
      <MessageList
        messages={messages}
        currentUserId={user?.id}
        onReply={setReplyingTo}
        onEdit={(msg) => { setEditingMsg(msg); setReplyingTo(null); }}
        onDelete={deleteMessage}
        onScrollTo={(id) => scrollToMsg(id, 'msg')}
        idPrefix="msg"
        emptyLabel="No messages yet"
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

// ─── Active Conversation (DM view) ────────────────────────────────────────────

function ActiveConversation({ conv, onBack }: { conv: Conversation; onBack: () => void }) {
  const { user } = useAuth();
  const { messages, isSending, sendMessage, editMessage, deleteMessage } = useDirectMessages(conv.id);
  const markRead = useMarkRead();
  const [replyingTo, setReplyingTo] = useState<ChatMsg | null>(null);
  const [editingMsg, setEditingMsg] = useState<ChatMsg | null>(null);

  useEffect(() => {
    markRead.mutate(conv.id);
  }, [conv.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

      <MessageList
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

// ─── DM Tab ───────────────────────────────────────────────────────────────────

function DMTab({ workspaceSlug }: { workspaceSlug: string | undefined }) {
  const { user } = useAuth();
  const { conversations, isLoading, findOrCreate, isFindingOrCreating } =
    useConversations(workspaceSlug);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const { data: members = [] } = useWorkspaceMembers(workspaceSlug);
  const otherMembers = useMemo(() => members.filter((m) => m.id !== user?.id), [members, user]);

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
                  const conv = await findOrCreate(member.id);
                  const existing = conversations.find((c) => c.id === conv.id);
                  setActiveConv(existing ?? {
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
              onClick={() => setActiveConv(conv)}
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

// ─── WorkspaceChatPanel (public export) ──────────────────────────────────────

export function WorkspaceChatPanel({ open, onOpenChange, workspaceSlug }: Props) {
  const { conversations } = useConversations(open ? workspaceSlug : undefined);
  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unread_count, 0),
    [conversations],
  );
  const [activeTab, setActiveTab] = useState<'team' | 'direct'>('team');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-[420px] flex-col gap-0 p-0 sm:max-w-[460px]">
        <SheetHeader className="shrink-0 border-b px-5 py-3.5 pr-12">
          <SheetTitle className="text-sm font-semibold">Chat</SheetTitle>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'team' | 'direct')}
          className="flex min-h-0 flex-1 flex-col"
        >
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
  return useMemo(
    () => conversations.reduce((sum, c) => sum + c.unread_count, 0),
    [conversations],
  );
}
