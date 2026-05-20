## Objetivo

Hoje, nos cards de imóveis o nome exibido é o do **cadastrante** (dono do `user_id` — ex.: o super admin), com `corretor_nome` apenas como fallback. Vamos inverter: **sempre mostrar o nome do corretor responsável (`corretor_nome`)**, usando o cadastrante apenas quando o imóvel não tiver corretor atribuído.

## Mudanças

Aplicar a mesma regra de prioridade em todas as telas que renderizam cards de imóvel:

```
nome exibido = imovel.corretor_nome?.trim()
             || ownerProfile?.full_name?.trim()
             || "Corretor"
```

A foto/WhatsApp seguem a mesma lógica: tentar primeiro o profile do corretor (resolvido pelo `corretor_nome` via `public_broker_profiles`), depois cair no profile do dono. Iniciais entram quando não houver avatar.

### Arquivos a ajustar

1. `src/pages/Site.tsx` — bloco ~785-820 (mapeamento de `brokerInfo` e atribuição `brokerName`).
2. `src/pages/AllProperties.tsx` — bloco ~185-210 (mesma lógica).
3. `src/pages/Home.tsx` — render dos cards (usa `corretor_nome` direto, garantir que não está sendo sobrescrito por profile).
4. `src/pages/BrokerSite.tsx` — manter `corretor_nome` como label do card.
5. `src/pages/BuildingDetail.tsx`, `src/pages/CondominiumDetail.tsx`, `src/pages/EmpreendimentoDetail.tsx` — cards internos de imóveis vinculados.
6. `src/pages/Imobiliarias.tsx`, `src/pages/RankingPage.tsx`, `src/pages/Brokers.tsx` — se exibem nome em card de imóvel, aplicar mesma regra.

### Resolução do avatar/WhatsApp por corretor

Quando `corretor_nome` existir, buscar o profile correspondente em `public_broker_profiles` por `full_name` (slug match), e usar `avatar_url`/`phone` dele. Se não achar, manter fallback para iniciais + WhatsApp do dono.

## Fora de escopo

- Não alterar schema do banco.
- Não mudar o cadastro nem a lógica de quem pode editar.
- Mantém o link do nome abrindo a página interna do corretor (já implementado).
