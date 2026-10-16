'use client';

import { useState, useTransition } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { updateBooking } from '@/actions/admin/bookings';
import { cairoIso } from '@/lib/cairo-time';
import { whatsappUrl } from '@/lib/whatsapp';
import { btn, field } from '@/components/ui/styles';

export interface AdminBooking {
  id: string;
  startsAt: string;
  status: 'requested' | 'confirmed' | 'cancelled' | 'done';
  note: string | null;
  leadId: string;
  name: string;
  phone: string | null;
  place: string;
  unitSlug: string | null;
}

const STATUS: Record<AdminBooking['status'], string> = {
  requested: 'bg-sand text-on-sand',
  confirmed: 'bg-[#DDF0E3] text-[#1F6B3D]',
  cancelled: 'bg-fill text-ink-2 line-through',
  done: 'bg-sky text-primary-hover',
};

const DAY = 24 * 3600_000;
const tz = 'Africa/Cairo';
const intlPhone = (p: string) => (p.startsWith('0') ? `20${p.slice(1)}` : p);

/** Cairo wall-clock "YYYY-MM-DDTHH:mm" for a datetime-local input. */
function toLocalInput(iso: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(iso));
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}`;
}

export function VisitsBoard({ bookings: initial, weekStart, week }: { bookings: AdminBooking[]; weekStart: string; week: number }) {
  const [bookings, setBookings] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  const days = Array.from({ length: 7 }, (_, i) => new Date(Date.parse(weekStart) + i * DAY + 12 * 3600_000));
  const dayKey = (d: Date | string) => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(d));
  const fmtDay = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'short', timeZone: tz });
  const fmtTime = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', timeZone: tz });

  function patch(id: string, p: { status?: AdminBooking['status']; startsAt?: string }) {
    setError(null);
    const before = bookings;
    setBookings((all) => all.map((b) => (b.id === id ? { ...b, ...p } : b)));
    start(async () => {
      const res = await updateBooking(id, p);
      if (!res.ok) {
        setBookings(before);
        setError(res.error ?? 'Could not save.');
      }
    });
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2">
        <Link href={`/admin/visits?week=${week - 1}`} className={btn.icon} aria-label="Previous week">
          <ChevronLeft className="size-4" />
        </Link>
        <p className="min-w-56 text-center font-semibold">
          {fmtDay.format(days[0])} – {fmtDay.format(days[6])}
        </p>
        <Link href={`/admin/visits?week=${week + 1}`} className={btn.icon} aria-label="Next week">
          <ChevronRight className="size-4" />
        </Link>
        {week !== 0 && (
          <Link href="/admin/visits" className="ms-2 text-sm font-semibold text-primary">
            This week
          </Link>
        )}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-heart">{error}</p>}

      <ol className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {days.map((d) => {
          const list = bookings.filter((b) => dayKey(b.startsAt) === dayKey(d));
          return (
            <li key={d.toISOString()} className="rounded-[20px] border border-line bg-card p-3">
              <h2 className="px-1 font-semibold text-ink" style={{ fontFamily: 'var(--font-body-stack)', letterSpacing: 0 }}>
                {fmtDay.format(d)}
              </h2>
              {list.length === 0 ? (
                <p className="px-1 py-3 text-sm text-ink-2">No visits</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {list.map((b) => (
                    <li key={b.id} className="rounded-2xl bg-pale p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-lg font-bold">{fmtTime.format(new Date(b.startsAt))}</span>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${STATUS[b.status]}`}>{b.status}</span>
                      </div>
                      <Link href={`/admin?lead=${b.leadId}`} className="mt-1 block font-semibold text-ink underline-offset-4 hover:underline">
                        {b.name}
                      </Link>
                      <p className="text-sm text-ink-2">{b.place}</p>
                      {b.note && <p className="mt-1 text-sm italic text-ink-2">“{b.note}”</p>}

                      {editing === b.id ? (
                        <form
                          className="mt-2 space-y-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const v = new FormData(e.currentTarget).get('when') as string;
                            const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v);
                            if (!m) return;
                            const iso = cairoIso(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])).replace(':00:00', `:${m[5]}:00`);
                            patch(b.id, { startsAt: iso, status: 'confirmed' });
                            setEditing(null);
                          }}
                        >
                          <label className="sr-only" htmlFor={`when-${b.id}`}>
                            New time
                          </label>
                          <input id={`when-${b.id}`} name="when" type="datetime-local" defaultValue={toLocalInput(b.startsAt)} className={`${field} min-h-11 text-sm`} />
                          <div className="flex gap-2">
                            <button type="submit" className={`${btn.primary} min-h-10 flex-1 px-3 text-sm`}>
                              Save
                            </button>
                            <button type="button" onClick={() => setEditing(null)} className={`${btn.outline} min-h-10 px-3 text-sm`}>
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {b.status === 'requested' && (
                            <button type="button" onClick={() => patch(b.id, { status: 'confirmed' })} className="min-h-10 rounded-xl bg-primary px-3 text-sm font-semibold text-on-primary">
                              Confirm
                            </button>
                          )}
                          {b.status !== 'cancelled' && b.status !== 'done' && (
                            <>
                              <button type="button" onClick={() => setEditing(b.id)} className="min-h-10 rounded-xl border border-line bg-card px-3 text-sm font-semibold">
                                Reschedule
                              </button>
                              <button type="button" onClick={() => patch(b.id, { status: 'done' })} className="min-h-10 rounded-xl border border-line bg-card px-3 text-sm font-semibold">
                                Done
                              </button>
                              <button type="button" onClick={() => patch(b.id, { status: 'cancelled' })} className="min-h-10 rounded-xl px-3 text-sm font-semibold text-heart">
                                Cancel visit
                              </button>
                            </>
                          )}
                          {b.phone && (
                            <a
                              href={whatsappUrl(intlPhone(b.phone), `Hi ${b.name.split(' ')[0]}, this is about your visit on ${fmtDay.format(new Date(b.startsAt))} at ${fmtTime.format(new Date(b.startsAt))}.`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex size-10 items-center justify-center rounded-xl border border-sky-line bg-card text-primary"
                              aria-label={`WhatsApp ${b.name}`}
                            >
                              <MessageCircle className="size-4" />
                            </a>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
