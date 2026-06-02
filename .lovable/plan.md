# Ajustes em Planos

## 1. Excluir plano no dashboard admin (`src/pages/admin/AdminPlanos.tsx`)
- Adicionar botão de lixeira em cada linha da lista de planos.
- Ao clicar, abrir confirmação (AlertDialog) e executar `delete` em `plans` pelo id.
- Bloquear exclusão se já houver assinaturas vinculadas: antes do delete, checar `subscriptions` por `plan_id`; se existir, mostrar toast explicando (e oferecer apenas desativar via `is_active=false`).
- Após exclusão, recarregar a lista.

## 2. Planos da home automáticos (`src/pages/Planos.tsx`)
- Já busca de `plans` com `is_active=true`. Confirmar que mostra exatamente o que estiver ativo no admin (sem hardcode) — manter a query atual.
- Remover qualquer filtro que esconda planos válidos.

## 3. Remover seletor "Imobiliária" da home de planos (`src/pages/Planos.tsx`)
- Remover o bloco de tabs "Para Corretores / Para Imobiliárias" (linhas ~134–159).
- Remover o estado `activeTab` e o filtro `p.plan_type === activeTab`.
- Renderizar todos os planos ativos diretamente no grid (continuar ordenando por `price`).
- Manter import/cleanup (remover `cn` se não for mais usado em outros pontos — verificar).

## Observações
- Nenhuma alteração de schema necessária (`plans` já tem `is_active`, exclusão é DELETE direto).
- Sem mudanças em RLS — política `Super admin manages plans` já permite DELETE para super_admin.
