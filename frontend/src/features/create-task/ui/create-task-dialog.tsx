import { useState, useMemo } from 'react';
import { ScrollArea } from '@shared/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Textarea } from '@shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import { useCreateTask } from '@entities/board';
import { PRIORITY_CONFIG } from "@shared/types";
import type { Board, Priority, CreateTaskPayload, Sprint, User } from "@shared/types";
import { Loader2 } from 'lucide-react';

interface CreateTaskDialogProps {
  board: Board;
  workspaceSlug: string;
  boardSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Preselects a column when opened from that column's "+" button. */
  defaultColumnId?: number | null;
}

const PRIORITIES: Priority[] = ['lowest', 'low', 'medium', 'high', 'highest'];

export function CreateTaskDialog({
  board,
  workspaceSlug,
  boardSlug,
  open,
  onOpenChange,
  defaultColumnId = null,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [columnId, setColumnId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [sprintId, setSprintId] = useState<string>('');

  const createTask = useCreateTask(board.id, workspaceSlug, boardSlug);

  const columns = useMemo(
    () =>
      board.columns
        ? [...board.columns].sort((a, b) => a.position - b.position)
        : [],
    [board.columns],
  );

  const sprints: Sprint[] = board.sprints ?? [];

  const users = useMemo(() => {
    const map = new Map<number, User>();
    for (const col of columns) {
      for (const task of col.tasks ?? []) {
        if (task.creator) map.set(task.creator.id, task.creator);
        if (task.assignee) map.set(task.assignee.id, task.assignee);
      }
    }
    return Array.from(map.values());
  }, [columns]);

  // Derived rather than synced into state: an explicit pick wins, otherwise
  // the column whose "+" opened the dialog, otherwise the first column.
  const effectiveColumnId = columnId
    ? Number(columnId)
    : defaultColumnId ?? columns[0]?.id ?? 0;

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setColumnId('');
    setDueDate('');
    setEstimatedHours('');
    setAssigneeId('');
    setSprintId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !effectiveColumnId) return;

    const payload: CreateTaskPayload = {
      column_id: effectiveColumnId,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: dueDate || undefined,
      estimated_hours: estimatedHours ? Number(estimatedHours) : undefined,
      assignee_id: assigneeId ? Number(assigneeId) : undefined,
      sprint_id: sprintId ? Number(sprintId) : undefined,
    };

    createTask.mutate(payload, {
      onSuccess: () => {
        resetForm();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setColumnId('');
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Add a new task to <strong>{board.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="mt-4 max-h-[65vh] pr-4">
            <div className="space-y-4 pb-4">
              {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea
                id="task-desc"
                placeholder="Add more details…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Row 1: Column + Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Column</Label>
                <Select
                  value={String(effectiveColumnId)}
                  onValueChange={setColumnId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col.id} value={String(col.id)}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: col.color ?? '#6b7280',
                            }}
                          />
                          {col.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as Priority)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        <span style={{ color: PRIORITY_CONFIG[p].color }}>
                          {PRIORITY_CONFIG[p].icon}
                        </span>{' '}
                        {PRIORITY_CONFIG[p].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Due Date + Estimated Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="task-due">Due Date</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="task-hours">Estimated Hours</Label>
                <Input
                  id="task-hours"
                  type="number"
                  min={0}
                  step={0.5}
                  placeholder="e.g. 4"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                />
              </div>
            </div>

            {/* Row 3: Assignee + Sprint */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Assignee</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Unassigned</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {sprints.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Sprint</Label>
                  <Select value={sprintId} onValueChange={setSprintId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Backlog" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Backlog</SelectItem>
                      {sprints.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || createTask.isPending}
            >
              {createTask.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
