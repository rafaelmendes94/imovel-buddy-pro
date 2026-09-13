# Auditoria MV Broker Connect - 2026-09-13

## Escopo executado

- Build de produção.
- Testes automatizados existentes.
- Rotas públicas em desktop e mobile:
  - `/`
  - `/todos-imoveis`
  - `/corretor/447177e4-8ff6-42a5-ae3f-3a1afd13fc74`
  - `/imovel/4004164e-8439-4c87-ba4a-a380eb77c916`
- Varredura de cadastro/listagem/página pública dos imóveis.
- Varredura de links públicos de corretores/imobiliárias.
- Consulta somente leitura dos dados públicos no Supabase.

## Correções aplicadas

1. Links de página pública de corretor passaram a priorizar `user_id` em vez de slug gerado por nome.
   - Corrige contas com nomes iguais abrindo a mesma página.
   - Mantém compatibilidade com links antigos por slug.

2. Página pública do corretor (`/corretor/:slug`) agora resolve:
   - `user_id` novo.
   - slug antigo por nome.
   - configuração antiga em `site_config.owner_id`.

3. Configuração/tabela da página do corretor passa a salvar usando ID único do dono quando possível.

4. Corrigida consulta de avaliações na página do corretor.
   - Antes buscava colunas antigas `transparencia` e `credibilidade`.
   - Agora usa `conhecimento_mercado` e `atendimento`.

5. Removidos campos internos da seleção pública de imóveis:
   - `local_chaves`
   - `comissao`
   - `bonus`
   - `bonus_validade`
   - `publicar_xml`

## Validações

- `npm run build`: passou.
- `npm test`: 15 testes passaram.
- Desktop público: sem 400/401 nas rotas testadas.
- Mobile público: sem 400/401 nas rotas testadas.

Observação: em localhost o Google Maps pode logar erro de chave/domínio. No site publicado isso depende da restrição da chave Google.

## Dados encontrados

- Perfis públicos: 10.
- Slug duplicado encontrado:
  - `teste-qa`
  - usuários:
    - `2738c4fb-ada5-4545-8025-9dc2d9f5e0e9`
    - `9f1bff55-afb4-42ef-bcf5-b7b548c9935b`
- Imóveis consultados: 7.
- Imóveis ativos/publicáveis: 6.
- Imóveis ativos sem foto: 5.
- Imóveis ativos com descrição: 6.
- Imóveis ativos com vídeo: 1.
- Imóveis ativos com tour 360: 0.
- Imóveis ativos com material/PDF/Drive: 1.
- Configurações antigas de página por slug: 4.

## Lacunas / próximos pontos

1. Campos públicos ainda não liberados no banco:
   - `valor_condominio`
   - `valor_iptu`
   - `mobiliado`

   Tentei incluir na consulta pública, mas a rota quebrou com `401 permission denied for table imoveis`. Para exibir esses campos publicamente, precisa ajustar permissões/GRANT/RLS no Supabase antes.

2. Auditoria com login real de Super Admin, Secretária, Corretor e Imobiliária ainda depende de credenciais válidas no Supabase atual.
   - As credenciais QA anteriores retornaram `Invalid login credentials`.

3. O lint geral ainda falha por dívida antiga do projeto, principalmente `any` e alguns `no-empty`.

4. Existem muitos imóveis ativos sem foto. Isso parece dado real, não erro de frontend, mas precisa filtro/relatório operacional se o admin quiser tratar.

5. Links antigos por slug continuam funcionando, mas se duas contas tiverem mesmo slug o link antigo continua ambíguo. Os novos links gerados pelo sistema agora usam `user_id`.

## Fase 2 - mapa do sistema

### Rotas públicas conferidas

- `/planos`: abre sem erro.
- `/parceiros`: abre sem erro.
- `/brick-store`: abre sem erro.
- `/galeria-cidade`: abre sem erro.
- `/mapa`: abre sem erro técnico em localhost.
- `/explorar-mapa`: abre sem erro técnico em localhost.
- `/todos-imoveis`: abre sem erro.
- `/ranking`: redireciona para `/login`, portanto está protegido.

### Regras de acesso encontradas

- `AuthGuard` bloqueia usuários sem login.
- Corretor/imobiliária só entra se `approval_status = approved`.
- Corretor/imobiliária sem assinatura efetiva é enviado para `/escolher-plano`.
- Assinatura `pending_payment`, `cancelled`, `blocked` ou trial vencido envia para `/painel/assinatura`.
- Super Admin e Secretária/Admin Staff passam pelas travas de assinatura.
- `ModuleGuard` libera Super Admin para tudo.
- Secretária/Admin Staff depende de `staff_permissions`.
- Corretor depende dos módulos salvos no plano (`subscription.plan.modules`).

### Módulos internos mapeados

