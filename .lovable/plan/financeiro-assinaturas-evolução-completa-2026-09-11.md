# Financeiro / Assinaturas — evolução completa

Vou evoluir o módulo financeiro que já existe (rota `/financeiro`) e a área de Planos, reaproveitando os dados atuais (4 assinantes, 19 pagamentos, 10 planos). Nada é apagado.

## O que você vai ver

**1. Planos editáveis (Administração > Planos)**
- Novos campos: público (imobiliária / corretor autônomo), periodicidade incluindo **semestral**, valor, máximo de corretores, benefícios, status, desconto e observações.
- Cadastro inicial dos valores pedidos: Imobiliária 299 (mensal), 800 (trimestral), 1.500 (semestral), 2.750 (anual); Corretor autônomo 249 (mensal). Todos editáveis, sem valor fixo no código.

**2. Tela principal do Financeiro**
- Cards clicáveis no topo que filtram a lista: Receita do mês, A receber, Em atraso, Assinantes ativos, Inadimplentes, MRR.
- Alertas clicáveis: vence hoje, próximos 7 dias, atrasados, clientes bloqueados.
- Lista moderna no computador com Assinante, Contato, Tipo, Plano, Valor, Vencimento, Status, Último pagamento, Próximo pagamento e Ações. Filtros por nome, telefone, CRECI, imobiliária, plano, status, vencimento e tipo.
- Ao abrir uma linha: à esquerda os corretores vinculados, à direita o histórico de pagamentos — sem sair da tela.

**3. Pagamento com 1 clique**
- Competência em formato humano (Set/2026, Out/2026).
- Cobranças pendentes/atrasadas são clicáveis → “Confirmar pagamento de R$ X?” com Confirmar/Cancelar.
- Ao confirmar: fica verde “Pago ✓”, guarda data/hora, quem registrou, valor, competência e forma de pagamento; cards, receita, inadimplência e gráficos atualizam na hora; gera apenas a **próxima** cobrança conforme a periodicidade (+1, +3, +6 ou +12 meses).
- Se o cliente estava bloqueado, pergunta se deseja liberar o acesso do grupo.

**4. Imobiliária e hierarquia**
- Ficha da imobiliária com dados da empresa, plano, vencimento, status e usuários vinculados (foto, nome, CRECI, telefone, WhatsApp, e-mail, função, status, último acesso).
- Funções: proprietário, gerente, corretor, financeiro.
- Ações rápidas: editar, bloquear/liberar, retirar da imobiliária, excluir vínculo, alterar função, ver perfil, adicionar corretor.

**5. Bloqueio em grupo**
- Bloquear a imobiliária bloqueia o acesso da conta-mãe e de todos os vinculados, sem apagar nada. Liberar restaura os que estavam ativos antes.
- Status separados: ativo, pagamento pendente, vencido, inadimplente, bloqueado, cancelado.

**6. Ações por cliente**
- Cobrar (WhatsApp do próprio titular, com texto pronto: nome, valor, vencimento), Pagamento, Editar, Usuários, Bloquear e Mais (histórico, alterar plano, alterar vencimento, gerar cobrança, registrar pagamento, desconto/cortesia, observação, cancelar assinatura).
- Cancelamento exige motivo (preço, não usa, migrou, atendimento, encerramento, inadimplência, outro) e preserva o histórico.
- Desconto/cortesia/isenção não contam como inadimplência.

**7. Perfil financeiro do cliente**
Abas Visão geral, Usuários, Financeiro, Histórico, Observações e Atividade. Em Financeiro: plano, valor, vencimento, início, próximo pagamento, total pago, total em aberto, nº de pagamentos, atrasos e tempo como cliente.

**8. Dashboard financeiro**
Receita hoje/semana/mês/ano, a receber no mês, em atraso, MRR, ticket médio, ativos, novos, cancelamentos, inadimplência % e previsão do mês (recebido + previsto). Gráficos: receita por período, recebido x previsto, receita por tipo de cliente, assinaturas por plano e evolução da inadimplência.

**9. Celular**
Cada assinante vira um card com nome, plano, valor, vencimento, status e botões grandes: Cobrar | Pago | Abrir.

## Detalhes técnicos

- **Reaproveitamento:** `subscribers` (titular/assinante), `payments` (cobranças/competências), `subscriber_brokers` (usuários vinculados), `plans`, `subscriptions`, `profiles`. Sem novas entidades duplicadas — não crio `subscription_plans` nem outra tabela de pagamentos.
- **Migração (aditiva, sem DROP):**
  - enum `billing_cycle`: novo valor `semiannual`.
  - `plans`: `description`, `discount_percent`, `notes`, `audience` derivado de `plan_type` existente (mantido).
  - `subscribers`: `plan_id` (FK `plans`), `subscriber_type` (`imobiliaria`/`corretor`), `owner_user_id`, `due_day`, `next_due_date`, `start_date`, `cancel_reason`, `cancelled_at`, `blocked_at`, `document`, `city`.
  - `subscriber_brokers`: `user_id`, `member_role` (`owner|manager|broker|finance`), `avatar_url`, `last_access_at`, `previous_status`.
  - `payments`: `paid_by`, `method`, `notes`, `is_courtesy`, `discount_amount`, `competence` (date, base do rótulo Set/2026).
  - nova `financial_activity_logs` (assinante, tipo de evento, descrição, metadados JSON, autor, data) com GRANTs e RLS só para super admin / staff com módulo financeiro.
  - Backfill: `competence` e `next_due_date` a partir dos registros atuais; `plan_id` casado por periodicidade; nenhum valor histórico alterado.
- **Bloqueio em grupo:** ao bloquear, guardo o status anterior de cada vinculado e marco `subscriptions.status='blocked'` do titular quando houver conta ligada; membros herdam pelo `profiles.agency_id` já usado por `get_effective_subscription`, então o AuthGuard atual passa a barrar o grupo sem mudança de regra de acesso.
- **Código:** `src/pages/Financeiro.tsx` reescrito em componentes sob `src/components/financeiro/` (cards, alertas, tabela, linha expansível, cards mobile, dialogs de pagamento/cobrança/plano/cancelamento, perfil com abas, dashboard e gráficos com Recharts), mais `src/lib/finance.ts` (competência, recorrência, métricas) e `src/hooks/useFinanceData.ts`. `AdminPlanos.tsx` ganha os novos campos.
- **Validação:** typecheck e teste autenticado no preview cobrindo plano editável, pagamento 1 clique, atualização do dashboard, hierarquia, bloqueio/desbloqueio em grupo, timeline e celular.

## Premissas

- Os 4 assinantes e 19 pagamentos atuais são reais e permanecem; apenas completo campos vazios.
- Os planos pedidos são criados como novos registros ativos; os planos antigos ficam como estão (podem ser desativados por você).
