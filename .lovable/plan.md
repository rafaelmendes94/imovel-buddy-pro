

## Melhorias na página pública do corretor

Três ajustes na hotsite do corretor (`/corretor/:slug`):

### 1. Estrela do avatar abre modal de avaliações
- O selo de estrela sobreposto ao avatar (canto inferior direito) hoje é decorativo. Vai virar um botão clicável que:
  - Exibe a **nota média** do corretor sobreposta na estrela (ex: `4.8` em texto pequeno) puxada das `broker_ratings`.
  - Ao clicar, abre um **modal (Dialog)** em tela cheia/centralizado contendo o componente `BrokerRatings` já existente (radar + formulário + comentários).
- A seção `<BrokerRatings>` que hoje está renderizada inline na página será **removida do fluxo** e movida para dentro do modal, evitando duplicação.

### 2. Botão "Subir tabela completa" deslocado para dentro do botão "Tabela"
- Hoje há dois botões separados: "Baixar tabela em PDF" e "Subir tabela completa" (dono). Vamos unificar:
  - **Visitante**: vê apenas "Baixar tabela em PDF" (se existir) ou "Tabela indisponível".
  - **Dono**: vê o botão "Baixar tabela em PDF" **com um sub-botão / ícone de upload anexo** ao lado (mesmo container visual) — clicar no ícone de upload abre o seletor de arquivo. Se ainda não houver tabela, o botão principal vira "Subir tabela completa" diretamente.
- Resultado: visualmente apenas 1 controle de "Tabela" + 1 controle de "Gerar PDF", como mostra o screenshot enviado.

### 3. PDF dos imóveis com design alinhado ao site
Substituir o PDF atual (tabela seca via `jspdf-autotable`) por um **PDF visual estilo catálogo**, gerado via `html2pdf.js` (já presente em `generatePropertyPdf.ts`) replicando a identidade do site:

**Estrutura do PDF:**
- **Capa**: gradiente navy/accent (mesma cor do site / `accent_color`), avatar circular do corretor, nome em fonte black grande, CRECI, contato (WhatsApp + e-mail), totais (X imóveis · VGV total · VGV vendido).
- **Páginas internas**: cards de imóvel em **grid 2 colunas**, cada card com:
  - Foto principal (proporção 4:3, cantos arredondados).
  - Badge de status (Disponível/Vendido/Reservado) com a cor do site.
  - Título em negrito + endereço com ícone de pin.
  - Linha de specs: m², quartos, banheiros, vagas (ícones).
  - **Preço** em destaque (cor accent).
  - Tags de condições (Permuta, Financia, etc.) e diferenciais (Vista mar, Decorado).
  - Código do imóvel no rodapé do card.
- **Quebra de página automática** (`page-break-inside: avoid`) por card.
- **Rodapé** em cada página: nome do corretor + número da página + data de geração.
- Cores derivadas de `accent_color` (fallback navy padrão).
- Imagens convertidas para base64 (mesma técnica de `generatePropertyPdf.ts`) para embed offline.

### Detalhes técnicos

- Novo arquivo: **`src/utils/generateBrokerCatalogPdf.ts`** — função `generateBrokerCatalogPdf({ broker, properties, soldProperties, config, accentColor })`.
- Lazy import de `html2pdf.js` para não pesar o bundle.
- Reaproveita o helper `imageToBase64` (extrair para `src/utils/imageToBase64.ts` ou copiar inline).
- Em `BrokerSite.tsx`:
  - Adicionar estado `ratingModalOpen` + `avgRating` (busca rápida em `broker_ratings` por `broker_id`).
  - Importar `Dialog` de `@/components/ui/dialog` para o modal de avaliações.
  - Trocar a chamada de `handleGeneratePdf` para usar a nova função de catálogo.
  - Remover o bloco `<BrokerRatings ... />` inline (agora vive no modal).

### Arquivos afetados

- `src/pages/BrokerSite.tsx` (modal de avaliações, unificação dos botões de tabela, troca da função de PDF)
- `src/utils/generateBrokerCatalogPdf.ts` (novo — geração visual do catálogo)

