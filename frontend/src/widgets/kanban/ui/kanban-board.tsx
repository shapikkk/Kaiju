import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  defaultDropAnimation,
  defaultDropAnimationSideEffects,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  PointerSensor,
  type CollisionDetection,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type DropAnimation,
} from '@dnd-kit/core';
import { useState } from 'react';
import { KanbanColumn } from './kanban-column';
import { TaskCard } from './task-card';
import { useMoveTask } from '@entities/board';
import { useQueryClient } from '@tanstack/react-query';
import { LayoutGrid } from 'lucide-react';
import type { Board, Column, Task } from "@shared/types";

interface KanbanBoardProps {
  board: Board | undefined;
  isLoading: boolean;
  onTaskClick?: (task: Task) => void;
  onAddTask?: (columnId: number) => void;
}

export function KanbanBoard({
  board,
  isLoading,
  onTaskClick,
  onAddTask,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();
  const { workspaceSlug = '', boardSlug = '' } = useParams();
  const boardQueryKey = useMemo(
    () => ['board', workspaceSlug, boardSlug],
    [workspaceSlug, boardSlug],
  );
  const moveTask = useMoveTask(boardQueryKey);

  /*
   * closestCorners measures the *dragged card's* corners against every
   * droppable. Because the card is a tall element trailing the cursor, the
   * corner nearest a column often fell outside it, so a drop only registered
   * over a narrow band. Resolving from the pointer instead means the drop
   * lands wherever the cursor is, which is what people actually expect.
   *
   * Column droppables are preferred over task droppables so that dropping
   * anywhere in a column's empty space works, not just onto another card.
   */
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    const collisions = pointerCollisions.length > 0
      ? pointerCollisions
      : rectIntersection(args);

    if (collisions.length === 0) return collisions;

    const overTask = collisions.find((c) => String(c.id).startsWith('task-'));
    if (overTask) return [overTask];

    const overColumn = collisions.find((c) => String(c.id).startsWith('column-'));
    if (overColumn) return [overColumn];

    const first = getFirstCollision(collisions);
    return first === null ? [] : collisions;
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // A short distance keeps drags responsive without hijacking clicks.
      activationConstraint: { distance: 6 },
    }),
  );

  // The card should fly back to its slot rather than blinking out of existence.
  const dropAnimation: DropAnimation = {
    ...defaultDropAnimation,
    duration: 260,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0.35' } },
    }),
  };

  const sortedColumns = useMemo(() => {
    if (!board?.columns) return [];
    return [...board.columns]
      .sort((a, b) => a.position - b.position)
      .map((col) => ({
        ...col,
        tasks: [...(col.tasks ?? [])].sort((a, b) => a.position - b.position),
      }));
  }, [board?.columns]);

  const findColumnByTaskId = useCallback(
    (taskId: number): Column | undefined => {
      return sortedColumns.find((col) =>
        col.tasks?.some((t) => t.id === taskId),
      );
    },
    [sortedColumns],
  );

  const extractTaskId = (dndId: string | number): number => {
    return Number(String(dndId).replace('task-', ''));
  };

  const extractColumnId = (dndId: string | number): number => {
    return Number(String(dndId).replace('column-', ''));
  };

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const taskId = extractTaskId(event.active.id);
      for (const col of sortedColumns) {
        const task = col.tasks?.find((t) => t.id === taskId);
        if (task) {
          setActiveTask(task);
          break;
        }
      }
    },
    [sortedColumns],
  );

  const handleDragOver = useCallback(
    (_event: DragOverEvent) => {
    },
    [],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over || !board) return;

      const activeTaskId = extractTaskId(active.id);
      const overId = String(over.id);

      let targetColumnId: number;
      let targetPosition: number;

      if (overId.startsWith('column-')) {
        targetColumnId = extractColumnId(overId);
        const col = sortedColumns.find((c) => c.id === targetColumnId);
        targetPosition = col?.tasks?.length ?? 0;
      } else if (overId.startsWith('task-')) {
        const overTaskId = extractTaskId(overId);
        const col = findColumnByTaskId(overTaskId);
        if (!col) return;
        targetColumnId = col.id;
        const overIndex = col.tasks?.findIndex((t) => t.id === overTaskId) ?? 0;
        targetPosition = overIndex;
      } else {
        return;
      }

      const sourceCol = findColumnByTaskId(activeTaskId);
      const sourceTask = sourceCol?.tasks?.find((t) => t.id === activeTaskId);
      if (
        sourceCol?.id === targetColumnId &&
        sourceTask?.position === targetPosition
      ) {
        return;
      }

      queryClient.setQueryData<Board>(boardQueryKey, (old) => {
          if (!old?.columns) return old;

          const newColumns = old.columns.map((col) => ({
            ...col,
            tasks: [...(col.tasks ?? [])],
          }));

          const srcCol = newColumns.find((c) =>
            c.tasks.some((t) => t.id === activeTaskId),
          );
          if (!srcCol) return old;
          const taskIndex = srcCol.tasks.findIndex(
            (t) => t.id === activeTaskId,
          );
          if (taskIndex === -1) return old;
          const [movedTask] = srcCol.tasks.splice(taskIndex, 1);

          const destCol = newColumns.find((c) => c.id === targetColumnId);
          if (!destCol) return old;
          movedTask.column_id = targetColumnId;
          movedTask.position = targetPosition;
          destCol.tasks.splice(targetPosition, 0, movedTask);

          destCol.tasks.forEach((t, i) => (t.position = i));
          if (srcCol.id !== targetColumnId) {
            srcCol.tasks.forEach((t, i) => (t.position = i));
          }

          return { ...old, columns: newColumns };
      });

      moveTask.mutate({
        taskId: activeTaskId,
        payload: {
          column_id: targetColumnId,
          position: targetPosition,
        },
      });
    },
    [board, sortedColumns, findColumnByTaskId, moveTask, queryClient, boardQueryKey],
  );

  if (isLoading) {
    // Skeleton mirrors the real layout so the board does not jump on load.
    return (
      <div className="flex h-full w-full min-h-0 gap-3 overflow-hidden p-4">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="mb-1 flex items-center gap-2 px-1">
              <span className="h-4 w-1 rounded-full bg-muted" />
              <span className="kj-shimmer h-3 w-24 rounded" />
            </div>
            <div className="flex flex-1 flex-col gap-2 rounded-xl bg-muted/25 p-2">
              {Array.from({ length: 3 - (col % 2) }).map((__, card) => (
                <div
                  key={card}
                  className="kj-shimmer h-[68px] rounded-lg"
                  style={{ animationDelay: `${(col * 3 + card) * 90}ms` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="kj-rise text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <LayoutGrid className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold text-foreground">
            No board selected
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a board from the sidebar to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/*
        Columns share the width evenly until they would get too narrow to read,
        then the board scrolls horizontally instead of crushing every card.
      */}
      <div className="kj-scroll group/board flex h-full w-full min-h-0 gap-3 overflow-x-auto overflow-y-hidden p-4">
        {sortedColumns.map((column, i) => (
          <div key={column.id} className="flex min-w-[264px] flex-1 flex-col">
            <KanbanColumn
              column={column}
              onTaskClick={onTaskClick}
              onAddTask={onAddTask}
              index={i}
            />
          </div>
        ))}
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeTask ? (
          <div className="w-[264px] cursor-grabbing">
            <TaskCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
