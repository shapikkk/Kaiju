import { create } from 'zustand';

interface ChatSidebarState {
  channelsOpen: boolean;
  dmsOpen: boolean;
  search: string;
  toggleChannelsOpen: () => void;
  toggleDmsOpen: () => void;
  setSearch: (search: string) => void;
  reset: () => void;
}

export const useChatSidebarStore = create<ChatSidebarState>((set) => ({
  channelsOpen: true,
  dmsOpen: true,
  search: '',
  toggleChannelsOpen: () => set((s) => ({ channelsOpen: !s.channelsOpen })),
  toggleDmsOpen: () => set((s) => ({ dmsOpen: !s.dmsOpen })),
  setSearch: (search) => set({ search }),
  reset: () => set({ channelsOpen: true, dmsOpen: true, search: '' }),
}));
