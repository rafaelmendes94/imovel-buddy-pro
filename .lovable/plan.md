

## Plano: Modulo "Fotos da Cidade" com Galerias

### Resumo
Refazer completamente a pagina Fotos da Cidade. Super Admin cria galerias (titulo + foto de capa), adiciona fotos e videos dentro. Todos os usuarios logados podem visualizar e baixar o conteudo.

### 1. Banco de Dados — 2 Migrations

**Tabela `city_galleries`** (cada galeria):
```sql
CREATE TABLE public.city_galleries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  capa_url text NOT NULL DEFAULT '',
  descricao text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.city_galleries ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode ver
CREATE POLICY "Anyone reads galleries" ON public.city_galleries
  FOR SELECT TO authenticated USING (true);
-- Apenas super_admin gerencia
CREATE POLICY "Super admin manages galleries" ON public.city_galleries
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));
```

**Tabela `city_gallery_items`** (fotos/videos dentro de cada galeria):
```sql
CREATE TABLE public.city_gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid NOT NULL REFERENCES public.city_galleries(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'foto', -- 'foto' ou 'video'
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
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));
```

**Storage bucket `city-photos`** (public):
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('city-photos','city-photos',true);
CREATE POLICY "Super admin uploads city photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'city-photos' AND has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Anyone reads city photos" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'city-photos');
CREATE POLICY "Super admin deletes city photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'city-photos' AND has_role(auth.uid(), 'super_admin'));
```

### 2. Reescrever `src/pages/CityPhotos.tsx`

**Tela principal — Grid de galerias:**
- Header "Fotos da Cidade" com contagem de galerias
- Botao "Nova Galeria" visivel apenas para `isSuperAdmin`
- Grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` com cards
- Cada card mostra: foto de capa (aspect 16:9), titulo, quantidade de itens, botoes editar/excluir (so super_admin)
- Clicar no card abre a galeria em modo detalhe

**Modal de criar/editar galeria:**
- Campo titulo (obrigatorio)
- Upload de foto de capa (bucket `city-photos`)
- Textarea descricao (opcional)

**Tela de detalhe da galeria (dentro da mesma pagina, com estado):**
- Header com titulo da galeria e botao voltar
- Botao "Adicionar Midia" (so super_admin) — abre modal para upload de foto ou colar link de video (YouTube)
- Grid de midias: fotos com lightbox e botao download, videos com embed do YouTube
- Botao de excluir item individual (so super_admin)
- Botao "Baixar Todas as Fotos" — faz download individual de cada foto (ou abre em nova aba)

**Permissoes na UI:**
- `useAuth()` para checar `isSuperAdmin`
- Usuarios comuns veem tudo, podem baixar, mas nao veem botoes de criar/editar/excluir

### 3. Rota
Ja existe: `/fotos-cidade` com `<AuthGuard>` — manter como esta.

### 4. Menu
Ja existe item "Fotos da Cidade" no AppSidebar — sem alteracao.

### Notas Tecnicas
- Uploads via `supabase.storage.from('city-photos').upload()`
- Videos sao links do YouTube armazenados como `tipo = 'video'` e `url = link`
- Fotos sao arquivos reais no bucket, `tipo = 'foto'`
- Download de foto usa `window.open(url)` ou tag `<a download>`
- Aproximadamente 450 linhas de codigo

