import { getTranslations } from 'next-intl/server';
import { container } from '@/components/ui/styles';

export async function HowWeWork({ name }: { name: string }) {
  const t = await getTranslations('how');
  const steps = [
    { n: '01', title: t('s1Title', { name }), text: t('s1Text') },
    { n: '02', title: t('s2Title'), text: t('s2Text') },
    { n: '03', title: t('s3Title'), text: t('s3Text') },
  ];
  return (
    <section aria-labelledby="how-title" className={`${container} pt-20`}>
      <h2 id="how-title" className="sr-only">
        {t('title')}
      </h2>
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="rounded-card border border-line bg-card p-7">
            <span aria-hidden className="font-display text-4xl font-extrabold text-primary">
              {s.n}
            </span>
            <h3 className="mt-4 text-xl font-bold" style={{ fontFamily: 'var(--font-body-stack)', letterSpacing: 0 }}>
              {s.title}
            </h3>
            <p className="mt-3 text-ink-2">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
