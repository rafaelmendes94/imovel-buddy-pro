CREATE TABLE public.brick_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  descricao text DEFAULT '',
  preco numeric NOT NULL DEFAULT 0,
  categoria text NOT NULL DEFAULT 'Outros',
  estado text NOT NULL DEFAULT 'Usado',
  cidade text DEFAULT '',
  telefone text DEFAULT '',
  imagens text[] DEFAULT '{}',
  vendido boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.brick_items ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all items
CREATE POLICY "Anyone can read brick items" ON public.brick_items
FOR SELECT TO anon, authenticated USING (true);

-- Users insert own items
CREATE POLICY "Users insert own brick items" ON public.brick_items
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users update own items
CREATE POLICY "Users update own brick items" ON public.brick_items
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Users delete own items
CREATE POLICY "Users delete own brick items" ON public.brick_items
FOR DELETE TO authenticated USING (auth.uid() = user_id);