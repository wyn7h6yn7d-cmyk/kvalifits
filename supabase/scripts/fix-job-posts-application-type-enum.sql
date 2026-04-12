-- Fixes: invalid input value for enum application_type: "in_app"
-- Run in Supabase SQL Editor if job publish/update fails on application_type.

alter type public.application_type add value if not exists 'in_app';
alter type public.application_type add value if not exists 'external_url';

notify pgrst, 'reload schema';