- Administração: Dashboard, Funcionários, Cargos e Funções, Clientes, Planos, Opções do Sistema, IA, Asaas/Pagamentos, Parceiros.
- Operacional/admin: Imóveis, Edifícios, Condomínios, Mapas Condomínio, Fotos da Cidade, Avaliações, Financeiro, Tabelas, Gerador de Tabela, Contratos, Material Extra, Configurações.
- Corretor/imobiliária: Painel, Assinatura, Feeds XML, Cadastro Rápido, Imóveis, Feed de Imóveis, Mapas Condomínio, Site, Corretores, Construtoras, Ranking, Avaliações, Tabelas, Gerador de Tabela, Fotos da Cidade, Material Extra, Contratos e Configurações conforme plano.

### Achados novos

1. Tela `Imobiliárias` usa dados fixos no front:
   - `Alpha Imóveis`
   - `Beta Imobiliária`
   - Cadastros, edições e exclusões mudam só o estado da tela.
   - Ao recarregar, os dados voltam ao mock.
   - Prioridade: alta.

2. Tela `Material Extra` / `Videomaker` usa dados iniciais mockados:
   - Trabalhos, agenda e financeiro são mantidos só no estado da tela.
   - Ao recarregar, alterações podem sumir.
   - Prioridade: alta se esse módulo for usado em produção.

3. Há rotas autenticadas sem `ModuleGuard` específico:
   - `/cadastro-corretores`
   - `/construtoras`
   - `/construtoras/:id`
   - `/construtoras/:id/avaliacoes`
   - `/brick`
   - `/configuracoes`

   Essas rotas dependem apenas de estar logado e passar assinatura/aprovação. Precisa validar se isso é a regra desejada para corretor/imobiliária.

4. O site público principal ainda tem fallback de WhatsApp fixo `5511999999999` em alguns pontos. Isso precisa ser trocado por configuração real ou ficar vazio quando não houver telefone.

5. Algumas páginas públicas continuam usando `select("*")` em tabelas públicas. Não quebrou nos testes, mas é melhor trocar por seleção explícita para evitar vazamento futuro quando novas colunas internas forem adicionadas.

6. A chave do Google Maps está em variável com nome `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`. Funciona tecnicamente, mas ainda carrega referência antiga de Lovable no nome da variável.

### Próximas frentes recomendadas

1. Corrigir telas com mock para usar Supabase real:
   - `Imobiliárias`
   - `Videomaker` / `Material Extra`

2. Fazer teste autenticado com usuários reais:
   - Super Admin
   - Secretária/Admin Staff
   - Corretor individual
   - Imobiliária/dono
   - Membro da equipe

3. Revisar permissões por módulo:
   - confirmar o que corretor pode acessar sempre;
   - confirmar o que depende de plano;
   - bloquear rota que não aparece no menu, se não puder ser aberta por URL direta.

4. Completar integração financeira:
   - checkout Asaas;
   - webhook Asaas;
   - bloqueio/liberação por pagamento;
   - tela de assinatura do cliente;
   - logs de pagamentos.

5. Otimizar imagens e listagens:
   - paginação;
   - seleção explícita de colunas;
   - lazy loading;
   - miniaturas/capa em vez de imagens grandes na listagem.

## Fase 3 - auditoria geral ampliada

### Comandos executados

- `npm run build`: passou.
- `npm test`: passou, 15 testes em 4 arquivos.
- `npm run lint`: falhou com 734 problemas.
- `npm audit --audit-level=moderate`: falhou com 25 vulnerabilidades.
- Teste Playwright sem login em rotas internas: todas as rotas testadas redirecionaram para `/login`.
- Consulta anon Supabase: conferida leitura pública e retorno RLS em tabelas sensíveis.

### Build e performance

- Build de produção passou.
- Bundle principal ficou grande:
  - `dist/assets/index-rJ-QKAPh.js`: 3.898,90 kB, gzip 1.089,17 kB.
- Chunks pesados:
  - `pdf.worker.min`: 1.265,41 kB.
  - `html2pdf.bundle.min`: 969,26 kB.
  - `html2pdf`: 776,17 kB.
  - `pdf`: 483,23 kB.
- Há alerta de import duplicado do `jszip`: import dinâmico em `Properties.tsx`, mas import estático em `Condominiums.tsx`.
- Impacto provável:
  - carregamento inicial mais lento;
  - navegação mobile mais pesada;
  - telas de imóveis/mapa carregam dependências antes do necessário.

### Qualidade de código

- Lint falha com 734 problemas:
  - muitos `any`;
  - blocos `catch` vazios;
  - hooks com dependências incompletas;
  - `require()` no `tailwind.config.ts`;
  - `@ts-ignore` onde deveria ser `@ts-expect-error`;
  - `prefer-const`;
  - warnings de Fast Refresh por arquivos exportando componente e constantes juntos.
