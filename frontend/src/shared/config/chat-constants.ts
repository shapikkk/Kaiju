/** @file Chat input constants — extracted from chat-input.tsx */

export interface PageMention {
  type: 'page';
  title: string;
  image: string;
}

export interface MessagePriority {
  name: string;
  badge?: string;
}

export const PAGE_MENTIONS: PageMention[] = [
  { type: 'page', title: 'Meeting Notes', image: '📝' },
  { type: 'page', title: 'Project Dashboard', image: '📊' },
  { type: 'page', title: 'Ideas & Brainstorming', image: '💡' },
  { type: 'page', title: 'Calendar & Events', image: '📅' },
  { type: 'page', title: 'Documentation', image: '📚' },
  { type: 'page', title: 'Goals & Objectives', image: '🎯' },
  { type: 'page', title: 'Budget Planning', image: '💰' },
  { type: 'page', title: 'Team Directory', image: '👥' },
  { type: 'page', title: 'Technical Specs', image: '🔧' },
  { type: 'page', title: 'Analytics Report', image: '📈' },
];

export const MESSAGE_PRIORITIES: MessagePriority[] = [
  { name: 'Standard' },
  { name: 'High' },
  { name: 'Urgent', badge: 'Alert' },
];
