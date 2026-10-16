import { Building2, CalendarDays, MessageCircle, Wallet } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export async function PromiseStrip({ name }: { name: string }) {
  const t = await getTranslations('promises');
  const items = [
    { icon: Wallet, title: t('downTitle'), text: t('downText') },
    { icon: Building2, title: t('devTitle'), text: t('devText') },
    { icon: CalendarDays, title: t('visitTitle'), text: t('visitText', { name }) },
    { icon: MessageCircle, title: t('oneTitle'), text: t('oneText') },
  ];
  return (
    <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex items-center gap-4 rounded-[20px] border border-line bg-card px-5 py-4">
          <span aria-hidden className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky text-primary">
            <Icon className="size-5" />
          </span>
          <span>
            <span className="block font-semibold text-ink">{title}</span>
            <span className="block text-sm text-ink-2">{text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
