import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { ScrollArea } from '@shared/ui/scroll-area';
import { AttachmentSection } from '@features/attachments/ui/attachment-section';
import { useTask, useUpdateTask, useTags, useEpics } from '@entities/board';
import { useCreateComment, useUpdateComment, useDeleteComment } from '@entities/message';
import { TaskMetadataGrid } from '@entities/task/ui/task-metadata-grid';
import { TaskCommentList } from '@entities/task/ui/task-comment-list';
import { PRIORITY_CONFIG } from '@shared/types';
import { cn } from '@shared/lib/utils';
import type { Priority, UpdateTaskPayload, User, Tag, Sprint } from '@shared/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@shared/ui/select';
import { X, Tags, Check, Copy } from 'lucide-react';

interface TaskDetailPanelProps {
  taskId: number;
  boardUsers?: User[];
  boardSprints?: Sprint[];
  onClose: () => void;
}

const PRIORITIES: Priority[] = ['lowest', 'low', 'medium', 'high', 'highest'];

/** Kept in step with the exit animation so the sheet is gone before unmount. */
const CLOSE_ANIM_MS = 220;

export function TaskDetailPanel({
  taskId,
  boardUsers = [],
  boardSprints = [],
  onClose,
}: TaskDetailPanelProps) {
  const { workspaceSlug = '', boardSlug = '' } = useParams();
  const boardQueryKey = ['board', workspaceSlug, boardSlug];

  const { data: task, isLoading: taskLoading } = useTask(taskId);
  const updateTask = useUpdateTask(boardQueryKey);
  const { data: allTags = [] } = useTags(workspaceSlug);
  const { data: allEpics = [] } = useEpics(workspaceSlug);

  const createComment = useCreateComment(taskId);
  const updateComment = useUpdateComment(taskId);
  const deleteComment = useDeleteComment(taskId);
  const commentMutations = { createComment, updateComment, deleteComment };

  const [closing, setClosing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setClosing(true);
      window.setTimeout(onClose, CLOSE_ANIM_MS);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  /** Lock background scroll while the sheet owns the screen. */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const requestClose = () => {
    setClosing(true);
    window.setTimeout(onClose, CLOSE_ANIM_MS);
  };

  const patchField = <K extends keyof UpdateTaskPayload>(field: K, value: UpdateTaskPayload[K]) => {
    if (!task) return;
    updateTask.mutate({ taskId: task.id, payload: { [field]: value } as UpdateTaskPayload });
  };

  const currentTagIds = task?.tags?.map((t: Tag) => t.id) ?? [];
  const toggleTag = (tagId: number) => {
    const newIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter((id: number) => id !== tagId)
      : [...currentTagIds, tagId];
    patchField('tag_ids', newIds);
  };

  const copyKey = () => {
    if (!task) return;
    navigator.clipboard.writeText(task.key)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      })
      .catch(() => {});
  };

  /*
   * Portalled to <body> on purpose. AppLayout wraps its content in a
   * `relative z-0` element, which opens a stacking context a `fixed` child
   * cannot escape — the sheet was painted *under* the z-50 title bar, hiding
   * its own header and close button.
   */
  const shell = (children: React.ReactNode) => createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[60] flex items-stretch justify-end bg-black/40 backdrop-blur-[2px]',
        closing ? 'animate-out fade-out duration-200' : 'kj-scrim',
      )}
      onClick={(e) => { if (e.target === e.currentTarget) requestClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'flex h-full w-full max-w-xl flex-col border-l bg-background shadow-[-24px_0_60px_-24px_rgba(0,0,0,0.6)]',
          closing
            ? 'animate-out slide-out-to-right-8 fade-out duration-200'
            : 'kj-panel',
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );

  if (taskLoading || !task) {
    // Skeleton mirrors the loaded layout so nothing jumps when data lands.
    return shell(
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="kj-shimmer h-4 w-28 rounded" />
        <div className="kj-shimmer h-7 w-3/4 rounded" />
        <div className="kj-shimmer h-16 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-3">
          <div className="kj-shimmer h-16 rounded-lg" />
          <div className="kj-shimmer h-16 rounded-lg" />
          <div className="kj-shimmer h-16 rounded-lg" />
          <div className="kj-shimmer h-16 rounded-lg" />
        </div>
      </div>,
    );
  }

  const priorityCfg = PRIORITY_CONFIG[task.priority];

  return shell(
    <>
      {/* Sticky header: key, current column and priority stay reachable. */}
      <header className="flex shrink-0 items-center gap-2 border-b bg-background/85 px-5 py-3 backdrop-blur-sm">
        <button
          onClick={copyKey}
          className="group/key flex items-center gap-1.5 rounded-md px-1.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Copy task key"
        >
          {task.key}
          {copied
            ? <Check className="h-3 w-3 text-emerald-500" />
            : <Copy className="h-3 w-3 opacity-0 transition-opacity group-hover/key:opacity-60" />}
        </button>

        {task.column && (
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: task.column.color ?? '#6b7280' }}
              aria-hidden
            />
            {task.column.name}
          </span>
        )}

        <Select
          value={task.priority}
          onValueChange={(v) => patchField('priority', v as Priority)}
        >
          <SelectTrigger className="h-7 w-auto gap-1 border-none bg-transparent p-0 shadow-none focus:ring-0">
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{
                backgroundColor: `${priorityCfg.color}1f`,
                color: priorityCfg.color,
              }}
            >
              {priorityCfg.icon} {priorityCfg.label}
            </span>
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                <span className="flex items-center gap-1.5">
                  <span style={{ color: PRIORITY_CONFIG[p].color }}>
                    {PRIORITY_CONFIG[p].icon}
                  </span>
                  {PRIORITY_CONFIG[p].label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-1">
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
            Esc
          </kbd>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={requestClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <ScrollArea className="kj-scroll min-h-0 flex-1">
        <div className="px-5 py-5">
          <h2 className="text-[19px] font-semibold leading-tight tracking-tight text-foreground">
            {task.title}
          </h2>

          {allTags.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                <Tags className="h-3 w-3" /> Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag: Tag) => {
                  const isActive = currentTagIds.includes(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant={isActive ? 'default' : 'outline'}
                      className="cursor-pointer select-none transition-transform duration-150 hover:scale-[1.06] active:scale-95"
                      style={
                        isActive
                          ? { backgroundColor: tag.color, borderColor: tag.color }
                          : { borderColor: `${tag.color}66`, color: tag.color }
                      }
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-5">
            <h3 className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
              Description
            </h3>
            <p
              className={cn(
                'whitespace-pre-wrap text-[13px] leading-relaxed',
                task.description ? 'text-foreground/90' : 'italic text-muted-foreground/50',
              )}
            >
              {task.description || 'No description yet.'}
            </p>
          </div>

          <TaskMetadataGrid
            task={task}
            boardUsers={boardUsers}
            boardSprints={boardSprints}
            allEpics={allEpics}
            onPatchField={patchField}
          />

          <TaskCommentList task={task} mutations={commentMutations} />

          <AttachmentSection taskId={task.id} />
        </div>
      </ScrollArea>
    </>,
  );
}
