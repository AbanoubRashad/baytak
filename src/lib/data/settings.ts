import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { seedSettings, seedStory } from '@/data/seed-settings';
import { createPublicClient } from '@/lib/supabase/public';
import { hasSupabase } from '@/lib/supabase/env';
import type { Settings, StoryItem } from '@/lib/types';
import { toSettings, toStory, type SettingsRow, type StoryRow } from './mappers';

/** Revalidated with updateTag(SETTINGS_TAG) when Romany saves Settings or My story. */
export const SETTINGS_TAG = 'settings';

/** Romany's details — name, photos, phone, WhatsApp, hours, areas, story intro. */
export async function getSettings(): Promise<Settings> {
  'use cache';
  cacheLife('hours');
  cacheTag(SETTINGS_TAG);
  if (!hasSupabase) return seedSettings;

  const { data, error } = await createPublicClient().from('settings').select('*').eq('id', 1).maybeSingle();
  if (error) throw new Error(`Loading settings failed: ${error.message}`);
  return data ? toSettings(data as SettingsRow) : seedSettings;
}

export async function getStory(): Promise<StoryItem[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(SETTINGS_TAG);
  if (!hasSupabase) return seedStory;

  const { data, error } = await createPublicClient().from('story_items').select('*').order('sort');
  if (error) throw new Error(`Loading story failed: ${error.message}`);
  return (data as StoryRow[]).map(toStory);
}