- Isso não quebra o build hoje, mas aumenta risco de bug silencioso.

### Segurança de dependências

`npm audit` retornou 25 vulnerabilidades:

- 1 crítica.
- 17 altas.
- 5 moderadas.
- 2 baixas.

Pacotes relevantes citados:

- `react-router-dom` / `@remix-run/router`: vulnerabilidades de XSS/open redirect.
- `vite` / `esbuild`: risco no dev server.
- `rollup`: path traversal/arbitrary file write.
- `postcss`: XSS/arbitrary file read em cenários específicos.
- `lodash`, `js-yaml`, `glob`, `minimatch`, `ws`, `nanoid`, `browserslist`.

Recomendação: atualizar dependências em uma etapa própria, com build/teste completo depois, porque `npm audit fix` pode alterar bastante o lockfile.

### Rotas internas sem login

Rotas testadas sem sessão e resultado esperado confirmado:

- `/dashboard`
- `/imoveis`
- `/cadastro-imovel`
- `/edificios`
- `/condominios`
- `/fotos-cidade`
- `/corretores`
- `/cadastro-corretores`
- `/relatorios`
- `/configuracoes`
- `/site-editor`
- `/ranking`
- `/avaliacoes`
- `/financeiro`
- `/tabelas`
- `/contratos`
- `/videomaker`
- `/imobiliarias`
- `/construtoras`
- `/brick`
- `/admin/clientes`
- `/admin/planos`
- `/admin/funcionarios`
- `/admin/cargos`
- `/admin/opcoes`
- `/admin/ia`
- `/admin/asaas`
- `/admin/parceiros`
- `/painel`
- `/painel/assinatura`

Todas redirecionaram para `/login`.

### Permissões e papéis

- Regra geral encontrada:
  - Super Admin: acesso total.
  - Admin Staff/Secretária: depende de `staff_permissions`.
  - Corretor/imobiliária: depende do plano e dos módulos em `subscription.plan.modules`.
- A proteção anônima está funcionando nas rotas internas.
- Ainda falta teste autenticado por papel real:
  - Super Admin;
  - Secretária com permissões parciais;
  - Corretor;
  - Imobiliária/dono;
  - membro da equipe da imobiliária.
- Algumas rotas usam apenas `AuthGuard` e não têm trava fina por módulo. Isso precisa decisão:
  - `/cadastro-corretores`
  - `/construtoras`
  - `/construtoras/:id`
  - `/construtoras/:id/avaliacoes`
  - `/brick`
  - `/configuracoes`

### Banco/RLS

Consulta anon com chave pública:

- Tabelas públicas que retornam dados:
  - `public_broker_profiles`: 10 registros.
  - `plans`: 15 registros.
  - `site_config`: 5 registros.
  - `partners`: 16 registros.
  - `city_galleries`: 2 registros.
- Tabelas sensíveis consultadas como anon retornaram 0 linhas, sem erro:
  - `profiles`
  - `subscriptions`
  - `subscribers`
  - `payments`
  - `staff_permissions`
  - `user_roles`
  - `billing_customers`
  - `subscription_payments`
  - `financial_activity_logs`

Observação: retornar 0 linhas por RLS é aceitável, mas precisa testar com usuários autenticados por papel para garantir que cada role enxerga só o que deve.

### Risco em migrations/policies

- O schema consolidado ainda mostra policies antigas como:
  - `Admins manage payments`
  - `Admins manage subscribers`
  - `Admins manage subscriber_brokers`
- As migrations novas criam policies mais finas com `has_staff_permission`, mas não removem necessariamente todos os nomes antigos dependendo do estado real do banco.
- No banco real precisa confirmar `pg_policies` para:
  - `payments`
  - `subscribers`
  - `subscriber_brokers`
  - `financial_activity_logs`
  - `subscriptions`
  - `subscription_payments`
- Se a policy antiga ampla ainda estiver ativa, Secretária/Admin Staff pode ter acesso mais amplo do que o desejado.

### Cadastro, login e aprovação

- Registro cria conta com metadata:
  - `full_name`
  - `phone`
  - `account_type`
- Trigger `handle_new_user` cria perfil com `approval_status = pending`.
- `AuthGuard` bloqueia usuário não aprovado.
- `Login` redireciona por papel/assinatura, mas quem estiver pendente acaba barrado pelo `AuthGuard` ao chegar no painel.
- Melhoria recomendada:
  - buscar `approval_status` já no login e mandar direto para uma tela clara de “aguardando aprovação”, evitando navegação intermediária.
- Termos de uso ainda não aparecem no cadastro do Connect nesta auditoria. Se for regra também do Connect, precisa implementar checkbox e salvar `terms_accepted_at`.

### Financeiro

