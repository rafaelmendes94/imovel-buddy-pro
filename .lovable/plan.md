

# Plano: Home como página principal, Dashboard no /dashboard

## Resumo
A rota `/` já renderiza `<Home />`. O problema é que após o login, admins são redirecionados para `/admin/dashboard` (que faz redirect para `/dashboard`). Corretores vão para `/painel`. Isso já está correto — o dashboard já está em `/dashboard`.

A única mudança necessária é garantir que o fluxo de login redirecione admins diretamente para `/dashboard` (sem passar por `/admin/dashboard`).

## Mudanças

### 1. `src/pages/Login.tsx` (linha 39)
- Alterar o redirect de admins de `"/admin/dashboard"` para `"/dashboard"`

### 2. `src/App.tsx` (linha 90)
- Remover a rota de redirect `"/admin/dashboard" → "/dashboard"` (já não será mais necessária)

Duas linhas de mudança. A Home já é a página principal em `/`.

