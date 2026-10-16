import Image from 'next/image';
import type { Consultant } from '@/components/layout/types';
import { Avatar } from '@/components/ui/Avatar';
import { container } from '@/components/ui/styles';

/** Full-bleed Cairo sunset with a quote in Romany's voice. */
export function Statement({ quote, consultant }: { quote: string; consultant: Consultant }) {
  return (
    <section aria-label={consultant.name} className="relative isolate mt-24 overflow-hidden">
      <Image src="/photos/bg-cairo-sunset.jpg" alt="" fill sizes="100vw" quality={70} className="-z-20 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[#141c24]/62" />
      <figure className={`${container} py-24 sm:py-32`}>
        <div className="mx-auto max-w-[980px]">
          <span aria-hidden className="block font-display text-6xl leading-none text-[#9FCDEC]">
            &rdquo;
          </span>
          <blockquote className="mt-2 font-display text-[32px] font-extrabold leading-[1.12] tracking-[-0.025em] text-white sm:text-5xl lg:text-[56px]">
            {quote}
          </blockquote>
          <figcaption className="mt-8 flex items-center gap-3.5 text-white">
            <Avatar src={consultant.avatar} alt="" size={56} className="rounded-full ring-2 ring-white/70" />
            <span>
              <span className="block font-semibold">{consultant.name}</span>
              <span className="block text-sm text-white/85">{consultant.title}</span>
            </span>
          </figcaption>
        </div>
      </figure>
    </section>
  );
}
