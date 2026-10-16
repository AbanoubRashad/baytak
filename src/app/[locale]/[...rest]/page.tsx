import { notFound } from 'next/navigation';

/** Unknown paths inside a locale always 404 — there is nothing to prerender or navigate to instantly. */
export const instant = false;

/** Unknown paths inside a locale render the localized not-found page. */
export default function CatchAll() {
  notFound();
}
