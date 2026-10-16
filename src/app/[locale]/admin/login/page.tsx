import { Suspense } from 'react';
import { Logo } from '@/components/ui/Logo';
import { LoginForm } from '@/components/admin/AuthForms';
import { hasSupabase } from '@/lib/supabase/env';

export default function LoginPage({ searchParams }: PageProps<'/[locale]/admin/login'>) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-card border border-line bg-card p-7 shadow-soft">
        <Logo locale="en" />
        <h1 className="mt-6 text-3xl font-extrabold">Your inbox</h1>
        {hasSupabase ? (
          <div className="mt-6">
            <Suspense fallback={<LoginForm />}>
              {searchParams.then((p) => (
                <LoginForm linkError={p.error === 'link'} />
              ))}
            </Suspense>
          </div>
        ) : (
          <p className="mt-4 text-ink-2">Connect Supabase (see README) to use the inbox.</p>
        )}
      </div>
    </main>
  );
}
