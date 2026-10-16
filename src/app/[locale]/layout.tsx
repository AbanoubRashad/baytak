import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, DM_Sans, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { notFound } from 'next/navigation';
import { locale as rootLocale } from 'next/root-params';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Analytics } from '@vercel/analytics/next';
import { isLocale, locales, site } from '@/config/site';
import { getSettings } from '@/lib/data/settings';
import { pick } from '@/lib/format';
import { themeInitScript } from '@/lib/client/theme';
import { localeAlternates } from '@/lib/seo';
import '../globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-bricolage',
  display: 'swap',
});
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-ar',
  display: 'swap',
  // Only Arabic pages use it; don't make English visitors download it up front.
  preload: false,
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  if (!isLocale(locale)) return {};
  const [t, settings] = await Promise.all([getTranslations({ locale, namespace: 'meta' }), getSettings()]);
  const name = pick(locale, settings.consultantName, settings.consultantNameAr);
  const brand = locale === 'ar' ? site.brandAr : site.brand;
  const title = t('title', { brand, name });
  return {
    metadataBase: new URL(site.url),
    title: { default: title, template: `%s · ${brand}` },
    description: t('description'),
    applicationName: brand,
    openGraph: { siteName: brand, locale: locale === 'ar' ? 'ar_EG' : 'en_US', type: 'website' },
    alternates: localeAlternates('/', locale),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F4EF' },
    { media: '(prefers-color-scheme: dark)', color: '#1C232A' },
  ],
};

export default async function RootLayout({ children }: LayoutProps<'/[locale]'>) {
  const locale = await rootLocale();
  if (!isLocale(locale)) notFound();

  return (
    <html
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className={`${bricolage.variable} ${dmSans.variable} ${plexArabic.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        {/* Vercel Analytics only exists on Vercel deployments. */}
        {process.env.VERCEL && <Analytics />}
      </body>
    </html>
  );
}
