

## Sistemática SaaS Unificada — Planos Corretor + Imobiliária com Cobrança Asaas

Implementação completa do ciclo: **cadastro → escolha do plano → trial/Free → liberação por webhook Asaas → bloqueio por inadimplência ou limite estourado**, contemplando tanto **corretor solo** quanto **imobiliária com N corretores vinculados** sob a mesma assinatura.

### 1. Banco de dados (1 migration única)

**Tabela `plans`**:
- Adicionar `is_free boolean default false`.
- `max_properties` = limite total de imóveis da assinatura (somado entre corretores da imobiliária).
- `max_brokers` = limite de corretores quando `plan_type='imobiliaria'` (fixo 1 para `corretor`).

**Tabela `profiles`**:
- Adicionar `agency_id uuid` — aponta para `user_id` da imobiliária dona; `null` para corretor solo.
- Adicionar `account_type text` (`corretor` | `imobiliaria`) gravado a partir do `raw_user_meta_data`.

**Tabela `subscriptions`**: adicionar `pending_payment` ao enum `subscription_status`. Assinatura sempre pertence ao dono (corretor solo OU imobiliária); corretores vinculados herdam via `agency_id`.

**Funções SECURITY DEFINER**:
- `get_effective_subscription(_user_id)` — se tem `agency_id`, retorna a subscription da imobiliária; senão a própria.
- `count_imoveis_in_subscription(_user_id)` — soma imóveis do dono + todos os corretores vinculados.
- `create_trial_subscription(_user_id, _plan_id)` — cria subscription `trial` (ou `active` se `is_free`); calcula `trial_ends_at`.
- `link_broker_to_agency(_broker_email, _agency_user_id)` — vincula corretor existente à imobiliária.

**Triggers**:
- `enforce_imovel_limit()` BEFORE INSERT em `imoveis` — bloqueia se atingiu `plan.max_properties` (Super Admin/Staff isentos).
- `enforce_broker_limit()` BEFORE INSERT/UPDATE em `profiles` quando `agency_id IS NOT NULL` — bloqueia se exceder `plan.max_brokers`.

**Seeds**:
- Plano "Free Corretor" (R$0, 5 imóveis, 1 corretor, `is_free=true`, `plan_type=corretor`).
- Plano "Free Imobiliária" (R$0, 10 imóveis, 2 corretores, `is_free=true`, `plan_type=imobiliaria`).

### 2. Cadastro e onboarding

**`Registro.tsx`** — após `signUp`, redirecionar para `/escolher-plano` (account_type já vai no metadata).

**Nova `/escolher-plano`** (`src/pages/EscolherPlano.tsx`):
- Filtra planos por `account_type` do usuário.
- Card "Free" destacado → RPC `create_trial_subscription` → `/painel`.
- Cards pagos → edge `asaas-checkout` (cria subscription local `pending_payment` ou `trial`) → abre `invoiceUrl` em nova aba → redireciona para `/painel/assinatura`.

**`AuthGuard.tsx`**:
- Sem subscription efetiva e não é Super Admin/Staff → redireciona para `/escolher-plano`.
- `status='blocked'` ou `pending_payment` → libera só `/painel/assinatura` e `/escolher-plano`.

**`useAuth.tsx`**: trocar fetch de subscription por RPC `get_effective_subscription` para herdar a da imobiliária quando aplicável.

### 3. Gestão de corretores pela imobiliária

Nova aba em `Brokers.tsx` (visível só para `account_type='imobiliaria'`):
- "Meus corretores (X de Y)" — lista `profiles.agency_id = user.id`.
- Botão "Convidar corretor" → modal e-mail+nome → RPC `link_broker_to_agency`. Trigger bloqueia se exceder limite, erro vira toast.
- Botão "Remover do quadro" → seta `agency_id = null`.
- Cada corretor vinculado loga normalmente, vê só seus imóveis, mas o limite total é da imobiliária.

### 4. Cobrança Asaas

**`asaas-checkout/index.ts`**: criar `subscription` local com `status='pending_payment'` (ou `trial` se `trial_days>0`) **antes** de chamar Asaas. Mantém `externalReference={user_id, plan_id}`.

**`asaas-webhook/index.ts`**:
- `PAYMENT_CONFIRMED/RECEIVED` → calcular `current_period_end` correto (30/90/365 conforme `plan.billing_cycle`), zerar `blocked_at`, status=`active`.
- `PAYMENT_OVERDUE` → status=`overdue`; se `current_period_end + 7 dias < now()` → `blocked` + `blocked_at=now()`.
- Subscription da imobiliária bloqueada → todos os corretores vinculados bloqueiam automaticamente (mesma subscription efetiva).

### 5. UI de limites e estados

- **`Properties.tsx`**: badge "X de Y imóveis usados" via `count_imoveis_in_subscription`. Botão "Novo imóvel" desabilitado ao atingir limite + tooltip + link upgrade.
- **`SubscriptionBanner.tsx`**: adicionar caso `pending_payment` ("Aguardando confirmação do pagamento").

### 6. Super Admin (`AdminPlanos.tsx`)

- Toggle "Plano gratuito (Free)" (`is_free`).
- Campo `max_brokers` visível apenas quando `plan_type='imobiliaria'`.
- Validação: máximo 1 plano `is_free=true` por `plan_type`.
- Badge "FREE" no card.

### 7. Diagrama do modelo

```text
Imobiliária (user A) ─ subscription S1 (10 im, 2 cor)
   ├─ profile A   (agency_id=null)
   ├─ profile B1  (agency_id=A)
   └─ profile B2  (agency_id=A)
        soma imóveis A+B1+B2 ≤ S1.max_properties
        contagem B1+B2       ≤ S1.max_brokers

Corretor solo (user C) ─ subscription S2 (5 im, 1 cor)
   └─ profile C (agency_id=null)

Fluxo: Registro → /escolher-plano
   ├─ Free  → RPC create_trial → active   → /painel
   └─ Pago  → asaas-checkout   → trial/pending → invoiceUrl
                                       │
                          Webhook PAYMENT_CONFIRMED
                                       ▼
                  active + period_end pelo billing_cycle
```

### Arquivos afetados

- **Migration única**: `is_free`, `agency_id`, `account_type`, enum `pending_payment`, funções `get_effective_subscription`/`create_trial_subscription`/`link_broker_to_agency`/`count_imoveis_in_subscription`, triggers `enforce_imovel_limit` e `enforce_broker_limit`, seeds Free.
- `src/pages/Registro.tsx` — redirect pós-cadastro.
- `src/pages/EscolherPlano.tsx` — **novo**.
- `src/App.tsx` — rota `/escolher-plano`.
- `src/components/AuthGuard.tsx` — redirect quando sem subscription efetiva.
- `src/components/SubscriptionBanner.tsx` — caso `pending_payment`.
- `src/hooks/useAuth.tsx` — usar `get_effective_subscription`.
- `src/pages/admin/AdminPlanos.tsx` — toggle Free + badge + campo max_brokers condicional.
- `src/pages/Brokers.tsx` — aba "Meus corretores" para imobiliária.
- `src/pages/Properties.tsx` — contador + bloqueio UI.
- `supabase/functions/asaas-checkout/index.ts` — cria subscription local antes do redirect.
- `supabase/functions/asaas-webhook/index.ts` — ciclo correto + auto-block.

