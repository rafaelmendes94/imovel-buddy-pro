import { useState, useEffect } from "react";
import { BackButton } from "@/components/BackButton";
import { useSearchParams } from "react-router-dom";
import { SmartLayout } from "@/components/SmartLayout";
import {
  FileText, ScrollText, Receipt, CreditCard, FileSignature, ShieldCheck,
  Sparkles, Loader2, Download, Copy, ArrowLeft, ChevronRight, Pencil, Check, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Template {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  color: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
}

const templates: Template[] = [
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
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-contract`;

export default function Contratos() {
  const [searchParams] = useSearchParams();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");

  // Auto-select template and pre-fill fields from URL params
  useEffect(() => {
    const imovel = searchParams.get("imovel");
    const endereco = searchParams.get("endereco");
    const valor = searchParams.get("valor");
    const proprietario = searchParams.get("proprietario");
    const empreendimento = searchParams.get("empreendimento");
    const unidade = searchParams.get("unidade");
    const dormitorios = searchParams.get("dormitorios");
    const vagas = searchParams.get("vagas");
    const cidade = searchParams.get("cidade");

    if (imovel || endereco || valor || proprietario) {
      const compraVenda = templates.find(t => t.id === "compra-venda");
      if (compraVenda) {
        setSelectedTemplate(compraVenda);
        const prefill: Record<string, string> = {};
        if (imovel) prefill["Descrição do Imóvel"] = imovel;
        if (endereco) prefill["Endereço do Imóvel"] = endereco;
        if (valor) prefill["Valor da Venda"] = Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
        if (proprietario) prefill["Nome do Vendedor"] = proprietario;
        if (empreendimento) prefill["Empreendimento"] = empreendimento;
        if (unidade) prefill["Unidade"] = unidade;
        if (dormitorios) prefill["Dormitórios"] = dormitorios;
        if (vagas) prefill["Vagas de Garagem"] = vagas;
        if (cidade) prefill["Cidade"] = cidade;
        setFieldValues(prefill);
      }
    }
  }, [searchParams]);

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setFieldValues({});
    setGeneratedText("");
    setIsEditing(false);
    setEditText("");
  };

  const handleBack = () => {
    setSelectedTemplate(null);
    setFieldValues({});
    setGeneratedText("");
    setIsEditing(false);
    setEditText("");
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;

    const filledFields = Object.entries(fieldValues).filter(([_, v]) => v.trim());
    if (filledFields.length < 2) {
      toast.error("Preencha pelo menos 2 campos para gerar o documento");
      return;
    }

    setIsGenerating(true);
    setGeneratedText("");
    setIsEditing(false);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          templateType: selectedTemplate.id,
          fields: fieldValues,
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          toast.error("Limite de requisições excedido. Tente novamente em instantes.");
          setIsGenerating(false);
          return;
        }
        if (resp.status === 402) {
          toast.error("Créditos insuficientes para gerar o documento.");
          setIsGenerating(false);
          return;
        }
        throw new Error("Erro ao gerar documento");
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("Stream não disponível");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setGeneratedText(fullText);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      toast.success("Documento gerado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar o documento. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartEdit = () => {
    setEditText(generatedText);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setGeneratedText(editText);
    setIsEditing(false);
    toast.success("Documento atualizado!");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText("");
  };

  const currentText = isEditing ? editText : generatedText;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentText);
    toast.success("Documento copiado para a área de transferência!");
  };

  const handleDownload = () => {
    const blob = new Blob([currentText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTemplate?.title.replace(/\s+/g, "_").toLowerCase() || "documento"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Documento baixado!");
  };

  return (
    <SmartLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <BackButton />
        {/* Header */}
        <div className="flex items-center gap-3">
          {selectedTemplate && (
            <button onClick={handleBack} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {selectedTemplate ? selectedTemplate.title : "Contratos"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedTemplate
                ? "Preencha os dados e a IA gerará o documento completo"
                : "Modelos de contratos imobiliários com preenchimento inteligente por IA"}
            </p>
          </div>
        </div>

        {!selectedTemplate ? (
          /* Template Selection Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="elevated-card rounded-xl p-5 text-left hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${template.color} flex items-center justify-center flex-shrink-0`}>
                    <template.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground text-sm">
                        {template.title}
                      </h3>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {template.description}
                    </p>
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
        ) : (
          /* Template Form + Generated Document */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-4">
              <div className="elevated-card rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg ${selectedTemplate.color} flex items-center justify-center`}>
                    <selectedTemplate.icon className="w-4 h-4" />
                  </div>
                  <h2 className="font-semibold text-foreground text-sm">Dados do Documento</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedTemplate.fields.map((field) => (
                    <div key={field.key} className={field.key.includes("Descrição") || field.key.includes("Condições") || field.key.includes("Referente") ? "sm:col-span-2" : ""}>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        {field.label}
                      </Label>
                      <Input
                        type={field.type || "text"}
                        placeholder={field.placeholder}
                        value={fieldValues[field.key] || ""}
                        onChange={(e) =>
                          setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full mt-2"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Gerando documento...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gerar com IA
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Generated Document */}
            <div className="space-y-3">
              <div className="elevated-card rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    {isEditing ? "Editando Documento" : "Documento Gerado"}
                  </h3>
                  {generatedText && !isGenerating && (
                    <div className="flex items-center gap-1.5">
                      {isEditing ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="text-emerald-500 hover:text-emerald-400">
                            <Check className="w-3.5 h-3.5 mr-1" /> Salvar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="text-destructive hover:text-destructive/80">
                            <X className="w-3.5 h-3.5 mr-1" /> Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={handleStartEdit}>
                            <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCopy}>
                            <Copy className="w-3.5 h-3.5 mr-1" /> Copiar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleDownload}>
                            <Download className="w-3.5 h-3.5 mr-1" /> Baixar
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-5 min-h-[400px] max-h-[70vh] overflow-y-auto">
                  {isEditing ? (
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full h-full min-h-[380px] bg-transparent text-sm text-foreground font-sans leading-relaxed resize-none focus:outline-none border border-border rounded-lg p-3"
                    />
                  ) : generatedText ? (
                    <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                      {generatedText}
                      {isGenerating && (
                        <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
                      )}
                    </pre>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                      <Sparkles className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm font-medium">Preencha os dados e clique em "Gerar com IA"</p>
                      <p className="text-xs mt-1">O documento será gerado automaticamente aqui</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SmartLayout>
  );
}
