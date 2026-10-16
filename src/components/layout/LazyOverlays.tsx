'use client';

import dynamic from 'next/dynamic';
import type { UnitWithCompound } from '@/lib/types';
import type { Consultant } from './types';

/* The chat and compare UI load after the page is interactive — they're not needed for first paint. */
const ChatWidget = dynamic(() => import('@/components/chat/ChatWidget').then((m) => m.ChatWidget), { ssr: false });
const Compare = dynamic(() => import('@/components/compare/Compare').then((m) => m.Compare), { ssr: false });

export function LazyOverlays({ consultant, units }: { consultant: Consultant; units: UnitWithCompound[] }) {
  return (
    <>
      <Compare units={units} consultantName={consultant.name} />
      <ChatWidget consultant={consultant} />
    </>
  );
}
