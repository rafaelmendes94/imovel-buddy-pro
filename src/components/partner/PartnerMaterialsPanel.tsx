import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, FileText, Image, Megaphone, Save, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaGalleryUpload } from "@/components/MediaGalleryUpload";
import { toast } from "sonner";

type MaterialType = "catalog" | "home_banner" | "weekly_pdf";
type MaterialStatus = "draft" | "submitted" | "approved" | "changes_requested";

interface PartnerMaterial {
  id?: string;
  partner_id: string;
  material_type: MaterialType;
  title: string;
  description: string;
  cta_url: string;
  media_urls: string[];
  status: MaterialStatus;
  admin_notes: string;
  submitted_at?: string | null;
  reviewed_at?: string | null;
}

interface MaterialDefinition {
  type: MaterialType;
  title: string;
  description: string;
  module: string;
  icon: typeof Image;
  uploadLabel: string;
  multiple: boolean;
  kind: "image" | "file";
}

const MATERIALS: MaterialDefinition[] = [
  {
    type: "catalog",
    title: "Catálogo completo",
    description: "Conteúdo usado na página pública e no catálogo de parceiros.",
    module: "catalogo",
    icon: Image,
    uploadLabel: "Fotos, portfólio e materiais do catálogo",
    multiple: true,
    kind: "file",
  },
  {
    type: "home_banner",
    title: "Anúncio rotativo da home",
    description: "Arte horizontal exibida entre os anunciantes em destaque.",
    module: "destaque",
    icon: Megaphone,
    uploadLabel: "Arte do anúncio (recomendado 1600 x 650 px)",
    multiple: false,
    kind: "image",
  },
  {
    type: "weekly_pdf",
    title: "PDF semanal",
    description: "Oferta e arquivos destinados ao material enviado aos corretores.",
    module: "pdf_semanal",
    icon: FileText,
    uploadLabel: "Imagens, PDF e documentos da publicação",
    multiple: true,
    kind: "file",
  },
];

const STATUS: Record<MaterialStatus, { label: string; className: string; icon: typeof Clock3 }> = {
  draft: { label: "Rascunho", className: "bg-muted text-muted-foreground", icon: Clock3 },
  submitted: { label: "Em análise", className: "bg-amber-100 text-amber-800", icon: Clock3 },
  approved: { label: "Aprovado", className: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  changes_requested: { label: "Ajustes solicitados", className: "bg-red-100 text-red-700", icon: AlertCircle },
};

const blankMaterial = (partnerId: string, type: MaterialType): PartnerMaterial => ({
  partner_id: partnerId,
  material_type: type,
  title: "",
  description: "",
  cta_url: "",
  media_urls: [],
  status: "draft",
  admin_notes: "",
});

interface Props {
  partnerId: string;
  planModules: string[];
}

export function PartnerMaterialsPanel({ partnerId, planModules }: Props) {
  const [materials, setMaterials] = useState<Record<string, PartnerMaterial>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const available = useMemo(() => {
    const modules = new Set(planModules || []);
    return MATERIALS.filter((item) => modules.has(item.module));
  }, [planModules]);

  useEffect(() => {
    (supabase as any)
      .from("partner_materials")
      .select("*")
      .eq("partner_id", partnerId)
      .then(({ data, error }: any) => {
        if (error) {
          toast.error(`Erro ao carregar materiais: ${error.message}`);
          return;
        }
        setMaterials(Object.fromEntries((data || []).map((item: PartnerMaterial) => [item.material_type, item])));
      });
  }, [partnerId]);

  const valueFor = (type: MaterialType) => materials[type] || blankMaterial(partnerId, type);

  const patchMaterial = (type: MaterialType, patch: Partial<PartnerMaterial>) => {
    setMaterials((current) => ({ ...current, [type]: { ...valueFor(type), ...patch } }));
  };

  const persist = async (definition: MaterialDefinition, submit: boolean) => {
    const material = valueFor(definition.type);
    if (submit && (!material.title.trim() || material.media_urls.length === 0)) {
      toast.error("Preencha o título e envie pelo menos um arquivo antes de enviar para análise.");
      return;
    }

    setSaving(definition.type);
    const payload = {
      partner_id: partnerId,
      material_type: definition.type,
      title: material.title.trim(),
      description: material.description.trim(),
      cta_url: material.cta_url.trim(),
      media_urls: material.media_urls,
      status: submit ? "submitted" : "draft",
      submitted_at: submit ? new Date().toISOString() : material.submitted_at || null,
    };
    const { data, error } = await (supabase as any)
      .from("partner_materials")
      .upsert(payload, { onConflict: "partner_id,material_type" })
      .select("*")
      .single();
    setSaving(null);
    if (error) {
      toast.error(`Não foi possível salvar: ${error.message}`);
      return;
    }
    setMaterials((current) => ({ ...current, [definition.type]: data }));
    toast.success(submit ? "Material enviado para aprovação." : "Rascunho salvo.");
  };

  if (available.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Materiais de divulgação</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Seu plano atual inclui o perfil público. Recursos de catálogo, anúncio e PDF estão disponíveis nos demais planos.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">Materiais de divulgação</h2>
        <p className="text-sm text-muted-foreground">Envie cada material para aprovação. Alterações em conteúdo aprovado exigem uma nova análise.</p>
      </div>
      {available.map((definition) => {
        const material = valueFor(definition.type);
        const status = STATUS[material.status] || STATUS.draft;
        const StatusIcon = status.icon;
        const Icon = definition.icon;
        const isReviewing = material.status === "submitted";
        return (
          <Card key={definition.type}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div>
                  <div>
                    <CardTitle className="text-base">{definition.title}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">{definition.description}</p>
                  </div>
                </div>
                <Badge className={status.className}><StatusIcon className="mr-1 h-3 w-3" />{status.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {material.admin_notes && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <strong>Retorno da equipe:</strong> {material.admin_notes}
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Título da divulgação *</Label>
                  <Input value={material.title} disabled={isReviewing} onChange={(event) => patchMaterial(definition.type, { title: event.target.value })} />
                </div>
                <div>
                  <Label>Link do botão</Label>
                  <Input value={material.cta_url} disabled={isReviewing} onChange={(event) => patchMaterial(definition.type, { cta_url: event.target.value })} placeholder="https://..." />
                </div>
              </div>
              <div>
                <Label>Texto da divulgação</Label>
                <Textarea rows={3} value={material.description} disabled={isReviewing} onChange={(event) => patchMaterial(definition.type, { description: event.target.value })} />
              </div>
              {!isReviewing && (
                <MediaGalleryUpload
                  label={definition.uploadLabel}
                  values={material.media_urls}
                  onChange={(media_urls) => patchMaterial(definition.type, { media_urls })}
                  folder={`partners/${partnerId}/${definition.type}`}
                  kind={definition.kind}
                  multiple={definition.multiple}
                  allowUrl
                  reorderable={definition.multiple}
                  coverLabel="Principal"
                />
              )}
              {isReviewing && material.media_urls.length > 0 && (
                <p className="text-xs text-muted-foreground">{material.media_urls.length} arquivo(s) enviado(s). A edição será liberada após a análise.</p>
              )}
              <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                <Button variant="outline" disabled={isReviewing || saving === definition.type} onClick={() => persist(definition, false)}>
                  <Save className="mr-2 h-4 w-4" />Salvar rascunho
                </Button>
                <Button disabled={isReviewing || saving === definition.type} onClick={() => persist(definition, true)}>
                  <Send className="mr-2 h-4 w-4" />Enviar para aprovação
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
