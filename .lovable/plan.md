# Unificação e melhoria dos mapas do MV Connect

## Objetivo
Criar uma experiência única de mapas para portal público, página do corretor e CRM, priorizando celular, sem alterar registros, coordenadas ou fluxos de cadastro.

## Implementação

### 1. Base compartilhada
- Extrair os comportamentos repetidos para componentes reutilizáveis: marcador compacto/selecionado, rota, localização, estados de carregamento/erro/sem coordenadas e card de localização.
- Manter Google Maps com ícones nativos desativados, coordenadas cadastradas e agrupamento de marcadores.

### 2. Mapa público
- Evoluir o mapa público existente com cabeçalho compacto, busca e filtros sincronizados com lista e marcadores.
- Exibir filtros ativos como chips removíveis e roláveis.
- No celular, usar quase toda a tela útil, respeitando notch e navegação inferior.
- Substituir o carrossel fixo por bottom sheet arrastável em estados recolhido/expandido, com imóvel selecionado e lista compacta.
- Manter “Buscar nesta área”, localização atual, cluster com aproximação e adicionar rota para as coordenadas exatas.
- Limitar a renderização/lista inicial e carregar mais resultados sob demanda.

### 3. Mapa do CRM
- Aplicar a mesma base visual e comportamental ao mapa geral do CRM: clusters, seleção clara, busca nesta área, localização, rota, filtros e lista/bottom sheet móvel.
- Preservar o split lista + mapa no desktop e as permissões atuais.

### 4. Detalhes de imóvel e empreendimento
- Trocar mapas incorporados/isolados pelo bloco compartilhado “mapa + informações”, com endereço, coordenada real, rota e estados sem coordenadas/erro.
- Manter ações de editar, compartilhar e WhatsApp fora da área de controles do mapa.

### 5. Qualidade
- Corrigir alturas, safe-area, z-index, overflow e alvos de toque.
- Garantir labels, foco visível e navegação por teclado.
- Validar typecheck, build e preview em desktop e celular, incluindo filtros, cluster, seleção, bottom sheet, localização, rota e estados vazios.

## Compatibilidade e limites
- Nenhuma tabela, registro ou coordenada será criada, apagada ou geocodificada silenciosamente.
- Cadastros rápido e central continuam usando os mesmos registros e campos atuais.
- A seção “Destaques” não será reintroduzida.
- O projeto é versionado automaticamente pelo ambiente; será informado o conjunto final de alterações, sem criar um commit Git manual.
