import 'server-only';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { hasSupabase } from '@/lib/supabase/env';

/** The signed-in admin, or null. Only users listed in `public.admins` count. */
export async function getAdmin() {
  if (!hasSupabase) return null;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  return data ? { supabase, user } : null;
}

/** For admin pages: redirects to the login page when not signed in as the admin. */
export async function requireAdminPage() {
  await connection(); // admin pages are per-request (session, clock-based stats)
  const admin = await getAdmin();
  if (!admin) redirect('/admin/login');
  return admin;
}

export class NotAdminError extends Error {
  constructor() {
    super('Not signed in as the admin');
  }
}

/** For admin server actions: throws when the caller is not the admin (RLS would refuse anyway). */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) throw new NotAdminError();
  return admin;
}
