

## Personalização do perfil do corretor

Adicionar ao cadastro do corretor (página interna) duas novas opções de personalização da sua hotsite pública: **foto de perfil personalizada** e **cor de destaque** (com paleta pré-definida + seletor livre).

### O que será feito

**1. Banco de dados**
- Migration adicionando 2 colunas em `profiles`:
  - `avatar_url text` — URL da foto personalizada
  - `accent_color text` — cor hex de destaque (ex: `#2563eb`)

**2. Tela de cadastro/edição do corretor** (`src/pages/Brokers.tsx` — formulário de criar/editar corretor)
- Novo bloco **"Aparência da página pública"** contendo:
  - **Upload de foto de perfil**: preview circular + botão "Enviar foto" / "Trocar foto" / "Remover". Upload para o bucket `site-assets` na pasta `broker-avatars/`.
  - **Cor de destaque**: 8 swatches pré-definidos clicáveis (Azul, Índigo, Roxo, Rosa, Vermelho, Laranja, Verde, Turquesa) + input `type="color"` para cor livre + campo hex editável. O swatch selecionado fica com anel destacado.

**3. Aplicação na hotsite pública** (`src/pages/BrokerSite.tsx`)
- Se `profile.avatar_url` existir → renderizar `<img>` no lugar do avatar com iniciais "DD".
- Aplicar `profile.accent_color` ao gradiente dos 7 cards de métricas e ao botão "Gerar PDF" (substituindo o degradê azul fixo atual `from-sky-400 via-blue-600 to-indigo-800` por um gradiente derivado dinamicamente da cor escolhida via inline style).

### Paleta pré-definida

```text
Azul     #2563eb    Índigo   #4f46e5
Roxo     #7c3aed    Rosa     #db2777
Vermelho #dc2626    Laranja  #ea580c
Verde    #16a34a    Turquesa #0d9488
```

### Detalhes técnicos

- Bucket reutilizado: `site-assets` (já público, já configurado).
- Upload usa `supabase.storage.from("site-assets").upload("broker-avatars/{userId}-{ts}.{ext}")`.
- Gradiente dinâmico: `linear-gradient(135deg, {accent}99, {accent}, {accent}cc)` aplicado via `style={{ background: ... }}`.
- Fallback: se `accent_color` for null, mantém o azul atual.
- A foto e cor são editáveis apenas pelo dono do perfil ou Super Admin (RLS já existente em `profiles` cobre isso).

### Arquivos afetados

- `supabase/migrations/{timestamp}_broker_appearance.sql` (novo)
- `src/pages/Brokers.tsx` (formulário de cadastro/edição)
- `src/pages/BrokerSite.tsx` (aplicar avatar + cor dinâmica)

