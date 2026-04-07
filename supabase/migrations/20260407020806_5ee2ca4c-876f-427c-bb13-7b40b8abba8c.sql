
-- Galleries table
CREATE TABLE public.city_galleries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  capa_url text NOT NULL DEFAULT '',
  descricao text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.city_galleries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads galleries" ON public.city_galleries
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin manages galleries" ON public.city_galleries
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Gallery items table
CREATE TABLE public.city_gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid NOT NULL REFERENCES public.city_galleries(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'foto',
  url text NOT NULL DEFAULT '',
  titulo text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.city_gallery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads gallery items" ON public.city_gallery_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin manages gallery items" ON public.city_gallery_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Trigger for updated_at on galleries
CREATE TRIGGER update_city_galleries_updated_at
  BEFORE UPDATE ON public.city_galleries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('city-photos', 'city-photos', true);

CREATE POLICY "Super admin uploads city photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'city-photos' AND public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Anyone reads city photos" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'city-photos');
CREATE POLICY "Super admin deletes city photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'city-photos' AND public.has_role(auth.uid(), 'super_admin'));