- `/financeiro` é a tela mais completa e usa o hook `useFinanceData`.
- Usa dados de:
  - `subscribers` legado;
  - `payments` legado;
  - `subscriber_brokers`;
  - `plans`;
  - `financial_activity_logs`;
  - `subscriptions`;
  - `subscription_payments`;
  - `profiles`.
- Possui:
  - dashboard;
  - filtros;
  - cobrança por WhatsApp;
  - pagamento rápido;
  - pagamento manual;
  - cortesia/isenção;
  - histórico;
  - membros;
  - bloqueio/liberação;
  - cancelamento;
  - troca de plano e vencimento.
- Risco encontrado:
  - mistura modelo legado (`subscribers/payments`) com modelo real de assinatura (`subscriptions/subscription_payments`).
  - alguns pagamentos sintéticos são gerados em tela quando não há cobrança real.
  - isso é útil visualmente, mas pode confundir se o usuário entender como cobrança real emitida.
- `AdminClientes` é uma tela antiga/simple. Ela também gerencia clientes/assinaturas, mas com menos regra que `/financeiro`.
  - Recomendação: unificar fluxo no Financeiro/Gestão do Cliente e ocultar/descontinuar `AdminClientes`, ou transformar `AdminClientes` em atalho para o painel novo.

### Asaas

- `asaas-checkout`:
  - lê chave em `system_settings`;
  - cria customer;
  - cria assinatura;
  - atualiza/cria `subscriptions`;
  - gera invoice URL.
- `asaas-webhook`:
  - tem token opcional `ASAAS_WEBHOOK_TOKEN`;
  - processa `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `PAYMENT_DELETED`;
  - atualiza status e vencimento da assinatura.
- Riscos/dívidas:
  - `asaas_subscription_id` também é gravado em `mercado_pago_subscription_id`.
  - `asaas_payment_id` também é gravado em `mercado_pago_payment_id`.
  - Isso deve ser separado/removido para não contaminar relatórios.
  - Sem chave real Asaas, só foi possível auditar código, não fluxo real de pagamento.

### Telas reais no Supabase

Pelo código, estas telas usam Supabase para CRUD ou leitura real:

- Imóveis.
- Cadastro/Edição de imóvel.
- Edifícios.
- Condomínios.
- Empreendimentos.
- Construtoras.
- Corretores.
- Fotos da cidade.
- Tabelas.
- Brick/Admin Brick.
- Parceiros/Admin Parceiros.
- Planos.
- Funcionários.
- Cargos/Funções.
- Opções do sistema.
- Configuração IA.
- Asaas/Pagamentos.
- Financeiro.
- Site/configuração pública.

### Telas com mock/estado local

- `Imobiliarias.tsx`:
  - usa `initialImobiliarias`.
  - salvar, editar e excluir não persistem no banco.
  - link público de corretor nessa tela usa slug por nome, podendo cair no problema antigo de duplicidade.

- `VideoMaker.tsx`:
  - usa `initialJobs`, `initialFinance`, `initialEvents`.
  - kanban, financeiro e agenda não persistem no banco.

### Público/site

- Páginas públicas funcionaram nos testes.
- `site_config` é público, incluindo campos de contato/configuração. Isso parece intencional para site público, mas deve evitar segredos nessa tabela.
- Ainda existe fallback fixo de WhatsApp `5511999999999` no site principal.
- Páginas públicas devem usar seleção explícita de colunas; algumas ainda usam `select("*")`.

### Imóveis e mídia

- Listagens e detalhes carregam imagens diretamente do array de URLs.
- Há muitos imóveis ativos sem foto nos dados públicos.
- Melhorias recomendadas:
  - gerar thumbnail/capa;
  - paginação menor;
  - lazy loading agressivo;
  - evitar carregar galerias completas na listagem;
  - mover PDF/geração pesada para import dinâmico apenas quando o usuário clicar.

### Mapa

- Em localhost, mapa pode depender da restrição da chave Google.
- A variável ainda se chama `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`.
- Recomendação:
  - renomear para `VITE_GOOGLE_MAPS_BROWSER_KEY`;
  - manter fallback temporário para não quebrar deploy;
  - validar domínios autorizados no Google Cloud.

### Prioridade sugerida para ajustes

1. Conferir policies reais no Supabase (`pg_policies`) e remover policies amplas antigas se ainda existirem.
2. Resolver fluxo financeiro/Asaas:
   - separar campos Asaas de Mercado Pago;
   - confirmar webhook com token obrigatório;
   - deixar cobrança sintética claramente visual.
3. Transformar `Imobiliarias.tsx` em tela real ou remover/ocultar.
4. Transformar `VideoMaker.tsx` em tela real ou remover/ocultar.
5. Unificar `AdminClientes` com `/financeiro`.
6. Otimizar bundle e carregamento de imagens/listagens.
7. Atualizar dependências com vulnerabilidades e testar tudo.
8. Reduzir dívida de lint em etapas.
