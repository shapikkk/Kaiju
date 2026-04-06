import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Input } from '@shared/ui/input';
import { Button } from '@shared/ui/button';
import { Hash, Trash2, Loader2 } from 'lucide-react';
import type { Channel } from "@shared/types";

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, description?: string) => Promise<void>;
  isCreating: boolean;
}

export function CreateChannelDialog({ open, onOpenChange, onCreate, isCreating }: CreateChannelDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setName('');
      setDescription('');
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!trimmed) return;
    if (!/^[a-z0-9_-]+$/.test(trimmed)) {
      setError('Only lowercase letters, numbers, hyphens and underscores allowed.');
      return;
    }
    try {
      setError('');
      await onCreate(trimmed, description.trim() || undefined);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to create channel.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create channel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="channel-name"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase())}
                className="pl-8"
              />
            </div>
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
            <p className="mt-1 text-[11px] text-muted-foreground">
              Lowercase letters, numbers, hyphens and underscores only.
            </p>
          </div>
          <div>
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isCreating}>
              {isCreating && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: Channel | null;
  onUpdate: (name: string, description: string | null) => Promise<void>;
  onDelete: () => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function EditChannelDialog({
  open,
  onOpenChange,
  channel,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
}: EditChannelDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (channel) {
      setName(channel.name);
      setDescription(channel.description ?? '');
      setError('');
    }
  }, [channel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[a-z0-9_-]+$/.test(trimmed)) {
      setError('Only lowercase letters, numbers, hyphens and underscores allowed.');
      return;
    }
    try {
      setError('');
      await onUpdate(trimmed, description.trim() || null);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to update channel.');
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to delete channel.');
    }
  };

  if (!channel) return null;

  return (
    <>
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Delete #{channel.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            All messages in this channel will be permanently deleted. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit channel</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="channel-name"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase())}
                  className="pl-8"
                />
              </div>
              {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
            </div>
            <div>
              <Input
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              {!channel.is_default && (
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete channel
                </Button>
              )}
              <div className={`flex gap-2 ${channel.is_default ? 'ml-auto' : ''}`}>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
