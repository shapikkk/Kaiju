import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { TagBadge } from '@/components/tag-badge';
import { PRIORITY_CONFIG } from '@/types';
import type { Task } from '@/types';
import { MessageSquare, Paperclip, Calendar, GripVertical } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragging = isDragging || isSortableDragging;
  const priorityCfg = PRIORITY_CONFIG[task.priority];

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group cursor-pointer border-border/50 bg-card transition-all hover:border-border hover:shadow-md active:scale-[0.98] ${
        dragging ? 'z-50 rotate-2 shadow-xl opacity-90 ring-2 ring-primary/30' : ''
      }`}
      onClick={() => !dragging && onClick?.(task)}
    >
      <CardContent className="space-y-2.5 p-3">
        {/* Drag handle + Tags row */}
        <div className="flex items-start justify-between">
          <div className="flex flex-wrap gap-1">
            {task.epic && (
              <span
                className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: task.epic.color ? `${task.epic.color}20` : undefined,
                  color: task.epic.color ?? 'inherit',
                  border: task.epic.color ? `1px solid ${task.epic.color}40` : undefined,
                }}
              >
                {task.epic.name}
              </span>
            )}
            {task.sprint && (
              <span className="inline-flex items-center rounded-sm bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground ring-1 ring-inset ring-border">
                {task.sprint.name}
              </span>
            )}
            {task.tags?.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
          <button
            className="mt-0.5 shrink-0 cursor-grab opacity-0 transition-opacity group-hover:opacity-60 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Title */}
        <p className="text-sm font-medium leading-snug text-foreground">
          {task.title}
        </p>

        {/* Bottom row */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase opacity-60">
              {task.key}
            </span>
            <span
              className="flex items-center gap-0.5"
              title={priorityCfg.label}
              style={{ color: priorityCfg.color }}
            >
              {priorityCfg.icon}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {task.due_date && (
              <span className="flex items-center gap-0.5">
                <Calendar className="h-3 w-3" />
                {new Date(task.due_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
            {(task.comments_count ?? 0) > 0 && (
              <span className="flex items-center gap-0.5">
                <MessageSquare className="h-3 w-3" />
                {task.comments_count}
              </span>
            )}
            {(task.attachments_count ?? 0) > 0 && (
              <span className="flex items-center gap-0.5">
                <Paperclip className="h-3 w-3" />
                {task.attachments_count}
              </span>
            )}
            {task.assignee && (
              <div
                className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground"
                title={task.assignee.name}
              >
                {task.assignee.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
