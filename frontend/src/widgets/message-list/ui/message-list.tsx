import { useRef, useCallback, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';
import { MessageBubble } from '@entities/message/ui/message-bubble';
import { DateSeparator } from '@shared/ui/date-separator';
import { formatDateLabel, isSameDay } from '@shared/lib/chat/formatters';
import type { ChatMsg } from '@shared/types';

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
  renderAvatar?: (
    userId: number,
    userName: string,
    userAvatar: string | null,
    children: React.ReactNode,
    placement: 'avatar' | 'name',
  ) => React.ReactNode;
}

export function MessageList({
  messages, currentUserId, onReply, onEdit, onDelete, onScrollTo,
  idPrefix = 'chat', emptyLabel = 'No messages yet', otherUserLastReadAt,
  renderAvatar,
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
                  renderAvatar={renderAvatar}
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
