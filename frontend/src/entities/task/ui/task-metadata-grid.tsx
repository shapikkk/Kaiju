import { useState, useEffect } from 'react';
import { Card, CardContent } from '@shared/ui/card';
import { Input } from '@shared/ui/input';
import { Button } from '@shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import {
  Calendar,
  Clock,
  User as UserIcon,
  Check,
  Zap,
} from 'lucide-react';
import type { Task, UpdateTaskPayload, User, Sprint, Epic } from '@shared/types';

interface TaskMetadataGridProps {
  task: Task;
  boardUsers: User[];
  boardSprints: Sprint[];
  allEpics: Epic[];
  onPatchField: <K extends keyof UpdateTaskPayload>(field: K, value: UpdateTaskPayload[K]) => void;
}

export function TaskMetadataGrid({
  task,
  boardUsers,
  boardSprints,
  allEpics,
  onPatchField,
}: TaskMetadataGridProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editDueDate, setEditDueDate] = useState(task.due_date ?? '');
  const [editHours, setEditHours] = useState(String(task.estimated_hours ?? ''));

  useEffect(() => {
    setEditDueDate(task.due_date ?? '');
    setEditHours(String(task.estimated_hours ?? ''));
    setEditingField(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id, task.due_date, task.estimated_hours]);

  const patch = <K extends keyof UpdateTaskPayload>(field: K, value: UpdateTaskPayload[K]) => {
    onPatchField(field, value);
    setEditingField(null);
  };

  return (
    <div className="mt-6 grid grid-cols-2 gap-4">
      {/* Assignee */}
      <Card
        className="cursor-pointer transition-colors hover:bg-accent/50"
        onClick={() => setEditingField('assignee')}
      >
        <CardContent className="flex items-center gap-2 p-3">
          <UserIcon className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-[10px] uppercase text-muted-foreground">Assignee</p>
            {editingField === 'assignee' ? (
              <Select
                value={String(task.assignee?.id ?? '__none')}
                onValueChange={(v) =>
                  patch('assignee_id', v === '__none' ? null : Number(v))
                }
              >
                <SelectTrigger className="mt-1 h-7 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Unassigned</SelectItem>
                  {boardUsers.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm font-medium">
                {task.assignee?.name ?? 'Unassigned'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Due Date */}
      <Card
        className="cursor-pointer transition-colors hover:bg-accent/50"
        onClick={() => setEditingField('due_date')}
      >
        <CardContent className="flex items-center gap-2 p-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-[10px] uppercase text-muted-foreground">Due Date</p>
            {editingField === 'due_date' ? (
              <div className="mt-1 flex items-center gap-1">
                <Input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="h-7 text-xs"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    patch('due_date', editDueDate || null);
                  }}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <p className="text-sm font-medium">
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Not set'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sprint */}
      <Card
        className="cursor-pointer transition-colors hover:bg-accent/50"
        onClick={() => setEditingField('sprint')}
      >
        <CardContent className="flex items-center gap-2 p-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-[10px] uppercase text-muted-foreground">Sprint</p>
            {editingField === 'sprint' ? (
              <Select
                value={String(task.sprint_id ?? '__none')}
                onValueChange={(v) =>
                  patch('sprint_id', v === '__none' ? null : Number(v))
                }
              >
                <SelectTrigger className="mt-1 h-7 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Backlog</SelectItem>
                  {boardSprints.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm font-medium">
                {task.sprint?.name ?? 'Backlog'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estimate */}
      <Card
        className="cursor-pointer transition-colors hover:bg-accent/50"
        onClick={() => setEditingField('estimated_hours')}
      >
        <CardContent className="flex items-center gap-2 p-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-[10px] uppercase text-muted-foreground">Estimate</p>
            {editingField === 'estimated_hours' ? (
              <div className="mt-1 flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={editHours}
                  onChange={(e) => setEditHours(e.target.value)}
                  className="h-7 text-xs"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    patch('estimated_hours', editHours ? Number(editHours) : null);
                  }}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <p className="text-sm font-medium">
                {task.estimated_hours ? `${task.estimated_hours}h` : 'Not set'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Epic */}
      <Card
        className="col-span-2 cursor-pointer transition-colors hover:bg-accent/50"
        onClick={() => setEditingField('epic')}
      >
        <CardContent className="flex items-center gap-2 p-3">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-[10px] uppercase text-muted-foreground">Epic</p>
            {editingField === 'epic' ? (
              <Select
                value={String(task.epic_id ?? '__none')}
                onValueChange={(v) =>
                  patch('epic_id', v === '__none' ? null : Number(v))
                }
              >
                <SelectTrigger className="mt-1 h-7 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No Epic</SelectItem>
                  {allEpics.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      <span className="flex items-center gap-1.5">
                        {e.color && (
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: e.color }}
                          />
                        )}
                        {e.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm font-medium">
                {task.epic?.name ?? 'No Epic'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
