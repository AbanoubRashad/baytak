'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { ArrowLeft, Mail, MessageCircle, Phone, Send } from 'lucide-react';
import { getLead, replyToLead, setLeadStatus, updateLead } from '@/actions/admin/inbox';
import { STAGES, SOURCE_LABEL, type InboxCompound, type InboxLead, type InboxMessage, type InboxUnit, type UpcomingVisit } from '@/lib/admin/types';
import { useNow } from '@/lib/client/use-available';
import { formatNumber, initials } from '@/lib/format';
import { photoUrl } from '@/lib/photos';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { hasSupabase, supabaseUrl } from '@/lib/supabase/env';
import { whatsappUrl } from '@/lib/whatsapp';
import type { LeadStatus } from '@/lib/types';
import { btn, field } from '@/components/ui/styles';

type Filter = 'all' | 'new' | 'visits' | 'closing';

const FILTERS: { key: Filter; label: string; test: (l: InboxLead) => boolean }[] = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'new', label: 'New', test: (l) => l.status === 'new' },
  { key: 'visits', label: 'Visits', test: (l) => l.status === 'visit_booked' || l.source === 'booking' },
  { key: 'closing', label: 'Closing', test: (l) => l.status === 'negotiating' || l.status === 'reserved' },
];

const STAGE_TONE: Record<LeadStatus, string> = {
  new: 'bg-sky text-primary-hover',
  contacted: 'bg-fill text-ink',
  visit_booked: 'bg-sand text-on-sand',
  negotiating: 'bg-area-new-capital text-[#4B4880]',
  reserved: 'bg-[#DDF0E3] text-[#1F6B3D]',
  closed: 'bg-fill text-ink-2',
};

/** Egyptian mobile → international digits for wa.me / tel: (01012345678 → 201012345678). */
const intlPhone = (p: string) => (p.startsWith('0') ? `20${p.slice(1)}` : p.replace(/\D/g, ''));
const displayName = (l: InboxLead) => l.name || (l.source === 'afford' ? 'Afford-tool visitor' : 'Website visitor');
const maskPhone = (p: string) => (p.length >= 11 ? `${p.slice(0, 3)} •••• ${p.slice(-4)}` : p);

