import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { initRealtime, destroyRealtime } from '@processes/realtime';

interface RealtimeProviderProps {
  children: ReactNode;
}

/**
 * Mounts the singleton Echo connection on app load and tears it down
 * when the component unmounts (e.g. on logout). Must live inside AuthProvider
 * so the auth token is already stored in localStorage before connection.
 */
export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    initRealtime();
    return () => {
      destroyRealtime();
    };
  // queryClient is stable — intentionally excluded
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // queryClient is passed through module scope; expose it globally so handlers
  // can always find the current client from non-React contexts if needed.
  useEffect(() => {
    (window as any).__queryClient = queryClient;
  }, [queryClient]);

  return <>{children}</>;
}
