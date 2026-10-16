import type { Metadata } from 'next';

/** The admin is per-session and fully dynamic; instant-navigation validation doesn't apply. */
export const instant = false;

export const metadata: Metadata = {
  title: 'Inbox',
  robots: { index: false, follow: false },
};

/** English-only; the proxy routes /admin/* here without language detection. */
export default function AdminRootLayout({ children }: LayoutProps<'/[locale]/admin'>) {
  return <div className="min-h-dvh bg-admin-bg">{children}</div>;
}
