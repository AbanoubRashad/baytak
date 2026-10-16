import { Suspense } from 'react';
import { Plus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getInboxCatalogue, getInboxLeads, getInboxStats, getUpcomingVisits } from '@/lib/admin/data';
import { requireAdminPage } from '@/lib/server/admin';
import { Inbox } from '@/components/admin/Inbox';
import { btn } from '@/components/ui/styles';

export default function InboxPage({ searchParams }: PageProps<'/[locale]/admin'>) {
  return (
    <Suspense fallback={<div className="p-8 text-ink-2">Loading your inbox…</div>}>
      <InboxContent searchParams={searchParams} />
    </Suspense>
  );
}

async function InboxContent({ searchParams }: Pick<PageProps<'/[locale]/admin'>, 'searchParams'>) {
  const [{ supabase }, params] = await Promise.all([requireAdminPage(), searchParams]);
  const [leads, catalogue, stats, visits, { data: settings }] = await Promise.all([
    getInboxLeads(supabase),
    getInboxCatalogue(supabase),
    getInboxStats(supabase),
    getUpcomingVisits(supabase),
    supabase.from('settings').select('consultant_name, phone, whatsapp').eq('id', 1).single(),
  ]);
  const name = settings?.consultant_name ?? 'Romany';
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const delta = stats.newThisWeek - stats.newLastWeek;

  const cards = [
    { label: 'New leads this week', value: String(stats.newThisWeek), note: `${delta >= 0 ? '+' : ''}${delta} vs last week`, tone: delta >= 0 ? 'text-online-ink' : 'text-ink-2' },
    { label: 'Visits booked', value: String(stats.visitsBooked), note: `${stats.visitsThisWeekend} this weekend`, tone: 'text-ink-2' },
    {
      label: 'Average first reply',
      value: stats.avgFirstReplyMinutes == null ? '—' : stats.avgFirstReplyMinutes < 60 ? `${stats.avgFirstReplyMinutes} min` : `${Math.round(stats.avgFirstReplyMinutes / 6) / 10} h`,
      note: 'Goal: under 1 hour',
      tone: stats.avgFirstReplyMinutes != null && stats.avgFirstReplyMinutes > 60 ? 'text-heart' : 'text-online-ink',
    },
    { label: 'Most-saved home', value: stats.mostSaved?.title ?? '—', note: stats.mostSaved ? `${stats.mostSaved.saves} saves` : 'No saves yet', tone: 'text-ink-2' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            {greeting}, {name}
          </h1>
          <p className="mt-1 text-ink-2">Every chat, call-back and visit from the website lands here.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/" className={btn.outline}>
            View website
          </Link>
          <Link href="/admin/homes/new" className={btn.primary}>
            <Plus aria-hidden className="size-4" />
            Add a home
          </Link>
        </div>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-[20px] border border-line bg-card p-5">
            <dt className="text-sm text-ink-2">{c.label}</dt>
            <dd className="mt-1 truncate font-display text-3xl font-extrabold text-ink">{c.value}</dd>
            <dd className={`mt-1 text-sm font-semibold ${c.tone}`}>{c.note}</dd>
          </div>
        ))}
      </dl>

      <Inbox
        initialLeads={leads}
        units={catalogue.units}
        compounds={catalogue.compounds}
        visits={visits}
        consultantName={name}
        initialLeadId={typeof params.lead === 'string' ? params.lead : undefined}
      />
    </div>
  );
}
