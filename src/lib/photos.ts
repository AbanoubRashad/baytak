import { supabaseUrl } from './supabase/env';

/**
 * Photo paths are either local files ("/photos/x.jpg", the illustrative seed photos)
 * or keys in the Supabase "photos" bucket (uploads from the admin).
 */
export function photoUrl(path: string): string {
  if (path.startsWith('/') || path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/photos/${path}`;
}
