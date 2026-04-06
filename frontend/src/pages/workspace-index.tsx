import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useWorkspaces } from '@/hooks/useApi';
import { CreateWorkspaceDialog } from '@/components/create-workspace-dialog';
import { Button } from '@shared/ui/button';
import { Loader2, LayoutDashboard } from 'lucide-react';

/**
 * Workspace index — redirects to the first available workspace,
 * or shows an actionable empty state if none exist.
 */
export function WorkspaceIndex() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const [createOpen, setCreateOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (workspaces && workspaces.length > 0) {
    return <Navigate to={`/${workspaces[0].slug}`} replace />;
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <LayoutDashboard className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-xl font-semibold">Welcome to Kaiju</h2>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          You don't have any workspaces yet. Create your first one to start
          organizing your team's work.
        </p>
        <Button className="mt-6" onClick={() => setCreateOpen(true)}>
          Create your first workspace
        </Button>
      </div>

      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
