import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { MiniMap } from "@/components/MiniMap";
import { properties, formatCurrency, type Property } from "@/data/mockData";
import {
  ArrowLeft, Building2, MapPin, Layers, Calendar, Wrench,
  BedDouble, Bath, Car, Ruler, CheckCircle2, Clock, Home, Key,
  ShieldCheck, Dumbbell, Trees, Users, Wifi, Droplets, Zap, ParkingCircle,
  Download, Share2, Play, Image, ExternalLink, X, ChevronLeft, ChevronRight,
  TrendingUp, Percent, Camera, Waves, Paintbrush,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Extended properties
const allProperties: Property[] = [
  ...properties,
  {
    id: "site-1", title: "Apartamento Beira Mar Navegantes", address: "Av. Beira Mar, 1800",
    city: "Capão da Canoa", type: "Apartamento", status: "Disponível", price: 780000, area: 95,
    bedrooms: 2, bathrooms: 2, parking: 1, broker: "Ana Rodrigues",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
    images: [], createdAt: "2024-03-20", lat: -29.743, lng: -50.098,
    decorated: false, seaView: true, acceptsExchange: true,
    paymentConditions: ["48x", "Permuta"], empreendimento: "Ed. Navegantes",
    unitNumber: "Ap 501", boxNumber: "Box 15",
  },
  {
    id: "site-6", title: "Apartamento Alto Padrão Atlântida", address: "Av. Atlântida, 600",
    city: "Xangri-lá", type: "Apartamento", status: "Disponível", price: 1100000, area: 150,
    bedrooms: 3, bathrooms: 3, parking: 2, broker: "Marcos Oliveira",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop",
    images: [], createdAt: "2024-03-01", lat: -29.785, lng: -50.07,
    decorated: true, seaView: true, acceptsExchange: true,
    paymentConditions: ["60x", "Permuta"], empreendimento: "Ed. Alto Padrão Atlântida",
    unitNumber: "Ap 801", boxNumber: "Box 25, 26",
  },
];

interface EmpreendimentoInfo {
  description: string;
  address: string;
  city: string;
  features: string[];
  photos: string[];
  coverPhoto: string;
  totalUnits?: number;
  floors?: number;
  yearBuilt?: string;
  builder?: string;
  infrastructure?: string[];
  videoUrl?: string;
  lat?: number;
  lng?: number;
}

const empreendimentoInfo: Record<string, EmpreendimentoInfo> = {
  "Ed. Atlântico Sul": {
    description: "O Edifício Atlântico Sul é referência em sofisticação no litoral gaúcho. Com localização privilegiada à beira-mar, oferece apartamentos amplos com acabamento de alto padrão, vista permanente para o mar e infraestrutura completa de lazer.",
    address: "Av. Beira Mar, 1200", city: "Capão da Canoa",
    features: ["Piscina aquecida", "Salão de festas", "Academia", "Churrasqueira", "Playground", "Segurança 24h", "Garagem coberta"],
    infrastructure: ["2 Elevadores sociais", "Gerador de emergência", "Cisterna 30.000L", "CFTV 24h", "Portaria 24h"],
    photos: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop",
    ],
    coverPhoto: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=600&fit=crop",
    totalUnits: 48, floors: 12, yearBuilt: "2022", builder: "Construtora Atlântico",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    lat: -29.7456, lng: -50.1028,
  },
  "Ed. Panorama Beach": {
    description: "O Ed. Panorama Beach é um empreendimento exclusivo com coberturas duplex e vista panorâmica para o mar.",
    address: "Rua Sepé, 500", city: "Capão da Canoa",
    features: ["Vista panorâmica", "Piscina infinita", "Espaço gourmet", "Sauna", "Bicicletário", "Portaria 24h"],
    infrastructure: ["3 Elevadores", "Energia solar parcial", "CFTV com IA", "Gerador full"],
    photos: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",
    ],
    coverPhoto: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=600&fit=crop",
    totalUnits: 24, floors: 15, yearBuilt: "2023", builder: "Incorporadora Beach",
    lat: -29.7480, lng: -50.1065,
  },
  "Cond. Reserva das Dunas": {
    description: "O Condomínio Reserva das Dunas é um condomínio horizontal de alto padrão em Xangri-lá, cercado por natureza e próximo à praia.",
    address: "Rua das Hortênsias, 300", city: "Xangri-lá",
    features: ["Pórtico com segurança", "Ruas pavimentadas", "Praça central", "Área verde preservada", "Trilha ecológica"],
    infrastructure: ["Portaria blindada", "CFTV 24h", "Iluminação LED", "Rede de esgoto própria"],
    photos: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800&h=600&fit=crop",
    ],
    coverPhoto: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=600&fit=crop",
    totalUnits: 80, yearBuilt: "2021", builder: "Green Build",
    lat: -29.8050, lng: -50.0520,
  },
  "Centro Comercial Capão": {
    description: "O Centro Comercial Capão é o principal ponto comercial de Capão da Canoa.",
    address: "Av. Paraguassú, 800", city: "Capão da Canoa",
    features: ["Estacionamento rotativo", "Elevadores", "Acessibilidade", "Próximo ao centro"],
    infrastructure: ["2 Elevadores", "Gerador parcial", "CFTV"],
    photos: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop",
    ],
    coverPhoto: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=600&fit=crop",
    totalUnits: 40, floors: 5, yearBuilt: "2018", builder: "Construtora Centro",
    lat: -29.7520, lng: -50.1100,
  },
  "Cond. Bosque do Litoral": {
    description: "Condomínio com lotes em meio a um bosque preservado no litoral norte gaúcho.",
    address: "Rua dos Coqueiros, 150", city: "Xangri-lá",
    features: ["Bosque preservado", "Segurança 24h", "Área de lazer", "Quadra poliesportiva"],
    infrastructure: ["Portaria 24h", "CFTV", "Iluminação pública interna"],
    photos: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800&h=600&fit=crop",
    ],
    coverPhoto: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&h=600&fit=crop",
    totalUnits: 60, yearBuilt: "2020", builder: "Green Build",
    lat: -29.8100, lng: -50.0450,
  },
  "Residencial Atlântida": {
    description: "Residencial localizado na Praia de Atlântida com apartamentos modernos e boa infraestrutura.",
    address: "Av. Central, 200", city: "Xangri-lá",
    features: ["Piscina", "Salão de festas", "Churrasqueira", "Playground"],
    infrastructure: ["Elevador", "Gerador", "CFTV", "Portaria eletrônica"],
    photos: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
    ],
    coverPhoto: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=600&fit=crop",
    totalUnits: 32, floors: 8, yearBuilt: "2019", builder: "Construtora Atlântida",
    lat: -29.7900, lng: -50.0650,
  },
  "Ed. Navegantes": {
    description: "Edifício com apartamentos funcionais e vista mar, localizado na avenida principal de Capão da Canoa.",
    address: "Av. Beira Mar, 1800", city: "Capão da Canoa",
    features: ["Vista mar", "Elevador", "Portaria eletrônica", "Garagem"],
    infrastructure: ["Elevador", "Portaria eletrônica", "CFTV"],
    photos: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&h=600&fit=crop",
    ],
    coverPhoto: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=600&fit=crop",
    totalUnits: 30, floors: 10, yearBuilt: "2021", builder: "Construtora Navegantes",
    lat: -29.743, lng: -50.098,
  },
  "Ed. Alto Padrão Atlântida": {
    description: "Empreendimento de alto padrão na Praia de Atlântida, com acabamentos premium.",
    address: "Av. Atlântida, 600", city: "Xangri-lá",
    features: ["Alto padrão", "Piscina aquecida", "Spa", "Academia", "Salão gourmet", "Segurança 24h"],
    infrastructure: ["3 Elevadores", "Energia solar", "Gerador full", "CFTV com IA"],
    photos: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
    ],
    coverPhoto: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=600&fit=crop",
    totalUnits: 20, floors: 14, yearBuilt: "2024", builder: "Incorporadora Premium",
    lat: -29.785, lng: -50.07,
  },
};

