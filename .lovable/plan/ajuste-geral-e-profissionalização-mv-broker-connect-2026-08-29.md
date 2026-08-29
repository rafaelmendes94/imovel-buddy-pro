# Ajuste geral e profissionalização — MV Broker Connect

## Análise do que já existe

- Os tokens de cor em `src/index.css` já são azul-marinho + azul médio, fundo cinza claro e cards brancos. A identidade base está correta; o problema é que várias páginas usam cores fixas (`bg-emerald-500`, `text-white`, `bg-red-600`...) em vez dos tokens.
- `src/components/AppSidebar.tsx` tem uma lista única de 15 itens, sem agrupamento (já com drag-and-drop via `useSidebarOrder`).
- `src/pages/Properties.tsx` tem 3043 linhas com `PropertyCard` e `PropertyRow` duplicando a mesma lógica de identificação (unidade/box/quadra/lote), painel de filtros aberto por padrão e indicadores em várias linhas.
- `src/pages/ImovelPublico.tsx` já segue o layout premium aprovado (galeria protagonista, downloads, vídeo, tour 360). Precisa apenas de ajustes finos.

## O que será melhorado

1. **Consistência visual**: substituir cores fixas por tokens semânticos (status, badges, botões) nas páginas do CRM. Nenhuma mudança de layout estrutural onde já está bom.
2. **Menu lateral**: agrupar em GESTÃO / COMERCIAL / FINANCEIRO / MÍDIA / CONFIGURAÇÕES, com grupos recolhíveis e estado salvo. Mantém filtro por módulo/plano, permissões e o drag-and-drop atual dentro de cada grupo.
3. **Página de Imóveis**: cabeçalho padronizado (título + "N imóveis ativos" + ações: **+ Novo imóvel** como principal, Importar, Exportar, Relatórios). Filtros passam a abrir em painel (fechado por padrão) com "Limpar filtros". Indicadores reorganizados em uma linha principal (VGV Ativo, Comissão Estimada, VGV Vendido, Comissões, Vendidos no mês) e secundários compactos (Atualizados/Atenção/Desatualizados).
4. **Busca ampla**: placeholder novo e busca cobrindo título, código, empreendimento, condomínio, proprietário, endereço, bairro, cidade, unidade, quadra e lote (usando os campos já carregados — sem mudança de banco).
5. **Identificação automática unificada**: novo helper compartilhado `src/lib/propertyIdentity.ts` que monta, por tipo:
   - Apartamento/Edifício: `Empreendimento • Unidade X • Box Y`
   - Casa em condomínio: `Condomínio • Quadra X • Lote Y`
   - Terreno/Lote: `Empreendimento • Quadra X • Lote Y`
   Campos vazios são omitidos — nunca `undefined`, `null`, `-` ou "Não informado". Usado em cards, lista e página do imóvel. **O campo Box não é alterado** — apenas lido.
6. **Cards de imóvel**: manter foto 4:3 e ordem/capa atuais; exibir título, identificação, localização, preço, dormitórios, suítes, vagas e área privativa. Ações rápidas: Ver, Editar, Compartilhar/WhatsApp visíveis e o resto em menu `•••`.
7. **Loading e performance**: skeletons onde falta, `loading="lazy"` + `decoding="async"` nas imagens da listagem, e carregar apenas a foto de capa nos cards (galeria completa só ao abrir o imóvel).
8. **Feedback**: padronizar mensagens de toast (salvo/atualizado/erro/campos obrigatórios) sem alterar a lógica de salvamento.
9. **Responsividade**: revisão de cabeçalho, filtros, cards e tabelas em mobile/tablet, evitando scroll horizontal e botões quebrados.

## Arquivos que serão alterados

- `src/components/AppSidebar.tsx` (agrupamento)
- `src/pages/Properties.tsx` (header, busca, filtros, indicadores, cards, lista, lazy loading)
- `src/lib/propertyIdentity.ts` (novo helper)
- `src/pages/Site.tsx`, `src/pages/AllProperties.tsx`, `src/pages/ImovelPublico.tsx` (usar o helper de identificação)
- `src/components/MetricCard.tsx` (variante compacta)
- `src/index.css` (apenas tokens de status, se necessário)

Sem migrations. Sem alteração de colunas, payloads de INSERT/UPDATE ou regras de negócio.

## Riscos e mitigação

- **Risco baixo–médio**: `Properties.tsx` é grande e concentra filtros, cache e ações. Mudanças serão incrementais (header → filtros → indicadores → cards), com typecheck após cada bloco e verificação no preview.
- **Risco baixo**: o menu lateral depende de módulos do plano e permissões; a filtragem atual será preservada integralmente, apenas distribuída em grupos.
- **Sem risco de perda de dados**: nenhum formulário de cadastro/edição terá seu estado ou payload alterado nesta fase (padronização de seções dos formulários fica para uma etapa seguinte, se você quiser).

## Não incluído nesta fase

Itens do menu que ainda não existem no sistema (Leads, CRM, Agenda, Proprietários, VGV/Comissões como páginas próprias, Vídeos/Documentos separados) não serão criados como links quebrados — os grupos mostrarão apenas as páginas existentes.
