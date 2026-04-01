

## Plano: Formulário de Imóvel com Seleção Rápida + Acesso Super Admin

### Problema Atual
- Campos numéricos (Dormitórios, Banheiros, Vagas, Elevadores) usam `<input type="number">`, exigindo digitação
- Campos como Tipo, Status, Condição, Padrão usam `<Select>` dropdown, exigindo 2 cliques (abrir + selecionar)
- O super admin já pode acessar as rotas de cadastro/edição, mas a experiência não é otimizada

### O Que Será Feito

**1. Componente QuickPick (novo)**
Botões inline clicáveis para seleção em 1 clique. Dois modos:
- **Numérico**: botões `0, 1, 2, 3, 4, 5+` exibidos lado a lado
- **Opções**: botões com labels (ex: "Apartamento", "Casa", etc.)

Substitui os campos:
- Dormitórios → botões `0 1 2 3 4 5+`
- Banheiros → botões `0 1 2 3 4 5+`
- Vagas → botões `0 1 2 3 4+`
- Elevadores → botões `0 1 2 3+`
- Tipo do Imóvel → botões inline com cada tipo
- Status → botões inline
- Condição → botões inline
- Padrão → botões inline
- Tipo do Proprietário → botões inline
- Posição Solar → botões inline (Nascente, Poente, Norte, Sul)
- Posição no Prédio → botões inline (Frente, Fundos, Lateral)

**2. Acesso Super Admin**
- As rotas `/cadastro-imovel` e `/editar-imovel/:id` já estão acessíveis via AuthGuard
- A RLS já permite super_admin fazer SELECT, UPDATE e DELETE em qualquer imóvel
- INSERT funciona porque o super_admin insere com seu próprio user_id
- Nenhuma mudança de rota ou banco necessária

### Arquivos Modificados
- `src/pages/CadastroImovel.tsx` — substituir inputs/selects por QuickPick buttons inline, reorganizar layout para fluidez

### Resultado Visual

```text
Dormitórios:  [0] [1] [2] [3] [4] [5+]
Banheiros:    [0] [1] [2] [3] [4] [5+]
Vagas:        [0] [1] [2] [3] [4+]

Tipo:  [Apartamento] [Casa] [Comercial] [Terreno] [Lote] [Condomínio]
Status: [Disponível] [Vendido] [Reservado] [Alugado] [Suspenso]
```

Cada botão selecionado fica com `bg-primary text-primary-foreground`, os demais ficam `bg-muted`. Seleção em 1 clique, sem dropdown.

