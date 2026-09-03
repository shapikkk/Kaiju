import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { initRealtime, destroyRealtime, subscribeUser, unsubscribeUser } from '@processes/realtime';
import { useAuth } from '@shared/lib/auth/useAuth';

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
  const { user } = useAuth();

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

  // Runs after initRealtime above, and re-runs once the signed-in user is
  // resolved, which is when the connection is actually ready to authorise.
  useEffect(() => {
    if (!user) return;
    subscribeUser(user.id, queryClient);
    return () => { unsubscribeUser(user.id); };
  }, [user, queryClient]);

  return <>{children}</>;
}
