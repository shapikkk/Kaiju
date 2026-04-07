import { useState } from 'react';
import { Button } from '@shared/ui/button';
import { MessageSquare, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useCurrentUser } from '@shared/lib/auth/useAuth';
import type { Task } from '@shared/types';
import type { UseMutationResult } from '@tanstack/react-query';

interface CommentMutations {
  createComment: UseMutationResult<unknown, Error, { body: string }, unknown>;
  updateComment: UseMutationResult<unknown, Error, { commentId: number; body: string }, unknown>;
  deleteComment: UseMutationResult<unknown, Error, number, unknown>;
}

interface TaskCommentListProps {
  task: Task;
  mutations: CommentMutations;
}

export function TaskCommentList({ task, mutations }: TaskCommentListProps) {
  const { createComment, updateComment, deleteComment } = mutations;
  const currentUser = useCurrentUser();
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  const handleSend = () => {
    if (!commentText.trim()) return;
    createComment.mutate(
      { body: commentText.trim() },
      { onSuccess: () => setCommentText('') },
    );
  };

  const handleSaveEdit = (commentId: number) => {
    if (!editCommentText.trim()) return;
    updateComment.mutate(
      { commentId, body: editCommentText.trim() },
      { onSuccess: () => setEditingCommentId(null) },
    );
  };

  return (
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
            <div key={comment.id} className="group rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {comment.user?.name
                      ?.split(' ')
                      .map((n: string) => n[0])
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
                      if (e.key === 'Enter') handleSaveEdit(comment.id);
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
                    onClick={() => handleSaveEdit(comment.id)}
                    disabled={updateComment.isPending}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <p className="mt-1.5 text-sm text-muted-foreground">{comment.body}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Add comment */}
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Add a comment..."
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
        />
        <Button
          size="sm"
          disabled={!commentText.trim() || createComment.isPending}
          onClick={handleSend}
        >
          {createComment.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Send'
          )}
        </Button>
      </div>
    </div>
  );
}
