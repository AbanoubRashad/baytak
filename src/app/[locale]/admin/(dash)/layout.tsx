import { Suspense } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { requireAdminPage } from '@/lib/server/admin';

/** Everything under the inbox needs Romany's session, so the whole dashboard renders at request time. */
export default function DashLayout({ children }: LayoutProps<'/[locale]/admin'>) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-admin-bg" />}>
      <Guarded>{children}</Guarded>
    </Suspense>
  );
}

async function Guarded({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireAdminPage();
  const [{ count }, { data: settings }] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new').neq('name', ''),
    supabase.from('settings').select('consultant_name, avatar_path, available').eq('id', 1).single(),
  ]);
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <AdminSidebar
        newCount={count ?? 0}
        name={settings?.consultant_name ?? 'Romany'}
        avatar={settings?.avatar_path ?? '/romany-avatar.jpg'}
        available={settings?.available ?? true}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
