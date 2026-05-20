import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Car,
  DollarSign,
  FileDown,
  FileText,
  Filter,
  Home,
  Mail,
  MapPin,
  Paintbrush,
  Phone,
  Eye,
  Clock,
  Ruler,
  Search,
  Star,
  TrendingUp,
  TreePine,
  Upload,
  Waves,
  X,
  Images,
  ExternalLink,
} from "lucide-react";
import { cn, toSlug } from "@/lib/utils";
import { BrokerRatings } from "@/components/BrokerRatings";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PropertyDetailModal } from "@/components/PropertyDetailModal";
import { toast } from "sonner";
import { generateBrokerCatalogPdf } from "@/utils/generateBrokerCatalogPdf";

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const normalizePhone = (value?: string | null) => (value || "").replace(/\D/g, "");
const getAvatarFallback = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f4c81&color=fff&size=256`;

interface BrokerRecord {
  name: string;
  phone: string | null;
  creci: string | null;
  email: string | null;
}

interface BrokerPageConfig {
  site_title: string;
  slogan: string;
  cover_photo_url: string | null;
  profile_photo_url: string | null;
  logo_url: string | null;
  whatsapp: string | null;
  footer_text: string | null;
  email_contact: string | null;
  bio: string | null;
  tabela_url: string | null;
  accent_color: string | null;
}

interface DBProperty {
  id: string;
  user_id: string;
  titulo: string;
  endereco: string;
  cidade: string;
  tipo: string;
  status: string;
  preco: number;
  area: number;
  quartos: number;
  banheiros: number;
  vagas: number;
  comissao: number | null;
  imagens: string[] | null;
  vista_mar: boolean;
  decorado: boolean;
  aceita_permuta: boolean;
  condicoes_pagamento: string[] | null;
  empreendimento: string | null;
  unidade: string | null;
  box: string | null;
  quadra: string | null;
  lote: string | null;
  bairro: string | null;
  corretor_nome: string | null;
  created_at: string;
  data_venda: string | null;
  termo_exclusividade_url: string | null;
  link_material: string | null;
  views: number | null;
}

function PropertyCard({ p, brokerName, whatsapp, onOpen }: { p: DBProperty; brokerName: string; whatsapp: string; onOpen: (p: DBProperty) => void }) {
  const img = p.imagens?.[0] || "/placeholder.svg";
  const msg = encodeURIComponent(`Olá ${brokerName}! Tenho interesse no imóvel: ${p.titulo} - ${formatCurrency(p.preco)}`);

  const handleExclusividade = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (p.termo_exclusividade_url) {
      window.open(p.termo_exclusividade_url, "_blank", "noopener,noreferrer");
    } else {
      toast.info("Termo de exclusividade não disponível");
    }
  };

  const handleDownloadPhotos = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const urls = (p.imagens || []).filter(Boolean);
    if (urls.length === 0) {
      toast.info("Sem fotos para baixar");
      return;
    }
    const tId = toast.loading("Preparando fotos...");
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      await Promise.all(
        urls.map(async (url, idx) => {
          try {
            const res = await fetch(url);
            const blob = await res.blob();
            const ext = (blob.type.split("/")[1] || "jpg").split("+")[0];
            zip.file(`foto-${String(idx + 1).padStart(2, "0")}.${ext}`, blob);
          } catch {}
        })
      );
      const content = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(content);
      a.download = `${p.titulo || "imovel"}-fotos.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      toast.success("Fotos baixadas", { id: tId });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao baixar fotos", { id: tId });
    }
  };

  const handleDownloadPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const tId = toast.loading("Gerando PDF...");
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const urls = (p.imagens || []).filter(Boolean);
      const toB64 = (u: string) =>
        fetch(u)
          .then((r) => r.blob())
          .then(
            (b) =>
              new Promise<string | null>((resolve) => {
                const fr = new FileReader();
                fr.onloadend = () => resolve(fr.result as string);
                fr.onerror = () => resolve(null);
                fr.readAsDataURL(b);
              })
          )
          .catch(() => null);
      const imgs = (await Promise.all(urls.map(toB64))).filter(Boolean) as string[];
      const html = `
        <div style="font-family:Arial,sans-serif;color:#1f2937;padding:8px;">
          <h1 style="font-size:22px;font-weight:800;margin:0 0 4px;color:#1e3a5f;text-align:center;">${p.titulo}</h1>
          <p style="text-align:center;font-size:11px;color:#6b7280;margin:0 0 8px;">${p.endereco}, ${p.cidade}</p>
          <p style="text-align:center;font-size:16px;font-weight:700;color:#0f4c81;margin:0 0 16px;">${formatCurrency(p.preco)}</p>
          ${imgs.length === 0
            ? `<p style="text-align:center;color:#9ca3af;font-size:12px;">Sem fotos cadastradas.</p>`
            : imgs.map((b) => `<div style="page-break-inside:avoid;margin-bottom:12px;text-align:center;"><img src="${b}" style="max-width:100%;max-height:240mm;object-fit:contain;border-radius:6px;" /></div>`).join("")}
        </div>`;
      const container = document.createElement("div");
      container.style.width = "210mm";
      container.innerHTML = html;
      document.body.appendChild(container);
      await html2pdf()
        .from(container)
        .set({ margin: 10, filename: `${p.titulo || "imovel"}.pdf`, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } })
        .save();
      document.body.removeChild(container);
      toast.success("PDF gerado", { id: tId });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF", { id: tId });
    }
  };

  const handleOpenDrive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (p.link_material) {
      window.open(p.link_material, "_blank", "noopener,noreferrer");
    } else {
      toast.info("Material no Drive não disponível");
    }
  };

  return (
    <article
      onClick={() => onOpen(p)}
      className="group cursor-pointer overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]"
    >
      <div className="relative h-60 overflow-hidden">
        <img src={img} alt={p.titulo} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
        {p.termo_exclusividade_url && (
          <button
            type="button"
            onClick={handleExclusividade}
            title="Clique para baixar o termo de exclusividade"
            className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-accent-foreground shadow-md transition-transform hover:scale-105"
          >
            <FileDown className="h-3 w-3" /> Exclusividade
          </button>
        )}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <p className="text-2xl font-black text-white drop-shadow-lg">{formatCurrency(p.preco)}</p>
          <div className="flex flex-wrap justify-end gap-2">
            {p.vista_mar && <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-[10px] font-bold text-accent-foreground"><Waves className="h-3 w-3" /> Vista mar</span>}
            {p.decorado && <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground"><Paintbrush className="h-3 w-3" /> Decorado</span>}
          </div>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-card-foreground">{p.titulo}</h3>
        {(p.empreendimento || p.unidade || p.quadra) && (
          <div className="flex flex-wrap items-center gap-2">
            {p.empreendimento && <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{p.empreendimento}</span>}
            {p.unidade && <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{p.unidade}</span>}
            {p.quadra && <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{p.quadra}</span>}
            {p.lote && <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{p.lote}</span>}
          </div>
        )}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /><span>{p.endereco}, {p.cidade}</span></div>
        </div>
        {(p.quartos > 0 || p.area > 0) && (
          <div className="flex flex-wrap items-center gap-4 border-y border-border py-3 text-sm text-muted-foreground">
            {p.area > 0 && <span className="flex items-center gap-1"><Ruler className="h-4 w-4" />{p.area}m²</span>}
            {p.quartos > 0 && <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" />{p.quartos}</span>}
            {p.banheiros > 0 && <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{p.banheiros}</span>}
            {p.vagas > 0 && <span className="flex items-center gap-1"><Car className="h-4 w-4" />{p.vagas}</span>}
          </div>
        )}
        {p.condicoes_pagamento && p.condicoes_pagamento.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {p.condicoes_pagamento.map((c) => <span key={`${p.id}-${c}`} className="rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-bold text-success">{c}</span>)}
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleDownloadPhotos}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-muted px-2 py-2 text-[11px] font-bold text-foreground transition-colors hover:bg-muted/70"
            title="Baixar todas as fotos em .zip"
          >
            <Images className="h-3.5 w-3.5" /> Fotos
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-muted px-2 py-2 text-[11px] font-bold text-foreground transition-colors hover:bg-muted/70"
            title="Baixar PDF do imóvel"
          >
            <FileDown className="h-3.5 w-3.5" /> PDF
          </button>
          <button
            type="button"
            onClick={handleOpenDrive}
            disabled={!p.link_material}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-muted px-2 py-2 text-[11px] font-bold text-foreground transition-colors hover:bg-muted/70 disabled:cursor-not-allowed disabled:opacity-50"
            title={p.link_material ? "Abrir material no Drive" : "Sem material no Drive"}
          >
            <ExternalLink className="h-3.5 w-3.5" /> Drive
          </button>
        </div>
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp}?text=${msg}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90">
            <Phone className="h-4 w-4" /> Tenho interesse
          </a>
        )}
      </div>
    </article>
  );
}

