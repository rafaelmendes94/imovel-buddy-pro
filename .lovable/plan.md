## Objetivo

Reverter a prioridade nos cards de imóvel: **sempre mostrar o nome e contato do corretor que cadastrou o imóvel** (dono do `user_id` na tabela `imoveis`), em vez de `corretor_nome`.

Isso é o oposto da última alteração — agora o "cadastrante" volta a ser a fonte de verdade no card.

## Regra única

```
nome    = ownerProfile?.full_name?.trim() || imovel.corretor_nome?.trim() || "Corretor"
avatar  = ownerProfile?.avatar_url
whatsapp = ownerProfile?.phone
link    = página do corretor cadastrante (slug do full_name do owner)
```

`corretor_nome` (campo do imóvel) vira apenas fallback caso o profile do dono não exista.

## Arquivos a ajustar

1. `src/pages/Site.tsx` — bloco `brokerInfo` (~785-820): inverter para `ownerProfile` primeiro.
2. `src/pages/AllProperties.tsx` — bloco equivalente (~185-220).
3. `src/pages/Home.tsx` — `MiniPropertyCard` hoje não exibe corretor; se for para mostrar, adicionar usando a mesma regra (confirmar com usuário se quer exibir aqui).
4. `src/pages/BrokerSite.tsx` — manter, pois já é o contexto do próprio corretor.
5. `src/pages/BuildingDetail.tsx`, `CondominiumDetail.tsx`, `EmpreendimentoDetail.tsx` — aplicar mesma regra nos cards internos.
6. `src/pages/Imobiliarias.tsx`, `RankingPage.tsx`, `Brokers.tsx` — revisar e alinhar.

## Detalhes técnicos

- Já carregamos `profiles` por `user_id` em quase todas as telas (`profilesByUser`). Vamos só inverter a ordem na composição do `brokerName/brokerPhoto/brokerWhatsapp`.
- O link do nome deve apontar para `/corretor/<slug-do-owner>` (slug do `full_name` do profile do dono).
- Iniciais entram quando não houver `avatar_url`.

## Fora de escopo

- Sem mudanças de schema.
- Sem mudanças na lógica de cadastro/edição/permissão.
- Sem mudanças visuais além da fonte dos dados exibidos.

## Pergunta pendente

No `Home.tsx` (carrossel da home pública) os mini-cards hoje **não exibem** o corretor. Devo adicionar a exibição do cadastrante ali também, ou manter como está?
