import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { ScrollArea } from '@shared/ui/scroll-area';
import { AttachmentSection } from '@features/attachments/ui/attachment-section';
import { useTask, useUpdateTask, useTags, useEpics } from '@entities/board';
import { useCreateComment, useUpdateComment, useDeleteComment } from '@entities/message';
import { TaskMetadataGrid } from '@entities/task/ui/task-metadata-grid';
import { TaskCommentList } from '@entities/task/ui/task-comment-list';
import { PRIORITY_CONFIG } from '@shared/types';
import type { Priority, UpdateTaskPayload, User, Tag, Sprint } from '@shared/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@shared/ui/select';
import { X, Loader2, Tags } from 'lucide-react';

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

  const { data: task, isLoading: taskLoading } = useTask(taskId);
  const updateTask = useUpdateTask(boardQueryKey);
  const { data: allTags = [] } = useTags(workspaceSlug);
  const { data: allEpics = [] } = useEpics(workspaceSlug);

  const createComment = useCreateComment(taskId);
  const updateComment = useUpdateComment(taskId);
  const deleteComment = useDeleteComment(taskId);
  const commentMutations = { createComment, updateComment, deleteComment };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const patchField = <K extends keyof UpdateTaskPayload>(field: K, value: UpdateTaskPayload[K]) => {
    if (!task) return;
    updateTask.mutate({ taskId: task.id, payload: { [field]: value } as UpdateTaskPayload });
  };

  const currentTagIds = task?.tags?.map((t: Tag) => t.id) ?? [];
  const toggleTag = (tagId: number) => {
    const newIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter((id: number) => id !== tagId)
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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex h-full w-full max-w-2xl flex-col bg-background shadow-2xl animate-in slide-in-from-right-8">
        {/* Header */}
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

            {/* Tags */}
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

            {/* Description */}
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Description</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {task.description || 'No description provided.'}
              </p>
            </div>

            {/* Metadata grid — extracted entity component */}
            <TaskMetadataGrid
              task={task}
              boardUsers={boardUsers}
              boardSprints={boardSprints}
              allEpics={allEpics}
              onPatchField={patchField}
            />

            {/* Comment list — extracted entity component */}
            <TaskCommentList task={task} mutations={commentMutations} />

            {/* Attachments */}
            <AttachmentSection taskId={task.id} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
