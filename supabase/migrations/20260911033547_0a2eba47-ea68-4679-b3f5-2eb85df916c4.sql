CREATE TABLE public.property_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  imovel_id uuid NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  corretor_responsavel_id uuid,
  corretor_que_clicou_id uuid,
  origem text NOT NULL DEFAULT 'feed',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_property_events_imovel ON public.property_events(imovel_id, event_type);
CREATE INDEX idx_property_events_resp ON public.property_events(corretor_responsavel_id, event_type);

GRANT SELECT, INSERT ON public.property_events TO authenticated;
GRANT ALL ON public.property_events TO service_role;

ALTER TABLE public.property_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users log their own events"
ON public.property_events FOR INSERT TO authenticated
WITH CHECK (corretor_que_clicou_id = auth.uid());

CREATE POLICY "Responsible broker and admins read events"
ON public.property_events FOR SELECT TO authenticated
USING (
  corretor_responsavel_id = auth.uid()
  OR corretor_que_clicou_id = auth.uid()
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'admin_staff')
);

CREATE OR REPLACE FUNCTION public.set_property_event_responsible()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT COALESCE(i.corretor_id, i.user_id) INTO NEW.corretor_responsavel_id
  FROM public.imoveis i WHERE i.id = NEW.imovel_id;
  NEW.corretor_que_clicou_id := auth.uid();
  IF NEW.event_type NOT IN ('whatsapp_click','detail_open','share') THEN
    RAISE EXCEPTION 'Tipo de evento inválido';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_property_events_responsible
BEFORE INSERT ON public.property_events
FOR EACH ROW EXECUTE FUNCTION public.set_property_event_responsible();

CREATE OR REPLACE FUNCTION public.get_imovel_contact(_imovel_id uuid)
RETURNS TABLE(nome text, whatsapp text, creci text, imobiliaria text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(c.nome, i.corretor_nome, pr.full_name)::text,
    COALESCE(c.telefone, pr.phone)::text,
    c.creci::text,
    i.imobiliaria_nome::text
  FROM public.imoveis i
  LEFT JOIN public.corretores c ON c.id = i.corretor_cadastro_id
  LEFT JOIN public.profiles pr ON pr.user_id = COALESCE(i.corretor_id, i.user_id)
  WHERE i.id = _imovel_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_imovel_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_imovel_contact(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_my_property_engagement()
RETURNS TABLE(visualizacoes bigint, favoritos bigint, aberturas bigint, contatos_whatsapp bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE((SELECT SUM(i.views) FROM public.imoveis i
              WHERE COALESCE(i.corretor_id, i.user_id) = auth.uid()), 0)::bigint,
    (SELECT COUNT(*) FROM public.favorites f
      JOIN public.imoveis i ON i.id = f.imovel_id
      WHERE COALESCE(i.corretor_id, i.user_id) = auth.uid())::bigint,
    (SELECT COUNT(*) FROM public.property_events e
      WHERE e.corretor_responsavel_id = auth.uid() AND e.event_type = 'detail_open')::bigint,
    (SELECT COUNT(*) FROM public.property_events e
      WHERE e.corretor_responsavel_id = auth.uid() AND e.event_type = 'whatsapp_click')::bigint;
$$;

REVOKE ALL ON FUNCTION public.get_my_property_engagement() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_property_engagement() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_top_whatsapp_imoveis(_limit integer DEFAULT 10)
RETURNS TABLE(imovel_id uuid, titulo text, contatos bigint, favoritos bigint, visualizacoes integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_staff')) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  RETURN QUERY
  SELECT i.id, i.titulo,
    (SELECT COUNT(*) FROM public.property_events e WHERE e.imovel_id = i.id AND e.event_type = 'whatsapp_click')::bigint,
    (SELECT COUNT(*) FROM public.favorites f WHERE f.imovel_id = i.id)::bigint,
    i.views
  FROM public.imoveis i
  ORDER BY 3 DESC, i.views DESC
  LIMIT GREATEST(COALESCE(_limit, 10), 1);
END;
$$;

REVOKE ALL ON FUNCTION public.get_top_whatsapp_imoveis(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_top_whatsapp_imoveis(integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_top_whatsapp_corretores(_limit integer DEFAULT 10)
RETURNS TABLE(corretor_id uuid, nome text, contatos bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_staff')) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  RETURN QUERY
  SELECT e.corretor_responsavel_id,
         COALESCE(pr.full_name, 'Sem nome')::text,
         COUNT(*)::bigint
  FROM public.property_events e
  LEFT JOIN public.profiles pr ON pr.user_id = e.corretor_responsavel_id
  WHERE e.event_type = 'whatsapp_click' AND e.corretor_responsavel_id IS NOT NULL
  GROUP BY e.corretor_responsavel_id, pr.full_name
  ORDER BY 3 DESC
  LIMIT GREATEST(COALESCE(_limit, 10), 1);
END;
$$;

REVOKE ALL ON FUNCTION public.get_top_whatsapp_corretores(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_top_whatsapp_corretores(integer) TO authenticated, service_role;