function timeAgo(iso: string, now: Date | null) {
  if (!now) return '';
  const mins = Math.max(0, Math.round((now.getTime() - Date.parse(iso)) / 60_000));
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h`;
  if (hours < 48) return 'Yesterday';
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Africa/Cairo' }).format(new Date(iso));
}

interface Props {
  initialLeads: InboxLead[];
  units: InboxUnit[];
  compounds: InboxCompound[];
  visits: UpcomingVisit[];
  consultantName: string;
  initialLeadId?: string;
}

export function Inbox({ initialLeads, units, compounds, visits, consultantName, initialLeadId }: Props) {
  const router = useRouter();
  const now = useNow();
  const [leads, setLeads] = useState(initialLeads);
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(initialLeadId ?? initialLeads[0]?.id ?? null);
  const [mobileThread, setMobileThread] = useState(Boolean(initialLeadId));

  // Realtime: new chats, replies and status changes appear without a reload.
  useEffect(() => {
    if (!hasSupabase || !supabaseUrl) return;
    const supabase = getBrowserSupabase();
    const upsertLead = async (id: string) => {
      const fresh = await getLead(id);
      if (!fresh) return;
      setLeads((all) => {
        const rest = all.filter((l) => l.id !== id);
        return [fresh, ...rest].sort((a, b) => (b.lastMessageAt ?? b.createdAt).localeCompare(a.lastMessageAt ?? a.createdAt));
      });
    };
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    // Realtime applies RLS, so it must connect with Romany's token, not the anon key.
    void supabase.auth.getSession().then(({ data }: { data: { session: { access_token: string } | null } }) => {
      if (!active) return;
      if (data.session) supabase.realtime.setAuth(data.session.access_token);
      channel = subscribe();
    });
    const subscribe = () => supabase
      .channel('romany-inbox')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: RealtimePostgresChangesPayload<{ lead_id: string }>) => {
        const m = payload.new as { lead_id?: string };
        if (m.lead_id) void upsertLead(m.lead_id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload: RealtimePostgresChangesPayload<{ id: string }>) => {
        const row = ('id' in payload.new ? payload.new : payload.old) as { id?: string };
        if (row.id) void upsertLead(row.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => router.refresh())
      .subscribe();
    return () => {
      active = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [router]);

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.key, leads.filter(f.test).length])) as Record<Filter, number>, [leads]);
  const visible = leads.filter(FILTERS.find((f) => f.key === filter)!.test);
  const selected = leads.find((l) => l.id === selectedId) ?? null;

  const patchLead = (id: string, patch: Partial<InboxLead>) => setLeads((all) => all.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,330px)_minmax(0,1fr)_minmax(0,320px)]">
      {/* 1 — Leads */}
      <section aria-labelledby="leads-title" className={`rounded-[20px] border border-line bg-card ${mobileThread ? 'max-xl:hidden' : ''}`}>
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 id="leads-title" className="text-xl font-bold">
            Leads
          </h2>
          <span className="text-sm text-ink-2">{visible.length} shown</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 px-4" role="group" aria-label="Filter leads">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className="min-h-10 rounded-xl border border-line px-3 text-sm font-semibold text-ink aria-pressed:border-strong aria-pressed:bg-strong aria-pressed:text-on-strong"
            >
              {f.label} {counts[f.key]}
            </button>
          ))}
        </div>
        <ul className="mt-3 max-h-[640px] space-y-1 overflow-y-auto p-2">
          {visible.length === 0 && <li className="p-6 text-center text-ink-2">Nothing here yet — new chats and requests appear instantly.</li>}
          {visible.map((l) => {
            const last = l.messages.at(-1);
            return (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(l.id);
                    setMobileThread(true);
                  }}
                  aria-current={l.id === selectedId}
                  className="flex w-full gap-3 rounded-2xl border border-transparent p-3 text-start hover:bg-pale aria-[current=true]:border-sky-line aria-[current=true]:bg-pale"
                >
                  <span aria-hidden className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-sky font-semibold text-primary-hover">
                    {initials(displayName(l)) || '•'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold text-ink">{displayName(l)}</span>
                      <span className="shrink-0 text-xs text-ink-2">{timeAgo(l.lastMessageAt ?? l.createdAt, now)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-ink-2">{last?.body ?? l.budget ?? (l.preferredTime ? `Call back in the ${l.preferredTime}` : SOURCE_LABEL[l.source])}</span>
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      <span className="rounded-md bg-fill px-2 py-0.5 text-xs font-semibold text-ink">{SOURCE_LABEL[l.source]}</span>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${STAGE_TONE[l.status]}`}>{STAGES.find((s) => s.key === l.status)?.label ?? l.status}</span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 2 — Conversation */}
      {selected ? (
        <Thread
          key={selected.id}
          lead={selected}
          units={units}
          consultantName={consultantName}
          onBack={() => setMobileThread(false)}
          className={mobileThread ? '' : 'max-xl:hidden'}
          onSent={(m) => patchLead(selected.id, { messages: [...selected.messages, m], lastMessageAt: m.createdAt, status: selected.status === 'new' ? 'contacted' : selected.status })}
        />
      ) : (
        <div className="grid place-items-center rounded-[20px] border border-line bg-card p-10 text-ink-2">Pick a lead to see the conversation.</div>
      )}

      {/* 3 — Profile + upcoming visits */}
      <div className={`space-y-4 ${mobileThread ? '' : 'max-xl:hidden'}`}>
        {selected && <Profile key={selected.id} lead={selected} units={units} compounds={compounds} onPatch={(p) => patchLead(selected.id, p)} />}
        <section aria-labelledby="visits-title" className="rounded-[20px] border border-line bg-card p-4">
          <div className="flex items-baseline justify-between">
            <h2 id="visits-title" className="text-lg font-bold">
              Upcoming visits
            </h2>
            <span className="text-sm text-ink-2">Next 7 days</span>
          </div>
          {visits.length === 0 ? (
            <p className="mt-3 text-sm text-ink-2">No visits booked yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {visits.map((v) => {
                const d = new Date(v.startsAt);
                const day = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Africa/Cairo' }).format(d);
                const time = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Cairo' }).format(d);
                return (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(v.leadId);
                        setMobileThread(true);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl bg-pale p-3 text-start"
                    >
                      <span className="w-14 shrink-0 rounded-xl border border-line bg-card py-1 text-center">
                        <span className="block text-[11px] font-semibold uppercase text-ink-2">{day}</span>
                        <span className="block font-bold text-ink">{time}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-ink">
                          {v.leadName}
                          {v.status === 'requested' && <span className="font-normal text-ink-2"> (requested)</span>}
                        </span>
                        <span className="block truncate text-sm text-ink-2">{v.place}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Thread({
  lead,
  units,
  consultantName,
  onSent,
  onBack,
  className,
}: {
  lead: InboxLead;
  units: InboxUnit[];
  consultantName: string;
  onSent: (m: InboxMessage) => void;
  onBack: () => void;
  className: string;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const logRef = useRef<HTMLOListElement>(null);
  const unit = units.find((u) => u.id === lead.unitId);
  const first = (lead.name || '').split(' ')[0] || 'there';
  const channels = [
    lead.phone ? ({ key: 'whatsapp', label: 'WhatsApp' } as const) : null,
    lead.email ? ({ key: 'email', label: 'Email' } as const) : null,
    ({ key: 'web', label: 'Website chat' } as const),
  ].filter((c): c is NonNullable<typeof c> => Boolean(c));
  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'web'>(channels[0].key);

  useEffect(() => {
    logRef.current?.lastElementChild?.scrollIntoView({ block: 'end' });
  }, [lead.messages.length]);

  const matches = units
    .filter((u) => u.id !== lead.unitId && (!unit || u.area === unit.area))
    .sort((a, b) => Math.abs(a.price - (unit?.price ?? a.price)) - Math.abs(b.price - (unit?.price ?? b.price)))
    .slice(0, 3);
  const site = typeof window !== 'undefined' ? window.location.origin : '';
  const templates = [
    { label: 'Send floor plan', text: `Hi ${first}, here’s the floor plan for ${unit?.title ?? 'the home you asked about'}. I’ll send the official PDF on WhatsApp — any questions, just ask. — ${consultantName}` },
    { label: 'Offer a visit', text: `Would you like to see ${unit?.title ?? 'it'} in person, ${first}? I can meet you at the gate this weekend — tell me a day and time that suits you.` },
    {
      label: 'Share 3 matches',
      text: `Hi ${first}, here are three homes I’d look at for you:\n${matches.map((m) => `• ${m.title} — EGP ${formatNumber(m.price, 'en')}\n  ${site}/units/${m.slug}`).join('\n')}`,
    },
  ];

  function send() {
    const body = text.trim();
    if (!body) return;
    setError(null);
    // Open WhatsApp synchronously (inside the click) so pop-up blockers allow it.
    if (channel === 'whatsapp' && lead.phone) window.open(whatsappUrl(intlPhone(lead.phone), body), '_blank', 'noopener');
    start(async () => {
      const res = await replyToLead({ leadId: lead.id, body, channel });
      if (res.ok) {
        onSent(res.message);
        setText('');
      } else setError(res.error);
    });
  }

  return (
    <section aria-labelledby="thread-title" className={`flex min-h-[560px] flex-col rounded-[20px] border border-line bg-card ${className}`}>
      <header className="flex flex-wrap items-center gap-3 border-b border-line p-4">
        <button type="button" onClick={onBack} className={`${btn.icon} xl:hidden`} aria-label="Back to leads">
          <ArrowLeft className="size-4" />
        </button>
        <span aria-hidden className="inline-flex size-11 items-center justify-center rounded-full bg-sky font-semibold text-primary-hover">
          {initials(displayName(lead)) || '•'}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="thread-title" className="truncate text-lg font-bold" style={{ fontFamily: 'var(--font-body-stack)', letterSpacing: 0 }}>
            {displayName(lead)}
          </h2>
          <p className="truncate text-sm text-ink-2">
            {[lead.phone && maskPhone(lead.phone), `came from ${SOURCE_LABEL[lead.source].toLowerCase()}`, lead.locale === 'ar' ? 'Arabic' : null].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex basis-full gap-2">
          {lead.phone && (
            <>
              <a href={whatsappUrl(intlPhone(lead.phone))} target="_blank" rel="noopener noreferrer" className={btn.soft}>
                <MessageCircle aria-hidden className="size-4" />
                WhatsApp
              </a>
              <a href={`tel:+${intlPhone(lead.phone)}`} className={btn.outline}>
                <Phone aria-hidden className="size-4" />
                Call
              </a>
            </>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`} className={btn.icon} aria-label={`Email ${lead.email}`}>
              <Mail className="size-4" />
            </a>
          )}
        </div>
      </header>

      <ol ref={logRef} className="flex-1 space-y-3 overflow-y-auto bg-[#F7F9FB] p-4 dark:bg-bg" aria-label="Conversation">
        {lead.messages.length === 0 && (
          <li className="mx-auto max-w-sm rounded-2xl bg-card p-4 text-center text-sm text-ink-2">
            {lead.source === 'callback'
              ? `${displayName(lead)} asked for a call back${lead.preferredTime ? ` in the ${lead.preferredTime}` : ''}.`
              : lead.source === 'afford'
                ? `Anonymous use of the afford tool: ${lead.budget ?? ''}`
                : 'No messages yet.'}
          </li>
        )}
        {lead.messages.map((m) => {
          const mine = m.sender === 'consultant';
          return (
            <li key={m.id} className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] ${mine ? 'ms-auto rounded-se-md bg-primary text-on-primary' : 'rounded-ss-md border border-line bg-card text-ink'}`}>
              {m.body}
              <span className={`mt-1 block text-[11px] ${mine ? 'text-white/80' : 'text-ink-2'}`}>
                {new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Cairo' }).format(new Date(m.createdAt))}
                {mine && m.channel !== 'web' ? ` · via ${m.channel === 'whatsapp' ? 'WhatsApp' : 'email'}` : ''}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="border-t border-line p-3">
        <div className="mb-2 flex flex-wrap gap-2">
          {templates.map((tpl) => (
            <button key={tpl.label} type="button" onClick={() => setText(tpl.text)} className="min-h-10 rounded-full border border-sky-line bg-pale px-3.5 text-sm font-semibold text-primary-hover">
              {tpl.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label htmlFor="reply" className="sr-only">
            Reply to {displayName(lead)}
          </label>
          <textarea id="reply" value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder={`Reply to ${first}…`} className={`${field} py-3`} />
          {error && <p role="alert" className="mt-2 text-sm text-heart">{error}</p>}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1" role="radiogroup" aria-label="Send via">
              {channels.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  role="radio"
                  aria-checked={channel === c.key}
                  onClick={() => setChannel(c.key)}
                  className="min-h-10 rounded-xl px-3 text-sm font-semibold text-ink-2 aria-checked:bg-fill aria-checked:text-ink"
                >
                  {c.label}
                </button>
              ))}
            </div>
            <button type="submit" disabled={pending || !text.trim()} className={btn.primary}>
              <Send aria-hidden className="size-4" />
              {pending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function Profile({
  lead,
  units,
  compounds,
  onPatch,
}: {
  lead: InboxLead;
  units: InboxUnit[];
  compounds: InboxCompound[];
  onPatch: (p: Partial<InboxLead>) => void;
}) {
  const [, start] = useTransition();
  const unit = units.find((u) => u.id === lead.unitId);
  const compound = compounds.find((c) => c.id === (unit?.compoundId ?? lead.compoundId));
  const photo = unit?.photo ?? compound?.photo;

  const save = (patch: { budget?: string; nextStep?: string; notes?: string }) => {
    onPatch(patch);
    start(async () => {
      await updateLead(lead.id, patch);
    });
  };

  return (
    <section aria-labelledby="profile-title" className="overflow-hidden rounded-[20px] border border-line bg-card">
      {photo && (
        <div className="relative h-40 bg-fill">
          <Image src={photoUrl(photo)} alt="" fill sizes="320px" className="object-cover" />
        </div>
      )}
      <div className="space-y-4 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-2">Interested in</p>
          <h2 id="profile-title" className="mt-1 text-lg font-bold" style={{ fontFamily: 'var(--font-body-stack)', letterSpacing: 0 }}>
            {unit?.title ?? compound?.name ?? 'Not linked to a home yet'}
          </h2>
          {(unit || compound?.priceFrom) && (
            <p className="mt-1 font-display text-2xl font-extrabold">EGP {formatNumber(unit?.price ?? compound!.priceFrom!, 'en')}</p>
          )}
        </div>
        <dl className="space-y-2 border-t border-line pt-3 text-[15px]">
          <EditableRow label="Budget" value={lead.budget ?? ''} onSave={(v) => save({ budget: v })} />
          <div className="flex justify-between gap-3">
            <dt className="text-ink-2">Best time</dt>
            <dd className="font-semibold capitalize text-ink">{lead.preferredTime ?? '—'}</dd>
          </div>
          <EditableRow label="Next step" value={lead.nextStep ?? ''} onSave={(v) => save({ nextStep: v })} />
        </dl>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-2">Stage</p>
          <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Stage">
            {STAGES.map((s) => (
              <button
                key={s.key}
                type="button"
                role="radio"
                aria-checked={lead.status === s.key}
                onClick={() => {
                  onPatch({ status: s.key });
                  start(async () => {
                    await setLeadStatus(lead.id, s.key);
                  });
                }}
                className="min-h-10 rounded-xl border border-line px-3 text-sm font-semibold text-ink aria-checked:border-primary aria-checked:bg-pale aria-checked:text-primary-hover"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="lead-notes" className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-2">
            Private notes
          </label>
          <textarea
            id="lead-notes"
            defaultValue={lead.notes ?? ''}
            rows={3}
            onBlur={(e) => e.target.value !== (lead.notes ?? '') && save({ notes: e.target.value })}
            className={`${field} mt-2 py-2 text-[15px]`}
          />
        </div>
      </div>
    </section>
  );
}

function EditableRow({ label, value, onSave }: { label: string; value: string; onSave: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-ink-2">{label}</dt>
      <dd className="min-w-0 flex-1">
        <input
          aria-label={label}
          defaultValue={value}
          placeholder="—"
          onBlur={(e) => e.target.value !== value && onSave(e.target.value)}
          className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-end font-semibold text-ink hover:border-line focus:border-primary focus:outline-none"
        />
      </dd>
    </div>
  );
}
