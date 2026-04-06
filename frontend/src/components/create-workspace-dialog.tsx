import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useCreateWorkspace } from '@/hooks/useApi';
import { Loader2 } from 'lucide-react';

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const createWorkspace = useCreateWorkspace();

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(toSlug(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setSlug(toSlug(value));
  };

  const resetForm = () => {
    setName('');
    setSlug('');
    setDescription('');
    setSlugTouched(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    createWorkspace.mutate(
      { name: name.trim(), slug: slug.trim(), description: description.trim() || undefined },
      {
        onSuccess: (workspace) => {
          resetForm();
          onOpenChange(false);
          navigate(`/${workspace.slug}`);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>
              A workspace groups your boards and team members.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ws-name">Name *</Label>
              <Input
                id="ws-name"
                placeholder="e.g. Acme Corp"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ws-slug">URL slug *</Label>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-muted-foreground">app/</span>
                <Input
                  id="ws-slug"
                  placeholder="acme-corp"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Only lowercase letters, numbers, and hyphens.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ws-desc">Description</Label>
              <Textarea
                id="ws-desc"
                placeholder="What is this workspace for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !slug.trim() || createWorkspace.isPending}
            >
              {createWorkspace.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
