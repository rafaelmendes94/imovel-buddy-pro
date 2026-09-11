import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/CurrencyInput";
import { MediaGalleryUpload } from "@/components/MediaGalleryUpload";
import { AIImovelImport } from "@/components/AIImovelImport";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmpreendimentoPicker } from "@/components/EmpreendimentoPicker";
import { tipoFromImovel, type EmpreendimentoRecord, type EmpreendimentoTipo } from "@/lib/empreendimentos";

const TIPOS = ["Apartamento", "Casa", "Comercial", "Terreno", "Lote", "Cobertura", "Sala", "Condomínio"];
const FINALIDADES = ["Venda", "Aluguel", "Venda e Aluguel"];
const STATUS = ["Disponível", "Reservado", "Vendido", "Alugado"];
const POSICOES_SOLAR = ["Leste (manhã)", "Oeste (tarde)", "Norte", "Sul"];
const PAGAMENTOS = ["Financiamento", "À vista", "Parcelado direto", "FGTS", "Consórcio", "Permuta"];

export interface BrokerImovelRecord {
  id?: string;
  [key: string]: any;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Registro existente para edição; ausente = novo cadastro */
  imovel?: BrokerImovelRecord | null;
  /** Dono do imóvel (user_id do perfil do corretor) */
  ownerId: string;
  ownerName?: string | null;
  onSaved: () => void | Promise<void>;
}

type Form = {
  titulo: string;
  tipo: string;
  finalidade: string;
  status: string;
  preco: string;
  valor_condominio: string;
  valor_iptu: string;
  cidade: string;
  bairro: string;
  endereco: string;
  numero: string;
  cep: string;
  estado: string;
  quadra: string;
  lote: string;
  unidade: string;
  empreendimento: string;
  box: string;
  quartos: string;
  suites: string;
  banheiros: string;
  vagas: string;
  area_privativa: string;
  area: string;
  posicao_solar: string;
  descricao: string;
  link_video: string;
  link_360: string;
  link_material: string;
  drive_fotos_url: string;
  fotos_pdf_url: string;
  mobiliado: boolean;
  decorado: boolean;
  vista_mar: boolean;
  aceita_permuta: boolean;
  exclusividade: boolean;
  ativo_site: boolean;
  destaque_home: boolean;
  condicoes_pagamento: string[];
  imagens: string[];
  latitude: string;
  longitude: string;
};

const EMPTY: Form = {
  titulo: "", tipo: "Apartamento", finalidade: "Venda", status: "Disponível",
  preco: "", valor_condominio: "", valor_iptu: "",
  cidade: "", bairro: "", endereco: "", numero: "", cep: "", estado: "",
  quadra: "", lote: "", unidade: "", empreendimento: "", box: "",
  quartos: "", suites: "", banheiros: "", vagas: "", area_privativa: "", area: "",
  posicao_solar: "", descricao: "",
  link_video: "", link_360: "", link_material: "", drive_fotos_url: "", fotos_pdf_url: "",
  mobiliado: false, decorado: false, vista_mar: false, aceita_permuta: false,
  exclusividade: false, ativo_site: true, destaque_home: false,
  condicoes_pagamento: [], imagens: [],
  latitude: "", longitude: "",
};

