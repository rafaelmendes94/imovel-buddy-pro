# Capa do imóvel + arrastar e soltar fotos

A primeira posição da galeria sempre será a capa, com uma flag visual **"📸 Foto de Capa"**. O corretor reordena as fotos arrastando e soltando.

## Mudanças

Tudo no bloco "Fotos do Imóvel" do `src/pages/CadastroImovel.tsx`. Sem dependências novas — uso HTML5 Drag & Drop nativo.

### Modelo unificado de fotos

Hoje existem duas listas separadas: `existingImages: string[]` (URLs já salvas) e `images: File[]` (novas). Para arrastar entre elas, unifico em uma lista única no render:

```ts
type Photo = { kind: 'existing'; url: string } | { kind: 'new'; file: File; preview: string };
```

- Mantenho os states atuais (`existingImages`, `images`, `imagePreviews`) para não quebrar o resto do código.
- Adiciono `photoOrder: Array<{ kind, idx }>` que define a ordem final exibida e salva.
- `handleImageChange` empilha novos arquivos no fim da ordem; remoção atualiza a ordem.

### Drag and drop

Cada card recebe `draggable`, `onDragStart`, `onDragOver`, `onDrop`. Um estado `draggingIndex` controla destaque visual do alvo. Solta-se em qualquer posição; mobile usa long-press do navegador (funciona em Chrome/Safari mobile recentes).

Botões "◀" e "▶" também aparecem em cada card para reordenar sem arrastar (acessibilidade + mobile garantido).

### Flag de capa

No card de índice 0 da ordem final:
- Borda em `border-primary` + ring sutil.
- Badge no canto superior esquerdo: `📸 Foto de Capa` com `bg-primary text-primary-foreground`.

Para fotos novas mantenho o badge "Nova" embaixo.

### Persistência

`onSubmit` monta `allImages` na ordem do `photoOrder`, intercalando URLs existentes e URLs recém-uploadadas. Salva em `imoveis.imagens` (mesma coluna já usada). Não muda schema.

### Onde os feeds e listagens pegam a capa

Hoje todo lugar usa `imagens[0]` como capa (Home, AllProperties, Site, feed XML que acabei de criar). Como a ordem do array passa a refletir a escolha do corretor, a capa aparece automaticamente certa em todos esses lugares — sem mudança extra.

## O que NÃO entra

- Reordenação não é replicada para `Edificios`, `Condominios`, `Empreendimentos` (focando só no cadastro de imóvel pedido). Se quiser depois, replica o mesmo padrão.
