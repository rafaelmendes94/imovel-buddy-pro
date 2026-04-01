

## Plano: Vincular Imóveis a Edifícios/Condomínios

### Situacao Atual
- Edifícios e Condomínios usam dados mock locais (sem banco de dados)
- Imóveis (`imoveis`) nao tem campo de vinculacao com edificio/condominio
- Nao existe tabela `edificios` nem `condominios` no banco

### O que sera feito

**1. Criar tabelas `edificios` e `condominios` no banco**

```sql
CREATE TABLE public.edificios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  nome text NOT NULL,
  endereco text DEFAULT '',
  cidade text DEFAULT '',
  andares integer DEFAULT 0,
  total_unidades integer DEFAULT 0,
  construtora text DEFAULT '',
  ano_construcao text DEFAULT '',
  status text DEFAULT 'Lançamento',
  imagem_url text,
  latitude numeric DEFAULT 0,
  longitude numeric DEFAULT 0,
  infraestrutura text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.condominios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  nome text NOT NULL,
  endereco text DEFAULT '',
  cidade text DEFAULT '',
  total_unidades integer DEFAULT 0,
  unidades_disponiveis integer DEFAULT 0,
  taxa_condominio numeric DEFAULT 0,
  amenidades text[] DEFAULT '{}',
  tipo text DEFAULT 'Vertical',
  imagem_url text,
  latitude numeric DEFAULT 0,
  longitude numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

Com RLS para owner + super_admin + admin_staff (mesmo padrao de `imoveis`).

**2. Adicionar colunas de vinculacao na tabela `imoveis`**

```sql
ALTER TABLE public.imoveis
  ADD COLUMN edificio_id uuid REFERENCES public.edificios(id),
  ADD COLUMN condominio_id uuid REFERENCES public.condominios(id);
```

**3. Refatorar `Buildings.tsx` e `Condominiums.tsx`**
- Substituir dados mock por queries ao banco (`supabase.from('edificios')` / `supabase.from('condominios')`)
- CRUD real com insert/update/delete no banco
- Mostrar contagem de imoveis vinculados em cada card

**4. Formulario de Cadastro/Edicao de Imovel (`CadastroImovel.tsx`)**
- No bloco Identificacao, adicionar selects "Edifício" e "Condomínio" que buscam do banco
- Ao selecionar, auto-preencher endereco/cidade/infraestrutura do edificio/condominio

**5. Modal de Detalhe do Imovel (`PropertyDetailModal.tsx`)**
- Adicionar nova secao "Edifício" ou "Condomínio" quando vinculado
- Mostrar: nome, endereco, andares, construtora, infraestrutura, imagem, taxa de condominio
- Link para a pagina de detalhe do edificio/condominio

**6. Paginas de Detalhe (`BuildingDetail.tsx`, `CondominiumDetail.tsx`)**
- Carregar dados do banco em vez de mock
- Aba "Imóveis" lista todos os imoveis vinculados (`imoveis.edificio_id = id`)

**7. Filtros no site publico (`AllProperties.tsx`, `Site.tsx`)**
- Adicionar filtro por Edifício e Condomínio nos dropdowns
- Buscar lista de edificios/condominios do banco para popular os selects

### Detalhes Tecnicos
- Migration SQL unica com 2 tabelas + 2 colunas em imoveis + RLS policies
- Tipos TypeScript serao atualizados automaticamente apos migration
- Paginas de listagem/detalhe refatoradas para usar `useEffect` + `supabase.from()`
- Formulario de imovel carrega edificios/condominios em `useEffect` e popula selects

