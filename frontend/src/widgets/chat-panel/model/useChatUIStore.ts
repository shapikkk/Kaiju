import { create } from 'zustand';
import type { Channel, Conversation } from '@shared/types';

export type ActiveChat =
  | { type: 'channel'; channel: Channel }
  | { type: 'dm'; conv: Conversation };

interface ChatUIState {
  activeChat: ActiveChat | null;
  activeChannelId: number | null;
  setActiveChat: (chat: ActiveChat | null) => void;
}

export const useChatUIStore = create<ChatUIState>((set) => ({
  activeChat: null,
  activeChannelId: null,
  setActiveChat: (chat) =>
    set({
      activeChat: chat,
      activeChannelId: chat?.type === 'channel' ? chat.channel.id : null,
    }),
}));
