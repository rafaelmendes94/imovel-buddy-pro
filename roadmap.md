# Roadmap

## Cadastro único de empreendimentos (corretor + central)
- [ ] Liberar leitura do catálogo (edificios, condominios, empreendimentos) para autenticados; escrita só dono/admin
- [ ] Serviço único `src/lib/empreendimentos.ts` (busca, salvar, obter por id)
- [ ] `EmpreendimentoFormDialog.tsx` com tipo obrigatório (edifício/condomínio/loteamento)
- [ ] `EmpreendimentoPicker.tsx` com autocomplete + criar novo + nenhum
- [ ] Usar picker em `BrokerImovelDialog.tsx` (vínculo por ID + nome para compatibilidade)
- [ ] Usar serviço/picker em `CadastroImovel.tsx` e páginas centrais
- [ ] Typecheck + validação no preview (desktop e mobile)
