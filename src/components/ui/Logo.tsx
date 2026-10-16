import { House } from 'lucide-react';
import { site } from '@/config/site';

export function Logo({ locale, light = false }: { locale: string; light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className={`inline-flex size-10 items-center justify-center rounded-xl ${light ? 'bg-white text-[#2B76A6]' : 'bg-primary text-on-primary'}`}
      >
        <House className="size-5" strokeWidth={2.2} />
      </span>
      <span className={`font-display text-[22px] font-extrabold ${light ? 'text-white' : 'text-ink'}`}>
        {locale === 'ar' ? site.brandAr : site.brand}
      </span>
    </span>
  );
}
