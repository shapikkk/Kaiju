import { memo, useCallback, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare, Paperclip, Calendar, GripVertical } from 'lucide-react';
import { PRIORITY_CONFIG } from "@shared/types";
import { cn } from '@shared/lib/utils';
import type { Task } from "@shared/types";

interface TaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
  isDragging?: boolean;
  index?: number;
}

/** Tags beyond this collapse into a "+N" chip so the title stays dominant. */
const MAX_VISIBLE_TAGS = 2;

function TaskCardComponent({ task, onClick, isDragging, index = 0 }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: `task-${task.id}`,
    data: { type: 'task', task },
  });

  const dragging = isDragging || isSortableDragging;

  const style = useMemo(
    () =>
      ({
        transform: CSS.Transform.toString(transform),
        transition,
        '--i': index,
      }) as React.CSSProperties,
    [transform, transition, index],
  );

  const priorityCfg = PRIORITY_CONFIG[task.priority];

  const handleClick = useCallback(() => {
    if (!dragging) onClick?.(task);
  }, [dragging, onClick, task]);

  const dueLabel = useMemo(
    () =>
      task.due_date
        ? new Date(task.due_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        : null,
    [task.due_date],
  );

  /** Overdue work should be obvious without opening the card. */
  const isOverdue = useMemo(() => {
    if (!task.due_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(task.due_date) < today;
  }, [task.due_date]);

  const assigneeInitials = useMemo(
    () =>
      task.assignee
        ? task.assignee.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : null,
    [task.assignee],
  );

  const tags = task.tags ?? [];
  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenTagCount = tags.length - visibleTags.length;

  const hasFooterMeta =
    !!dueLabel ||
    (task.comments_count ?? 0) > 0 ||
    (task.attachments_count ?? 0) > 0 ||
    !!task.assignee;

  return (
    <article
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={cn(
        'kj-lift group/card relative cursor-pointer select-none overflow-hidden rounded-lg border bg-card p-2.5 text-left',
        'border-border/60 shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
        'hover:border-border hover:shadow-[0_6px_16px_-6px_rgba(0,0,0,0.35)]',
        dragging &&
          'z-50 rotate-[1.5deg] scale-[1.02] opacity-95 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)] ring-1 ring-primary/40',
      )}
    >
      {/* Priority as a colour edge, so it never competes with the title. */}
      <span
        className="absolute inset-y-0 left-0 w-[3px] rounded-r-full opacity-70 transition-opacity duration-200 group-hover/card:opacity-100"
        style={{ backgroundColor: priorityCfg.color }}
        title={`${priorityCfg.label} priority`}
        aria-hidden
      />

      <div className="pl-1.5">
        {/* Title first — it is what people scan for. */}
        <div className="flex items-start gap-1.5">
          <p className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-foreground">
            {task.title}
          </p>
          <button
            className="-mr-0.5 -mt-0.5 shrink-0 cursor-grab rounded p-0.5 text-muted-foreground/40 opacity-0 transition-opacity duration-150 hover:text-muted-foreground group-hover/card:opacity-100 active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
            aria-label="Drag task"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </div>

        {(visibleTags.length > 0 || task.epic) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {task.epic && (
              <span
                className="inline-flex max-w-[120px] items-center truncate rounded px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-wide"
                style={{
                  backgroundColor: task.epic.color ? `${task.epic.color}1f` : undefined,
                  color: task.epic.color ?? undefined,
                }}
                title={task.epic.name}
              >
                {task.epic.name}
              </span>
            )}
            {visibleTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded px-1.5 py-[1px] text-[9px] font-medium text-muted-foreground ring-1 ring-inset ring-border/60"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: tag.color }}
                  aria-hidden
                />
                {tag.name}
              </span>
            ))}
            {hiddenTagCount > 0 && (
              <span
                className="text-[9px] font-medium text-muted-foreground/60"
                title={tags.slice(MAX_VISIBLE_TAGS).map((t) => t.name).join(', ')}
              >
                +{hiddenTagCount}
              </span>
            )}
          </div>
        )}

        <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="font-mono font-medium uppercase tracking-tight opacity-50">
            {task.key}
          </span>

          {hasFooterMeta && (
            <div className="ml-auto flex items-center gap-2">
              {dueLabel && (
                <span
                  className={cn(
                    'flex items-center gap-0.5',
                    isOverdue && 'font-medium text-destructive',
                  )}
                  title={isOverdue ? 'Overdue' : 'Due date'}
                >
                  <Calendar className="h-3 w-3" />
                  {dueLabel}
                </span>
              )}
              {(task.comments_count ?? 0) > 0 && (
                <span className="flex items-center gap-0.5" title="Comments">
                  <MessageSquare className="h-3 w-3" />
                  {task.comments_count}
                </span>
              )}
              {(task.attachments_count ?? 0) > 0 && (
                <span className="flex items-center gap-0.5" title="Attachments">
                  <Paperclip className="h-3 w-3" />
                  {task.attachments_count}
                </span>
              )}
              {task.assignee && (
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-card"
                  title={task.assignee.name}
                >
                  {assigneeInitials}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// Memoised: dnd-kit re-renders the whole DndContext subtree during a drag.
export const TaskCard = memo(TaskCardComponent);