/** Converte digitação brasileira ("1.900.000,00" / "120,5") em número */
function parseBrNumber(v: string): number {
  if (!v) return 0;
  const cleaned = String(v).trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

const isValidUrl = (v: string) => {
  if (!v) return true;
  try {
    const u = new URL(v.startsWith("http") ? v : `https://${v}`);
    return !!u.hostname.includes(".");
  } catch {
    return false;
  }
};

const withProtocol = (v: string) => (!v ? null : v.startsWith("http") ? v : `https://${v}`);

export function BrokerImovelDialog({ open, onOpenChange, imovel, ownerId, ownerName, onSaved }: Props) {
  const isEdit = !!imovel?.id;
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [empLink, setEmpLink] = useState<{ tipo: EmpreendimentoTipo; id: string } | null>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!open) return;
    if (imovel?.id) {
      const s = (v: any) => (v === null || v === undefined ? "" : String(v));
      const num = (v: any) => (v === null || v === undefined || Number(v) === 0 ? "" : String(v));
      setForm({
        titulo: s(imovel.titulo),
        tipo: s(imovel.tipo) || "Apartamento",
        finalidade: s(imovel.finalidade) || "Venda",
        status: s(imovel.status) || "Disponível",
        preco: num(imovel.preco),
        valor_condominio: num(imovel.valor_condominio),
        valor_iptu: num(imovel.valor_iptu),
        cidade: s(imovel.cidade),
        bairro: s(imovel.bairro),
        endereco: s(imovel.endereco),
        numero: s(imovel.numero),
        cep: s(imovel.cep),
        estado: s(imovel.estado),
        quadra: s(imovel.quadra),
        lote: s(imovel.lote),
        unidade: s(imovel.unidade),
        empreendimento: s(imovel.empreendimento),
        box: s(imovel.box),
        quartos: num(imovel.quartos),
        suites: num(imovel.suites),
        banheiros: num(imovel.banheiros),
        vagas: num(imovel.vagas),
        area_privativa: num(imovel.area_privativa),
        area: num(imovel.area),
        posicao_solar: s(imovel.posicao_solar),
        descricao: s(imovel.descricao),
        link_video: s(imovel.link_video),
        link_360: s(imovel.link_360),
        link_material: s(imovel.link_material),
        drive_fotos_url: s(imovel.drive_fotos_url),
        fotos_pdf_url: s(imovel.fotos_pdf_url),
        mobiliado: !!imovel.mobiliado,
        decorado: !!imovel.decorado,
        vista_mar: !!imovel.vista_mar,
        aceita_permuta: !!imovel.aceita_permuta,
        exclusividade: !!(imovel.termo_exclusividade || imovel.termo_exclusividade_url),
        ativo_site: imovel.ativo_site !== false,
        destaque_home: !!imovel.destaque_home,
        condicoes_pagamento: Array.isArray(imovel.condicoes_pagamento) ? imovel.condicoes_pagamento : [],
        imagens: Array.isArray(imovel.imagens) ? imovel.imagens : [],
        latitude: s(imovel.latitude),
        longitude: s(imovel.longitude),
      });
      setEmpLink(tipoFromImovel(imovel));
    } else {
      setForm(EMPTY);
      setEmpLink(null);
    }
    setErrors({});
  }, [open, imovel?.id]);

  /** Vínculo real por ID + preenchimento automático do endereço e coordenadas. */
  const handleEmpreendimento = (rec: EmpreendimentoRecord | null) => {
    if (!rec) {
      setEmpLink(null);
      set("empreendimento", "");
      return;
    }
    setEmpLink({ tipo: rec.tipo, id: rec.id });
    setForm((prev) => ({
      ...prev,
      empreendimento: rec.nome,
      endereco: rec.endereco || prev.endereco,
      numero: rec.numero || prev.numero,
      bairro: rec.bairro || prev.bairro,
      cidade: rec.cidade || prev.cidade,
      estado: rec.estado || prev.estado,
      cep: rec.cep || prev.cep,
      latitude: rec.latitude != null ? String(rec.latitude) : prev.latitude,
      longitude: rec.longitude != null ? String(rec.longitude) : prev.longitude,
    }));
  };

  const applyAI = (u: Record<string, any>) => {
    const str = (v: any) => (v === undefined || v === null ? "" : String(v));
    setForm((prev) => ({
      ...prev,
      titulo: u.titulo ? str(u.titulo) : prev.titulo,
      tipo: u.tipo && TIPOS.includes(str(u.tipo)) ? str(u.tipo) : prev.tipo,
      cidade: u.cidade ? str(u.cidade) : prev.cidade,
      bairro: u.bairro ? str(u.bairro) : prev.bairro,
      endereco: u.endereco ? str(u.endereco) : prev.endereco,
      preco: u.preco ? str(u.preco) : prev.preco,
      quartos: u.quartos !== undefined ? str(u.quartos) : prev.quartos,
      suites: u.suites !== undefined ? str(u.suites) : prev.suites,
      banheiros: u.banheiros !== undefined ? str(u.banheiros) : prev.banheiros,
      vagas: u.vagas !== undefined ? str(u.vagas) : prev.vagas,
      area: u.area ? str(u.area) : prev.area,
      area_privativa: u.areaPrivativa ? str(u.areaPrivativa) : prev.area_privativa,
      descricao: u.descricao ? str(u.descricao) : prev.descricao,
      link_video: u.linkVideo ? str(u.linkVideo) : prev.link_video,
      drive_fotos_url: u.driveUrl || u.drive_fotos_url ? str(u.driveUrl || u.drive_fotos_url) : prev.drive_fotos_url,
      imagens: Array.isArray(u.imagens) && u.imagens.length ? u.imagens.map(String) : prev.imagens,
    }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.titulo.trim()) e.titulo = "Informe o título do imóvel.";
    if (!form.cidade.trim()) e.cidade = "Informe a cidade.";
    if (!form.tipo) e.tipo = "Selecione o tipo.";
    const preco = parseBrNumber(form.preco);
    if (preco <= 0) e.preco = "Informe um valor válido maior que zero.";
    ([
      ["link_video", "Link do vídeo inválido."],
      ["link_360", "Link do tour 360 inválido."],
      ["link_material", "Link do material inválido."],
      ["drive_fotos_url", "Link das fotos inválido."],
      ["fotos_pdf_url", "Link do PDF inválido."],
    ] as const).forEach(([key, msg]) => {
      if (!isValidUrl(form[key] as string)) e[key] = msg;
    });
    setErrors(e);
    if (Object.keys(e).length) toast.error("Revise os campos destacados no formulário.");
    return Object.keys(e).length === 0;
  };

  const buildPayload = () => ({
    titulo: form.titulo.trim(),
    tipo: form.tipo,
    finalidade: form.finalidade,
    status: form.status,
    preco: parseBrNumber(form.preco),
    valor_condominio: parseBrNumber(form.valor_condominio),
    valor_iptu: parseBrNumber(form.valor_iptu),
    cidade: form.cidade.trim(),
    bairro: form.bairro.trim(),
    endereco: form.endereco.trim(),
    numero: form.numero.trim(),
    cep: form.cep.trim(),
    estado: form.estado.trim(),
    quadra: form.quadra.trim(),
    lote: form.lote.trim(),
    unidade: form.unidade.trim(),
    empreendimento: form.empreendimento.trim(),
    edificio_id: empLink?.tipo === "edificio" ? empLink.id : null,
    condominio_id: empLink?.tipo === "condominio" ? empLink.id : null,
    empreendimento_id: empLink?.tipo === "loteamento" ? empLink.id : null,
    latitude: form.latitude ? parseBrNumber(form.latitude) : null,
    longitude: form.longitude ? parseBrNumber(form.longitude) : null,
    box: form.box.trim(),
    quartos: Math.trunc(parseBrNumber(form.quartos)),
    suites: Math.trunc(parseBrNumber(form.suites)),
    banheiros: Math.trunc(parseBrNumber(form.banheiros)),
    vagas: Math.trunc(parseBrNumber(form.vagas)),
    area_privativa: parseBrNumber(form.area_privativa),
    area: parseBrNumber(form.area),
    posicao_solar: form.posicao_solar,
    descricao: form.descricao.trim(),
    link_video: withProtocol(form.link_video.trim()),
    link_360: withProtocol(form.link_360.trim()),
    link_material: withProtocol(form.link_material.trim()),
    drive_fotos_url: withProtocol(form.drive_fotos_url.trim()),
    fotos_pdf_url: withProtocol(form.fotos_pdf_url.trim()),
    mobiliado: form.mobiliado,
    decorado: form.decorado,
    vista_mar: form.vista_mar,
    aceita_permuta: form.aceita_permuta,
    termo_exclusividade: form.exclusividade ? "Sim" : "",
    ativo_site: form.ativo_site,
    destaque_home: form.destaque_home,
    condicoes_pagamento: form.condicoes_pagamento,
    imagens: form.imagens,
  });

  const submit = async () => {
    if (saving) return;
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit && imovel?.id) {
        const { error } = await supabase.from("imoveis").update(payload as any).eq("id", imovel.id);
        if (error) throw error;
        toast.success("Imóvel atualizado com sucesso");
      } else {
        const { error } = await supabase.from("imoveis").insert([{
          ...payload,
          user_id: ownerId,
          corretor_id: ownerId,
          corretor_nome: ownerName || null,
        }] as any);
        if (error) throw error;
        toast.success("Imóvel cadastrado com sucesso");
      }
      await onSaved();
      onOpenChange(false);
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (/row-level security|permission/i.test(msg)) {
        toast.error("Você não tem permissão para salvar imóveis deste perfil.");
      } else if (/Limite de/i.test(msg) || /assinatura/i.test(msg)) {
        toast.error(msg);
      } else {
        toast.error("Erro ao salvar imóvel: " + msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const showQuadraLote = useMemo(
    () => ["Casa", "Terreno", "Lote", "Condomínio"].includes(form.tipo),
    [form.tipo],
  );

  const err = (k: string) => errors[k] && <p className="text-[11px] font-medium text-destructive">{errors[k]}</p>;

  const Toggle = ({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
        value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-secondary-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) onOpenChange(v); }}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <Building2 className="h-5 w-5 text-accent" />
            {isEdit ? "Editar imóvel" : "Adicionar imóvel"}
          </DialogTitle>
          <DialogDescription>
            Os dados são salvos no portfólio de {ownerName || "este corretor"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!isEdit && <AIImovelImport onApply={applyAI} />}

          {/* Identificação */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Identificação</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Título do imóvel *</Label>
                <Input value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ex: Apartamento 3 suítes frente mar" />
                {err("titulo")}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo *</Label>
                <div className="flex flex-wrap gap-1.5">
                  {TIPOS.map((t) => <Toggle key={t} label={t} value={form.tipo === t} onToggle={() => set("tipo", t)} />)}
                </div>
                {err("tipo")}
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Finalidade</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {FINALIDADES.map((f) => <Toggle key={f} label={f} value={form.finalidade === f} onToggle={() => set("finalidade", f)} />)}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS.map((s) => <Toggle key={s} label={s} value={form.status === s} onToggle={() => set("status", s)} />)}
                  </div>
                </div>
              </div>
              <EmpreendimentoPicker value={empLink} onChange={handleEmpreendimento} />
              <div className="space-y-1.5">
                <Label className="text-xs">Unidade / Referência</Label>
                <Input value={form.unidade} onChange={(e) => set("unidade", e.target.value)} placeholder="Ex: 1203" />
              </div>
              {showQuadraLote && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Quadra</Label>
                    <Input value={form.quadra} onChange={(e) => set("quadra", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Lote</Label>
                    <Input value={form.lote} onChange={(e) => set("lote", e.target.value)} />
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">Box / Vaga (número)</Label>
                <Input value={form.box} onChange={(e) => set("box", e.target.value)} placeholder="Ex: 1.11, A12" />
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Valores</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Valor *</Label>
                <CurrencyInput value={form.preco} onValueChange={(v) => set("preco", v)} />
                {err("preco")}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Condomínio</Label>
                <CurrencyInput value={form.valor_condominio} onValueChange={(v) => set("valor_condominio", v)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">IPTU</Label>
                <CurrencyInput value={form.valor_iptu} onValueChange={(v) => set("valor_iptu", v)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Condições de pagamento</Label>
              <div className="flex flex-wrap gap-1.5">
                {PAGAMENTOS.map((p) => (
                  <Toggle
                    key={p}
                    label={p}
                    value={form.condicoes_pagamento.includes(p)}
                    onToggle={() => set("condicoes_pagamento",
                      form.condicoes_pagamento.includes(p)
                        ? form.condicoes_pagamento.filter((x) => x !== p)
                        : [...form.condicoes_pagamento, p])}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Endereço</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">CEP</Label>
                <Input value={form.cep} onChange={(e) => set("cep", e.target.value)} placeholder="88330-000" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cidade *</Label>
                <Input value={form.cidade} onChange={(e) => set("cidade", e.target.value)} />
                {err("cidade")}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Estado</Label>
                <Input value={form.estado} onChange={(e) => set("estado", e.target.value)} placeholder="SC" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Bairro</Label>
                <Input value={form.bairro} onChange={(e) => set("bairro", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <Label className="text-xs">Rua / Endereço</Label>
                <Input value={form.endereco} onChange={(e) => set("endereco", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Número</Label>
                <Input value={form.numero} onChange={(e) => set("numero", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Características */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Características</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {([
                ["Dormitórios", "quartos"],
                ["Suítes", "suites"],
                ["Banheiros", "banheiros"],
                ["Vagas", "vagas"],
                ["Área privativa (m²)", "area_privativa"],
                ["Área total (m²)", "area"],
              ] as const).map(([label, key]) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs">{label}</Label>
                  <Input
                    inputMode="decimal"
                    value={form[key] as string}
                    onChange={(e) => set(key, e.target.value.replace(/[^\d.,]/g, "") as any)}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Posição solar</Label>
              <div className="flex flex-wrap gap-1.5">
                {POSICOES_SOLAR.map((p) => (
                  <Toggle key={p} label={p} value={form.posicao_solar === p} onToggle={() => set("posicao_solar", form.posicao_solar === p ? "" : p)} />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Toggle label="Mobiliado" value={form.mobiliado} onToggle={() => set("mobiliado", !form.mobiliado)} />
              <Toggle label="Decorado" value={form.decorado} onToggle={() => set("decorado", !form.decorado)} />
              <Toggle label="Vista mar" value={form.vista_mar} onToggle={() => set("vista_mar", !form.vista_mar)} />
              <Toggle label="Exclusividade" value={form.exclusividade} onToggle={() => set("exclusividade", !form.exclusividade)} />
              <Toggle label="Aceita permuta" value={form.aceita_permuta} onToggle={() => set("aceita_permuta", !form.aceita_permuta)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => set("descricao", e.target.value)} rows={4} />
            </div>
          </div>

          {/* Fotos e mídias */}
          <div className="space-y-5 rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Fotos e mídias</p>
            <MediaGalleryUpload
              label="Fotos do imóvel (arraste para ordenar — a primeira é a capa)"
              values={form.imagens}
              onChange={(next) => set("imagens", next)}
              folder="imoveis/portfolio-corretor"
              kind="image"
              reorderable
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                ["Link do vídeo", "link_video", "https://youtube.com/..."],
                ["Link do tour 360", "link_360", "https://..."],
                ["Link do material / PDF", "link_material", "https://..."],
                ["Link das fotos (Drive)", "drive_fotos_url", "https://drive.google.com/..."],
                ["Link do PDF de fotos", "fotos_pdf_url", "https://..."],
              ] as const).map(([label, key, ph]) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs">{label}</Label>
                  <Input value={form[key] as string} onChange={(e) => set(key, e.target.value as any)} placeholder={ph} />
                  {err(key)}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Toggle label="Publicar no site" value={form.ativo_site} onToggle={() => set("ativo_site", !form.ativo_site)} />
              <Toggle label="Destaque" value={form.destaque_home} onToggle={() => set("destaque_home", !form.destaque_home)} />
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={submit} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar imóvel"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
