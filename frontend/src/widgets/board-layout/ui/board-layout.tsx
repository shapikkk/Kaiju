import { useState, useMemo, useCallback } from 'react';
import { KanbanBoard } from '@widgets/kanban';
import { TaskDetailPanel } from '@widgets/task-detail';
import { CreateTaskDialog } from '@features/create-task';
import { useBoard, useSprints, useCreateSprint, useCreateEpic, useDeleteBoard } from '@entities/board';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@shared/ui/dialog';
import { Plus, Zap, Timer, MoreHorizontal, Trash2, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu';
import type { User } from '@shared/types';

interface BoardLayoutProps {
  workspaceSlug: string;
  boardSlug: string;
  initialTaskId?: number | null;
}

export function BoardLayout({ workspaceSlug, boardSlug, initialTaskId = null }: BoardLayoutProps) {
  const { data: board, isLoading } = useBoard(workspaceSlug, boardSlug);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(initialTaskId);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createInColumnId, setCreateInColumnId] = useState<number | null>(null);
  const [sprintDialogOpen, setSprintDialogOpen] = useState(false);
  const [epicDialogOpen, setEpicDialogOpen] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');
  const [newEpicName, setNewEpicName] = useState('');
  const [newEpicColor, setNewEpicColor] = useState('#6366f1');
  const [deleteBoardOpen, setDeleteBoardOpen] = useState(false);

  const { data: sprints = [] } = useSprints(board?.id ?? 0);
  const createSprint = useCreateSprint(board?.id ?? 0);
  const createEpic = useCreateEpic(workspaceSlug);
  const deleteBoard = useDeleteBoard(workspaceSlug);

  const boardUsers = useMemo(() => {
    if (!board?.columns) return [];
    const map = new Map<number, User>();
    for (const col of board.columns) {
      for (const task of col.tasks ?? []) {
        if (task.creator) map.set(task.creator.id, task.creator);
        if (task.assignee) map.set(task.assignee.id, task.assignee);
      }
    }
    return Array.from(map.values());
  }, [board]);

  const handleTaskClick = useCallback((task: { id: number }) => {
    setSelectedTaskId(task.id);
  }, []);

  const handleCloseTask = useCallback(() => setSelectedTaskId(null), []);

  const handleAddTask = useCallback((columnId: number) => {
    setCreateInColumnId(columnId);
    setCreateDialogOpen(true);
  }, []);

  const handleNewTask = useCallback(() => {
    setCreateInColumnId(null);
    setCreateDialogOpen(true);
  }, []);

  /** Total tasks and the share sitting in a "done" column, in one pass. */
  const { taskTotal, donePct } = useMemo(() => {
    const columns = board?.columns ?? [];
    let total = 0;
    let done = 0;
    for (const col of columns) {
      const n = col.tasks?.length ?? 0;
      total += n;
      if (col.is_done_column) done += n;
    }
    return {
      taskTotal: total,
      donePct: total === 0 ? 0 : Math.round((done / total) * 100),
    };
  }, [board?.columns]);

  const handleCreateSprint = useCallback(() => {
    if (!newSprintName.trim()) return;
    createSprint.mutate(
      { name: newSprintName.trim() },
      { onSuccess: () => { setNewSprintName(''); setSprintDialogOpen(false); } },
    );
  }, [newSprintName, createSprint]);

  const handleCreateEpic = useCallback(() => {
    if (!newEpicName.trim()) return;
    createEpic.mutate(
      { name: newEpicName.trim(), color: newEpicColor },
      { onSuccess: () => { setNewEpicName(''); setNewEpicColor('#6366f1'); setEpicDialogOpen(false); } },
    );
  }, [newEpicName, newEpicColor, createEpic]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {board && (
        <div className="kj-fade relative z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-sm">
          <div className="flex min-w-0 items-center gap-3">
            {board.color && (
              <span
                className="h-5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: board.color }}
                aria-hidden
              />
            )}
            <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground">
              {board.name}
            </h1>

            {taskTotal > 0 && (
              <div className="flex items-center gap-2 border-l pl-3 text-[11px] text-muted-foreground">
                <span className="tabular-nums">
                  {taskTotal} {taskTotal === 1 ? 'task' : 'tasks'}
                </span>
                <span
                  className="relative h-1.5 w-16 overflow-hidden rounded-full bg-muted"
                  title={`${donePct}% done`}
                >
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-[width] duration-500 ease-out"
                    style={{ width: `${donePct}%` }}
                  />
                </span>
                <span className="tabular-nums font-medium">{donePct}%</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSprintDialogOpen(true)}>
              <Timer className="mr-1.5 h-3.5 w-3.5" /> Sprint
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEpicDialogOpen(true)}>
              <Zap className="mr-1.5 h-3.5 w-3.5" /> Epic
            </Button>
            <Button size="sm" onClick={handleNewTask}>
              <Plus className="mr-1.5 h-4 w-4" /> New Task
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Board actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  className="gap-2 text-destructive focus:text-destructive"
                  onSelect={() => setDeleteBoardOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      <KanbanBoard
        board={board}
        isLoading={isLoading}
        onTaskClick={handleTaskClick}
        onAddTask={handleAddTask}
      />

      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          boardUsers={boardUsers}
          boardSprints={sprints}
          onClose={handleCloseTask}
        />
      )}

      {board && (
        <CreateTaskDialog
          board={board}
          workspaceSlug={workspaceSlug}
          boardSlug={boardSlug}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          defaultColumnId={createInColumnId}
        />
      )}

      <Dialog open={deleteBoardOpen} onOpenChange={setDeleteBoardOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Delete Board
            </DialogTitle>
            <DialogDescription>
              Delete <strong>{board?.name}</strong>? Its columns and{' '}
              {taskTotal} {taskTotal === 1 ? 'task' : 'tasks'} will be permanently
              removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteBoardOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteBoard.isPending}
              onClick={() => board && deleteBoard.mutate(board.slug)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sprintDialogOpen} onOpenChange={setSprintDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Sprint</DialogTitle>
            <DialogDescription>Add a new sprint to <strong>{board?.name}</strong></DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            <Input
              placeholder="Sprint name, e.g. Sprint 1"
              value={newSprintName}
              onChange={(e) => setNewSprintName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateSprint()}
              autoFocus
            />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setSprintDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSprint} disabled={!newSprintName.trim() || createSprint.isPending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={epicDialogOpen} onOpenChange={setEpicDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Epic</DialogTitle>
            <DialogDescription>Add a new epic to this workspace</DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            <Input
              placeholder="Epic name, e.g. User Authentication"
              value={newEpicName}
              onChange={(e) => setNewEpicName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateEpic()}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newEpicColor}
                onChange={(e) => setNewEpicColor(e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border bg-transparent"
              />
              <span className="text-xs text-muted-foreground">{newEpicColor}</span>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEpicDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateEpic} disabled={!newEpicName.trim() || createEpic.isPending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
