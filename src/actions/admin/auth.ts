'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { site } from '@/config/site';
import { getAdmin } from '@/lib/server/admin';
import { allowRequest } from '@/lib/server/guard';
import { createServerSupabase } from '@/lib/supabase/server';

const credentials = z.object({ email: z.email(), password: z.string().min(8) });

export type AuthState = { error?: string; sent?: boolean };

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse({ email: form.get('email'), password: form.get('password') });
  if (!parsed.success) return { error: 'Enter your email and a password of at least 8 characters.' };
  if (!(await allowRequest('admin-login', 10, 900))) return { error: 'Too many attempts. Please wait a few minutes.' };

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: 'That email and password don’t match.' };
  if (!(await getAdmin())) {
    await supabase.auth.signOut();
    return { error: 'This account doesn’t have access to the inbox.' };
  }
  redirect('/admin');
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

export async function requestPasswordReset(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = z.email().safeParse(form.get('email'));
  if (!email.success) return { error: 'Enter the email you sign in with.' };
  if (!(await allowRequest('admin-reset', 3, 900))) return { error: 'Too many attempts. Please wait a few minutes.' };
  const supabase = await createServerSupabase();
  // Always report success so the form can't be used to discover which emails exist.
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${site.url}/api/auth/callback?next=/admin/reset` });
  return { sent: true };
}

export async function updatePassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  const password = z.string().min(10).safeParse(form.get('password'));
  if (!password.success) return { error: 'Use at least 10 characters.' };
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { error: 'That link has expired. Request a new one from the login page.' };
  redirect('/admin');
}
