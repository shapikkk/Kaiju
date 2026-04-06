import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import { KanbanColumn } from '@/components/kanban-column';
import { TaskCard } from '@/components/task-card';
import { useMoveTask } from '@/hooks/useApi';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import type { Board, Column, Task } from "@shared/types";

interface KanbanBoardProps {
  board: Board | undefined;
  isLoading: boolean;
  onTaskClick?: (task: Task) => void;
}

export function KanbanBoard({
  board,
  isLoading,
  onTaskClick,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();
  const { workspaceSlug = '', boardSlug = '' } = useParams();
  const boardQueryKey = useMemo(
    () => ['board', workspaceSlug, boardSlug],
    [workspaceSlug, boardSlug],
  );
  const moveTask = useMoveTask(boardQueryKey);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

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
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">
            No board selected
          </h2>
          <p className="text-sm text-muted-foreground">
            Select a board from the sidebar to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* 
        Strict grid layout: all columns share the available width equally.
        No horizontal scrollbar. Columns shrink proportionally.
      */}
      <div
        className="grid h-full w-full min-h-0 min-w-0 auto-cols-fr grid-flow-col gap-3 p-4"
      >
        {sortedColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-[280px]">
            <TaskCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
