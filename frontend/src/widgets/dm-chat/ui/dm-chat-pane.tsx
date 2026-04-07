import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { ChatInput } from '@features/send-message';
import { useDirectMessages } from '@entities/conversation';
import { useMarkRead } from '@entities/conversation';
import { useMessageDraftStore } from '@features/send-message';
import { MessageList } from '@widgets/message-list';
import { scrollToMsg } from '@shared/lib/chat/formatters';
import { useAuth } from '@shared/lib/auth/useAuth';
import { UserMiniProfile } from '@entities/user';
import type { Conversation, WorkspaceMember } from '@shared/types';

interface DMChatPaneProps {
  conv: Conversation;
  onBack: () => void;
}

export function DMChatPane({ conv, onBack }: DMChatPaneProps) {
  const { user } = useAuth();
  const { messages, isSending, sendMessage, editMessage, deleteMessage } = useDirectMessages(conv.id);
  const markRead = useMarkRead();
  const { replyingTo, editingMsg, setReplyingTo, setEditingMsg, reset: resetDraft } = useMessageDraftStore();
  const displayName = conv.local_name ?? conv.other_user?.name ?? 'Direct Message';

  useEffect(() => {
    markRead.mutate(conv.id);
    resetDraft();
  }, [conv.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
        onEdit={setEditingMsg}
        onDelete={deleteMessage}
        onScrollTo={(id) => scrollToMsg(id, `dm-${conv.id}`)}
        idPrefix={`dm-${conv.id}`}
        emptyLabel="Start a conversation"
        otherUserLastReadAt={conv.other_user_last_read_at}
        renderAvatar={(userId, userName, userAvatar, children, placement) => (
          <UserMiniProfile
            userId={userId}
            userName={userName}
            userAvatar={userAvatar}
            side={placement === 'avatar' ? 'right' : 'top'}
          >
            {children}
          </UserMiniProfile>
        )}
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
