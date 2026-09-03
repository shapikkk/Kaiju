import { useRef, useCallback, useEffect } from 'react';
import { MessagesSquare } from 'lucide-react';
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
  /** 'channel' renders a left-aligned roster; 'dm' renders two-sided bubbles. */
  variant?: 'channel' | 'dm';
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
  renderAvatar, variant = 'dm',
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
      /* The ambient particle field is a nice touch, but reading a dense
         message log through it is genuinely hard — damp it here only. */
      className="kj-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-background/85 px-4 pt-4 pb-[150px]"
    >
      {messages.length === 0 ? (
        <div className="kj-rise flex flex-1 flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-inset ring-primary/20">
            <MessagesSquare className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">{emptyLabel}</p>
          <p className="mt-1 max-w-[22rem] text-xs text-muted-foreground">
            Messages sent here are visible to everyone with access. Say hello to get things started.
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {messages.map((msg, index) => {
            const isMine = msg.user.id === currentUserId;
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const withinGroupWindow =
              !!prevMsg &&
              new Date(msg.created_at).getTime() -
                new Date(prevMsg.created_at).getTime() < 5 * 60_000;
            const isConsecutive =
              !!prevMsg &&
              prevMsg.user.id === msg.user.id &&
              withinGroupWindow &&
              !msg.reply_to_id;
            const showDateSep = !prevMsg || !isSameDay(msg.created_at, prevMsg.created_at);
            return (
              <div key={msg.id}>
                {showDateSep && <DateSeparator label={formatDateLabel(msg.created_at)} />}
                <MessageBubble
                  msg={msg}
                  variant={variant}
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
