import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Consultant } from '@/components/layout/types';
import { btn, container } from '@/components/ui/styles';
import { StatusPill } from './StatusPill';

/** The headline block on top of the slideshow. */
export async function HeroContent({ consultant }: { consultant: Consultant }) {
  const t = await getTranslations('hero');
  return (
    <div className={`${container} flex flex-1 flex-col justify-center pb-44 pt-32 sm:pb-52 lg:pb-60 lg:pt-36`}>
      <div className="max-w-[760px] text-white">
        <StatusPill consultant={consultant} />
        <h1 className="mt-6 text-[44px] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-[80px]">
          {t('titleBefore')} <span className="text-[#9FCDEC]">{t('titleHighlight')}</span>
        </h1>
        <p className="mt-6 max-w-[560px] text-lg leading-relaxed text-white/92 max-sm:hidden sm:text-xl">{t('subtitle')}</p>
        <p className="mt-4 text-lg text-white/92 sm:hidden">{t('subtitleShort', { name: consultant.name })}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/#homes" className={`${btn.primary} min-h-13 px-6 text-base`}>
            {t('explore')}
            <ArrowRight aria-hidden className="size-[18px] rtl:rotate-180" />
          </Link>
          <Link href="/#afford" className={`${btn.ghostLight} min-h-13 px-6 text-base`}>
            {t('afford')}
          </Link>
        </div>
      </div>
    </div>
  );
}
