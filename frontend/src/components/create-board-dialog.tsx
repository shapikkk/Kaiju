import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateBoard } from '@/hooks/useApi';
import { Loader2 } from 'lucide-react';
import type { CreateBoardPayload } from '@/types';

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBoardDialog({
  open,
  onOpenChange,
}: CreateBoardDialogProps) {
  const { workspaceSlug = '' } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prefix, setPrefix] = useState('');
  const [color, setColor] = useState('#6366f1');

  const createBoard = useCreateBoard(workspaceSlug);

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug) return;

    const payload: CreateBoardPayload = {
      name: name.trim(),
      slug,
      prefix: prefix.trim().toUpperCase() || slug.toUpperCase().slice(0, 4),
      description: description.trim() || undefined,
      color,
    };

    createBoard.mutate(payload, {
      onSuccess: () => {
        setName('');
        setDescription('');
        setPrefix('');
        setColor('#6366f1');
        onOpenChange(false);
        navigate(`/${workspaceSlug}/${slug}`);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Board</DialogTitle>
            <DialogDescription>
              Add a new board to this workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="board-name">Board Name *</Label>
              <Input
                id="board-name"
                placeholder="e.g. Product Board"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
              {name && (
                <p className="text-[10px] text-muted-foreground">
                  Slug: <code>{slug}</code>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="board-prefix">Task Prefix</Label>
                <Input
                  id="board-prefix"
                  placeholder="e.g. PROJ"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  maxLength={10}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="board-color">Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="board-color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded border bg-transparent"
                  />
                  <span className="text-xs text-muted-foreground">{color}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="board-desc">Description</Label>
              <Textarea
                id="board-desc"
                placeholder="Optional description…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createBoard.isPending}
            >
              {createBoard.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Board
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
