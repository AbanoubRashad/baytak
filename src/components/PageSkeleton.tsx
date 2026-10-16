import { container } from '@/components/ui/styles';

/** Calm placeholder shown for a moment while a listing page streams in. */
export function PageSkeleton({ variant }: { variant: 'unit' | 'compound' }) {
  const block = 'animate-pulse rounded-card bg-fill';
  return (
    <div className={`${container} pb-20 pt-28`} aria-hidden>
      <div className="h-11 w-36 animate-pulse rounded-btn bg-fill" />
      <div className="mt-8 h-6 w-64 animate-pulse rounded-full bg-fill" />
      <div className="mt-4 h-12 w-full max-w-2xl animate-pulse rounded-2xl bg-fill" />
      <div className={`mt-8 h-[300px] sm:h-[420px] lg:h-[490px] ${block}`} />
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-[20px] bg-fill" />
            ))}
          </div>
          <div className={`h-40 ${block}`} />
        </div>
        {variant === 'unit' && <div className={`h-[520px] ${block}`} />}
      </div>
    </div>
  );
}
