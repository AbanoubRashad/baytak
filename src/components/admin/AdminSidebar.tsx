'use client';

import Image from 'next/image';
import { useOptimistic, useTransition } from 'react';
import { Building2, CalendarDays, Home, House, Inbox, LogOut, Settings } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { setAvailable } from '@/actions/admin/inbox';
import { signOut } from '@/actions/admin/auth';

const NAV = [
  { href: '/admin', label: 'Inbox', icon: Inbox },
  { href: '/admin/visits', label: 'Visits', icon: CalendarDays },
  { href: '/admin/homes', label: 'Homes', icon: Home },
  { href: '/admin/compounds', label: 'Compounds', icon: Building2 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
] as const;

interface Props {
  newCount: number;
  name: string;
  avatar: string;
  available: boolean;
}

export function AdminSidebar({ newCount, name, avatar, available }: Props) {
  const pathname = usePathname();
  const [optimistic, setOptimistic] = useOptimistic(available);
  const [, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      setOptimistic(!optimistic);
      await setAvailable(!optimistic);
    });

  return (
    <aside className="sticky top-0 z-30 flex flex-col bg-[#1F2A35] text-[#DCE3E9] lg:h-dvh">
      <div className="flex items-center justify-between gap-3 px-5 py-4 lg:py-6">
        <Link href="/admin" className="inline-flex items-center gap-2.5 rounded-xl">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white text-[#2B76A6]">
            <House aria-hidden className="size-5" />
          </span>
          <span className="font-display text-[22px] font-extrabold text-white">Baytak</span>
        </Link>
        <Link href="/" className="rounded-lg px-2 py-1 text-sm text-[#AFC0CE] underline-offset-4 hover:underline lg:hidden">
          View website
        </Link>
      </div>

      <nav aria-label="Admin" className="no-scrollbar overflow-x-auto px-3 lg:flex-1 lg:overflow-visible">
        <ul className="flex gap-1 pb-3 lg:flex-col lg:pb-0">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className="flex min-h-11 items-center gap-3 whitespace-nowrap rounded-xl px-4 font-semibold text-[#DCE3E9] hover:bg-white/8 aria-[current=page]:bg-[#2B76A6] aria-[current=page]:text-white"
                >
                  <Icon aria-hidden className="size-[18px]" />
                  {label}
                  {href === '/admin' && newCount > 0 && (
                    <span className="ms-auto inline-flex min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-[#24303A]">
                      <span className="sr-only">new leads: </span>
                      {newCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="hidden p-3 lg:block">
        <div className="rounded-2xl bg-white/6 p-3">
          <div className="flex items-center gap-3">
            <Image src={avatar} alt="" width={40} height={40} className="size-10 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">{name}</p>
              <p className="text-[13px] text-[#AFC0CE]">{optimistic ? 'Available · replies on' : 'Away · WhatsApp only'}</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={optimistic}
            onClick={toggle}
            className="mt-3 flex min-h-11 w-full items-center justify-between rounded-xl bg-white/6 px-3 text-sm font-semibold text-white"
          >
            Available today
            <span aria-hidden className={`relative h-6 w-11 rounded-full transition-colors ${optimistic ? 'bg-[#3FAE6A]' : 'bg-white/25'}`}>
              <span className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${optimistic ? 'start-[22px]' : 'start-0.5'}`} />
            </span>
          </button>
          <div className="mt-2 flex gap-2">
            <Link href="/" className="flex min-h-11 flex-1 items-center justify-center rounded-xl text-sm text-[#AFC0CE] hover:bg-white/8">
              View website
            </Link>
            <form action={signOut}>
              <button type="submit" className="inline-flex size-11 items-center justify-center rounded-xl text-[#AFC0CE] hover:bg-white/8" aria-label="Sign out">
                <LogOut className="size-[18px]" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  );
}
