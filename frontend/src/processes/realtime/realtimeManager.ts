import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import type { QueryClient } from '@tanstack/react-query';
import { channelSocketHandler } from './handlers/channelSocketHandler';
import { dmSocketHandler } from './handlers/dmSocketHandler';
import { workspaceSocketHandler } from './handlers/workspaceSocketHandler';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

window.Pusher = Pusher;

/** The single persistent Echo instance for the app lifetime. */
let echoInstance: Echo<any> | null = null;

function buildEcho(token: string | null): Echo<any> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const baseUrl = apiUrl.replace(/\/api\/?$/, '');

  return new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
    wssPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${baseUrl}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        Accept: 'application/json',
      },
    },
  });
}

/**
 * Initialises the singleton Echo instance. Safe to call multiple times —
 * only creates a new connection when none exists.
 */
export function initRealtime(): void {
  if (echoInstance) return;
  const token = localStorage.getItem('auth_token');
  echoInstance = buildEcho(token);
}

/** Tears down the singleton (called on logout / unmount). */
export function destroyRealtime(): void {
  echoInstance?.disconnect();
  echoInstance = null;
}

/** Read-only accessor for use in handlers. */
export function getEcho(): Echo<any> | null {
  return echoInstance;
}

// ─── Channel Presence ──────────────────────────────────────────────────────

/**
 * Joins a channel presence channel and wires cache-update handlers.
 * Idempotent — Echo deduplicates joins internally.
 */
export function subscribeChannel(
  channelId: number,
  queryClient: QueryClient,
): void {
  if (!echoInstance) return;
  const ch = echoInstance.join(`channel.${channelId}`);
  channelSocketHandler(queryClient, channelId, ch as any);
}

export function unsubscribeChannel(channelId: number): void {
  echoInstance?.leave(`channel.${channelId}`);
}

// ─── DM Private ────────────────────────────────────────────────────────────

export function subscribeConversation(
  conversationId: number,
  currentUserId: number,
  queryClient: QueryClient,
): void {
  if (!echoInstance) return;
  const ch = echoInstance.private(`conversation.${conversationId}`);
  dmSocketHandler(queryClient, conversationId, currentUserId, ch as any);
}

export function unsubscribeConversation(conversationId: number): void {
  echoInstance?.leave(`conversation.${conversationId}`);
}

// ─── Workspace Presence ────────────────────────────────────────────────────

export function subscribeWorkspace(
  workspaceSlug: string,
  queryClient: QueryClient,
): void {
  if (!echoInstance) return;
  const ch = echoInstance.join(`workspace.${workspaceSlug}`);
  workspaceSocketHandler(queryClient, workspaceSlug, ch as any);
}

export function unsubscribeWorkspace(workspaceSlug: string): void {
  echoInstance?.leave(`workspace.${workspaceSlug}`);
}
