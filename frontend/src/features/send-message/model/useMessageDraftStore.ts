import { create } from 'zustand';
import type { ChatMsg } from '@shared/types';

export type { ChatMsg };

interface MessageDraftState {
  replyingTo: ChatMsg | null;
  editingMsg: ChatMsg | null;
  setReplyingTo: (msg: ChatMsg | null) => void;
  setEditingMsg: (msg: ChatMsg | null) => void;
  reset: () => void;
}

export const useMessageDraftStore = create<MessageDraftState>((set) => ({
  replyingTo: null,
  editingMsg: null,
  setReplyingTo: (msg) => set({ replyingTo: msg, editingMsg: null }),
  setEditingMsg: (msg) => set({ editingMsg: msg, replyingTo: null }),
  reset: () => set({ replyingTo: null, editingMsg: null }),
}));
