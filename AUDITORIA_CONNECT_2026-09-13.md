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
