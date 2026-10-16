'use client';

import dynamic from 'next/dynamic';
import type { Consultant } from '@/components/layout/types';

/** The call-back form sits far below the fold; its form libraries load after the page is interactive. */
const CallbackForm = dynamic(() => import('./CallbackForm').then((m) => m.CallbackForm), {
  ssr: false,
  loading: () => <div aria-hidden className="h-[330px] animate-pulse rounded-2xl bg-fill" />,
});

export function LazyCallbackForm({ consultant }: { consultant: Consultant }) {
  return <CallbackForm consultant={consultant} />;
}
