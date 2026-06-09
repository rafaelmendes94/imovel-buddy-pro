## Alinhar contato do corretor no rodapé dos cards (página /todos-imoveis)

Hoje em `src/pages/AllProperties.tsx` o `PropertyCard` deixa o bloco "corretor + WhatsApp" logo depois do conteúdo, então a posição vertical varia conforme o tamanho do título/endereço/badges. Vou fazer o bloco ficar sempre colado na base do card, padronizando a linha do corretor em todos os cards da grade.

### Mudanças (somente CSS/classes, sem alterar dados ou lógica)

Arquivo: `src/pages/AllProperties.tsx` — componente `PropertyCard`

1. Wrapper do card (linha 59): adicionar `flex flex-col h-full` para o card ocupar toda a altura da célula do grid.
2. Área de conteúdo (linha 148, `<div className="p-4 space-y-3">`): adicionar `flex-1 flex flex-col` para empurrar conteúdo verticalmente.
3. Bloco "Broker + WhatsApp" (linha 202): adicionar `mt-auto` para grudar no rodapé do card.
4. Nome do corretor (linha 210): adicionar `truncate` + container `min-w-0` no Link para evitar quebra de linha quando o nome for longo (mantém alinhamento horizontal consistente).
5. Botão WhatsApp (linha 215): adicionar `flex-shrink-0 whitespace-nowrap` para não ser comprimido.

Resultado: em qualquer card da grade, a linha "foto + nome do corretor + botão WhatsApp" fica sempre na mesma posição (na base), igual ao print enviado.

Sem alterações em outras páginas (Site, Properties), sem mudanças em rotas, dados ou backend.