const statusConfig: Record<string, { color: string; bg: string; bgLight: string; border: string; icon: typeof Home }> = {
  Disponível: { color: "text-success", bg: "bg-success", bgLight: "bg-success/10", border: "border-success/30", icon: Home },
  Vendido: { color: "text-destructive", bg: "bg-destructive", bgLight: "bg-destructive/10", border: "border-destructive/30", icon: CheckCircle2 },
  Reservado: { color: "text-warning", bg: "bg-warning", bgLight: "bg-warning/10", border: "border-warning/30", icon: Clock },
  Alugado: { color: "text-info", bg: "bg-info", bgLight: "bg-info/10", border: "border-info/30", icon: Key },
};

const amenityIcons: Record<string, typeof Dumbbell> = {
  Piscina: Droplets, "Piscina aquecida": Droplets, "Piscina infinita": Droplets,
  Academia: Dumbbell, "Segurança 24h": ShieldCheck, Playground: Home,
  "Salão de festas": Users, "Salão de Festas": Users, "Salão gourmet": Users,
  "Espaço gourmet": Users, Quadra: Dumbbell, "Quadra poliesportiva": Dumbbell,
  Churrasqueira: Home, "Área verde preservada": Trees, "Área de lazer": Trees,
  "Bosque preservado": Trees, "Trilha ecológica": Trees,
  "Wi-Fi": Wifi, Elevador: Layers, "Elevadores": Layers,
  Estacionamento: ParkingCircle, "Estacionamento rotativo": ParkingCircle,
  "Energia Solar": Zap, "Vista mar": Waves, "Vista panorâmica": Waves,
  "Alto padrão": ShieldCheck, Sauna: Droplets, Spa: Droplets,
  "Bicicletário": Home, "Portaria 24h": ShieldCheck, "Portaria eletrônica": ShieldCheck,
  "Pórtico com segurança": ShieldCheck, "Ruas pavimentadas": Home,
  "Praça central": Trees, Acessibilidade: Users, "Próximo ao centro": MapPin,
  Garagem: Car, "Garagem coberta": Car,
};

