import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Hash, MessageSquarePlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { useChannels, useChannelManagement } from '@entities/channel';
import { useConversations } from '@entities/conversation';
import { DMProfileModal } from '@entities/conversation';
import { CreateChannelDialog, EditChannelDialog } from '@features/channel-manage';
import { useChatUIStore, type ActiveChat } from '@widgets/chat-panel';
import { ChatSidebar } from '@widgets/chat-sidebar';
import { ChannelChatPane } from '@widgets/channel-chat';
import { DMChatPane } from '@widgets/dm-chat';
import { getInitials } from '@shared/lib/chat/formatters';
import type { Channel, Conversation } from '@shared/types';

// ─── Chat header ──────────────────────────────────────────────────────────────

function ChatHeader({
  active,
  onDmProfileClick,
}: {
  active: ActiveChat;
  onDmProfileClick?: () => void;
}) {
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
          <AvatarFallback className="text-[10px]">
            {getInitials(conv.other_user?.name ?? '?')}
          </AvatarFallback>
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

// ─── Empty state ──────────────────────────────────────────────────────────────

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

// ─── ChatLayout — owns all sync effects and dialog states ─────────────────────

interface ChatLayoutProps {
  workspaceSlug: string;
}

export function ChatLayout({ workspaceSlug }: ChatLayoutProps) {
  const navigate = useNavigate();
  const { activeChat, setActiveChat } = useChatUIStore();

  const [dmProfileOpen, setDmProfileOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [editChannelOpen, setEditChannelOpen] = useState(false);
  const [selectedChannelForEdit, setSelectedChannelForEdit] = useState<Channel | null>(null);

  const { createChannel, isCreating, updateChannel, isUpdating, deleteChannel, isDeleting } =
    useChannelManagement(workspaceSlug);
  const { data: channels = [] } = useChannels(workspaceSlug);
  const { conversations } = useConversations(workspaceSlug);

  useEffect(() => {
    if (channels.length > 0 && activeChat === null) {
      setActiveChat({ type: 'channel', channel: channels[0] });
    }
  }, [channels]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setActiveChat(null);
    setDmProfileOpen(false);
  }, [workspaceSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeChat?.type === 'dm') {
      const fresh = conversations.find(
        (c) => c.id === (activeChat as { type: 'dm'; conv: Conversation }).conv.id,
      );
      if (fresh) setActiveChat({ type: 'dm', conv: fresh });
    }
  }, [conversations]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeChat?.type === 'channel') {
      const fresh = channels.find(
        (ch) => ch.id === (activeChat as { type: 'channel'; channel: Channel }).channel.id,
      );
      if (fresh) setActiveChat({ type: 'channel', channel: fresh });
    }
  }, [channels]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChannelDeleted = useCallback(() => {
    const deletedId = selectedChannelForEdit?.id ?? -1;
    if (activeChat?.type === 'channel' && activeChat.channel.id === deletedId) {
      const fallback = channels.find((ch) => ch.id !== deletedId);
      setActiveChat(fallback ? { type: 'channel', channel: fallback } : null);
    }
    setEditChannelOpen(false);
  }, [channels, activeChat, selectedChannelForEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!workspaceSlug) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <p>
          No workspace selected.{' '}
          <button className="text-primary underline" onClick={() => navigate('/')}>
            Go home
          </button>
        </p>
      </div>
    );
  }

  const fallbackChannel = channels[0] ?? {
    id: 0,
    name: 'general',
    description: null,
    is_default: true,
    position: 0,
  };

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* ─── Sidebar ─── */}
      <ChatSidebar
        workspaceSlug={workspaceSlug}
        active={activeChat ?? { type: 'channel', channel: fallbackChannel }}
        onSelect={(chat) => {
          setActiveChat(chat);
          setDmProfileOpen(false);
        }}
        onCreateChannel={() => setCreateChannelOpen(true)}
        onEditChannel={(ch) => {
          setSelectedChannelForEdit(ch);
          setEditChannelOpen(true);
        }}
      />

      {/* ─── Main pane ─── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {activeChat == null ? (
          <NoChatSelected />
        ) : (
          <>
            <ChatHeader
              active={activeChat}
              onDmProfileClick={
                activeChat.type === 'dm' ? () => setDmProfileOpen(true) : undefined
              }
            />
            {activeChat.type === 'channel' ? (
              <ChannelChatPane channel={activeChat.channel} workspaceSlug={workspaceSlug} />
            ) : (
              <DMChatPane
                conv={activeChat.conv}
                onBack={() =>
                  setActiveChat({ type: 'channel', channel: fallbackChannel })
                }
              />
            )}
          </>
        )}
      </div>

      {/* ─── Modals ─── */}
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
