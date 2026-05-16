
CREATE POLICY "Super admin can insert any imovel"
ON public.imoveis
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