function slugify(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function empreendimentoSlug(name: string) {
  return slugify(name);
}

function InfraGallery({ photos, onSelect }: { photos: { url: string; label: string }[]; onSelect: (idx: number) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {photos.map((photo, idx) => (
        <button key={idx} onClick={() => onSelect(idx)} className="group relative rounded-xl overflow-hidden aspect-[3/2] border border-border hover:border-accent/50 transition-all">
          <img src={photo.url} alt={photo.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
          <span className="absolute bottom-2 left-2 text-xs font-semibold text-primary-foreground">{photo.label}</span>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Image className="w-6 h-6 text-primary-foreground drop-shadow-lg" />
          </div>
        </button>
      ))}
    </div>
  );
}

function PhotoLightbox({ photos, startIdx, onClose }: { photos: { url: string; label: string }[]; startIdx: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIdx);
  return (
    <div className="fixed inset-0 bg-foreground/90 z-50 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-primary-foreground/80 hover:text-primary-foreground z-10"><X className="w-7 h-7" /></button>
      <button onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c - 1 + photos.length) % photos.length); }} className="absolute left-4 text-primary-foreground/80 hover:text-primary-foreground z-10"><ChevronLeft className="w-8 h-8" /></button>
      <button onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c + 1) % photos.length); }} className="absolute right-4 text-primary-foreground/80 hover:text-primary-foreground z-10"><ChevronRight className="w-8 h-8" /></button>
      <div className="max-w-4xl max-h-[80vh] px-12" onClick={(e) => e.stopPropagation()}>
        <img src={photos[current].url} alt={photos[current].label} className="w-full h-full object-contain rounded-lg" />
        <p className="text-center text-primary-foreground text-sm mt-3 font-medium">{photos[current].label} — {current + 1}/{photos.length}</p>
      </div>
    </div>
  );
}

