## Mudanças

### 1. Migração: adicionar `featured` em `partners`
```sql
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS partners_featured_idx ON public.partners (featured) WHERE featured = true;
```

### 2. `AdminParceiros.tsx` — cadastro
- Adicionar `featured: boolean` em `Partner` e `emptyPartner` (default `false`).
- Adicionar switch/checkbox **"Destaque na home"** no formulário (junto com Status).
- Mostrar uma pequena badge "Destaque" na tabela quando `featured=true`.

### 3. Novo componente `PartnersCarouselHome` (Site público)
Criar `src/components/PartnersCarouselHome.tsx`:
- Carrega `partners` com `status='active'` e `featured=true`.
- Embaralha (Fisher-Yates) a cada montagem → ordem aleatória a cada refresh.
- Carrossel com **vários cards lado a lado** (3–4 no desktop, 2 no tablet, 1 no mobile), setas de navegação, autoplay leve (6s). Vou usar a abordagem nativa do projeto (scroll-snap horizontal + setas) já usada em outras seções de `Site.tsx`, para não adicionar dependência.
- Cada card: logo + nome + categoria + cidade, link para `/parceiro/:slug`.
- Botão **"Ver todos os parceiros"** ao lado do título, leva para `/parceiros`.

### 4. `Site.tsx` — montar a seção
- Importar `PartnersCarouselHome`.
- Inserir nova `<section>` com `SectionHeader title="Parceiros em Destaque"` em um ponto natural da home (antes da seção do mapa).
- Renderizar apenas se houver destaques (o componente já retorna `null` caso vazio).

### 5. Página `/parceiros` (Parceiros.tsx)
- Continua mostrando **todos** os parceiros ativos (sem filtro de `featured`). Nenhuma mudança necessária além de confirmar que não filtra por `featured`.

## Resultado
- Admin marca quais parceiros aparecem na home via toggle "Destaque na home".
- Home pública mostra um carrossel de cards (vários por vez) só com destaques, em ordem aleatória a cada carregamento.
- Botão "Ver todos os parceiros" leva para a página completa com todos.
