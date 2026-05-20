## Ajustes na página do corretor (`src/pages/BrokerSite.tsx`)

### 1. Cards clicáveis → abrem o imóvel
- Adicionar estado `selectedProperty` na página.
- O `PropertyCard` recebe `onClick` que seta esse imóvel.
- Reaproveitar o `PropertyDetailModal` já usado em `Site.tsx` / `AllProperties.tsx`, mapeando o `DBProperty` para o formato `Property` que o modal espera (mesmo mapeamento de `Site.tsx`, linhas ~820-870).
- Botão "Tenho interesse" (WhatsApp) continua funcionando com `stopPropagation` para não abrir o modal ao clicar nele.

### 2. Seção de Avaliações inline + restrição de quem avalia
- Renderizar o componente `<BrokerRatings />` direto na página (nova seção logo antes do histórico de vendas), além de manter o modal atual disparado pelo selo de nota no header.
- Mantém a regra atual do `BrokerRatings`: `canRate = !!user && isBroker && user.id !== brokerId` — só corretores logados conseguem enviar avaliação, demais visitantes apenas visualizam médias e comentários.
- Se o visitante não estiver logado, mostrar uma mensagem "Faça login como corretor para avaliar" no lugar do formulário (já existe no componente, só garantir que apareça).

### 3. Tag "Exclusividade" com download do termo
- Substituir a tag de status atual (`Disponível` / `Vendido` / `Reservado`) por um badge fixo **"Exclusividade"** em todos os cards ativos.
- O badge vira um link/botão: se `termo_exclusividade_url` existir, abre o PDF em nova aba (`target="_blank"`, `download`); se não existir, exibe um toast "Termo não disponível".
- Cards de imóveis vendidos (`status === "Vendido"`) continuam com o badge vermelho "Vendido" no carrossel de histórico, para não confundir prova social.
- Incluir `termo_exclusividade_url` na interface `DBProperty` e no `select` da query de imóveis do corretor.

### Arquivos afetados
- `src/pages/BrokerSite.tsx` (cards, estado de modal, seção de avaliações, tag de exclusividade, query incluindo `termo_exclusividade_url`).

Sem migrations — o campo `termo_exclusividade_url` já existe na tabela `imoveis`.
