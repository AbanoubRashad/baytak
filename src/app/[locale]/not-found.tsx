import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { btn, container } from '@/components/ui/styles';

export default async function NotFound() {
  const t = await getTranslations('notFound');
  return (
    <div className={`${container} flex min-h-[70dvh] flex-col items-start justify-center gap-5 py-32`}>
      <h1 className="max-w-2xl text-4xl font-extrabold sm:text-5xl">{t('title')}</h1>
      <p className="max-w-xl text-lg text-ink-2">{t('body')}</p>
      <Link href="/units" className={btn.primary}>{t('cta')}</Link>
    </div>
  );
}
