import { useParams, useSearchParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { KanbanBoard } from '@widgets/kanban/ui/kanban-board';
import { TaskDetailPanel } from '@widgets/task-detail/ui/task-detail-panel';
import { CreateTaskDialog } from '@features/create-task/ui/create-task-dialog';
import { useBoard, useSprints, useCreateSprint, useCreateEpic } from '@shared/lib/api/useApi';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Plus, Zap, Timer } from 'lucide-react';
import type { User } from "@shared/types";

export function BoardPage() {
  const { workspaceSlug = '', boardSlug = '' } = useParams();
  const [searchParams] = useSearchParams();
  const { data: board, isLoading } = useBoard(workspaceSlug, boardSlug);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(() => {
    const p = searchParams.get('task');
    return p ? Number(p) : null;
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const [sprintDialogOpen, setSprintDialogOpen] = useState(false);
  const [epicDialogOpen, setEpicDialogOpen] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');
  const [newEpicName, setNewEpicName] = useState('');
  const [newEpicColor, setNewEpicColor] = useState('#6366f1');

  const { data: sprints = [] } = useSprints(board?.id ?? 0);
  const createSprint = useCreateSprint(board?.id ?? 0);
  const createEpic = useCreateEpic(workspaceSlug);

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

  const handleCreateSprint = () => {
    if (!newSprintName.trim()) return;
    createSprint.mutate(
      { name: newSprintName.trim() },
      {
        onSuccess: () => {
          setNewSprintName('');
          setSprintDialogOpen(false);
        },
      },
    );
  };

  const handleCreateEpic = () => {
    if (!newEpicName.trim()) return;
    createEpic.mutate(
      { name: newEpicName.trim(), color: newEpicColor },
      {
        onSuccess: () => {
          setNewEpicName('');
          setNewEpicColor('#6366f1');
          setEpicDialogOpen(false);
        },
      },
    );
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {board && (
        <div className="relative z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background px-6">
          <div className="flex items-center gap-3">
            {board.color && (
              <div
                className="h-4 w-4 rounded"
                style={{ backgroundColor: board.color }}
              />
            )}
            <h1 className="text-lg font-bold text-foreground">{board.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSprintDialogOpen(true)}
            >
              <Timer className="mr-1.5 h-3.5 w-3.5" />
              Sprint
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEpicDialogOpen(true)}
            >
              <Zap className="mr-1.5 h-3.5 w-3.5" />
              Epic
            </Button>
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>
      )}

      <KanbanBoard
        board={board}
        isLoading={isLoading}
        onTaskClick={(task) => setSelectedTaskId(task.id)}
      />

      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          boardUsers={boardUsers}
          boardSprints={sprints}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {board && (
        <CreateTaskDialog
          board={board}
          workspaceSlug={workspaceSlug}
          boardSlug={boardSlug}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      )}

      <Dialog open={sprintDialogOpen} onOpenChange={setSprintDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Sprint</DialogTitle>
            <DialogDescription>
              Add a new sprint to <strong>{board?.name}</strong>
            </DialogDescription>
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
            <Button
              variant="outline"
              onClick={() => setSprintDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSprint}
              disabled={!newSprintName.trim() || createSprint.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={epicDialogOpen} onOpenChange={setEpicDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Epic</DialogTitle>
            <DialogDescription>
              Add a new epic to this workspace
            </DialogDescription>
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
              <span className="text-xs text-muted-foreground">
                {newEpicColor}
              </span>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setEpicDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateEpic}
              disabled={!newEpicName.trim() || createEpic.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
