import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, FileText, Image, Megaphone, PencilLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ReviewMaterial {
  id: string;
  material_type: "catalog" | "home_banner" | "weekly_pdf";
  title: string;
  description: string;
  cta_url: string;
  media_urls: string[];
  submitted_at: string | null;
  partners?: { name: string; slug: string } | null;
}

const META = {
  catalog: { label: "Catálogo", icon: Image },
  home_banner: { label: "Anúncio da home", icon: Megaphone },
  weekly_pdf: { label: "PDF semanal", icon: FileText },
};

export function AdminPartnerMaterialsQueue() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<ReviewMaterial[]>([]);
  const [selected, setSelected] = useState<ReviewMaterial | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await (supabase as any)
      .from("partner_materials")
      .select("*,partners(name,slug)")
      .eq("status", "submitted")
      .order("submitted_at", { ascending: true });
    if (error) {
      toast.error(`Erro ao carregar aprovações: ${error.message}`);
      return;
    }
    setMaterials(data || []);
  };

  useEffect(() => { load(); }, []);

  const review = async (approved: boolean) => {
    if (!selected) return;
    if (!approved && !notes.trim()) {
      toast.error("Informe quais ajustes o parceiro precisa fazer.");
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any)
      .from("partner_materials")
      .update({
        status: approved ? "approved" : "changes_requested",
        admin_notes: approved ? notes.trim() : notes.trim(),
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id || null,
      })
      .eq("id", selected.id);
    setSaving(false);
    if (error) {
      toast.error(`Não foi possível concluir a análise: ${error.message}`);
      return;
    }
    toast.success(approved ? "Material aprovado e liberado." : "Material devolvido para ajustes.");
    setSelected(null);
    setNotes("");
    await load();
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Materiais aguardando aprovação</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Anúncios e conteúdos enviados pelos parceiros.</p>
            </div>
            <Badge variant={materials.length ? "default" : "secondary"}>{materials.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <p className="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground">Nenhum material pendente.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {materials.map((material) => {
                const meta = META[material.material_type];
                const Icon = meta.icon;
                return (
                  <button
                    key={material.id}
                    type="button"
                    onClick={() => { setSelected(material); setNotes(""); }}
                    className="flex items-start gap-3 rounded-md border p-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="rounded-md bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{material.partners?.name || "Parceiro"}</p>
                      <p className="text-xs text-muted-foreground">{meta.label} · {material.media_urls?.length || 0} arquivo(s)</p>
                      <p className="mt-1 truncate text-xs">{material.title}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle>Analisar {META[selected.material_type].label}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Parceiro</p>
                  <p className="font-bold">{selected.partners?.name}</p>
                  <p className="mt-2 text-sm font-semibold">{selected.title}</p>
                  {selected.description && <p className="mt-1 text-sm text-muted-foreground">{selected.description}</p>}
                  {selected.cta_url && <a href={selected.cta_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">Abrir link <ExternalLink className="h-3 w-3" /></a>}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {(selected.media_urls || []).map((url) => {
                    const isImage = /\.(jpg|jpeg|png|webp|gif|avif)($|\?)/i.test(url) || url.includes("imagedelivery.net");
                    return (
                      <a key={url} href={url} target="_blank" rel="noreferrer" className="flex aspect-square items-center justify-center overflow-hidden rounded-md border bg-muted">
                        {isImage ? <img src={url} alt="" className="h-full w-full object-cover" /> : <FileText className="h-8 w-8 text-muted-foreground" />}
                      </a>
                    );
                  })}
                </div>
                <div>
                  <Label>Observação para o parceiro</Label>
                  <Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Obrigatória quando solicitar ajustes" />
                </div>
                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button variant="outline" disabled={saving} onClick={() => review(false)}><PencilLine className="mr-2 h-4 w-4" />Solicitar ajustes</Button>
                  <Button disabled={saving} onClick={() => review(true)}><CheckCircle2 className="mr-2 h-4 w-4" />Aprovar material</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
