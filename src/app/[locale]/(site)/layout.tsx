import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomBar } from '@/components/layout/MobileBottomBar';
import { LazyOverlays } from '@/components/layout/LazyOverlays';
import { getUnits } from '@/lib/data/listings';
import { getSettings } from '@/lib/data/settings';
import { toConsultant } from '@/lib/consultant';
import { currentLocale } from '@/lib/server/locale';

export default async function SiteLayout({ children }: LayoutProps<'/[locale]'>) {
  const locale = await currentLocale();
  const [settings, units] = await Promise.all([getSettings(), getUnits()]);
  const consultant = toConsultant(settings, locale);

  return (
    <>
      <Header consultant={consultant} />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer settings={settings} locale={locale} name={consultant.name} />
      {/* Room for the mobile bottom bar so it never covers the footer. */}
      <div aria-hidden className="h-[76px] bg-footer lg:hidden" />
      <MobileBottomBar consultant={consultant} />
      <LazyOverlays consultant={consultant} units={units} />
    </>
  );
}
