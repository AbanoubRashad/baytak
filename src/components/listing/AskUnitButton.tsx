'use client';

import { MessageCircle } from 'lucide-react';
import { openChat } from '@/lib/client/events';
import { btn } from '@/components/ui/styles';

/** The small chat icon on a home card: opens the chat pre-filled with that home. */
export function AskUnitButton({ unitId, message, label }: { unitId: string; message: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => openChat({ unitId, message })}
      className={`${btn.icon} border-sky-line bg-pale text-primary-hover dark:text-primary`}
      aria-label={label}
    >
      <MessageCircle className="size-5" />
    </button>
  );
}
