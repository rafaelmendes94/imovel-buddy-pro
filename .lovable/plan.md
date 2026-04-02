

## Plano: Corrigir Tela Branca (504 no Vite deps cache)

### Diagnóstico

- O screenshot confirma tela branca no `/admin/dashboard`
- Console mostra: `504` ao carregar `react-dom_client.js?v=ba234700` do cache Vite
- O `vite.config.ts` já tem `dedupe` correto para React
- O `package.json` tem versões compatíveis de `react` e `react-dom` (^18.3.1)
- O problema é o cache de dependências pré-empacotadas do Vite estar corrompido ou desatualizado

### Solução

Forçar a regeneração completa do cache do Vite:

1. **Deletar o diretório de cache do Vite** (`node_modules/.vite`) para eliminar os arquivos pré-empacotados corrompidos
2. **Forçar rebuild** tocando o `vite.config.ts` para que o dev server reinicie com um novo hash de cache
3. **Verificar** que a página carrega após o restart

### Arquivo Modificado

- `vite.config.ts` — adicionar um comentário com timestamp para forçar invalidação do cache (o conteúdo funcional não muda)

