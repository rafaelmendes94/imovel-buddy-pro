# Cadastro único de empreendimentos (corretor + central)

## Diagnóstico

Encontrei duas causas reais do problema:

1. **No cadastro rápido da página do corretor o campo "Empreendimento" é apenas texto livre** (`BrokerImovelDialog.tsx` grava só `empreendimento` como texto). Ele nunca cria nem vincula um registro — por isso "não cadastra".
2. **As regras de acesso das tabelas de edifícios, condomínios e loteamentos só permitem que cada usuário veja os próprios registros** (ou super admin). Um corretor comum não vê os 755 edifícios já cadastrados, então a busca aparece vazia mesmo com dados no banco.

As tabelas certas já existem e serão reaproveitadas: `edificios`, `condominios`, `empreendimentos`. A tabela de imóveis já tem `edificio_id`, `condominio_id`, `empreendimento_id` — nenhuma tabela nova, nenhum dado movido.

## O que vou fazer

### 1. Catálogo compartilhado (banco)
- Liberar **leitura** dos empreendimentos/edifícios/condomínios para usuários autenticados (catálogo comum do sistema), mantendo **criar/editar/excluir** restrito ao dono do registro, super admin e admin staff.
- Nenhum registro alterado, nenhuma coluna removida; os 755 edifícios e coordenadas permanecem intactos.

### 2. Serviço único
Novo `src/lib/empreendimentos.ts`, fonte única de verdade:
- tipos `EmpreendimentoTipo = 'edificio' | 'condominio' | 'loteamento'` e mapeamento tipo → tabela;
- `searchEmpreendimentos(termo)` — busca unificada por nome, endereço e bairro nas três tabelas;
- `saveEmpreendimento(tipo, dados)` — validação em português + insert/update com `user_id` do usuário logado, devolvendo o registro salvo;
- `getEmpreendimentoById(tipo, id)` para carregar o vínculo na edição.

### 3. Formulário central reutilizável
Novo `src/components/EmpreendimentoFormDialog.tsx` (modal/drawer responsivo):
- seletor obrigatório do tipo: **Edifício vertical / Condomínio horizontal / Loteamento** — a gravação vai para a tabela correta, nunca pelo texto digitado;
- campos: nome, construtora, ano, status, CEP/endereço/número/bairro/cidade/estado (com preenchimento automático já existente), latitude/longitude, unidades, infraestrutura, capa;
- botão com estado de carregamento e trava contra duplo clique; só mostra sucesso após gravação confirmada; erros de permissão traduzidos.

As páginas centrais (`CadastroEdificio`, `CadastroCondominio`, `CadastroEmpreendimento`) passam a usar `saveEmpreendimento` do serviço, mantendo o layout atual — mesma validação e mesma gravação dos dois lados.

### 4. Seletor pesquisável
Novo `src/components/EmpreendimentoPicker.tsx`:
- autocomplete mostrando **nome • tipo • endereço • bairro/cidade**;
- ações: *Selecionar existente*, *Cadastrar novo empreendimento* (abre o formulário acima) e *Nenhum empreendimento*;
- não aceita nome solto: sem seleção, nenhum vínculo é salvo;
- ao salvar um novo, ele volta já selecionado e aparece na lista sem recarregar a página;
- ao selecionar, preenche no imóvel endereço, número, bairro, cidade, CEP, latitude e longitude quando existirem (marcador do mapa usa as coordenadas reais).

### 5. Uso nos dois pontos
- `BrokerImovelDialog.tsx` (cadastro rápido do corretor): troca o texto livre pelo seletor; grava `edificio_id`/`condominio_id`/`empreendimento_id` conforme o tipo e mantém `empreendimento` com o nome para compatibilidade; na edição carrega o vínculo pelo ID.
- `CadastroImovel.tsx`: os três seletores separados passam a usar o mesmo componente/serviço, com criação em modal em vez de sair da página.
- Como o nome exibido vem do registro vinculado, editar nome/endereço no cadastro central reflete no imóvel.

### 6. Validação
Typecheck e teste no preview autenticado: selecionar edifício existente; criar edifício, condomínio horizontal e loteamento pelo modal; conferir que aparecem no cadastro central certo; criar imóvel vinculado e confirmar o vínculo após recarregar; editar pelo central e ver refletido; conferir ausência de duplicados, coordenadas no mapa e o fluxo no celular.
