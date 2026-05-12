
INSERT INTO public.system_options (category, value, sort_order) VALUES
  ('posicao_predio', 'Frente', 1),
  ('posicao_predio', 'Fundos', 2),
  ('posicao_predio', 'Lateral', 3),
  ('posicao_predio', 'Esquina', 4),
  ('posicao_solar', 'Nascente', 1),
  ('posicao_solar', 'Poente', 2),
  ('posicao_solar', 'Norte', 3),
  ('posicao_solar', 'Sul', 4),
  ('posicao_solar', 'Leste', 5),
  ('posicao_solar', 'Oeste', 6),
  ('vista', 'Mar', 1),
  ('vista', 'Cidade', 2),
  ('vista', 'Lagoa', 3),
  ('vista', 'Montanha', 4),
  ('vista', 'Parque', 5),
  ('vista', 'Piscina', 6),
  ('vista', 'Interna', 7)
ON CONFLICT DO NOTHING;
