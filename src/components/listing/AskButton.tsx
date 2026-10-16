'use client';

import { MessageCircle } from 'lucide-react';
import type { ChatOpenDetail } from '@/lib/client/events';
import { openChat } from '@/lib/client/events';

/** Opens the chat pre-filled with context (used from server-rendered pages). */
export function AskButton({ detail, className, children }: { detail: ChatOpenDetail; className?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => openChat(detail)} className={className}>
      <MessageCircle aria-hidden className="size-[18px]" />
      {children}
    </button>
  );
}
