'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useReducedMotion } from '@/lib/client/use-media';

export interface Slide {
  src: string;
  caption: string;
}

const INTERVAL = 6000;

/** Full-bleed photo slideshow behind the hero copy (passed as children). */
export function HeroSlideshow({ slides, children }: { slides: Slide[]; children: ReactNode }) {
  const t = useTranslations('hero');
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const running = !paused && !reduced && slides.length > 1;

  // Only the first photo loads with the page; the others arrive once it's settled (keeps LCP fast).
  const [loadRest, setLoadRest] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setLoadRest(true), 2500);
    return () => window.clearTimeout(id);
  }, []);

  const go = useCallback((i: number) => setIndex((i + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => go(index + 1), INTERVAL);
    return () => window.clearTimeout(id);
  }, [running, index, go]);

  const ctrl =
    'inline-flex size-11 items-center justify-center rounded-full border border-white/45 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/25';

  return (
    <section
      aria-roledescription="carousel"
      aria-label={slides[index]?.caption}
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#1d2833] lg:min-h-[940px]"
    >
      {slides.map((s, i) => (i > 0 && !loadRest ? null : (
        <div
          key={s.src}
          aria-hidden={i !== index}
          className={`absolute inset-0 -z-20 transition-opacity duration-[1400ms] ease-out ${i === index ? 'opacity-100' : 'opacity-0'}`}
        >
          <Image
            src={s.src}
            alt=""
            fill
            priority={i === 0}
            fetchPriority={i === 0 ? 'high' : 'low'}
            sizes="100vw"
            quality={70}
            className={`object-cover ${i === index && !reduced ? 'animate-slow-zoom' : ''}`}
            key={i === index ? `active-${index}` : 'idle'}
          />
        </div>
      )))}
      {/* Dark scrim from the text side so white copy passes AA on any photo. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(20,28,36,0.78)_0%,rgba(20,28,36,0.55)_45%,rgba(20,28,36,0.15)_100%)] rtl:bg-[linear-gradient(270deg,rgba(20,28,36,0.78)_0%,rgba(20,28,36,0.55)_45%,rgba(20,28,36,0.15)_100%)]"
      />
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-40 bg-[linear-gradient(180deg,rgba(20,28,36,0.45),transparent)]" />

      {children}

      {slides.length > 1 && (
        <div className="absolute end-4 top-[92px] z-10 hidden items-center gap-3 sm:end-6 md:flex lg:end-8">
          <p className="max-w-[260px] text-end text-sm text-white/90" aria-live={running ? 'off' : 'polite'}>
            {slides[index]?.caption}
          </p>
          <button type="button" onClick={() => go(index - 1)} className={ctrl} aria-label={t('prev')}>
            <ChevronLeft className="size-5 rtl:rotate-180" />
          </button>
          <button type="button" onClick={() => go(index + 1)} className={ctrl} aria-label={t('next')}>
            <ChevronRight className="size-5 rtl:rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className={ctrl}
            aria-label={paused ? t('play') : t('pause')}
            hidden={reduced}
          >
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          </button>
          <div className="flex items-center">
            {slides.map((s, i) => (
              <button
                key={s.src}
                type="button"
                onClick={() => go(i)}
                aria-label={t('goTo', { n: i + 1 })}
                aria-current={i === index}
                className="group inline-flex h-11 items-center px-1"
              >
                <span
                  className={`block h-2 rounded-full bg-white transition-all ${i === index ? 'w-7' : 'w-2 opacity-55 group-hover:opacity-90'}`}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
