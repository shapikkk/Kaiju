import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@shared/ui/button';
import { Card, CardContent } from '@shared/ui/card';
import { Input } from '@shared/ui/input';
import { Badge } from '@shared/ui/badge';
import { ScrollArea } from '@shared/ui/scroll-area';
import { AttachmentSection } from '@/components/attachment-section';
import {
  useTask,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useUpdateTask,
  useTags,
  useEpics,
} from '@/hooks/useApi';
import { useCurrentUser } from '@/hooks/useAuth';
import { PRIORITY_CONFIG } from "@shared/types";
import type { Priority, UpdateTaskPayload, User, Tag, Epic, Sprint } from "@shared/types";
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
  MessageSquare,
  User as UserIcon,
  X,
  Loader2,
  Check,
  Pencil,
  Trash2,
  Zap,
  Tags,
} from 'lucide-react';

interface TaskDetailPanelProps {
  taskId: number;
  boardUsers?: User[];
  boardSprints?: Sprint[];
  onClose: () => void;
}

const PRIORITIES: Priority[] = ['lowest', 'low', 'medium', 'high', 'highest'];

export function TaskDetailPanel({
  taskId,
  boardUsers = [],
  boardSprints = [],
  onClose,
}: TaskDetailPanelProps) {
  const { workspaceSlug = '', boardSlug = '' } = useParams();
  const boardQueryKey = ['board', workspaceSlug, boardSlug];
  const currentUser = useCurrentUser();
  const [commentText, setCommentText] = useState('');

  const { data: task, isLoading: taskLoading } = useTask(taskId);

  const createComment = useCreateComment(taskId);
  const updateComment = useUpdateComment(taskId);
  const deleteComment = useDeleteComment(taskId);
  const updateTask = useUpdateTask(boardQueryKey);

  const { data: allTags = [] } = useTags(workspaceSlug);
  const { data: allEpics = [] } = useEpics(workspaceSlug);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editDueDate, setEditDueDate] = useState('');
  const [editHours, setEditHours] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  useEffect(() => {
    if (!task) return;
    setEditDueDate(task.due_date ?? '');
    setEditHours(String(task.estimated_hours ?? ''));
    setEditingField(null);
    setEditingCommentId(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, task?.due_date, task?.estimated_hours]);

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    createComment.mutate(
      { body: commentText.trim() },
      { onSuccess: () => setCommentText('') },
    );
  };

  const handleSaveEditComment = (commentId: number) => {
    if (!editCommentText.trim()) return;
    updateComment.mutate(
      { commentId, body: editCommentText.trim() },
      { onSuccess: () => setEditingCommentId(null) },
    );
  };

  const patchField = <K extends keyof UpdateTaskPayload>(field: K, value: UpdateTaskPayload[K]) => {
    if (!task) return;
    updateTask.mutate({
      taskId: task.id,
      payload: { [field]: value } as UpdateTaskPayload,
    });
    setEditingField(null);
  };

  const currentTagIds = task?.tags?.map((t) => t.id) ?? [];
  const toggleTag = (tagId: number) => {
    const newIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter((id) => id !== tagId)
      : [...currentTagIds, tagId];
    patchField('tag_ids', newIds);
  };

  if (taskLoading || !task) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="flex h-full w-full max-w-2xl items-center justify-center bg-background shadow-2xl">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const priorityCfg = PRIORITY_CONFIG[task.priority];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-full w-full max-w-2xl flex-col bg-background shadow-2xl animate-in slide-in-from-right-8">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold uppercase text-muted-foreground">
              {task.key}
            </span>

            <Select
              value={task.priority}
              onValueChange={(v) => patchField('priority', v as Priority)}
            >
              <SelectTrigger className="h-7 w-auto border-none bg-transparent p-0 shadow-none">
                <span
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${priorityCfg.color}15`,
                    color: priorityCfg.color,
                  }}
                >
                  {priorityCfg.icon} {priorityCfg.label}
                </span>
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    <span className="flex items-center gap-1.5">
                      <span style={{ color: PRIORITY_CONFIG[p].color }}>
                        {PRIORITY_CONFIG[p].icon}
                      </span>
                      {PRIORITY_CONFIG[p].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="px-6 py-5">
          <h2 className="text-xl font-bold text-foreground">{task.title}</h2>

          {allTags.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground">
                <Tags className="h-3 w-3" /> Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag: Tag) => {
                  const isActive = currentTagIds.includes(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant={isActive ? 'default' : 'outline'}
                      className="cursor-pointer select-none transition-all hover:scale-105"
                      style={
                        isActive
                          ? { backgroundColor: tag.color, borderColor: tag.color }
                          : { borderColor: tag.color, color: tag.color }
                      }
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-5">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Description
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {task.description || 'No description provided.'}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <Card
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => setEditingField('assignee')}
            >
              <CardContent className="flex items-center gap-2 p-3">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Assignee
                  </p>
                  {editingField === 'assignee' ? (
                    <Select
                      value={String(task.assignee?.id ?? '__none')}
                      onValueChange={(v) =>
                        patchField(
                          'assignee_id',
                          v === '__none' ? null : Number(v),
                        )
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

            <Card
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => setEditingField('due_date')}
            >
              <CardContent className="flex items-center gap-2 p-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Due Date
                  </p>
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
                          patchField('due_date', editDueDate || null);
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

            <Card
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => setEditingField('sprint')}
            >
              <CardContent className="flex items-center gap-2 p-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Sprint
                  </p>
                  {editingField === 'sprint' ? (
                    <Select
                      value={String(task.sprint_id ?? '__none')}
                      onValueChange={(v) =>
                        patchField(
                          'sprint_id',
                          v === '__none' ? null : Number(v),
                        )
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

            <Card
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => setEditingField('estimated_hours')}
            >
              <CardContent className="flex items-center gap-2 p-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Estimate
                  </p>
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
                          patchField(
                            'estimated_hours',
                            editHours ? Number(editHours) : null,
                          );
                        }}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm font-medium">
                      {task.estimated_hours
                        ? `${task.estimated_hours}h`
                        : 'Not set'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card
              className="col-span-2 cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => setEditingField('epic')}
            >
              <CardContent className="flex items-center gap-2 p-3">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Epic
                  </p>
                  {editingField === 'epic' ? (
                    <Select
                      value={String(task.epic_id ?? '__none')}
                      onValueChange={(v) =>
                        patchField(
                          'epic_id',
                          v === '__none' ? null : Number(v),
                        )
                      }
                    >
                      <SelectTrigger className="mt-1 h-7 w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">No Epic</SelectItem>
                        {allEpics.map((e: Epic) => (
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

          <div className="mt-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageSquare className="h-4 w-4" />
              Comments
              {task.comments && task.comments.length > 0 && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {task.comments.length}
                </span>
              )}
            </h3>

            <div className="space-y-3">
              {task.comments?.map((comment) => {
                const isOwn = currentUser?.id === comment.user?.id;
                const isEditing = editingCommentId === comment.id;

                return (
                  <div
                    key={comment.id}
                    className="group rounded-lg border bg-card p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                          {comment.user?.name
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2) ?? '?'}
                        </div>
                        <span className="text-xs font-medium">
                          {comment.user?.name ?? 'Unknown'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {isOwn && !isEditing && (
                        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditCommentText(comment.body);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => deleteComment.mutate(comment.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter')
                              handleSaveEditComment(comment.id);
                            if (e.key === 'Escape') setEditingCommentId(null);
                          }}
                          className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm outline-none ring-ring focus:ring-2"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingCommentId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEditComment(comment.id)}
                          disabled={updateComment.isPending}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {comment.body}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                placeholder="Add a comment..."
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
              />
              <Button
                size="sm"
                disabled={!commentText.trim() || createComment.isPending}
                onClick={handleSendComment}
              >
                {createComment.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Send'
                )}
              </Button>
            </div>
          </div>

          <AttachmentSection taskId={task.id} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