export default function EmpreendimentoDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const empName = Object.keys(empreendimentoInfo).find((name) => slugify(name) === slug);
  const info = empName ? empreendimentoInfo[empName] : null;
  const empProperties = allProperties.filter((p) => p.empreendimento && slugify(p.empreendimento) === slug);

  if (!info || !empName) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-muted-foreground">
          <Building2 className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p className="text-lg">Empreendimento não encontrado</p>
          <Link to="/imoveis" className="text-accent hover:underline mt-2 inline-block">Voltar</Link>
        </div>
      </AppLayout>
    );
  }

  const stats = {
    disponivel: empProperties.filter((p) => p.status === "Disponível").length,
    vendido: empProperties.filter((p) => p.status === "Vendido").length,
    reservado: empProperties.filter((p) => p.status === "Reservado").length,
    alugado: empProperties.filter((p) => p.status === "Alugado").length,
  };

  const totalRevenue = empProperties.filter((p) => p.status === "Vendido").reduce((s, p) => s + p.price, 0);
  const totalPotential = empProperties.reduce((s, p) => s + p.price, 0);
  const soldPercent = empProperties.length > 0 ? Math.round((stats.vendido / empProperties.length) * 100) : 0;

  const infraPhotos = info.photos.map((url, i) => ({ url, label: info.features[i] || `Foto ${i + 1}` }));

  function shareWhatsApp() {
    const text = `🏢 *${empName}*\n📍 ${info!.address}, ${info!.city}\n\n📊 Espelho de Vendas:\n✅ ${stats.disponivel} Disponíveis\n🔴 ${stats.vendido} Vendidos\n🟡 ${stats.reservado} Reservados\n🔵 ${stats.alugado} Alugados\n\n💰 VGV: ${formatCurrency(totalPotential)}\n\n🔗 Veja mais: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/imoveis" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{empName}</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{info.address}, {info.city}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start">
            <button onClick={shareWhatsApp}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-success text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              <Share2 className="w-4 h-4" /> WhatsApp
            </button>
            {info.videoUrl && (
              <a href={info.videoUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors">
                <Play className="w-4 h-4" /> Vídeo
              </a>
            )}
          </div>
        </div>

        {/* Hero Image + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-xl overflow-hidden h-64">
            <img src={info.coverPhoto} alt={empName} className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Disponíveis", value: stats.disponivel, color: "text-success", bg: "bg-success/10" },
              { label: "Vendidos", value: stats.vendido, color: "text-destructive", bg: "bg-destructive/10" },
              { label: "Reservados", value: stats.reservado, color: "text-warning", bg: "bg-warning/10" },
              { label: "Alugados", value: stats.alugado, color: "text-info", bg: "bg-info/10" },
            ].map((s) => (
              <div key={s.label} className={cn("rounded-xl p-4 flex flex-col items-center justify-center", s.bg)}>
                <span className={cn("text-3xl font-bold", s.color)}>{s.value}</span>
                <span className="text-xs text-muted-foreground mt-1">{s.label}</span>
              </div>
            ))}
            <div className="rounded-xl bg-accent/10 p-4 text-center">
              <p className="text-xs text-muted-foreground">Receita</p>
              <p className="text-base font-bold text-accent">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="rounded-xl bg-accent/10 p-4 text-center flex flex-col items-center justify-center">
              <Percent className="w-4 h-4 text-accent mb-1" />
              <p className="text-xl font-bold text-accent">{soldPercent}%</p>
              <p className="text-[10px] text-muted-foreground">vendido</p>
            </div>
          </div>
        </div>

        {/* Info Bar */}
        <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-card border border-border">
          {[
            ...(info.floors ? [{ icon: Layers, label: `${info.floors} andares` }] : []),
            { icon: Building2, label: `${info.totalUnits || empProperties.length} unidades` },
            ...(info.builder ? [{ icon: Wrench, label: info.builder }] : []),
            ...(info.yearBuilt ? [{ icon: Calendar, label: `Ano ${info.yearBuilt}` }] : []),
            { icon: TrendingUp, label: `VGV: ${formatCurrency(totalPotential)}` },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
              <item.icon className="w-4 h-4 text-accent" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="rounded-xl bg-card border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-2">Sobre o Empreendimento</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{info.description}</p>
        </div>

        {/* Location Map */}
        {info.lat && info.lng && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent" /> Localização
              </h3>
              <a href={`https://www.google.com/maps?q=${info.lat},${info.lng}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-info/10 text-info text-xs font-semibold hover:bg-info/20 transition-colors border border-info/20">
                <ExternalLink className="w-3 h-3" /> Abrir no Google Maps
              </a>
            </div>
            <MiniMap lat={info.lat} lng={info.lng} name={empName} height="200px" />
          </div>
        )}

        <Tabs defaultValue="imoveis" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="imoveis">Imóveis</TabsTrigger>
            <TabsTrigger value="espelho">Espelho de Vendas</TabsTrigger>
            <TabsTrigger value="infra">Infraestrutura</TabsTrigger>
          </TabsList>

          {/* Imóveis */}
          <TabsContent value="imoveis" className="space-y-3">
            {empProperties.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhum imóvel cadastrado neste empreendimento</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {empProperties.map((property) => (
                  <div key={property.id} className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-40 overflow-hidden">
                      <img src={property.images?.[0] || property.image} alt={property.title} className="w-full h-full object-cover" />
                      <span className={cn("absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold text-primary-foreground",
                        property.status === "Disponível" ? "bg-success" :
                        property.status === "Vendido" ? "bg-destructive" :
                        property.status === "Reservado" ? "bg-warning" : "bg-info"
                      )}>{property.status}</span>
                      <div className="absolute bottom-2 left-2 flex gap-1">
                        {property.seaView && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/90 text-white flex items-center gap-0.5"><Waves className="w-2.5 h-2.5" /></span>}
                        {property.decorated && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/90 text-white flex items-center gap-0.5"><Paintbrush className="w-2.5 h-2.5" /></span>}
                      </div>
                      <p className="absolute bottom-2 right-2 text-base font-bold text-white drop-shadow-lg">{formatCurrency(property.price)}</p>
                    </div>
                    <div className="p-3 space-y-2">
                      <h3 className="font-semibold text-foreground text-sm">{property.title}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{property.address}, {property.city}</span>
                      </div>
                      {(property.unitNumber || property.boxNumber || property.quadra || property.lote) && (
                        <div className="flex flex-wrap gap-1">
                          {property.unitNumber && <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{property.unitNumber}</span>}
                          {property.boxNumber && <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{property.boxNumber}</span>}
                          {property.quadra && <span className="text-[10px] font-semibold text-info bg-info/10 px-1.5 py-0.5 rounded">{property.quadra}</span>}
                          {property.lote && <span className="text-[10px] font-semibold text-info bg-info/10 px-1.5 py-0.5 rounded">{property.lote}</span>}
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground border-t border-border pt-2">
                        {property.area > 0 && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{property.area}m²</span>}
                        {property.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{property.bedrooms}q</span>}
                        {property.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{property.bathrooms}b</span>}
                        {property.parking > 0 && <span className="flex items-center gap-1"><Car className="w-3 h-3" />{property.parking}v</span>}
                      </div>
                      {property.paymentConditions && property.paymentConditions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {property.paymentConditions.map((c) => (
                            <span key={c} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success">{c}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Espelho de Vendas */}
          <TabsContent value="espelho" className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center">
                {Object.entries(statusConfig).map(([key, cfg]) => {
                  const count = key === "Disponível" ? stats.disponivel : key === "Vendido" ? stats.vendido : key === "Reservado" ? stats.reservado : stats.alugado;
                  return (
                    <button key={key} onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                      className={cn("flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all",
                        statusFilter === key ? `${cfg.bgLight} ${cfg.border} ${cfg.color} font-semibold` : "border-transparent hover:bg-muted/50"
                      )}>
                      <span className={cn("w-3 h-3 rounded-sm", cfg.bg)} />
                      <span>{key}</span>
                      <span className="text-muted-foreground">({count})</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Progresso vendas:</span>
                <div className="w-32 h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${soldPercent}%` }} />
                </div>
                <span className="font-semibold text-accent">{soldPercent}%</span>
              </div>
            </div>

            {/* Properties as espelho */}
            <div className="overflow-x-auto rounded-xl border border-border bg-card p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                {empProperties.map((p) => {
                  const cfg = statusConfig[p.status];
                  const dimmed = statusFilter && p.status !== statusFilter;
                  return (
                    <div key={p.id}
                      className={cn("rounded-lg p-3 text-center border transition-all",
                        cfg.bg, cfg.border, "text-primary-foreground",
                        dimmed && "opacity-20"
                      )}>
                      <p className="text-xs font-bold">{p.unitNumber || p.title.slice(0, 15)}</p>
                      <p className="text-[9px] opacity-80 mt-0.5">{p.type}</p>
                      <p className="text-[10px] font-semibold mt-1">{formatCurrency(p.price)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Preço médio", value: empProperties.length > 0 ? formatCurrency(totalPotential / empProperties.length) : "—" },
                { label: "Menor preço", value: empProperties.length > 0 ? formatCurrency(Math.min(...empProperties.map((p) => p.price))) : "—" },
                { label: "Maior preço", value: empProperties.length > 0 ? formatCurrency(Math.max(...empProperties.map((p) => p.price))) : "—" },
                { label: "VGV Total", value: formatCurrency(totalPotential) },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl bg-muted/50 border border-border text-center">
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Infrastructure */}
          <TabsContent value="infra" className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">Fotos</h3>
                <span className="text-xs text-muted-foreground">{infraPhotos.length} fotos</span>
              </div>
              <InfraGallery photos={infraPhotos} onSelect={setLightboxIdx} />
            </div>

            {info.videoUrl && (
              <a href={info.videoUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border hover:border-accent/40 transition-colors group">
                <div className="w-14 h-14 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0 group-hover:bg-destructive/20 transition-colors">
                  <Play className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Assistir tour virtual</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Abrir vídeo em nova aba</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
              </a>
            )}

            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">Comodidades</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {info.features.map((a) => {
                  const Icon = amenityIcons[a] || Home;
                  return (
                    <div key={a} className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50 border border-border">
                      <Icon className="w-5 h-5 text-accent" /><span className="text-sm text-foreground">{a}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {info.infrastructure && info.infrastructure.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3">Infraestrutura</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {info.infrastructure.map((item) => (
                    <div key={item} className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50 border border-border">
                      <Wrench className="w-4 h-4 text-accent" /><span className="text-sm text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Lightbox */}
        {lightboxIdx !== null && (
          <PhotoLightbox photos={infraPhotos} startIdx={lightboxIdx} onClose={() => setLightboxIdx(null)} />
        )}
      </div>
    </AppLayout>
  );
}
