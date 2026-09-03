import { memo } from 'react';
import { Check, CheckCheck, CornerUpLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { BubbleMenu } from './bubble-menu';
import { AttachmentRenderer } from './attachment-renderer';
import { formatTime, truncate, getInitials } from '@shared/lib/chat/formatters';
import { cn } from '@shared/lib/utils';
import type { ChatMsg } from '@shared/types';

interface BubbleProps {
  msg: ChatMsg;
  isMine: boolean;
  isConsecutive: boolean;
  /**
   * Channels read as a roster (everyone left-aligned, like a document);
   * DMs read as a conversation (own messages right-aligned). Using bubbles
   * for both is what made channels feel broken — every message hugged the
   * far right of a very wide, otherwise empty pane.
   */
  variant?: 'channel' | 'dm';
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
  msg, isMine, isConsecutive, variant = 'dm', onReply, onEdit, onDelete,
  onScrollTo, onImageLoad, idPrefix = 'chat', otherUserLastReadAt,
  renderAvatar,
}: BubbleProps) {
  const initials = getInitials(msg.user.name);
  const hasText = !!msg.body;
  const hasAttachment = !!msg.attachment_url;
  const isChannel = variant === 'channel';

  let receiptIcon: React.ReactNode = null;
  if (isMine && !isChannel && otherUserLastReadAt !== undefined) {
    const isRead = otherUserLastReadAt
      ? new Date(otherUserLastReadAt) >= new Date(msg.created_at)
      : false;
    receiptIcon = isRead
      ? <CheckCheck className="h-3 w-3 text-primary" />
      : <Check className="h-3 w-3 text-muted-foreground/60" />;
  }

  const avatarNode = (
    <Avatar className="h-7 w-7 shrink-0 cursor-pointer ring-1 ring-border/50">
      <AvatarImage src={msg.user.avatar_url ?? undefined} />
      <AvatarFallback className="text-[10px] font-medium">{initials}</AvatarFallback>
    </Avatar>
  );

  const wrappedAvatar = renderAvatar
    ? renderAvatar(msg.user.id, msg.user.name, msg.user.avatar_url, avatarNode, 'avatar')
    : avatarNode;

  const replyPreview = msg.reply_to && (
    <button
      onClick={() => onScrollTo(msg.reply_to!.id)}
      className={cn(
        'mb-1 flex w-full max-w-full items-center gap-1.5 rounded-md border-l-2 border-primary/50 bg-muted/40 px-2 py-1 text-left transition-colors hover:bg-muted',
        !isChannel && isMine && 'flex-row-reverse text-right',
      )}
    >
      <CornerUpLeft className="h-3 w-3 shrink-0 text-primary/70" />
      <span className="shrink-0 text-[10px] font-semibold text-primary">
        {msg.reply_to.user.name}
      </span>
      <span className="truncate text-[11px] text-muted-foreground">
        {truncate(msg.reply_to.body ?? '', 70)}
      </span>
    </button>
  );

  const attachmentNode = hasAttachment && (
    <AttachmentRenderer
      url={msg.attachment_url!}
      name={msg.attachment_name}
      type={msg.attachment_type!}
      isMine={isMine}
      onDelete={onDelete ? () => onDelete(msg.id) : undefined}
      onImageLoad={onImageLoad}
    />
  );

  /* ── Channel: dense, left-aligned roster row ───────────────────────── */
  if (isChannel) {
    return (
      <div
        id={`${idPrefix}-${msg.id}`}
        className={cn(
          'kj-msg group/msg relative flex w-full gap-2.5 rounded-md px-2 transition-colors duration-150 hover:bg-muted/40',
          isConsecutive ? 'py-0.5' : 'mt-3 py-1',
        )}
      >
        <div className="w-7 shrink-0 pt-0.5">
          {!isConsecutive ? wrappedAvatar : (
            // Hover reveals the timestamp in the gutter, Slack-style.
            <span className="hidden select-none pt-1 text-[9px] leading-none text-muted-foreground/50 group-hover/msg:block">
              {formatTime(msg.created_at).replace(/\s?[AP]M/i, '')}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {!isConsecutive && (
            <div className="mb-0.5 flex items-baseline gap-2">
              <span className="text-[13px] font-semibold text-foreground">
                {renderAvatar
                  ? renderAvatar(
                      msg.user.id,
                      msg.user.name,
                      msg.user.avatar_url,
                      <button className="hover:underline focus:outline-none">{msg.user.name}</button>,
                      'name',
                    )
                  : msg.user.name}
              </span>
              <span className="text-[10px] text-muted-foreground/60">
                {formatTime(msg.created_at)}
              </span>
            </div>
          )}

          {replyPreview}

          {hasText && (
            <BubbleMenu msg={msg} isMine={isMine} onReply={onReply} onEdit={onEdit} onDelete={onDelete}>
              <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-foreground/90">
                {msg.body}
                {'is_edited' in msg && msg.is_edited && (
                  <span className="ml-1.5 text-[10px] text-muted-foreground/50">(edited)</span>
                )}
              </p>
            </BubbleMenu>
          )}

          {hasAttachment && (
            <BubbleMenu msg={msg} isMine={isMine} onReply={onReply} onEdit={onEdit} onDelete={onDelete}>
              <div className="mt-1 min-w-0">{attachmentNode}</div>
            </BubbleMenu>
          )}
        </div>
      </div>
    );
  }

  /* ── DM: two-sided conversation ───────────────────────────────────── */
  return (
    <div
      id={`${idPrefix}-${msg.id}`}
      className={cn(
        'kj-msg group/msg flex w-full items-end gap-2',
        isMine ? 'flex-row-reverse' : 'flex-row',
        isConsecutive ? 'mt-0.5' : 'mt-3',
      )}
    >
      <div className="w-7 shrink-0">
        {!isConsecutive && (isMine ? avatarNode : wrappedAvatar)}
      </div>

      <div
        className={cn(
          'flex min-w-0 max-w-[min(70%,32rem)] flex-col gap-0.5',
          isMine ? 'items-end' : 'items-start',
        )}
      >
        {!isConsecutive && !isMine && (
          <span className="px-1 text-[10px] font-medium text-muted-foreground">
            {renderAvatar
              ? renderAvatar(
                  msg.user.id,
                  msg.user.name,
                  msg.user.avatar_url,
                  <button className="hover:underline focus:outline-none">{msg.user.name}</button>,
                  'name',
                )
              : msg.user.name}
          </span>
        )}

        {replyPreview}

        {hasText && (
          <BubbleMenu msg={msg} isMine={isMine} onReply={onReply} onEdit={onEdit} onDelete={onDelete}>
            <div
              className={cn(
                'w-fit max-w-full cursor-default select-text whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-[13px] leading-relaxed shadow-sm',
                isMine
                  ? 'rounded-br-md bg-primary text-primary-foreground'
                  : 'rounded-bl-md border bg-muted/60 text-foreground',
              )}
            >
              {msg.body}
              {'is_edited' in msg && msg.is_edited && (
                <span className="ml-1.5 text-[10px] opacity-60">(edited)</span>
              )}
            </div>
          </BubbleMenu>
        )}

        {hasAttachment && (
          <BubbleMenu msg={msg} isMine={isMine} onReply={onReply} onEdit={onEdit} onDelete={onDelete}>
            <div className="min-w-0">{attachmentNode}</div>
          </BubbleMenu>
        )}

        <div
          className={cn(
            'flex items-center gap-1 px-1 text-[10px] text-muted-foreground/60',
            isMine ? 'flex-row-reverse' : 'flex-row',
          )}
        >
          {/* Timestamp stays out of the way until the row is hovered. */}
          <span className="opacity-0 transition-opacity duration-150 group-hover/msg:opacity-100">
            {formatTime(msg.created_at)}
          </span>
          {receiptIcon}
        </div>
      </div>
    </div>
  );
}

// Memoised: relies on the panes passing stable callbacks.
export const MessageBubble = memo(MessageBubbleComponent);
