import type { AreaKey } from '@/lib/types';

/** Static class names (Tailwind can't see dynamically built ones). */
export const areaTint: Record<AreaKey, string> = {
  'new-cairo': 'bg-area-new-cairo',
  'north-coast': 'bg-area-north-coast',
  'new-capital': 'bg-area-new-capital',
  october: 'bg-area-october',
  zayed: 'bg-area-zayed',
};
