import type { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';
import { QueryProvider } from './query-provider';
import { TooltipProvider } from '@shared/ui/tooltip';
import { AuthProvider } from '@shared/lib/auth/auth-provider';
import { Toaster } from '@shared/ui/sonner';
import { ParticlesBackground } from '@shared/ui/particles-background';
import { RealtimeProvider } from './realtime-provider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <Toaster
          closeButton
          position="bottom-right"
          toastOptions={{ style: { marginBottom: '80px' } }}
        />
        <ParticlesBackground />
        <TooltipProvider>
          <AuthProvider>
            <RealtimeProvider>
              {children}
            </RealtimeProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
