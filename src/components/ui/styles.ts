/**
 * Shared class strings for buttons and chips, so every control has the same calm look:
 * 44px+ touch targets, 14px radius, visible focus ring (global :focus-visible).
 */
const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-btn px-5 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

export const btn = {
  primary: `${base} bg-primary text-on-primary hover:bg-primary-hover`,
  strong: `${base} bg-strong text-on-strong hover:opacity-90`,
  outline: `${base} border border-line bg-card text-ink hover:border-ink-2`,
  sand: `${base} bg-sand text-on-sand hover:brightness-95`,
  soft: `${base} border border-sky-line bg-pale text-primary-hover hover:bg-sky dark:text-primary`,
  ghostLight: `${base} border border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20`,
  icon: 'inline-flex size-11 shrink-0 items-center justify-center rounded-btn border border-line bg-card text-ink transition-colors hover:border-ink-2',
};

/** Selectable chip (area, bedrooms, years…). Pair with aria-pressed. */
export const chip =
  'inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium transition-colors border-line bg-card text-ink hover:border-ink-2 aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-primary';

/** Two-option segmented control (Off-plan / Ready, Quarterly / Monthly). */
export const segment = {
  wrap: 'inline-flex rounded-2xl bg-fill p-1',
  item: 'min-h-11 rounded-xl px-5 text-[15px] font-semibold text-ink-2 transition-colors aria-pressed:bg-strong aria-pressed:text-on-strong aria-selected:bg-strong aria-selected:text-on-strong',
};

export const eyebrow = 'text-[13px] font-semibold uppercase tracking-[0.14em] text-primary-hover dark:text-primary';
export const eyebrowWarm = 'text-[13px] font-semibold uppercase tracking-[0.14em] text-warm';
export const card = 'rounded-card border border-line bg-card';
export const container = 'mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8';
export const field =
  'min-h-12 w-full rounded-btn border border-line bg-input px-4 text-base text-ink placeholder:text-ink-2/70 focus:border-primary focus:outline-none';
export const label = 'mb-1.5 block text-sm font-semibold text-ink';
