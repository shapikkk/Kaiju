/** Format an ISO timestamp as "h:mm AM/PM" */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

/** Return a human-friendly date label for a message timestamp. */
export function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/** Returns true when two ISO strings share the same calendar day. */
export function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

/** Truncate a string to `max` chars, appending ellipsis if needed. */
export function truncate(text: string, max = 60): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

/** Return up to two uppercase initials from a display name. */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Smooth-scroll to a message element by its DOM id (e.g. "chat-42")
 * and briefly highlight it with a ring animation.
 */
export function scrollToMsg(id: number, prefix = 'chat'): void {
  const el = document.getElementById(`${prefix}-${id}`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('ring-2', 'ring-primary/40', 'rounded-2xl', 'transition-all');
  setTimeout(() => el.classList.remove('ring-2', 'ring-primary/40', 'rounded-2xl', 'transition-all'), 1500);
}
