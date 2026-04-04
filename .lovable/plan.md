

# Plano: Otimizar layout mobile dos cards de métricas e contagem

## Problema
Os badges de VGV e os cards de contagem (Imóveis, Atualizados, Atenção, Desatualizados) estão transbordando para fora da tela em dispositivos móveis (384px viewport).

## Mudanças

### 1. Badges VGV (linhas 526-569)
- Trocar `flex-wrap` por `grid grid-cols-2` no mobile para os 4 badges ficarem em 2x2
- Garantir que cada badge tenha `min-w-0` e `overflow-hidden` para textos longos
- Truncar valores muito longos com `truncate`

### 2. Cards de Freshness/Contagem (linhas 603-669)
- Mudar de `grid-cols-4` fixo para `grid-cols-2 sm:grid-cols-4` — 2 colunas no mobile, 4 no desktop
- Reduzir padding interno no mobile
- Ocultar o ícone grande no mobile para liberar espaço horizontal

### Arquivos alterados
- `src/pages/Properties.tsx` — seção de badges VGV e seção de freshness cards

