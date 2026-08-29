import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  FileDown, Image as ImageIcon, Loader2, Save, Share2, LayoutTemplate,
  ListOrdered, Settings2, Eye, Trash2, RefreshCw, FolderOpen,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PropertySelector } from "@/components/tabela/PropertySelector";
import { SelectedProperties } from "@/components/tabela/SelectedProperties";
import { TemplateSelector } from "@/components/tabela/TemplateSelector";
import { TableSettings } from "@/components/tabela/TableSettings";
import { TablePreview } from "@/components/tabela/TablePreview";
import { fetchTabelaImoveis, type TabelaCorretor, type TabelaImovel } from "@/lib/tabelaData";
import { defaultSettings, getFormat, getTemplate, type TableSettingsState } from "@/lib/tabelaTemplates";
import { exportTableImages, exportTablePdf, fileBaseName } from "@/utils/exportTable";
import type { Palette } from "@/lib/tabelaPalettes";

interface SavedTable {
  id: string;
  nome: string;
  titulo: string;
  subtitulo: string | null;
  template: string;
  formato: string;
  property_ids: string[];
  settings: any;
  updated_at: string;
}

export default function GeradorTabela() {
  const { user } = useAuth();
  const [imoveis, setImoveis] = useState<TabelaImovel[]>([]);
  const [corretores, setCorretores] = useState<TabelaCorretor[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [companyPalette, setCompanyPalette] = useState<Palette | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<TableSettingsState>(defaultSettings());
  const [exporting, setExporting] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedTable[]>([]);
  const [savingTable, setSavingTable] = useState(false);

  const previewWrap = useRef<HTMLDivElement>(null);
  const previewInner = useRef<HTMLDivElement>(null);
  const [wrapWidth, setWrapWidth] = useState(0);

  /* ---------------- dados reais ---------------- */
  const loadData = useCallback(async () => {
    setLoading(true);
    const [props, brokers, config] = await Promise.all([
      fetchTabelaImoveis(),
      (supabase.from("corretores") as any)
        .select("id, nome, telefone, creci, foto_url")
        .eq("ativo", true)
        .order("nome"),
      (supabase.from("site_config") as any)
        .select("logo_url, header_color, accent_color, footer_color, title_color")
        .limit(1),
    ]);
    setImoveis(props);
    setCorretores((brokers?.data as TabelaCorretor[]) || []);
    const cfg = config?.data?.[0];
    setLogoUrl(cfg?.logo_url || null);
    setCompanyPalette(
      cfg?.header_color
        ? {
            id: "minha-imobiliaria",
            name: "Minha imobiliária",
            principal: cfg.header_color,
            secundaria: cfg.footer_color || cfg.header_color,
            destaque: cfg.accent_color || "#D6A23A",
            fundo: "#FFFFFF",
            texto: cfg.title_color || "#10233F",
          }
        : null
    );
    setLoading(false);
  }, []);

  const loadSaved = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase.from("tabela_apresentacoes") as any)
      .select("*")
      .order("updated_at", { ascending: false });
    setSaved((data as SavedTable[]) || []);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadSaved(); }, [loadSaved]);

  useEffect(() => {
    const el = previewWrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWrapWidth(el.clientWidth));
    ro.observe(el);
    setWrapWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  /* ---------------- seleção e ordem ---------------- */
  const selectedItems = useMemo(
    () => selectedIds.map(id => imoveis.find(i => i.id === id)).filter((p): p is TabelaImovel => !!p),
    [selectedIds, imoveis]
  );

  const toggle = (id: string) =>
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const reorder = (from: number, to: number) =>
    setSelectedIds(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  const patch = (p: Partial<TableSettingsState>) => setSettings(s => ({ ...s, ...p }));

  /* ---------------- exportação ---------------- */
  const pageNodes = () =>
    Array.from(previewInner.current?.querySelectorAll<HTMLElement>("[data-table-page]") || []);

  const withRealSize = async <T,>(fn: (pages: HTMLElement[]) => Promise<T>): Promise<T> => {
    const inner = previewInner.current?.firstElementChild as HTMLElement | undefined;
    const prev = inner?.style.transform;
    if (inner) inner.style.transform = "scale(1)";
    try {
      await new Promise(r => setTimeout(r, 120));
      return await fn(pageNodes());
    } finally {
      if (inner && prev !== undefined) inner.style.transform = prev;
    }
  };

  const handlePdf = async () => {
    if (selectedItems.length === 0) return toast.error("Selecione ao menos um imóvel");
    setExporting("pdf");
    try {
      await withRealSize(pages =>
        exportTablePdf(pages, getFormat(settings.formato), settings.palette.fundo, fileBaseName(settings.titulo))
      );
      toast.success("PDF gerado com links clicáveis!");
    } catch (e: any) {
      toast.error("Erro ao gerar PDF: " + (e?.message || "tente novamente"));
    } finally {
      setExporting(null);
    }
  };

  const handleImage = async (type: "png" | "jpg") => {
    if (selectedItems.length === 0) return toast.error("Selecione ao menos um imóvel");
    setExporting(type);
    try {
      await withRealSize(pages =>
        exportTableImages(pages, settings.palette.fundo, fileBaseName(settings.titulo), type)
      );
      toast.success(`Imagem ${type.toUpperCase()} gerada!`);
    } catch (e: any) {
      toast.error("Erro ao gerar imagem: " + (e?.message || "tente novamente"));
    } finally {
      setExporting(null);
    }
  };

  const shareWhatsApp = () => {
    const lines = [
      `*${settings.titulo}*`,
      settings.subtitulo,
      "",
      ...selectedItems.map(p => `• ${p.titulo}${p.unidade ? ` — Apto ${p.unidade}` : ""} — ${window.location.origin}/imovel/${p.id}`),
    ].filter(Boolean);
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  };

  /* ---------------- salvar / carregar ---------------- */
  const saveTable = async () => {
    if (!user) return toast.error("Faça login para salvar");
    if (!saveName.trim()) return toast.error("Dê um nome para a apresentação");
    setSavingTable(true);
    const payload = {
      user_id: user.id,
      nome: saveName.trim(),
      titulo: settings.titulo,
      subtitulo: settings.subtitulo || null,
      template: settings.template,
      formato: settings.formato,
      property_ids: selectedIds,
      settings,
    };
    const q = savedId
      ? (supabase.from("tabela_apresentacoes") as any).update(payload).eq("id", savedId)
      : (supabase.from("tabela_apresentacoes") as any).insert(payload);
    const { error } = await q;
    setSavingTable(false);
    if (error) return toast.error("Erro ao salvar: " + error.message);
    toast.success("Apresentação salva!");
    setSaveOpen(false);
    loadSaved();
  };

  const openSaved = (t: SavedTable) => {
    setSavedId(t.id);
    setSaveName(t.nome);
    setSettings({ ...defaultSettings(), ...(t.settings || {}) });
    // imóveis são recarregados do banco: dados sempre atualizados
    setSelectedIds((t.property_ids || []).filter(id => imoveis.some(i => i.id === id)));
    toast.success(`"${t.nome}" carregada com os dados atualizados`);
  };

  const deleteSaved = async (id: string) => {
    if (!confirm("Excluir esta apresentação salva?")) return;
    const { error } = await (supabase.from("tabela_apresentacoes") as any).delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir");
    if (savedId === id) setSavedId(null);
    setSaved(s => s.filter(t => t.id !== id));
    toast.success("Apresentação excluída");
  };

  const Step = ({ n, icon, title, children }: { n: number; icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <section className="elevated-card rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{n}</span>
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">{icon} {title}</h2>
      </div>
      {children}
    </section>
  );

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto">
        <BackButton />
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <h1 className="text-2xl font-bold text-foreground">Gerador de Tabela de Imóveis</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monte tabelas e apresentações profissionais com os imóveis reais já cadastrados no sistema.
            </p>
          </div>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Atualizar dados
          </Button>
        </div>

        <Tabs defaultValue="criar">
          <TabsList>
            <TabsTrigger value="criar">Criar tabela</TabsTrigger>
            <TabsTrigger value="salvas">Tabelas salvas ({saved.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="criar" className="mt-4 space-y-5">
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5">
              <div className="space-y-5">
                <Step n={1} icon={<ListOrdered className="w-4 h-4" />} title="Selecionar imóveis">
                  <PropertySelector
                    imoveis={imoveis}
                    corretores={corretores}
                    selectedIds={selectedIds}
                    onToggle={toggle}
                    onSelectAll={ids => setSelectedIds(prev => Array.from(new Set([...prev, ...ids])))}
                    onClear={() => setSelectedIds([])}
                    loading={loading}
                  />
                </Step>

                <Step n={2} icon={<ListOrdered className="w-4 h-4" />} title="Ordem de apresentação (arraste)">
                  <SelectedProperties
                    items={selectedItems}
                    onReorder={reorder}
                    onRemove={id => setSelectedIds(p => p.filter(x => x !== id))}
                  />
                </Step>

                <Step n={3} icon={<LayoutTemplate className="w-4 h-4" />} title="Modelo da tabela">
                  <TemplateSelector value={settings.template} onChange={v => patch({ template: v })} />
                </Step>

                <Step n={4} icon={<Settings2 className="w-4 h-4" />} title="Configurações">
                  <TableSettings settings={settings} onChange={patch} corretores={corretores} items={selectedItems} companyPalette={companyPalette} />
                </Step>
              </div>

              {/* Preview + ações */}
              <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
                <Step n={5} icon={<Eye className="w-4 h-4" />} title="Pré-visualização e geração">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handlePdf} disabled={!!exporting || selectedItems.length === 0}>
                      {exporting === "pdf" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                      Gerar PDF
                    </Button>
                    <Button variant="secondary" onClick={() => handleImage("png")} disabled={!!exporting || selectedItems.length === 0}>
                      {exporting === "png" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                      PNG
                    </Button>
                    <Button variant="secondary" onClick={() => handleImage("jpg")} disabled={!!exporting || selectedItems.length === 0}>
                      {exporting === "jpg" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                      JPG
                    </Button>
                    <Button variant="outline" onClick={shareWhatsApp} disabled={selectedItems.length === 0}>
                      <Share2 className="w-4 h-4 mr-2" /> WhatsApp
                    </Button>
                    <Button variant="outline" onClick={() => setSaveOpen(true)} disabled={selectedItems.length === 0}>
                      <Save className="w-4 h-4 mr-2" /> Salvar
                    </Button>
                  </div>
                  <div ref={previewWrap} className="overflow-x-auto rounded-lg bg-muted/40 p-2">
                    <div ref={previewInner}>
                      <TablePreview
                        items={selectedItems}
                        settings={settings}
                        corretores={corretores}
                        logoUrl={logoUrl}
                        containerWidth={Math.max(0, wrapWidth - 16)}
                      />
                    </div>
                  </div>
                </Step>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="salvas" className="mt-4">
            {saved.length === 0 ? (
              <div className="elevated-card rounded-xl p-10 text-center space-y-2">
                <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Nenhuma apresentação salva ainda.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {saved.map(t => (
                  <div key={t.id} className="elevated-card rounded-xl p-4 space-y-2">
                    <p className="text-sm font-semibold text-foreground truncate">{t.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.titulo}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {t.property_ids?.length || 0} imóveis • atualizada em{" "}
                      {new Date(t.updated_at).toLocaleDateString("pt-BR")}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => openSaved(t)}>
                        <FolderOpen className="w-3.5 h-3.5 mr-1.5" /> Abrir
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteSaved(t.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Salvar apresentação</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">Nome da apresentação</Label>
            <Input value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Ex.: Exclusividades Outubro" />
            <p className="text-xs text-muted-foreground">
              Salvamos apenas a seleção e as configurações — os dados dos imóveis são sempre lidos atualizados do sistema.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>Cancelar</Button>
            <Button onClick={saveTable} disabled={savingTable}>
              {savingTable && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
