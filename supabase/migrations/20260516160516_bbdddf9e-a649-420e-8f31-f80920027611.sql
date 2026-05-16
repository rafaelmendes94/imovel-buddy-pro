
-- Public view of broker profile info for the public site
CREATE OR REPLACE VIEW public.public_broker_profiles AS
  SELECT user_id, full_name, phone, avatar_url
  FROM public.profiles;

GRANT SELECT ON public.public_broker_profiles TO anon, authenticated;
