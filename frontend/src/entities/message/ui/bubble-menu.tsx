import { Reply, Pencil, Trash2 } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@shared/ui/context-menu';
import type { ChatMsg } from '@shared/types';

interface BubbleMenuProps {
  children: React.ReactNode;
  msg: ChatMsg;
  isMine: boolean;
  onReply: (msg: ChatMsg) => void;
  onEdit?: (msg: ChatMsg) => void;
  onDelete?: (id: number) => void;
}

export function BubbleMenu({ children, msg, isMine, onReply, onEdit, onDelete }: BubbleMenuProps) {
  return (
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
}
