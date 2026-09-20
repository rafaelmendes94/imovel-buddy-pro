UPDATE public.staff_permissions
SET permissions = jsonb_set(
  COALESCE(permissions, '{}'::jsonb),
  '{brick}',
  COALESCE(permissions->'brick', '{"view": false, "create": false, "edit": false, "delete": false}'::jsonb),
  true
)
WHERE NOT (COALESCE(permissions, '{}'::jsonb) ? 'brick');

ALTER TABLE public.staff_permissions
  ALTER COLUMN permissions SET DEFAULT '{
    "brick": {"edit": false, "view": false, "create": false, "delete": false},
    "planos": {"edit": false, "view": false, "create": false, "delete": false},
    "imoveis": {"edit": false, "view": false, "create": false, "delete": false},
    "tabelas": {"edit": false, "view": false, "create": false, "delete": false},
    "clientes": {"edit": false, "view": false, "create": false, "delete": false},
    "contratos": {"edit": false, "view": false, "create": false, "delete": false},
    "dashboard": {"edit": false, "view": false, "create": false, "delete": false},
    "edificios": {"edit": false, "view": false, "create": false, "delete": false},
    "avaliacoes": {"edit": false, "view": false, "create": false, "delete": false},
    "corretores": {"edit": false, "view": false, "create": false, "delete": false},
    "financeiro": {"edit": false, "view": false, "create": false, "delete": false},
    "relatorios": {"edit": false, "view": false, "create": false, "delete": false},
    "condominios": {"edit": false, "view": false, "create": false, "delete": false},
    "site_editor": {"edit": false, "view": false, "create": false, "delete": false},
    "fotos_cidade": {"edit": false, "view": false, "create": false, "delete": false},
    "funcionarios": {"edit": false, "view": false, "create": false, "delete": false},
    "imobiliarias": {"edit": false, "view": false, "create": false, "delete": false},
    "configuracoes": {"edit": false, "view": false, "create": false, "delete": false},
    "material_extra": {"edit": false, "view": false, "create": false, "delete": false},
    "dashboard_admin": {"edit": false, "view": false, "create": false, "delete": false}
  }'::jsonb;

DROP POLICY IF EXISTS "Users update own brick items" ON public.brick_items;
CREATE POLICY "Users update own brick items" ON public.brick_items
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'brick', 'edit')
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'brick', 'edit')
  );

DROP POLICY IF EXISTS "Users delete own brick items" ON public.brick_items;
CREATE POLICY "Users delete own brick items" ON public.brick_items
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'brick', 'delete')
  );
