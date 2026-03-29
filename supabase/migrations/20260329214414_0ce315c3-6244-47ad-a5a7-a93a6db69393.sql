
-- Table for individual ratings by brokers on construtoras
CREATE TABLE public.construtora_avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  construtora_id uuid NOT NULL REFERENCES public.construtoras(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reputacao integer NOT NULL DEFAULT 0 CHECK (reputacao >= 0 AND reputacao <= 5),
  cumprimento_prazos integer NOT NULL DEFAULT 0 CHECK (cumprimento_prazos >= 0 AND cumprimento_prazos <= 5),
  facilidade_aquisicao integer NOT NULL DEFAULT 0 CHECK (facilidade_aquisicao >= 0 AND facilidade_aquisicao <= 5),
  condicoes_propostas integer NOT NULL DEFAULT 0 CHECK (condicoes_propostas >= 0 AND condicoes_propostas <= 5),
  qualidade_construcao integer NOT NULL DEFAULT 0 CHECK (qualidade_construcao >= 0 AND qualidade_construcao <= 5),
  suporte_corretor integer NOT NULL DEFAULT 0 CHECK (suporte_corretor >= 0 AND suporte_corretor <= 5),
  comentario text DEFAULT '',
  util_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table to track "útil" votes to prevent duplicates
CREATE TABLE public.avaliacao_utils (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id uuid NOT NULL REFERENCES public.construtora_avaliacoes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(avaliacao_id, user_id)
);

-- Enable RLS
ALTER TABLE public.construtora_avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacao_utils ENABLE ROW LEVEL SECURITY;

-- RLS for construtora_avaliacoes
CREATE POLICY "Authenticated users can read all avaliacoes"
  ON public.construtora_avaliacoes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert own avaliacoes"
  ON public.construtora_avaliacoes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own avaliacoes"
  ON public.construtora_avaliacoes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own avaliacoes"
  ON public.construtora_avaliacoes FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'));

-- RLS for avaliacao_utils
CREATE POLICY "Authenticated users can read utils"
  ON public.avaliacao_utils FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert own utils"
  ON public.avaliacao_utils FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own utils"
  ON public.avaliacao_utils FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for avaliacoes
ALTER PUBLICATION supabase_realtime ADD TABLE public.construtora_avaliacoes;
