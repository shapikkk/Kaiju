import { memo } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { BubbleMenu } from './bubble-menu';
import { AttachmentRenderer } from './attachment-renderer';
import { formatTime, truncate, getInitials } from '@shared/lib/chat/formatters';
import type { ChatMsg } from '@shared/types';

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
  renderAvatar?: (
    userId: number,
    userName: string,
    userAvatar: string | null,
    children: React.ReactNode,
    placement: 'avatar' | 'name',
  ) => React.ReactNode;
}

function MessageBubbleComponent({
  msg, isMine, isConsecutive, onReply, onEdit, onDelete,
  onScrollTo, onImageLoad, idPrefix = 'chat', otherUserLastReadAt,
  renderAvatar,
}: BubbleProps) {
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
          renderAvatar
            ? renderAvatar(msg.user.id, msg.user.name, msg.user.avatar_url, avatarNode, 'avatar')
            : avatarNode
        )
      ) : (
        <div className="h-7 w-7 shrink-0" />
      )}

      <div className={`flex min-w-0 max-w-[80%] flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
        {!isConsecutive && (
          <span className="px-1 text-[10px] text-muted-foreground">
            {isMine ? 'You' : (
              renderAvatar
                ? renderAvatar(
                    msg.user.id,
                    msg.user.name,
                    msg.user.avatar_url,
                    <button className="hover:underline focus:outline-none">{msg.user.name}</button>,
                    'name',
                  )
                : msg.user.name
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

// Memoised: relies on the panes passing stable callbacks.
export const MessageBubble = memo(MessageBubbleComponent);
