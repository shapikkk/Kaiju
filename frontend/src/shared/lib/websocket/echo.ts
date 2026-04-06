import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any>;
  }
}

window.Pusher = Pusher;

/**
 * Create a fresh Echo instance wired to the local Reverb WebSocket server.
 *
 * Key details:
 * - authEndpoint hits POST /api/broadcasting/auth (registered via withBroadcasting
 *   in bootstrap/app.php with prefix 'api' + auth:sanctum middleware).
 * - Bearer token is injected so Sanctum identifies the user.
 * - forceTLS is off for local dev (VITE_REVERB_SCHEME=http).
 */
export const createEchoInstance = () => {
  const token = localStorage.getItem('auth_token');

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
};
