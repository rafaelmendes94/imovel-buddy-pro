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
