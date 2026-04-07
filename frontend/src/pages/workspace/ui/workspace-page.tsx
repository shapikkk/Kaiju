import { Navigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useBoards } from '@entities/board';
import { Loader2 } from 'lucide-react';

/**
 * Workspace page — when only a workspace is selected (no board),
 * auto-redirects to the first board.
 */
export function WorkspacePage() {
  const { workspaceSlug = '' } = useParams();
  const { data: boards, isLoading } = useBoards(workspaceSlug);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (boards && boards.length > 0) {
    return <Navigate to={`/${workspaceSlug}/${boards[0].slug}`} replace />;
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold">No boards yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Create a board from the sidebar to get started.
        </p>
      </div>
    </div>
  );
}
