import { memo, useMemo } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { TaskCard } from '@widgets/kanban/ui/task-card';
import { ScrollArea } from '@shared/ui/scroll-area';
import type { Column, Task } from "@shared/types";

interface KanbanColumnProps {
  column: Column;
  onTaskClick?: (task: Task) => void;
}

function KanbanColumnComponent({ column, onTaskClick }: KanbanColumnProps) {
  const tasks = useMemo(() => column.tasks ?? [], [column.tasks]);
  const taskCount = tasks.length;
  const isAtLimit = column.wip_limit !== null && taskCount >= column.wip_limit;

  const droppableData = useMemo(
    () => ({ type: 'column', column }),
    [column],
  );

  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: droppableData,
  });

  const taskIds = useMemo(() => tasks.map((t) => `task-${t.id}`), [tasks]);

  return (
    <div
      className={`flex min-w-0 flex-1 flex-col rounded-xl transition-colors ${
        isOver
          ? 'bg-accent/60 ring-2 ring-primary/20'
          : 'bg-muted/40'
      }`}
    >
      {/* Column header */}
      <div className="flex shrink-0 items-center justify-between px-3 pb-2 pt-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <div
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: column.color ?? '#6b7280' }}
          />
          <h3 className="truncate text-sm font-semibold text-foreground">
            {column.name}
          </h3>
          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {taskCount}
          </span>
        </div>

        {column.wip_limit !== null && (
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              isAtLimit
                ? 'bg-destructive/10 text-destructive'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            WIP {taskCount}/{column.wip_limit}
          </span>
        )}
      </div>

      {/* Tasks — ScrollArea for styled vertical scrollbar */}
      <ScrollArea className="min-h-0 flex-1 px-2 pb-2">
        <div
          ref={setNodeRef}
          className="flex flex-col gap-2"
          style={{ minHeight: 60 }}
        >
          <SortableContext
            items={taskIds}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))}
          </SortableContext>

          {taskCount === 0 && !isOver && (
            <div className="flex flex-1 items-center justify-center py-8">
              <p className="text-xs text-muted-foreground/50">No tasks</p>
            </div>
          )}

          {taskCount === 0 && isOver && (
            <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-primary/30 py-8">
              <p className="text-xs text-primary/60">Drop here</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export const KanbanColumn = memo(KanbanColumnComponent);
