# Link Drive Fotos no imóvel

## Escopo
Adicionar um link separado de "Drive Fotos" (além do já existente "Baixar Drive" / `link_material`) que abre em nova aba.

## Banco de dados
- Migration: adicionar coluna `drive_fotos_url TEXT` em `public.imoveis` (nullable, default null).

## Cadastro de imóvel (`src/pages/CadastroImovel.tsx`)
- Adicionar `driveFotosUrl` ao estado `form`.
- Carregar de `data.drive_fotos_url` no fetch/edit (próximo a `linkMaterial`).
- Salvar `drive_fotos_url: form.driveFotosUrl || ''` no payload.
- Adicionar input (tipo url) "Link Drive Fotos" no mesmo bloco do campo "Link Material/Drive" e "Link 360".

## Modal do imóvel (`src/components/PropertyDetailModal.tsx`)
- Ler `drive_fotos_url` da property.
- Na action bar, logo após "Baixar Fotos (PDF)" / "Baixar Drive", adicionar botão `<a target="_blank" rel="noopener noreferrer">` com ícone `Images` (lucide) e label **"Drive Fotos"**, visível somente quando a URL existir.

## Página interna do imóvel
- Página atual de detalhe é o próprio `PropertyDetailModal` (reusado em `Properties`/`AllProperties`). Não há rota dedicada de detalhe; o botão no modal já cobre "página interna". 
- Confirmar que `BrokerSite` continua usando `link_material` (Drive geral) — sem alteração.

## Tipos
- Aguardar regeneração automática de `src/integrations/supabase/types.ts` após a migration; usar cast `(property as any).drive_fotos_url` se necessário no curto prazo.

## Comportamento
- Botão sempre abre em nova aba (`target="_blank"`).
- Campo opcional; quando vazio, botão não aparece.
