import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/config/site';
import { pick } from '@/lib/format';
import type { Settings, StoryItem } from '@/lib/types';
import type { Consultant } from '@/components/layout/types';
import { AvailabilityBadge } from '@/components/AvailabilityBadge';
import { StoryTimeline } from '@/components/StoryTimeline';
import { CallButton, WhatsAppButton } from '@/components/WhatsAppButton';
import { btn, container, eyebrowWarm } from '@/components/ui/styles';

interface Props {
  consultant: Consultant;
  settings: Settings;
  story: StoryItem[];
  locale: Locale;
  /** On /about the heading is the page h1. */
  headingLevel?: 'h1' | 'h2';
}

/** Portrait + My story + timeline. Used on the home page and the About page. */
export async function AboutRomany({ consultant, settings, story, locale, headingLevel = 'h2' }: Props) {
  const t = await getTranslations('story');
  const Heading = headingLevel;
  return (
    <section id="romany" aria-labelledby="romany-title" className={`${container} scroll-mt-24 pt-24`}>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)] lg:gap-14">
        <div className="relative h-[440px] overflow-hidden rounded-[28px] bg-fill sm:h-[600px]">
          <Image
            src={consultant.portrait}
            alt={consultant.name}
            fill
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover"
            style={{ objectPosition: 'center 18%' }}
          />
          <AvailabilityBadge consultant={consultant} className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5" />
        </div>
        <div>
          <p className={eyebrowWarm}>{t('eyebrow')}</p>
          <Heading id="romany-title" className="mt-3 text-4xl font-extrabold sm:text-[44px]">
            {t('title')}
          </Heading>
          <p className="mt-6 text-lg leading-relaxed text-ink-2">{pick(locale, settings.storyIntro, settings.storyIntroAr)}</p>
          <StoryTimeline items={story} locale={locale} />
          <div className="mt-8 flex flex-wrap gap-3">
            <WhatsAppButton number={consultant.whatsapp} className={btn.primary} from="story">
              {t('whatsapp', { name: consultant.name })}
            </WhatsAppButton>
            <CallButton phone={consultant.phone} className={btn.outline} from="story">
              {t('call')}
            </CallButton>
          </div>
        </div>
      </div>
    </section>
  );
}
