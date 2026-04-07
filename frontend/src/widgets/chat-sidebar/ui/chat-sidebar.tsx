import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@shared/lib/auth/useAuth';
import { useChannels } from '@entities/channel';
import { useConversations } from '@entities/conversation';
import { useWorkspaceMembers } from '@entities/workspace';
import { useWorkspaces } from '@entities/workspace';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu';
import { cn } from '@shared/lib/utils';
import {
  Hash, Search, MessageSquarePlus,
  ChevronDown, ChevronRight, Plus, Settings2, Check,
} from 'lucide-react';
import { useChatSidebarStore } from '../model/useChatSidebarStore';
import { getInitials, formatTime } from '@shared/lib/chat/formatters';
import type { Channel, Conversation } from '@shared/types';
import type { ActiveChat } from '@widgets/chat-panel';

// ─── Sub-components ─────────────────────────────────────────────

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

// ─── Main component ──────────────────────────────────────────────

interface ChatSidebarProps {
  workspaceSlug: string;
  active: ActiveChat;
  onSelect: (chat: ActiveChat) => void;
  onCreateChannel: () => void;
  onEditChannel?: (ch: Channel) => void;
}

export function ChatSidebar({
  workspaceSlug, active, onSelect, onCreateChannel, onEditChannel,
}: ChatSidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: workspaces = [] } = useWorkspaces();
  const { data: channels = [], isLoading: channelsLoading } = useChannels(workspaceSlug);
  const { conversations, isLoading: convsLoading, findOrCreate, isFindingOrCreating } =
    useConversations(workspaceSlug);
  const { data: members = [] } = useWorkspaceMembers(workspaceSlug);
  const { search, setSearch, channelsOpen, toggleChannelsOpen, dmsOpen, toggleDmsOpen } =
    useChatSidebarStore();

  const currentWorkspace = workspaces.find((w) => w.slug === workspaceSlug);
  const otherMembers = useMemo(() => members.filter((m) => m.id !== user?.id), [members, user]);
  const totalUnread = useMemo(
    () => conversations.reduce((s, c) => s + c.unread_count, 0),
    [conversations],
  );

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

      {/* Workspace switcher */}
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

      {/* Search */}
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

      {/* Scrollable list */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">

        {/* Channels section */}
        <div className="mb-1">
          <div className="flex items-center justify-between px-2 pb-1 pt-3">
            <button
              onClick={toggleChannelsOpen}
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

        {/* DMs section */}
        <div>
          <div className="flex items-center justify-between px-2 pb-1 pt-3">
            <button
              onClick={toggleDmsOpen}
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
