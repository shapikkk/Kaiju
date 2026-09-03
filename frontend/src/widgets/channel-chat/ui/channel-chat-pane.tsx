import { useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Users } from 'lucide-react';
import { ChatInput } from '@features/send-message';
import { useChannelChat } from '@entities/channel';
import { useWorkspaceMembers } from '@entities/workspace';
import { useMessageDraftStore } from '@features/send-message';
import { MessageList } from '@widgets/message-list';
import { scrollToMsg } from '@shared/lib/chat/formatters';
import { useAuth } from '@shared/lib/auth/useAuth';
import { UserMiniProfile } from '@entities/user';
import type { Channel } from '@shared/types';

interface ChannelChatPaneProps {
  channel: Channel;
  workspaceSlug: string;
}

export function ChannelChatPane({ channel, workspaceSlug }: ChannelChatPaneProps) {
  const { user } = useAuth();
  const { messages, onlineMembers, sendMessage, isSending, editMessage, deleteMessage } =
    useChannelChat(channel.id);
  const { data: members = [] } = useWorkspaceMembers(workspaceSlug);
  const { replyingTo, editingMsg, setReplyingTo, setEditingMsg, reset: resetDraft } = useMessageDraftStore();

  useEffect(() => { resetDraft(); }, [channel.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stable identities: MessageList and MessageBubble are memoised.
  const handleScrollTo = useCallback(
    (id: number) => scrollToMsg(id, `ch-${channel.id}`),
    [channel.id],
  );

  const renderAvatar = useCallback(
    (
      userId: number,
      userName: string,
      userAvatar: string | null,
      children: ReactNode,
      placement: 'avatar' | 'name',
    ) => (
      <UserMiniProfile
        userId={userId}
        userName={userName}
        userAvatar={userAvatar}
        side={placement === 'avatar' ? 'right' : 'top'}
      >
        {children}
      </UserMiniProfile>
    ),
    [],
  );

  const handleCancelReply = useCallback(() => setReplyingTo(null), [setReplyingTo]);
  const handleCancelEdit = useCallback(() => setEditingMsg(null), [setEditingMsg]);

  const handleSend = useCallback(
    (body: string, replyToId: number | null, file: File | null) =>
      sendMessage(body, replyToId, file),
    [sendMessage],
  );

  const handleEdit = useCallback(
    (id: number, body: string) => editMessage(id, body),
    [editMessage],
  );

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
        onEdit={setEditingMsg}
        onDelete={deleteMessage}
        onScrollTo={handleScrollTo}
        variant="channel"
        idPrefix={`ch-${channel.id}`}
        emptyLabel={`No messages in #${channel.name} yet`}
        renderAvatar={renderAvatar}
      />

      <div className="absolute bottom-0 left-0 w-full z-10 pointer-events-none px-4 pb-6 pt-2">
        <div className="pointer-events-auto">
          <ChatInput
            replyingTo={replyingTo}
            editingMsg={editingMsg}
            members={members}
            onCancelReply={handleCancelReply}
            onCancelEdit={handleCancelEdit}
            onSend={handleSend}
            onEdit={handleEdit}
            isSending={isSending}
            placeholder={`Message #${channel.name}`}
          />
        </div>
      </div>
    </div>
  );
}
