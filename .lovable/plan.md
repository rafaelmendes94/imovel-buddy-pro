## Objetivo
Ao clicar em "Compartilhar" no modal de detalhes do imóvel, enviar apenas as informações do imóvel (fotos, vídeo, tour 360°, características, descrição, localização aproximada) — sem nome/telefone/email/foto do corretor. Para isso, criar uma página pública dedicada.

## Mudanças

### 1. Nova página pública `src/pages/ImovelPublico.tsx`
- Rota: `/imovel/:id` (acesso anônimo, sem AuthGuard).
- Busca o imóvel no Supabase pelo `id` (somente registros ativos/disponíveis — bloqueia vendidos com mensagem "Imóvel indisponível").
- Layout limpo com header simples (logo MV Broker Connect, sem corretor).
- Conteúdo exibido:
  - Galeria de fotos (com lightbox/navegação)
  - Vídeo do imóvel (YouTube embed)
  - Tour Virtual 360°
  - Título, preço, código
  - Endereço/cidade/bairro (sem CEP/número exato — só rua + bairro + cidade para preservar privacidade)
  - Quartos, banheiros, vagas, área, suítes
  - Características (vista mar, decorado, aceita permuta, etc.)
  - Descrição
  - Infraestrutura/comodidades do condomínio
  - Mini-mapa da localização (opcional, aproximada)
- **NÃO** exibe: nome do corretor, telefone, email, foto, WhatsApp, CRECI, botão "falar com corretor", links para painel.
- Botões: "Baixar fotos (PDF)" e "Compartilhar" (re-share do mesmo link público).
- SEO: title/description com dados do imóvel, og:image com a foto principal.

### 2. Registrar rota em `src/App.tsx`
Adicionar antes das rotas autenticadas:
```tsx
<Route path="/imovel/:id" element={<ImovelPublico />} />
```

### 3. Atualizar `handleShare` em `src/components/PropertyDetailModal.tsx`
Trocar `window.location.href` por URL pública:
```ts
const publicUrl = `${window.location.origin}/imovel/${property.id}`;
const text = `🏠 *${property.title}*\n💰 ${formatCurrency(property.price)}\n📍 ${property.address}, ${property.city}\n🛏 ${property.bedrooms} quartos • 🚿 ${property.bathrooms} banheiros • 📐 ${property.area}m²\n\n🔗 ${publicUrl}`;
window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
```
Também usar `navigator.share` quando disponível como fallback amigável.

## Detalhes técnicos
- A página pública usa o cliente Supabase com a anon key (já presente) e respeita as RLS atuais da tabela `properties`. Se hoje a leitura pública não estiver permitida, será necessário um policy `SELECT` para `anon` filtrando `status = 'available'` (criada via migration apenas se a query falhar para visitantes não logados — confirmo durante a build).
- A página é renderizada client-side; meta tags são definidas via `document.title` e `<meta>` injetado para preview em redes sociais (limitação: não há SSR, então og:image só funciona em crawlers que executam JS — aceitável no escopo atual).
- Nenhum dado do corretor é buscado ou exibido, eliminando qualquer vazamento.
