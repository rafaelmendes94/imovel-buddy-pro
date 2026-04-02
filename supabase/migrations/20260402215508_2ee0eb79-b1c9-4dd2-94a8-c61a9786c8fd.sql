
CREATE TABLE public.system_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category, value)
);

ALTER TABLE public.system_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read system_options"
ON public.system_options FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Super admin manages system_options"
ON public.system_options FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Seed default infrastructure options
INSERT INTO public.system_options (category, value, sort_order) VALUES
('infraestrutura', 'Piscina', 1),
('infraestrutura', 'Academia', 2),
('infraestrutura', 'Salão de Festas', 3),
('infraestrutura', 'Playground', 4),
('infraestrutura', 'Quadra', 5),
('infraestrutura', 'Churrasqueira', 6),
('infraestrutura', 'Segurança 24h', 7),
('infraestrutura', 'Portaria', 8),
('infraestrutura', 'Área Verde', 9),
('infraestrutura', 'Coworking', 10),
('infraestrutura', 'Elevador', 11),
('infraestrutura', 'Sauna', 12),
('infraestrutura', 'Brinquedoteca', 13),
('infraestrutura', 'Pet Place', 14),
('infraestrutura', 'Lavanderia', 15),
('tipo_imovel', 'Apartamento', 1),
('tipo_imovel', 'Casa', 2),
('tipo_imovel', 'Comercial', 3),
('tipo_imovel', 'Terreno', 4),
('tipo_imovel', 'Lote', 5),
('tipo_imovel', 'Sala Comercial', 6),
('tipo_imovel', 'Cobertura', 7),
('tipo_imovel', 'Kitnet', 8),
('status_imovel', 'Disponível', 1),
('status_imovel', 'Vendido', 2),
('status_imovel', 'Reservado', 3),
('status_imovel', 'Alugado', 4),
('status_imovel', 'Suspenso', 5),
('condicao_imovel', 'Novo', 1),
('condicao_imovel', 'Usado', 2),
('condicao_imovel', 'Na Planta', 3),
('condicao_imovel', 'Em Construção', 4),
('padrao_imovel', 'Econômico', 1),
('padrao_imovel', 'Médio Padrão', 2),
('padrao_imovel', 'Alto Padrão', 3),
('padrao_imovel', 'Luxo', 4),
('amenidades_condominio', 'Piscina', 1),
('amenidades_condominio', 'Academia', 2),
('amenidades_condominio', 'Salão de Festas', 3),
('amenidades_condominio', 'Playground', 4),
('amenidades_condominio', 'Quadra', 5),
('amenidades_condominio', 'Churrasqueira', 6),
('amenidades_condominio', 'Segurança 24h', 7),
('amenidades_condominio', 'Portaria', 8),
('amenidades_condominio', 'Área Verde', 9),
('amenidades_condominio', 'Coworking', 10),
('categoria_brick', 'Móveis', 1),
('categoria_brick', 'Eletrodomésticos', 2),
('categoria_brick', 'Decoração', 3),
('categoria_brick', 'Eletrônicos', 4),
('categoria_brick', 'Materiais de Construção', 5),
('categoria_brick', 'Ferramentas', 6),
('categoria_brick', 'Outros', 7);
