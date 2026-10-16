import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { Consultant } from '@/components/layout/types';
import { LazyCallbackForm } from '@/components/forms/LazyCallbackForm';
import { container } from '@/components/ui/styles';

/** Call-back request over the golden-hour Nile photo. */
export async function CallbackSection({ consultant }: { consultant: Consultant }) {
  const t = await getTranslations('callback');
  return (
    <section id="callback" aria-labelledby="callback-title" className="relative isolate mt-24 scroll-mt-20 overflow-hidden">
      <Image src="/photos/bg-nile-golden.jpg" alt="" fill sizes="100vw" quality={70} className="-z-20 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[#141c24]/60" />
      <div className={`${container} grid items-center gap-10 py-20 sm:py-24 lg:grid-cols-2`}>
        <div className="text-white">
          <h2 id="callback-title" className="max-w-lg text-4xl font-extrabold sm:text-5xl">
            {t('title')}
          </h2>
          <p className="mt-5 max-w-md text-lg text-white/90">{t('text')}</p>
        </div>
        <div className="rounded-card bg-card p-6 shadow-float sm:p-7">
          <LazyCallbackForm consultant={consultant} />
        </div>
      </div>
    </section>
  );
}
