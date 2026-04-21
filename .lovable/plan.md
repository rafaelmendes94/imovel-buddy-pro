

## Suavizar carrossel de Últimas Vendas com loop infinito perfeito

Ajustes focados na seção "Últimas Vendas" da home (`Site.tsx`) para eliminar o bug de "card sumindo" no fim do loop e deixar a transição mais lenta e fluida.

### O que será feito

**1. Loop infinito sem salto (`src/pages/Site.tsx`)**

O problema atual: `translateX(0 → -50%)` assume que a 2ª metade duplicada começa exatamente no meio, mas o `gap-6` adiciona um espaço extra após o último card duplicado, fazendo a animação "pular" um card vazio antes de reiniciar.

Correção:
- Trocar a animação inline para usar `translateX(-50%)` aplicado a um wrapper que contém **dois blocos idênticos lado a lado** (já existe `[...sold, ...sold]`), mas garantindo que o wrapper inteiro tenha `width: max-content` e cada bloco interno também — assim o "ponto de loop" cai exatamente no meio sem o gap extra atrapalhar.
- Estrutura: container `flex w-max` → bloco A `flex gap-6` (com cards originais) + bloco B `flex gap-6 ml-6` (duplicata, com `ml-6` substituindo o gap "perdido" entre os dois blocos). O reset de `-50%` agora cai num frame visualmente idêntico ao início.

**2. Velocidade mais lenta + transição suave**

- Aumentar `animationDuration` de `soldProperties.length * 5s` para `soldProperties.length * 12s` (mais lento, contemplativo).
- Trocar `animation-timing-function: linear` por `cubic-bezier(0.45, 0, 0.55, 1)` no keyframe — movimento contínuo mas com micro-suavização nas bordas do ciclo, eliminando a sensação de "trava e reinicia".
- Adicionar `will-change: transform` para performance e `backface-visibility: hidden` para evitar flicker.
- Manter pausa no hover.

**3. Largura de card responsiva consistente**

- Trocar `w-[calc(25%-18px)]` por largura fixa em `rem` (ex.: `w-[300px] md:w-[340px]`) — assim o cálculo do loop não depende da largura do container, eliminando qualquer desalinhamento no momento do `translate -50%`.

### Resumo técnico

- `src/pages/Site.tsx`: reestruturar o JSX do carrossel "Últimas Vendas" (linhas 1328-1341) com wrapper duplo + larguras fixas + duração maior.
- `src/index.css`: ajustar keyframe `scroll` (timing-function suave + `will-change`).

### Arquivos afetados

- `src/pages/Site.tsx` (carrossel Últimas Vendas)
- `src/index.css` (keyframe `scroll`)

