CREATE OR REPLACE FUNCTION public.owns_site_config_slug(_owner_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND lower(regexp_replace(
        translate(p.full_name,
          'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
          'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'),
        '[^a-zA-Z0-9]+', '-', 'g'
      )) = lower(trim(both '-' from _owner_id))
  );
$$;

CREATE POLICY "Brokers manage own page config by slug"
ON public.site_config
FOR ALL
TO authenticated
USING (
  config_type = ANY (ARRAY['broker_page'::text, 'partner_page'::text])
  AND public.owns_site_config_slug(owner_id)
)
WITH CHECK (
  config_type = ANY (ARRAY['broker_page'::text, 'partner_page'::text])
  AND public.owns_site_config_slug(owner_id)
);