'use client';

import type { ReactNode } from 'react';
import { openChat, type ChatOpenDetail } from '@/lib/client/events';

/** A button that opens the chat with context; its contents can be server-rendered. */
export function ChatTrigger({ detail, className, label, children }: { detail: ChatOpenDetail; className?: string; label?: string; children: ReactNode }) {
  return (
    <button type="button" className={className} aria-label={label} onClick={() => openChat(detail)}>
      {children}
    </button>
  );
}
