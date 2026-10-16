'use client';

import { createBrowserClient } from '@supabase/ssr';
import { supabaseAnonKey, supabaseUrl } from './env';

let client: ReturnType<typeof createBrowserClient> | undefined;

/** Browser client for the admin (Realtime inbox, photo uploads). */
export function getBrowserSupabase() {
  client ??= createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}
