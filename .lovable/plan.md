

# Plan: Planos para Corretores e Imobiliárias com Gestão de Corretores

## Resumo

Adicionar um campo `plan_type` na tabela `plans` para diferenciar planos de **Corretor** (individual) e **Imobiliária** (pode cadastrar seus corretores). A imobiliária terá limite de corretores (`max_brokers`) e poderá gerenciá-los dentro do seu painel. O formulário de criação de planos no admin e a página pública de planos serão atualizados para refletir essa diferenciação.

## O que muda

1. **Banco de dados**: Adicionar coluna `plan_type` (text, default `'corretor'`) na tabela `plans` com valores `'corretor'` ou `'imobiliaria'`.

2. **Admin Planos** (`src/pages/admin/AdminPlanos.tsx`):
   - Adicionar seletor de tipo de plano (Corretor / Imobiliária) no formulário.
   - Mostrar o tipo no card do plano com badge visual.
   - Quando tipo = "corretor", `max_brokers` fica fixo em 1 (o próprio). Quando tipo = "imobiliaria", o campo `max_brokers` fica editável.

3. **Página pública de Planos** (`src/pages/Planos.tsx`):
   - Separar planos em duas seções/tabs: "Para Corretores" e "Para Imobiliárias".
   - Destacar que planos de imobiliária incluem gestão de equipe.

4. **Registro** (`src/pages/Registro.tsx`):
   - Adicionar seletor de tipo de conta (Corretor / Imobiliária) no cadastro.
   - Salvar no `user_metadata` para uso posterior na criação da assinatura.

5. **Assinatura do Broker** (`src/pages/broker/BrokerAssinatura.tsx`):
   - Filtrar planos exibidos de acordo com o tipo da conta do usuário (corretor vê planos de corretor, imobiliária vê planos de imobiliária).

6. **Dashboard do Super Admin** (`src/pages/Dashboard.tsx`):
   - Card "Imobiliárias" conta perfis com plano tipo `imobiliaria` em vez de valor fixo 0.
   - Card "Corretores" conta perfis com plano tipo `corretor`.

## Detalhes Técnicos

- **Migration SQL**:
  ```sql
  ALTER TABLE public.plans ADD COLUMN plan_type text NOT NULL DEFAULT 'corretor';
  ```

- **Lógica de contagem no Dashboard**: Join `subscriptions` → `plans` filtrando por `plan_type`.

- Nenhuma tabela nova necessária — a tabela `subscriber_brokers` já existe para corretores vinculados a uma imobiliária.

