-- Allow anonymous users to read city galleries publicly
CREATE POLICY "Anon reads galleries" ON public.city_galleries FOR SELECT TO anon USING (true);

-- Allow anonymous users to read gallery items publicly  
CREATE POLICY "Anon reads gallery items" ON public.city_gallery_items FOR SELECT TO anon USING (true);