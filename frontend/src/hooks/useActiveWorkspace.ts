import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

export function useActiveWorkspace() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();

  useEffect(() => {
    if (workspaceSlug) {
      localStorage.setItem('lastActiveWorkspace', workspaceSlug);
    }
  }, [workspaceSlug]);

  return workspaceSlug || localStorage.getItem('lastActiveWorkspace') || undefined;
}
