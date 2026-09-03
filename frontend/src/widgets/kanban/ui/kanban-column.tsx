import { memo, useMemo } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { TaskCard } from '@widgets/kanban/ui/task-card';
import { cn } from '@shared/lib/utils';
import type { Column, Task } from "@shared/types";

interface KanbanColumnProps {
  column: Column;
  onTaskClick?: (task: Task) => void;
  onAddTask?: (columnId: number) => void;
  index?: number;
}

function KanbanColumnComponent({ column, onTaskClick, onAddTask, index = 0 }: KanbanColumnProps) {
  const tasks = useMemo(() => column.tasks ?? [], [column.tasks]);
  const taskCount = tasks.length;
  const limit = column.wip_limit;
  const isAtLimit = limit !== null && taskCount >= limit;
  const isOverLimit = limit !== null && taskCount > limit;

  const droppableData = useMemo(() => ({ type: 'column', column }), [column]);

  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: droppableData,
  });

  const taskIds = useMemo(() => tasks.map((t) => `task-${t.id}`), [tasks]);

  const accent = column.color ?? '#6b7280';
  const fillPct = limit ? Math.min(100, (taskCount / limit) * 100) : 0;

  return (
    <div
      className="kj-rise kj-stagger group/col flex min-w-0 flex-1 flex-col"
      style={{ '--i': index } as React.CSSProperties}
    >
      {/* Header sits outside the drop surface so it stays readable mid-drag. */}
      <div className="mb-2 flex shrink-0 items-center gap-2 px-1">
        <span
          className="h-4 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <h3 className="truncate text-[13px] font-semibold tracking-tight text-foreground">
          {column.name}
        </h3>
        <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground/70">
          {taskCount}
        </span>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {limit !== null && (
            <span
              className={cn(
                'flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums transition-colors',
                isOverLimit
                  ? 'bg-destructive/15 text-destructive'
                  : isAtLimit
                    ? 'bg-amber-500/15 text-amber-500'
                    : 'text-muted-foreground/60',
              )}
              title={`Work in progress limit: ${taskCount} of ${limit}`}
            >
              {/* Capacity meter — reads faster than the raw numbers alone. */}
              <span className="relative h-1 w-6 overflow-hidden rounded-full bg-current/20">
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-current transition-[width] duration-300 ease-out"
                  style={{ width: `${fillPct}%` }}
                />
              </span>
              {taskCount}/{limit}
            </span>
          )}

          {onAddTask && (
            <button
              type="button"
              onClick={() => onAddTask(column.id)}
              className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground/50 opacity-0 transition-all duration-150 hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover/col:opacity-100"
              title={`Add task to ${column.name}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Drop surface — the whole scroll area is the target, not just the list. */}
      <div
        ref={setNodeRef}
        className={cn(
          'kj-scroll relative flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-xl p-2 transition-colors duration-200',
          isOver
            ? 'bg-primary/[0.07] ring-1 ring-inset ring-primary/25'
            : 'bg-muted/30 ring-1 ring-inset ring-border/30',
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task, i) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} index={i} />
          ))}
        </SortableContext>

        {taskCount === 0 && (
          <div
            className={cn(
              'pointer-events-none flex flex-1 items-center justify-center rounded-lg border border-dashed transition-colors duration-200',
              isOver
                ? 'border-primary/40 text-primary/70'
                : 'border-border/40 text-muted-foreground/35',
            )}
          >
            <p className="text-[11px] font-medium">
              {isOver ? 'Release to drop' : 'Nothing here yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export const KanbanColumn = memo(KanbanColumnComponent);
