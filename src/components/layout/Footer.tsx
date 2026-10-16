import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { site, type Locale } from '@/config/site';
import { CallButton, WhatsAppButton } from '@/components/WhatsAppButton';
import type { Settings } from '@/lib/types';
import { container } from '@/components/ui/styles';

export async function Footer({ settings, locale, name }: { settings: Settings; locale: Locale; name: string }) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const brand = locale === 'ar' ? site.brandAr : site.brand;
  const linkCls = 'inline-flex min-h-11 items-center underline-offset-4 hover:underline';
  const social = Object.entries(settings.social).filter(([, url]) => Boolean(url)) as [keyof typeof settings.social, string][];

  return (
    <footer className="bg-footer text-on-footer">
      <div className={`${container} py-14`}>
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-md">
            <p className="font-display text-2xl font-extrabold text-white">{brand}</p>
            <p className="mt-3 leading-7">{t('blurb', { name })}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-14 gap-y-2">
            <nav aria-label={t('explore')}>
              <p className="mb-1 font-semibold text-white">{t('explore')}</p>
              <ul>
                <li><Link className={linkCls} href="/units">{t('allHomes')}</Link></li>
                <li><Link className={linkCls} href="/compounds">{t('compounds')}</Link></li>
                <li><Link className={linkCls} href="/#areas">{t('areas')}</Link></li>
                <li><Link className={linkCls} href="/#afford">{t('afford')}</Link></li>
                <li><Link className={linkCls} href="/saved">{t('saved')}</Link></li>
                <li><Link className={linkCls} href="/about">{t('story')}</Link></li>
              </ul>
            </nav>
            <nav aria-label={t('talk')}>
              <p className="mb-1 font-semibold text-white">{t('talk')}</p>
              <ul>
                <li>
                  <WhatsAppButton number={settings.whatsapp} className={linkCls} from="footer" icon={false}>
                    {t('whatsapp')}
                  </WhatsAppButton>
                </li>
                <li>
                  <CallButton phone={settings.phone} className={`${linkCls} gap-1.5 [&>svg]:hidden`} from="footer">
                    {t('call')}
                  </CallButton>
                </li>
                {settings.email && <li><a className={linkCls} href={`mailto:${settings.email}`}>{t('email')}</a></li>}
                {social.map(([key, url]) => (
                  <li key={key}>
                    <a className={linkCls} href={url} target="_blank" rel="noopener noreferrer">{t(key)}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-white/12 pt-6 text-sm text-on-footer/80 sm:flex-row sm:justify-between">
          <p>{t('disclaimer', { month: site.pricesCheckedLabel[locale] })}</p>
          <p>{t('rights', { year: 2026, brand })}</p>
        </div>
      </div>
    </footer>
  );
}
