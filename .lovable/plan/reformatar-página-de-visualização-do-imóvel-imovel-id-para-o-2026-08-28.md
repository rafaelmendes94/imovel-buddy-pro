# Reformatar página de visualização do imóvel (/imovel/:id) para o novo modelo

Objetivo: alterar o layout de `src/pages/ImovelPublico.tsx` para seguir o mockup enviado (media hero em estilo player de vídeo, faixa de miniaturas, conteúdo em coluna única, grade de downloads, barra inferior de recursos), mantendo os dados e ações já existentes.

## Estrutura da nova página (de cima para baixo)

1. **Barra superior**
   - Esquerda: "Voltar para Imóveis".
   - Direita: Compartilhar, WhatsApp e "Editar imóvel" (visível apenas para corretor dono/admin, com mesma lógica atual de permissão).

2. **Hero de mídia (estilo player)**
   - Área grande 16:9: se houver vídeo, badge "Vídeo do Imóvel" no canto superior esquerdo e botão de play central que inicia o vídeo (YouTube/Vídeo do cadastro) dentro da própria área; sem vídeo, exibe a foto atual da galeria.
   - Canto superior direito: contador "1/18" (foto atual/total).
   - Setas laterais para navegar as fotos.
   - Barra inferior do player com tempo (quando vídeo), volume e tela cheia; na versão fotos, mostra apenas tela cheia (abre lightbox).

3. **Faixa de miniaturas**
   - Carrossel horizontal de thumbs com setas laterais; thumb ativa com borda destacada; clique troca a mídia do hero.

4. **Cabeçalho do imóvel**
   - Breadcrumb: Início / Imóveis / Tipo / Condomínio-Empreendimento.
   - Badge de status ("À Venda"), título, endereço com ícone de pin.
   - Preço em destaque + linha secundária com Condomínio e IPTU (quando houver).
   - Linha de 5 stats com ícones: Suítes, Banheiros, Vagas, Área construída, Área do terreno.
   - Dois botões lado a lado: "Falar com Corretor" (WhatsApp) e "Agendar Visita".

5. **Downloads e Materiais** (só renderiza os itens existentes)
   - Grade de cartões: Baixar Todas as Fotos (ZIP), Vídeo do Imóvel (MP4), Tour 360°, Documentação (PDF), Plantas (PDF), Catálogo do Imóvel (PDF gerado).
   - Cartão "Abrir Pasta no Google Drive" quando houver link do Drive.

6. **Linha de 3 colunas** (empilha no mobile)
   - Sobre o Imóvel (descrição + checklist de amenidades com checks).
   - Características (ficha técnica: código, tipo, status, áreas, quartos/suítes, banheiros, vagas, ano, aceita permuta).
   - Tour 360° com imagem de capa e botão "Abrir Tour 360°" (quando houver link).

7. **Localização**
   - Mapa estático/mini-mapa + endereço completo + botão "Ver no Google Maps".

8. **Barra inferior de recursos (fixa, escura)**
   - Galeria de Fotos, Vídeo do Imóvel, Tour 360°, Plantas, Documentação, Abrir no Drive, Compartilhar — com estado "Disponível/Não informado" e rolagem/ação ao clicar.
   - No mobile, mantém os CTAs principais acessíveis (barra fixa com Falar com Corretor/Visita já existente, integrada ao novo design).

## Notas técnicas

- Reescrever o JSX de `src/pages/ImovelPublico.tsx` para o layout em coluna única (remover painel lateral sticky atual), reaproveitando toda a lógica de dados (fetch do imóvel, corretor, tracking de view, SEO/Open Graph, PDF, lightbox).
- Responsivo: hero 16:9 no desktop e ~4:3 no mobile, stats em grade 3+2, colunas empilhadas, safe-area na barra inferior.
- Player de vídeo: YouTube embed quando `video_url` for YouTube; caso contrário `<video>` nativo para MP4. Estado local controla play/pausa e troca foto↔vídeo.
- Manter tokens semânticos do design system (sem cores hardcoded); a barra inferior escura usa token de foreground/background existente.
- Verificação: `tsgo` typecheck + teste no preview (desktop e mobile) em um imóvel real.
