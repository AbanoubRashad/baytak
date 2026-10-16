'use client';

import type { ReactNode } from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { track } from '@/lib/client/track';
import { telHref } from '@/lib/format';
import { whatsappUrl } from '@/lib/whatsapp';

interface WhatsAppButtonProps {
  number: string;
  /** Pre-filled message with context (unit, compound, saved list, comparison…). */
  message?: string;
  className?: string;
  children: ReactNode;
  /** Where the click came from, for analytics. */
  from?: string;
  icon?: boolean;
}

export function WhatsAppButton({ number, message, className, children, from, icon = true }: WhatsAppButtonProps) {
  return (
    <a
      href={whatsappUrl(number, message)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => track('WhatsApp click', { from: from ?? null })}
    >
      {icon && <MessageCircle aria-hidden className="size-[18px]" />}
      {children}
    </a>
  );
}

export function CallButton({
  phone,
  className,
  children,
  from,
  label,
}: {
  phone: string;
  className?: string;
  children?: ReactNode;
  from?: string;
  label?: string;
}) {
  return (
    <a href={telHref(phone)} className={className} aria-label={label} onClick={() => track('Call click', { from: from ?? null })}>
      <Phone aria-hidden className="size-[18px]" />
      {children}
    </a>
  );
}
