/** Supabase is optional in development: without it, public pages read the seed data and forms are not stored. */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey);
