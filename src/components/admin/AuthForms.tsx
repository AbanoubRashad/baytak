'use client';

import { useActionState, useState } from 'react';
import { requestPasswordReset, signIn, updatePassword, type AuthState } from '@/actions/admin/auth';
import { btn, field, label } from '@/components/ui/styles';

export function LoginForm({ linkError }: { linkError?: boolean }) {
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [loginState, login, loggingIn] = useActionState<AuthState, FormData>(signIn, {});
  const [resetState, reset, resetting] = useActionState<AuthState, FormData>(requestPasswordReset, {});

  if (mode === 'reset') {
    return (
      <form action={reset} className="space-y-4">
        <p className="text-ink-2">Enter your email and I’ll send you a link to choose a new password.</p>
        <div>
          <label htmlFor="reset-email" className={label}>
            Email
          </label>
          <input id="reset-email" name="email" type="email" autoComplete="email" required className={field} />
        </div>
        {resetState.error && <p role="alert" className="text-sm text-heart">{resetState.error}</p>}
        {resetState.sent && <p role="status" className="rounded-xl bg-pale px-4 py-3 text-sm text-ink">If that email has access, a reset link is on its way.</p>}
        <button type="submit" disabled={resetting} className={`${btn.primary} w-full`}>
          {resetting ? 'Sending…' : 'Send reset link'}
        </button>
        <button type="button" onClick={() => setMode('login')} className="min-h-11 text-sm font-semibold text-primary">
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form action={login} className="space-y-4">
      <div>
        <label htmlFor="email" className={label}>
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className={field} />
      </div>
      <div>
        <label htmlFor="password" className={label}>
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} className={field} />
      </div>
      {(loginState.error || linkError) && (
        <p role="alert" className="text-sm text-heart">
          {loginState.error ?? 'That link has expired. Request a new one below.'}
        </p>
      )}
      <button type="submit" disabled={loggingIn} className={`${btn.primary} w-full`}>
        {loggingIn ? 'Signing in…' : 'Sign in'}
      </button>
      <button type="button" onClick={() => setMode('reset')} className="min-h-11 text-sm font-semibold text-primary">
        Forgot your password?
      </button>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="new-password" className={label}>
          New password
        </label>
        <input id="new-password" name="password" type="password" autoComplete="new-password" required minLength={10} className={field} />
      </div>
      {state.error && <p role="alert" className="text-sm text-heart">{state.error}</p>}
      <button type="submit" disabled={pending} className={`${btn.primary} w-full`}>
        {pending ? 'Saving…' : 'Save and open the inbox'}
      </button>
    </form>
  );
}
