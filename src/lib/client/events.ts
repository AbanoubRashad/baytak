'use client';

/**
 * Cross-component UI events (open the chat with a pre-filled message, etc.).
 * Components anywhere on the page can open the chat without prop drilling.
 */
export interface ChatOpenDetail {
  message?: string;
  unitId?: string;
  compoundId?: string;
  source?: 'chat' | 'compare' | 'afford';
}

const CHAT_OPEN = 'baytak:chat-open';

export function openChat(detail: ChatOpenDetail = {}) {
  window.dispatchEvent(new CustomEvent<ChatOpenDetail>(CHAT_OPEN, { detail }));
}

export function onChatOpen(handler: (detail: ChatOpenDetail) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<ChatOpenDetail>).detail);
  window.addEventListener(CHAT_OPEN, listener);
  return () => window.removeEventListener(CHAT_OPEN, listener);
}
