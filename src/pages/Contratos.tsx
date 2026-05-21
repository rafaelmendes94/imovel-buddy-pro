import { useState, useEffect } from "react";
import { BackButton } from "@/components/BackButton";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Sparkles, Loader2, ArrowLeft, Building2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { templates, ContractTemplate, TemplateGrid } from "@/components/contratos/ContractTemplates";
import { PropertySearchCombobox } from "@/components/contratos/PropertySearchCombobox";
import { DocumentViewer } from "@/components/contratos/DocumentViewer";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-contract`;

export default function Contratos() {
  const [searchParams] = useSearchParams();
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [fromUrlParams, setFromUrlParams] = useState(false);

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
      setFromUrlParams(true);
      const compraVenda = templates.find((t) => t.id === "compra-venda");
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

  const handleSelectTemplate = (template: ContractTemplate) => {
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
    setFromUrlParams(false);
  };

  const handlePropertySelect = (property: {
    titulo: string;
    endereco: string;
    cidade: string;
    preco: number;
    proprietario: string | null;
    empreendimento: string | null;
    unidade: string | null;
    quartos: number;
    vagas: number;
    bairro: string | null;
    descricao: string | null;
  }) => {
    const prefill: Record<string, string> = {};
    if (property.descricao) prefill["Descrição do Imóvel"] = property.descricao;
    else prefill["Descrição do Imóvel"] = property.titulo;
    prefill["Endereço do Imóvel"] = property.endereco;
    prefill["Valor da Venda"] = property.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    prefill["Valor de Venda Autorizado"] = property.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    if (property.proprietario) {
      prefill["Nome do Vendedor"] = property.proprietario;
      prefill["Nome do Proprietário"] = property.proprietario;
      prefill["Nome do Locador"] = property.proprietario;
    }
    if (property.empreendimento) prefill["Empreendimento"] = property.empreendimento;
    if (property.unidade) prefill["Unidade"] = property.unidade;
    if (property.quartos) prefill["Dormitórios"] = `${property.quartos} dormitório(s)`;
    if (property.vagas) prefill["Vagas de Garagem"] = `${property.vagas} vaga(s)`;
    if (property.cidade) prefill["Cidade"] = property.cidade;

    setFieldValues((prev) => ({ ...prev, ...prefill }));
    toast.success("Dados do imóvel preenchidos automaticamente!");
  };

  const handleGenerate = async (blank = false) => {
    if (!selectedTemplate) return;

    if (!blank) {
      const filledFields = Object.entries(fieldValues).filter(([_, v]) => v.trim());
      if (filledFields.length < 2) {
        toast.error("Preencha pelo menos 2 campos para gerar o documento");
        return;
      }
    }

    const BLANK = "_______________________________";
    const payloadFields = blank
      ? Object.fromEntries(selectedTemplate.fields.map((f) => [f.key, BLANK]))
      : fieldValues;


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
          fields: payloadFields,
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

  return (
    <AppLayout>
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
          <TemplateGrid onSelect={handleSelectTemplate} />
        ) : (
          <div className="space-y-6">
            {/* Property Search - only when not pre-filled from URL */}
            {!fromUrlParams && (
              <div className="elevated-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground text-sm">Selecionar Imóvel (opcional)</h2>
                </div>
                <PropertySearchCombobox onSelect={handlePropertySelect} />
              </div>
            )}

            {/* Form Fields */}
            <div className="elevated-card rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg ${selectedTemplate.color} flex items-center justify-center`}>
                  <selectedTemplate.icon className="w-4 h-4" />
                </div>
                <h2 className="font-semibold text-foreground text-sm">Dados do Documento</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedTemplate.fields.map((field) => (
                  <div
                    key={field.key}
                    className={
                      field.key.includes("Descrição") || field.key.includes("Condições") || field.key.includes("Referente")
                        ? "sm:col-span-2 lg:col-span-3"
                        : ""
                    }
                  >
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      {field.label}
                    </Label>
                    <Input
                      type={field.type || "text"}
                      placeholder={field.placeholder}
                      value={fieldValues[field.key] || ""}
                      onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <Button onClick={() => handleGenerate(false)} disabled={isGenerating} size="lg">
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleGenerate(true)}
                  disabled={isGenerating}
                  size="lg"
                  title="Gera o modelo com campos em branco para preencher e assinar manualmente"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Gerar em branco (preenchimento manual)
                </Button>
              </div>

            </div>

            {/* Document Viewer - Word-style A4 */}
            <DocumentViewer
              generatedText={generatedText}
              isGenerating={isGenerating}
              isEditing={isEditing}
              editText={editText}
              templateTitle={selectedTemplate.title}
              onStartEdit={() => {
                setEditText(generatedText);
                setIsEditing(true);
              }}
              onSaveEdit={() => {
                setGeneratedText(editText);
                setIsEditing(false);
                toast.success("Documento atualizado!");
              }}
              onCancelEdit={() => {
                setIsEditing(false);
                setEditText("");
              }}
              onEditChange={setEditText}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
