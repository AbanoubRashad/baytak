-- Hardening after the Supabase security advisor:
-- * trigger functions are not meant to be called over the API
-- * pin search_path on the updated_at trigger
-- Intentionally callable: increment_save (anonymous heart counter) and is_admin (used by RLS policies;
-- it only tells the caller whether *they* are the admin).

alter function public.set_updated_at() set search_path = public;

revoke execute on function public.on_message_insert() from public, anon, authenticated;
revoke execute on function public.on_booking_insert() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
