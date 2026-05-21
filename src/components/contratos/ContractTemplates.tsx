import {
  FileText, ScrollText, Receipt, CreditCard, FileSignature, ShieldCheck,
  Sparkles, ChevronRight,
} from "lucide-react";

export interface ContractTemplate {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  color: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
}

export const templates: ContractTemplate[] = [
  {
    id: "compra-venda",
    title: "Contrato de Compra e Venda",
    description: "Contrato completo para venda de imóvel com todas as cláusulas legais",
    icon: FileSignature,
    color: "text-blue-500 bg-blue-500/10",
    fields: [
      { key: "Nome do Vendedor", label: "Vendedor (Nome completo)", placeholder: "João da Silva" },
      { key: "CPF do Vendedor", label: "CPF do Vendedor", placeholder: "000.000.000-00" },
      { key: "Endereço do Vendedor", label: "Endereço do Vendedor", placeholder: "Rua..." },
      { key: "Nome do Comprador", label: "Comprador (Nome completo)", placeholder: "Maria Santos" },
      { key: "CPF do Comprador", label: "CPF do Comprador", placeholder: "000.000.000-00" },
      { key: "Endereço do Comprador", label: "Endereço do Comprador", placeholder: "Rua..." },
      { key: "Empreendimento", label: "Empreendimento", placeholder: "Ed. Atlântico" },
      { key: "Descrição do Imóvel", label: "Descrição do Imóvel", placeholder: "Apartamento 302, Ed. Atlântico..." },
      { key: "Unidade", label: "Unidade (Apto / Quadra / Lote)", placeholder: "Apto 302 / Quadra 5 / Lote 12" },
      { key: "Dormitórios", label: "Dormitórios", placeholder: "3 dormitórios (1 suíte)" },
      { key: "Vagas de Garagem", label: "Nº de Vagas e Identificação", placeholder: "2 vagas (V-15 e V-16)" },
      { key: "Endereço do Imóvel", label: "Endereço do Imóvel", placeholder: "Av. Beira Mar, 1200" },
      { key: "Matrícula do Imóvel", label: "Matrícula no Registro de Imóveis", placeholder: "Matrícula nº 12345" },
      { key: "Valor da Venda", label: "Valor da Venda (R$)", placeholder: "950.000,00" },
      { key: "Forma de Pagamento", label: "Forma de Pagamento", placeholder: "48x parcelas de R$ 19.791,67" },
      { key: "Cidade", label: "Cidade/Estado", placeholder: "Capão da Canoa/RS" },
    ],
  },
  {
    id: "locacao",
    title: "Contrato de Locação",
    description: "Contrato de aluguel conforme Lei do Inquilinato (Lei 8.245/91)",
    icon: ScrollText,
    color: "text-emerald-500 bg-emerald-500/10",
    fields: [
      { key: "Nome do Locador", label: "Locador (Proprietário)", placeholder: "João da Silva" },
      { key: "CPF do Locador", label: "CPF do Locador", placeholder: "000.000.000-00" },
      { key: "Nome do Locatário", label: "Locatário (Inquilino)", placeholder: "Maria Santos" },
      { key: "CPF do Locatário", label: "CPF do Locatário", placeholder: "000.000.000-00" },
      { key: "Descrição do Imóvel", label: "Descrição do Imóvel", placeholder: "Apartamento 302..." },
      { key: "Endereço do Imóvel", label: "Endereço do Imóvel", placeholder: "Av. Beira Mar, 1200" },
      { key: "Valor do Aluguel", label: "Valor do Aluguel (R$)", placeholder: "2.500,00" },
      { key: "Prazo do Contrato", label: "Prazo do Contrato", placeholder: "30 meses" },
      { key: "Data de Início", label: "Data de Início", placeholder: "01/04/2026", type: "text" },
      { key: "Garantia", label: "Tipo de Garantia", placeholder: "Caução de 3 aluguéis / Fiador / Seguro" },
      { key: "Cidade", label: "Cidade/Estado", placeholder: "Capão da Canoa/RS" },
    ],
  },
  {
    id: "recibo",
    title: "Recibo de Pagamento",
    description: "Recibo oficial de pagamento com valor por extenso",
    icon: Receipt,
    color: "text-amber-500 bg-amber-500/10",
    fields: [
      { key: "Nome de quem recebeu", label: "Recebido por (Nome)", placeholder: "João da Silva" },
      { key: "CPF de quem recebeu", label: "CPF de quem recebeu", placeholder: "000.000.000-00" },
      { key: "Nome de quem pagou", label: "Pago por (Nome)", placeholder: "Maria Santos" },
      { key: "CPF de quem pagou", label: "CPF de quem pagou", placeholder: "000.000.000-00" },
      { key: "Valor", label: "Valor (R$)", placeholder: "5.000,00" },
      { key: "Referente a", label: "Referente a", placeholder: "Sinal do Apartamento 302, Ed. Atlântico" },
      { key: "Cidade", label: "Cidade/Estado", placeholder: "Capão da Canoa/RS" },
      { key: "Data", label: "Data", placeholder: "27/03/2026", type: "text" },
    ],
  },
  {
    id: "nota-promissoria",
    title: "Nota Promissória",
    description: "Nota promissória conforme padrão legal brasileiro",
    icon: CreditCard,
    color: "text-purple-500 bg-purple-500/10",
    fields: [
      { key: "Número da Nota", label: "Nº da Nota Promissória", placeholder: "001/012" },
      { key: "Valor", label: "Valor (R$)", placeholder: "19.791,67" },
      { key: "Data de Vencimento", label: "Data de Vencimento", placeholder: "01/05/2026", type: "text" },
      { key: "Nome do Emitente (Devedor)", label: "Emitente / Devedor", placeholder: "Maria Santos" },
      { key: "CPF do Emitente", label: "CPF do Emitente", placeholder: "000.000.000-00" },
      { key: "Endereço do Emitente", label: "Endereço do Emitente", placeholder: "Rua..." },
      { key: "Nome do Beneficiário (Credor)", label: "Beneficiário / Credor", placeholder: "João da Silva" },
      { key: "CPF do Beneficiário", label: "CPF do Beneficiário", placeholder: "000.000.000-00" },
      { key: "Praça de Pagamento", label: "Praça de Pagamento", placeholder: "Capão da Canoa/RS" },
      { key: "Data de Emissão", label: "Data de Emissão", placeholder: "27/03/2026", type: "text" },
    ],
  },
  {
    id: "distrato",
    title: "Distrato / Rescisão",
    description: "Termo de rescisão contratual com quitação mútua",
    icon: FileText,
    color: "text-red-500 bg-red-500/10",
    fields: [
      { key: "Referência ao Contrato Original", label: "Contrato Original (Nº/Data)", placeholder: "Contrato de 15/01/2026" },
      { key: "Nome da Parte 1", label: "Parte 1 (Nome)", placeholder: "João da Silva" },
      { key: "CPF da Parte 1", label: "CPF Parte 1", placeholder: "000.000.000-00" },
      { key: "Nome da Parte 2", label: "Parte 2 (Nome)", placeholder: "Maria Santos" },
      { key: "CPF da Parte 2", label: "CPF Parte 2", placeholder: "000.000.000-00" },
      { key: "Descrição do Imóvel", label: "Imóvel Objeto do Contrato", placeholder: "Apartamento 302..." },
      { key: "Motivo da Rescisão", label: "Motivo da Rescisão", placeholder: "Acordo mútuo entre as partes" },
      { key: "Condições de Devolução", label: "Condições (Devolução de valores, etc.)", placeholder: "Devolução de R$ 50.000,00 em 30 dias" },
      { key: "Cidade", label: "Cidade/Estado", placeholder: "Capão da Canoa/RS" },
    ],
  },
  {
    id: "autorizacao-venda",
    title: "Autorização de Venda",
    description: "Termo de exclusividade e autorização para comercialização",
    icon: ShieldCheck,
    color: "text-teal-500 bg-teal-500/10",
    fields: [
      { key: "Nome do Proprietário", label: "Proprietário (Nome)", placeholder: "João da Silva" },
      { key: "CPF do Proprietário", label: "CPF do Proprietário", placeholder: "000.000.000-00" },
      { key: "Descrição do Imóvel", label: "Descrição do Imóvel", placeholder: "Apartamento 302, 3 quartos..." },
      { key: "Endereço do Imóvel", label: "Endereço do Imóvel", placeholder: "Av. Beira Mar, 1200" },
      { key: "Valor de Venda Autorizado", label: "Valor de Venda (R$)", placeholder: "950.000,00" },
      { key: "Comissão", label: "Comissão (%)", placeholder: "6%" },
      { key: "Nome da Imobiliária/Corretor", label: "Imobiliária / Corretor", placeholder: "ImobCRM - Carlos Silva" },
      { key: "CRECI", label: "CRECI", placeholder: "123456-RS" },
      { key: "Prazo de Validade", label: "Prazo de Validade", placeholder: "90 dias" },
      { key: "Cidade", label: "Cidade/Estado", placeholder: "Capão da Canoa/RS" },
    ],
  },
  {
    id: "exclusividade-simplificada",
    title: "Exclusividade Simplificada",
    description: "Modelo enxuto de exclusividade que libera a divulgação do imóvel para mais de 2.000 corretores da rede",
    icon: Sparkles,
    color: "text-indigo-500 bg-indigo-500/10",
    fields: [
      { key: "Nome do Proprietário", label: "Proprietário (Nome completo)", placeholder: "João da Silva" },
      { key: "CPF do Proprietário", label: "CPF do Proprietário", placeholder: "000.000.000-00" },
      { key: "Telefone do Proprietário", label: "Telefone do Proprietário", placeholder: "(51) 99999-0000" },
      { key: "Descrição do Imóvel", label: "Descrição do Imóvel", placeholder: "Apartamento 302, 3 quartos..." },
      { key: "Endereço do Imóvel", label: "Endereço do Imóvel", placeholder: "Av. Beira Mar, 1200" },
      { key: "Valor de Venda Autorizado", label: "Valor de Venda (R$)", placeholder: "950.000,00" },
      { key: "Comissão", label: "Comissão (%)", placeholder: "6%" },
      { key: "Nome do Corretor/Imobiliária", label: "Corretor / Imobiliária Responsável", placeholder: "MV Broker Connect - Carlos Silva" },
      { key: "CRECI", label: "CRECI", placeholder: "123456-RS" },
      { key: "Prazo de Validade", label: "Prazo de Exclusividade", placeholder: "90 dias" },
      { key: "Cidade", label: "Cidade/Estado", placeholder: "Capão da Canoa/RS" },
    ],
  },
  {
    id: "exclusividade-completa",
    title: "Exclusividade Completa (Detalhada)",
    description: "Modelo detalhado de exclusividade com cláusulas estendidas e divulgação para +2.000 corretores da rede",
    icon: ShieldCheck,
    color: "text-fuchsia-500 bg-fuchsia-500/10",
    fields: [
      { key: "Nome do Proprietário", label: "Proprietário (Nome completo)", placeholder: "João da Silva" },
      { key: "CPF do Proprietário", label: "CPF do Proprietário", placeholder: "000.000.000-00" },
      { key: "RG do Proprietário", label: "RG do Proprietário", placeholder: "1234567 SSP/RS" },
      { key: "Endereço do Proprietário", label: "Endereço do Proprietário", placeholder: "Rua das Flores, 123" },
      { key: "Telefone do Proprietário", label: "Telefone do Proprietário", placeholder: "(51) 99999-0000" },
      { key: "E-mail do Proprietário", label: "E-mail do Proprietário", placeholder: "proprietario@email.com" },
      { key: "Descrição do Imóvel", label: "Descrição do Imóvel", placeholder: "Apartamento 302, 3 quartos..." },
      { key: "Endereço do Imóvel", label: "Endereço do Imóvel", placeholder: "Av. Beira Mar, 1200" },
      { key: "Matrícula do Imóvel", label: "Matrícula/Registro do Imóvel", placeholder: "Matrícula nº 12345" },
      { key: "Valor de Venda Autorizado", label: "Valor de Venda (R$)", placeholder: "950.000,00" },
      { key: "Comissão", label: "Comissão (%)", placeholder: "6%" },
      { key: "Nome do Corretor/Imobiliária", label: "Corretor / Imobiliária Responsável", placeholder: "MV Broker Connect - Carlos Silva" },
      { key: "CRECI", label: "CRECI", placeholder: "123456-RS" },
      { key: "CNPJ da Imobiliária", label: "CNPJ da Imobiliária", placeholder: "00.000.000/0001-00" },
      { key: "Prazo de Validade", label: "Prazo de Exclusividade", placeholder: "180 dias" },
      { key: "Multa por Descumprimento", label: "Multa por Descumprimento (%)", placeholder: "100% da comissão" },
      { key: "Cidade", label: "Cidade/Estado", placeholder: "Capão da Canoa/RS" },
    ],
  },
];

interface TemplateGridProps {
  onSelect: (template: ContractTemplate) => void;
}

export function TemplateGrid({ onSelect }: TemplateGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template)}
          className="elevated-card rounded-xl p-5 text-left hover:border-primary/30 transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl ${template.color} flex items-center justify-center flex-shrink-0`}>
              <template.icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-sm">{template.title}</h3>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
              <div className="flex items-center gap-1.5 mt-3">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                  Preenchimento por IA
                </span>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
