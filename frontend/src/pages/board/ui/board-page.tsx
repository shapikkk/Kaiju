import { useParams, useSearchParams } from 'react-router-dom';
import { BoardLayout } from '@widgets/board-layout';

export function BoardPage() {
  const { workspaceSlug = '', boardSlug = '' } = useParams();
  const [searchParams] = useSearchParams();
  const initialTaskId = searchParams.get('task') ? Number(searchParams.get('task')) : null;

  return (
    <BoardLayout
      workspaceSlug={workspaceSlug}
      boardSlug={boardSlug}
      initialTaskId={initialTaskId}
    />
  );
}
