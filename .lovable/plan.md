

## Plano: Modulo "Implantacoes" dos Empreendimentos

### Resumo
Criar pagina completa de Implantacoes com grid de cards dos empreendimentos, modal de visualizacao de mapas/PDFs, formulario de upload, tabela no banco, bucket de storage e rota no menu.

### 1. Banco de Dados — Migration

Criar tabela `implantacoes`:
```sql
CREATE TABLE public.implantacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  empreendimento_id uuid NOT NULL,
  imagem_capa_url text NOT NULL DEFAULT '',
  mapa_url text NOT NULL DEFAULT '',
  tipo_arquivo text NOT NULL DEFAULT 'imagem',
  descricao text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.implantacoes ENABLE ROW LEVEL SECURITY;

-- RLS: owner + super_admin + admin_staff read
CREATE POLICY "Users read own implantacoes" ON public.implantacoes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin_staff'));

CREATE POLICY "Users insert own implantacoes" ON public.implantacoes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own implantacoes" ON public.implantacoes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'super_admin'));

CREATE POLICY "Users delete own implantacoes" ON public.implantacoes
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'super_admin'));
```

Criar storage bucket `implantacoes` (public):
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('implantacoes','implantacoes',true);

CREATE POLICY "Auth users upload implantacoes" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'implantacoes');
CREATE POLICY "Anyone reads implantacoes" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'implantacoes');
CREATE POLICY "Auth users delete implantacoes" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'implantacoes');
```

### 2. Nova Pagina — `src/pages/Implantacoes.tsx`

**Layout:**
- Cabecalho com titulo "Implantacoes dos Empreendimentos", subtitulo, icone `Map`
- Botao "Nova Implantacao" abre dialog de cadastro
- Grid responsivo: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

**Card de cada implantacao:**
- Imagem de capa (aspect-ratio 16:9) com fallback
- Nome do empreendimento (buscado da tabela empreendimentos)
- Endereco/cidade do empreendimento
- Badge de status do empreendimento
- Descricao (se houver, truncada)
- Botao "Ver Implantacao" — abre modal de visualizacao
- Botoes editar/excluir para o dono

**Modal de visualizacao:**
- Dialog grande (max-w-4xl)
- Header com nome do empreendimento
- Se tipo_arquivo = 'imagem': exibe img com zoom (CSS transform + scroll)
- Se tipo_arquivo = 'pdf': iframe embed ou link de download
- Botao "Baixar Arquivo" com download direto
- Botao fechar

**Dialog de cadastro/edicao:**
- Select de empreendimento (carrega da tabela empreendimentos do user)
- Upload imagem de capa (JPG/PNG/WEBP, max 5MB)
- Upload mapa de implantacao (JPG/PNG/PDF, max 20MB) — detecta automaticamente se e PDF para setar tipo_arquivo
- Textarea descricao (opcional)
- Validacoes de formato e tamanho
- Salvar faz upload no bucket e insert/update na tabela

### 3. Rota — `src/App.tsx`
Adicionar:
```tsx
import Implantacoes from "./pages/Implantacoes";
// ...
<Route path="/implantacoes" element={<AuthGuard><Implantacoes /></AuthGuard>} />
```

### 4. Menu — `src/components/AppSidebar.tsx` e `AdminSidebar.tsx`
Adicionar item no menu apos "Empreendimentos":
```tsx
{ icon: Map, label: "Implantacoes", path: "/implantacoes" }
```

### Notas Tecnicas
- Usa AppLayout como wrapper (padrao do projeto)
- Empreendimentos sao carregados via supabase query para popular o select e enriquecer os cards
- Upload usa `supabase.storage.from('implantacoes').upload()`
- Zoom na imagem via state de scale + CSS transform (sem lib externa)
- Aproximadamente 400 linhas de codigo na pagina