export default function BrokerSite() {
  const { slug } = useParams<{ slug: string }>();

  const [brokerName, setBrokerName] = useState("");
  const [properties, setProperties] = useState<DBProperty[]>([]);
  const [soldProperties, setSoldProperties] = useState<DBProperty[]>([]);
  const [brokerRecord, setBrokerRecord] = useState<BrokerRecord | null>(null);
  const [config, setConfig] = useState<BrokerPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [brokerId, setBrokerId] = useState<string | null>(null);
  const [pageViews, setPageViews] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  useEffect(() => {
    if (!slug) return;
    (supabase.rpc as any)("increment_broker_page_view", { _slug: slug });
    (supabase.from as any)("broker_page_views")
      .select("id", { count: "exact", head: true })
      .eq("broker_slug", slug)
      .then(({ count }: { count: number | null }) => setPageViews(count || 0));
  }, [slug]);

  useEffect(() => {
    const load = async () => {
      if (!slug) { setLoading(false); return; }

      setLoading(true);

      const [{ data: brokersData }, { data: propertiesData }, { data: pageConfig }, { data: profilesData }] = await Promise.all([
        supabase
          .from("subscriber_brokers")
          .select("name, phone, creci, email")
          .eq("status", "active"),
        supabase
          .from("imoveis")
          .select("id, user_id, titulo, endereco, cidade, tipo, status, preco, area, quartos, banheiros, vagas, comissao, imagens, vista_mar, decorado, aceita_permuta, condicoes_pagamento, empreendimento, unidade, box, quadra, lote, bairro, corretor_nome, created_at, data_venda, termo_exclusividade_url, link_material")
          .eq("ativo_site", true),
        supabase
          .from("site_config")
          .select("site_title, slogan, cover_photo_url, profile_photo_url, logo_url, whatsapp, footer_text, email_contact, bio, tabela_url, accent_color")
          .eq("config_type", "broker_page")
          .eq("owner_id", slug)
          .maybeSingle(),
        (supabase as any).from("public_broker_profiles").select("user_id, full_name, phone, avatar_url"),
      ]);

      const matchedBroker = ((brokersData as BrokerRecord[] | null) || []).find((broker) => toSlug(broker.name) === slug) || null;
      const matchedProfile = ((profilesData as any[]) || []).find((p) => p.full_name && toSlug(p.full_name) === slug) || null;

      const matchedProperties = ((propertiesData as DBProperty[] | null) || [])
        .filter((property) => {
          if (matchedProfile && property.user_id === matchedProfile.user_id) return true;
          return toSlug(property.corretor_nome || "") === slug;
        })
        .sort((a, b) => Number(b.preco) - Number(a.preco));

      const resolvedName = matchedProfile?.full_name || matchedBroker?.name || matchedProperties[0]?.corretor_nome || (slug ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "");

      setBrokerName(resolvedName);
      setBrokerRecord(matchedBroker || (matchedProfile ? { name: matchedProfile.full_name, phone: matchedProfile.phone, creci: null, email: null } as any : null));
      setConfig((pageConfig as BrokerPageConfig | null) || null);
      setProfileAvatar(matchedProfile?.avatar_url || null);
      setBrokerId(matchedProfile?.user_id || matchedProperties[0]?.user_id || null);
      setProperties(matchedProperties.filter((property) => property.status !== "Vendido"));
      setSoldProperties(matchedProperties.filter((property) => property.status === "Vendido"));
      setLoading(false);
    };

    load();
  }, [slug]);

  const filteredProperties = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return properties.filter((property) => {
      if (tipoFilter && property.tipo !== tipoFilter) return false;
      if (statusFilter && property.status !== statusFilter) return false;
      if (!term) return true;
      return (
        property.titulo.toLowerCase().includes(term) ||
        property.endereco.toLowerCase().includes(term) ||
        property.cidade.toLowerCase().includes(term) ||
        (property.bairro || "").toLowerCase().includes(term)
      );
    });
  }, [properties, searchTerm, tipoFilter, statusFilter]);

  const propertiesByCity = useMemo(() => {
    const grouped = filteredProperties.reduce<Record<string, DBProperty[]>>((acc, property) => {
      const city = property.cidade || "Outras regiões";
      if (!acc[city]) acc[city] = [];
      acc[city].push(property);
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([cityA], [cityB]) => cityA.localeCompare(cityB, "pt-BR"))
      .map(([city, items]) => ({ city, items }));
  }, [filteredProperties]);

  const featuredProperties = useMemo(() => properties.slice(0, 3), [properties]);
  const apartments = useMemo(() => properties.filter((property) => property.tipo === "Apartamento").length, [properties]);
  const houses = useMemo(() => properties.filter((property) => property.tipo === "Casa").length, [properties]);
  const lots = useMemo(() => properties.filter((property) => property.tipo === "Terreno" || property.tipo === "Lote").length, [properties]);
  const totalValue = useMemo(() => properties.reduce((sum, property) => sum + Number(property.preco), 0), [properties]);
  const soldValue = useMemo(() => soldProperties.reduce((sum, property) => sum + Number(property.preco), 0), [soldProperties]);
  const ticketMedio = useMemo(() => (properties.length > 0 ? totalValue / properties.length : 0), [properties, totalValue]);
  const totalComissao = useMemo(
    () => properties.reduce((sum, p) => sum + (Number(p.preco) * (Number(p.comissao) || 0)) / 100, 0),
    [properties],
  );
  const tempoMedioVenda = useMemo(() => {
    const days = soldProperties
      .map((p) => {
        if (!p.data_venda || !p.created_at) return null;
        const start = new Date(p.created_at).getTime();
        const end = new Date(p.data_venda).getTime();
        if (isNaN(start) || isNaN(end) || end < start) return null;
        return Math.round((end - start) / (1000 * 60 * 60 * 24));
      })
      .filter((d): d is number => d !== null);
    if (days.length === 0) return 0;
    return Math.round(days.reduce((a, b) => a + b, 0) / days.length);
  }, [soldProperties]);
  const tipos = useMemo(() => Array.from(new Set(properties.map((p) => p.tipo).filter(Boolean))), [properties]);
  const statusList = useMemo(() => Array.from(new Set(properties.map((p) => p.status).filter(Boolean))), [properties]);

  useEffect(() => {
    if (!brokerId) { setAvgRating(null); setRatingsCount(0); return; }
    (async () => {
      const { data } = await (supabase as any)
        .from("broker_ratings")
        .select("pontualidade, agilidade, transparencia, credibilidade, negociacao")
        .eq("broker_id", brokerId);
      const rows = (data as any[]) || [];
      setRatingsCount(rows.length);
      if (!rows.length) { setAvgRating(null); return; }
      const total = rows.reduce((s, r) =>
        s + ((r.pontualidade + r.agilidade + r.transparencia + r.credibilidade + r.negociacao) / 5), 0);
      setAvgRating(Number((total / rows.length).toFixed(1)));
    })();
  }, [brokerId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!brokerName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="space-y-4 text-center">
          <p className="text-lg font-semibold text-foreground">Corretor não encontrado</p>
          <Link to="/site" className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2.5 font-semibold text-accent-foreground transition-opacity hover:opacity-90">
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = !!currentUserId && !!brokerId && currentUserId === brokerId;

  const handleUploadTabela = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !slug || !currentUserId) return;
    try {
      setUploading(true);
      const ext = file.name.split(".").pop() || "pdf";
      const path = `broker-tables/${currentUserId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("tabelas").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("tabelas").getPublicUrl(path);
      const url = pub.publicUrl;

      const { data: existing } = await supabase
        .from("site_config")
        .select("id")
        .eq("config_type", "broker_page")
        .eq("owner_id", slug)
        .maybeSingle();

      if (existing?.id) {
        await (supabase.from("site_config") as any).update({ tabela_url: url }).eq("id", existing.id);
      } else {
        await (supabase.from("site_config") as any).insert({ config_type: "broker_page", owner_id: slug, tabela_url: url, site_title: brokerName });
      }
      setConfig((prev) => prev ? { ...prev, tabela_url: url } : { site_title: brokerName, slogan: "", cover_photo_url: null, profile_photo_url: null, logo_url: null, whatsapp: null, footer_text: null, email_contact: null, bio: null, tabela_url: url, accent_color: null });
      toast.success("Tabela completa enviada!");
    } catch (err: any) {
      toast.error("Erro ao enviar tabela: " + (err?.message || ""));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleGeneratePdf = async () => {
    const all = [...properties, ...soldProperties];
    if (all.length === 0) {
      toast.info("Sem imóveis para exportar");
      return;
    }
    toast.info("Gerando catálogo em PDF...");
    try {
      await generateBrokerCatalogPdf({
        brokerName,
        creci,
        whatsapp,
        email,
        avatarUrl: config?.profile_photo_url || null,
        properties,
        soldProperties,
        accentColor: config?.accent_color || null,
        fileSlug: slug || "broker",
      });
      toast.success("Catálogo gerado!");
    } catch (err: any) {
      toast.error("Erro ao gerar PDF: " + (err?.message || ""));
    }
  };

  const whatsapp = normalizePhone(config?.whatsapp || brokerRecord?.phone || "");
  const email = config?.email_contact || brokerRecord?.email || "";
  const creci = brokerRecord?.creci || "";
  const avatarUrl = profileAvatar || config?.profile_photo_url || getAvatarFallback(brokerName);
  const coverUrl = config?.cover_photo_url;
  const accentColor = config?.accent_color && config.accent_color.trim() !== "" ? config.accent_color : null;
  const eyebrow = config?.site_title || "Portfólio do corretor";
  const slogan = config?.slogan || "Confira os imóveis disponíveis e o histórico de vendas deste corretor.";
  const whatsappGeneral = encodeURIComponent(`Olá ${brokerName}! Vi sua página pública e gostaria de mais informações.`);
  const totalPortfolio = properties.length + soldProperties.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/site" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </Link>
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}?text=${whatsappGeneral}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90">
              <Phone className="h-4 w-4" /> Falar agora
            </a>
          )}
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border">
          {coverUrl ? (
            <img src={coverUrl} alt={`Capa de ${brokerName}`} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 gradient-navy" aria-hidden />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/90 via-foreground/75 to-primary/70" aria-hidden />

          <div className="container relative py-16 md:py-24">
            <div className="grid gap-8 lg:grid-cols-[220px,1fr] lg:items-start">
              <div className="mx-auto lg:mx-0">
                <div className="relative animate-scale-in">
                  <img src={avatarUrl} alt={brokerName} className="h-40 w-40 rounded-full border-4 border-background/80 object-cover shadow-2xl md:h-52 md:w-52" />
                  <button
                    type="button"
                    onClick={() => setRatingModalOpen(true)}
                    title={avgRating !== null ? `${avgRating}/5 · ${ratingsCount} avaliação${ratingsCount === 1 ? "" : "ões"} — clique para ver` : "Ver avaliações"}
                    className="absolute bottom-3 right-3 flex min-h-[3rem] min-w-[3rem] items-center justify-center gap-1 rounded-full bg-accent px-2 text-accent-foreground shadow-xl transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/60"
                  >
                    <Star className="h-5 w-5 fill-current" />
                    {avgRating !== null && (
                      <span className="text-sm font-black leading-none">{avgRating.toFixed(1)}</span>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-6 text-center lg:text-left animate-fade-in">
                <div className="space-y-4">
                  <p className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                    {eyebrow}
                  </p>
                  <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:gap-5">
                    {config?.logo_url && (
                      <img src={config.logo_url} alt="Logo" className="h-16 w-16 rounded-2xl border border-white/20 bg-white/10 object-contain p-1.5 shadow-xl backdrop-blur md:h-20 md:w-20" />
                    )}
                    <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">{brokerName}</h1>
                  </div>
                  {config?.bio ? (
                    <p className="max-w-3xl whitespace-pre-line rounded-2xl border border-white/10 bg-white/5 p-4 text-base leading-relaxed text-white/90 backdrop-blur-sm md:text-lg">
                      {config.bio}
                    </p>
                  ) : (
                    <p className="max-w-3xl text-base text-white/80 md:text-xl">{slogan}</p>
                  )}
                  <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-white/75 lg:justify-start">
                    {creci && <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white/85">CRECI {creci}</span>}
                    {email && (
                      <a href={`mailto:${email}`} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 transition-colors hover:bg-white/15 hover:text-white">
                        <Mail className="h-4 w-4" /> {email}
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
                  {whatsapp && (
                    <a href={`https://wa.me/${whatsapp}?text=${whatsappGeneral}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition-all hover:scale-105 hover:opacity-90">
                      <Phone className="h-4 w-4" /> Chamar no WhatsApp
                    </a>
                  )}
                  {/* Tabela: download + upload (dono) unificados */}
                  {config?.tabela_url ? (
                    <div className="inline-flex items-stretch overflow-hidden rounded-2xl shadow-lg">
                      <a
                        href={config.tabela_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-bold text-white transition-all hover:brightness-110"
                      >
                        <FileDown className="h-4 w-4" /> Baixar tabela em PDF
                      </a>
                      {isOwner && (
                        <label
                          title={uploading ? "Enviando..." : "Trocar tabela"}
                          className={cn(
                            "inline-flex cursor-pointer items-center justify-center border-l border-white/20 bg-orange-600 px-3 text-white transition-colors hover:bg-orange-700",
                            uploading && "pointer-events-none opacity-60",
                          )}
                        >
                          <Upload className="h-4 w-4" />
                          <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleUploadTabela} />
                        </label>
                      )}
                    </div>
                  ) : isOwner ? (
                    <label className={cn("inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-105", uploading && "opacity-60 pointer-events-none")}>
                      <Upload className="h-4 w-4" /> {uploading ? "Enviando..." : "Subir tabela completa"}
                      <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleUploadTabela} />
                    </label>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-bold text-white/60">
                      <FileText className="h-4 w-4" /> Tabela indisponível
                    </span>
                  )}
                  <button
                    onClick={handleGeneratePdf}
                    style={accentColor ? { background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor}, ${accentColor}dd)` } : undefined}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-105",
                      !accentColor && "bg-gradient-to-r from-emerald-500 to-teal-600",
                    )}
                  >
                    <FileDown className="h-4 w-4" /> Gerar PDF dos imóveis
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Animated vibrant metric cards */}
        <section className="container -mt-10 relative z-10 pb-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {[
              { label: "Imóveis", value: properties.length, icon: Building2 },
              { label: "VGV carteira", value: formatCurrency(totalValue), icon: DollarSign },
              { label: "Ticket médio", value: formatCurrency(ticketMedio), icon: TrendingUp },
              { label: "Vendas", value: soldProperties.length, icon: Home },
              { label: "VGV vendido", value: formatCurrency(soldValue), icon: DollarSign },
              { label: "Tempo médio venda", value: tempoMedioVenda > 0 ? `${tempoMedioVenda}d` : "—", icon: Clock },
              { label: "Visualizações", value: ([...properties, ...soldProperties].reduce((sum, p) => sum + (p.views || 0), 0)).toLocaleString("pt-BR"), icon: Eye },
            ].map((metric, idx) => (
              <div
                key={metric.label}
                className={cn(
                  "group relative overflow-hidden rounded-2xl p-3 text-white shadow-lg transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl animate-fade-in",
                  !accentColor && "bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-800",
                )}
                style={{
                  animationDelay: `${idx * 70}ms`,
                  animationFillMode: "both",
                  ...(accentColor
                    ? { background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor}, ${accentColor}ee)` }
                    : {}),
                }}
              >
                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/15 blur-2xl transition-transform duration-700 group-hover:scale-150" />
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/25 backdrop-blur-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                    <metric.icon className="h-4 w-4" />
                  </div>
                  <p className="text-base font-black drop-shadow-sm leading-tight truncate">{metric.value}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-white/80 leading-tight">{metric.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>



        <section className="container py-8">
          <div className="grid gap-4 lg:grid-cols-[1fr,auto] lg:items-center">
            <div className="flex items-center rounded-3xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
              <Search className="ml-3 h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar imóvel por título, endereço, bairro ou cidade"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="rounded-2xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Limpar busca">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-sm font-medium text-muted-foreground"><Building2 className="h-4 w-4" /> {apartments} apartamentos</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-sm font-medium text-muted-foreground"><Home className="h-4 w-4" /> {houses} casas</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-sm font-medium text-muted-foreground"><TreePine className="h-4 w-4" /> {lots} terrenos</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Filter className="h-3 w-3" /> Filtros:
            </span>
            <button
              onClick={() => setTipoFilter("")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                !tipoFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              Todos os tipos
            </button>
            {tipos.map((t) => (
              <button
                key={t}
                onClick={() => setTipoFilter(t)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  tipoFilter === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {t}
              </button>
            ))}
            <span className="mx-2 h-4 w-px bg-border" />
            <button
              onClick={() => setStatusFilter("")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                !statusFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              Qualquer status
            </button>
            {statusList.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  statusFilter === s ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {!searchTerm && !tipoFilter && !statusFilter && featuredProperties.length > 0 && (
          <section className="container pb-6">
            <div className="mb-6 space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Seleção especial</p>
              <h2 className="text-3xl font-black text-foreground">Destaques do portfólio</h2>
              <p className="text-muted-foreground">Os imóveis mais estratégicos publicados por {brokerName}.</p>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {featuredProperties.map((property) => <PropertyCard key={property.id} p={property} brokerName={brokerName} whatsapp={whatsapp} onOpen={setSelectedProperty} />)}
            </div>
          </section>
        )}

        <section className="container py-8 space-y-10">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Portfólio atual</p>
            <h2 className="text-3xl font-black text-foreground">Imóveis em carteira</h2>
            <p className="text-muted-foreground">
              {filteredProperties.length} resultado{filteredProperties.length === 1 ? "" : "s"} encontrado{filteredProperties.length === 1 ? "" : "s"} para este corretor.
            </p>
          </div>

          {propertiesByCity.length > 0 ? (
            propertiesByCity.map(({ city, items }) => (
              <section key={city} className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground">{city}</h3>
                    <p className="text-sm text-muted-foreground">{items.length} imóvel{items.length === 1 ? "" : "eis"} disponível{items.length === 1 ? "" : "is"}</p>
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((property) => <PropertyCard key={property.id} p={property} brokerName={brokerName} whatsapp={whatsapp} onOpen={setSelectedProperty} />)}
                </div>
              </section>
            ))
          ) : (
            <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
              <p className="text-lg font-semibold text-foreground">Nenhum imóvel encontrado</p>
              <p className="mt-2 text-muted-foreground">Ajuste a busca ou volte mais tarde para conferir novas oportunidades.</p>
            </div>
          )}
        </section>



        {soldProperties.length > 0 && !searchTerm && (
          <section className="border-y border-border bg-muted/40">
            <div className="container py-14">
              <div className="mb-6 space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Prova social</p>
                <h2 className="text-3xl font-black text-foreground">Histórico de vendas</h2>
                <p className="text-muted-foreground">{soldProperties.length} imóvel{soldProperties.length === 1 ? "" : "eis"} vendido{soldProperties.length === 1 ? "" : "s"} com VGV público de {formatCurrency(soldValue)}.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {soldProperties.slice(0, 6).map((property) => (
                  <article key={property.id} className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
                    <div className="relative h-56 overflow-hidden">
                      <img src={property.imagens?.[0] || "/placeholder.svg"} alt={property.titulo} loading="lazy" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/10 to-transparent" />
                      <span className="absolute left-4 top-4 rounded-full bg-destructive px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-destructive-foreground">Vendido</span>
                    </div>
                    <div className="space-y-3 p-5">
                      <h3 className="text-lg font-bold text-card-foreground">{property.titulo}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {property.endereco}, {property.cidade}</div>
                      <p className="text-2xl font-black text-foreground">{formatCurrency(property.preco)}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {property.area > 0 && <span className="flex items-center gap-1"><Ruler className="h-4 w-4" />{property.area}m²</span>}
                        {property.quartos > 0 && <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" />{property.quartos}</span>}
                        {property.vagas > 0 && <span className="flex items-center gap-1"><Car className="h-4 w-4" />{property.vagas}</span>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {brokerId && (
          <section className="container py-10">
            <div className="mb-6 space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Reputação</p>
              <h2 className="text-3xl font-black text-foreground">Avaliações do corretor</h2>
              <p className="text-muted-foreground">Usuários logados podem avaliar. Visitantes visualizam as notas e comentários.</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-2 shadow-[var(--shadow-card)]">
              <BrokerRatings brokerId={brokerId} brokerName={brokerName} />
            </div>
          </section>
        )}


        <Dialog open={ratingModalOpen} onOpenChange={setRatingModalOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="border-b border-border px-6 pt-6 pb-4">
              <DialogTitle className="text-2xl font-black">Avaliações de {brokerName}</DialogTitle>
            </DialogHeader>
            <div className="px-2 pb-4">
              <BrokerRatings brokerId={brokerId} brokerName={brokerName} />
            </div>
          </DialogContent>
        </Dialog>

        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          allProperties={properties.map((row) => ({
            id: row.id,
            title: row.titulo,
            address: row.endereco,
            city: row.cidade,
            type: row.tipo,
            status: row.status,
            price: Number(row.preco),
            area: Number(row.area),
            bedrooms: row.quartos,
            bathrooms: row.banheiros,
            parking: row.vagas,
            broker: brokerName,
            image: row.imagens?.[0] || "/placeholder.svg",
            images: row.imagens || [],
            createdAt: row.created_at,
            decorated: row.decorado,
            seaView: row.vista_mar,
            acceptsExchange: row.aceita_permuta,
            paymentConditions: row.condicoes_pagamento || [],
            empreendimento: row.empreendimento || "",
            unitNumber: row.unidade || "",
            boxNumber: row.box || "",
            quadra: row.quadra || "",
            lote: row.lote || "",
            exclusivityTermUrl: row.termo_exclusividade_url || "",
            neighborhood: row.bairro || "",
          })) as any}
          brokerInfo={{ [brokerName]: { photo: avatarUrl, whatsapp } }}
          onSelectSimilar={(p: any) => setSelectedProperty(p)}
        />
      </main>


      <footer className="border-t border-border bg-card">
        <div className="container flex flex-col gap-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-foreground">{brokerName}{creci && ` · CRECI ${creci}`}</p>
            <p>{config?.footer_text || "Portfólio público de imóveis atualizado em tempo real."}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {email && (
              <a href={`mailto:${email}`} className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2.5 font-semibold text-foreground transition-colors hover:bg-muted">
                <Mail className="h-4 w-4" /> Email
              </a>
            )}
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}?text=${whatsappGeneral}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2.5 font-semibold text-accent-foreground transition-opacity hover:opacity-90">
                <Phone className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
