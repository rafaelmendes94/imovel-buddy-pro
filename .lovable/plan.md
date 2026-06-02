## Problema
1. Mapa do site público demora a aparecer / fica em branco até o usuário clicar (tiles do Google só renderizam após o primeiro interação).
2. Garantir que tanto o mapa quanto a página "Ver Todos os Imóveis" carreguem somente imóveis ativos (`ativo_site=true` e não vendidos).

## Causa do delay/tela branca
O Google Maps é inicializado assim que o componente `SiteMap` é montado, mas a seção do mapa fica bem ao fim da página. Quando o container ainda não está totalmente visível / dimensionado, o Maps API renderiza tiles em branco. Só após um evento de `resize` (que acontece quando o usuário clica/interage e força reflow) os tiles aparecem.

Solução: forçar `google.maps.event.trigger(map, "resize")` logo após a criação do mapa e sempre que o container mudar de tamanho ou entrar no viewport.

## Mudanças

### 1. `src/pages/Site.tsx` — função `SiteMap`
- Após `new MapCtor(...)`, agendar `setTimeout(() => { google.maps.event.trigger(map, "resize"); map.setCenter(map.getCenter()); }, 50)` para forçar render imediato.
- Adicionar um `ResizeObserver` no `mapRef.current`: a cada redimensionamento, disparar `resize` e re-centralizar.
- Adicionar um `IntersectionObserver` no `mapRef.current`: quando entrar no viewport pela primeira vez, disparar `resize`. Isso resolve o caso em que o usuário rola até o mapa.
- Os cleanups desses observers entram no `return` do `useEffect`.

### 2. `src/pages/Site.tsx` — fetch de imóveis (linha 781)
Substituir
```ts
supabase.from("imoveis").select("...").eq("ativo_site", true)
```
por
```ts
supabase.from("imoveis").select("...").eq("ativo_site", true).neq("status", "Vendido")
```
Isso garante (no servidor) que o mapa e a listagem do site nunca recebam imóveis vendidos.

### 3. `src/pages/AllProperties.tsx` — fetch (linha 253-261)
Adicionar `.neq('status', 'Vendido')` no ramo `else` (modo público sem `sharedIds`) e remover o filtro client-side redundante (linha 279) — manter apenas para o modo `sharedIds` quando relevante. A página "Ver Todos" continuará exibindo apenas imóveis ativos (ativo_site=true e não vendidos).

### 4. Pré-carregar Google Maps mais cedo (opcional / leve)
O hook `useGoogleMapsLoader` já é chamado no nível da página `Site`, então o script começa a baixar no primeiro render. Sem mudança aqui.

## Resultado
- Mapa carrega visivelmente assim que o usuário rola até ele, sem precisar de clique.
- Mapa e "Ver Todos" servem somente imóveis com `ativo_site=true` e que não estão `Vendido`.
