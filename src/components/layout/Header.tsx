'use client';

import { useEffect, useRef, useState } from 'react';
import { Heart, Menu, Moon, Sun, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Logo } from '@/components/ui/Logo';
import { btn } from '@/components/ui/styles';
import { openChat } from '@/lib/client/events';
import { savedStore } from '@/lib/client/saved';
import { setTheme, themeStore } from '@/lib/client/theme';
import { useAvailable } from '@/lib/client/use-available';
import type { Locale } from '@/config/site';
import type { Consultant } from './types';

export function Header({ consultant }: { consultant: Consultant }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const saved = savedStore.useValue();
  const theme = themeStore.useValue();
  const online = useAvailable(consultant);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  // On the home page the header floats over the hero photo until the visitor scrolls.
  const overHero = pathname === '/' && !scrolled && !menuOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const links = [
    { href: '/units', label: t('nav.homes') },
    { href: '/#areas', label: t('nav.areas') },
    { href: '/#afford', label: t('nav.afford') },
    { href: '/about', label: t('nav.about', { name: consultant.name }) },
    { href: '/about#contact', label: t('nav.contact') },
  ];

  function switchLanguage() {
    const next: Locale = locale === 'ar' ? 'en' : 'ar';
    router.replace(`${pathname}${window.location.search}${window.location.hash}`, { locale: next, scroll: false });
  }

  const tone = overHero ? 'text-white' : 'text-ink';
  const iconBtn = overHero
    ? 'inline-flex size-11 items-center justify-center rounded-btn border border-white/35 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20'
    : btn.icon;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow] duration-300 ${
        overHero ? 'bg-transparent' : 'bg-bg/92 shadow-[0_1px_0_var(--c-line)] backdrop-blur-md'
      }`}
    >
      <a
        href="#main"
        className="sr-only z-50 rounded-btn bg-card px-4 py-3 text-ink focus:not-sr-only focus:absolute focus:start-4 focus:top-3"
      >
        {t('a11y.skip')}
      </a>
      <div className="mx-auto flex h-[76px] max-w-[1240px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="rounded-xl">
          <Logo locale={locale} light={overHero} />
        </Link>

        <nav aria-label={t('a11y.mainNav')} className="ms-6 hidden lg:block">
          <ul className="flex items-center gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`inline-flex min-h-11 items-center rounded-lg px-3 text-[15px] font-medium ${tone} hover:opacity-80`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`${iconBtn} max-sm:hidden`}
            aria-label={theme === 'dark' ? t('a11y.themeToLight') : t('a11y.themeToDark')}
          >
            {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </button>
          <button
            type="button"
            onClick={switchLanguage}
            className={`${iconBtn} w-auto px-4 text-[15px] font-medium max-sm:hidden`}
            aria-label={t('a11y.switchLanguage')}
            lang={locale === 'ar' ? 'en' : 'ar'}
          >
            {t('nav.langShort')}
          </button>
          <Link
            href="/saved"
            className={`${iconBtn} w-auto gap-1.5 px-3.5`}
            aria-label={t('a11y.saved', { count: saved.length })}
          >
            <Heart className={`size-[18px] ${saved.length ? 'fill-heart text-heart' : ''}`} />
            <span className="text-[15px] font-semibold tabular-nums">{saved.length}</span>
          </Link>
          <button
            type="button"
            onClick={() => openChat()}
            className="hidden min-h-11 items-center gap-2.5 rounded-full border border-line bg-card py-1 ps-1 pe-4 text-[15px] font-semibold text-ink shadow-soft transition-colors hover:border-ink-2 md:inline-flex"
          >
            <Avatar src={consultant.avatar} alt="" size={36} online={online} />
            {t('nav.talk', { name: consultant.name })}
          </button>
          <button
            ref={menuButton}
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className={`${iconBtn} lg:hidden`}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? t('a11y.closeMenu') : t('a11y.menu')}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-line bg-bg lg:hidden">
          <nav aria-label={t('a11y.mainNav')} className="mx-auto max-w-[1240px] px-4 pb-6 pt-2 sm:px-6">
            <ul className="divide-y divide-line">
              {[...links, { href: '/compounds', label: t('nav.compounds') }].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-14 items-center text-lg font-medium text-ink"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={switchLanguage} className={btn.outline} lang={locale === 'ar' ? 'en' : 'ar'}>
                {t('nav.langShort')}
              </button>
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={btn.outline}
                aria-label={theme === 'dark' ? t('a11y.themeToLight') : t('a11y.themeToDark')}
              >
                {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openChat();
                }}
                className={`${btn.primary} flex-1`}
              >
                {t('nav.talk', { name: consultant.name })}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
