import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { formatCurrency } from "@/data/mockData";
import {
  ArrowLeft,
  Building,
  MapPin,
  Layers,
  Calendar,
  Wrench,
  BedDouble,
  Bath,
  Car,
  Ruler,
  CheckCircle2,
  Clock,
  Home,
  Key,
  ShieldCheck,
  Dumbbell,
  Trees,
  Users,
  Wifi,
  Droplets,
  Zap,
  ParkingCircle,
  Download,
  Share2,
  Play,
  Image,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Unit {
  id: string;
  number: string;
  floor: number;
  type: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  price: number;
  status: "Disponível" | "Vendido" | "Reservado" | "Alugado";
  buyer?: string;
}

interface InfraPhoto {
  url: string;
  label: string;
}

interface BuildingInfo {
  id: string;
  name: string;
  address: string;
  city: string;
  floors: number;
  totalUnits: number;
  builder: string;
  yearBuilt: string;
  status: string;
  image: string;
  amenities: string[];
  infrastructure: string[];
  infraPhotos: InfraPhoto[];
  videoUrl: string;
  downloadUrl: string;
  units: Unit[];
}

const statusConfig: Record<string, { color: string; bg: string; bgLight: string; border: string; icon: typeof Home }> = {
  Disponível: { color: "text-success", bg: "bg-success", bgLight: "bg-success/10", border: "border-success/30", icon: Home },
  Vendido: { color: "text-destructive", bg: "bg-destructive", bgLight: "bg-destructive/10", border: "border-destructive/30", icon: CheckCircle2 },
  Reservado: { color: "text-warning", bg: "bg-warning", bgLight: "bg-warning/10", border: "border-warning/30", icon: Clock },
  Alugado: { color: "text-info", bg: "bg-info", bgLight: "bg-info/10", border: "border-info/30", icon: Key },
};

const amenityIcons: Record<string, typeof Dumbbell> = {
  Piscina: Droplets, Academia: Dumbbell, "Segurança 24h": ShieldCheck, Playground: Home,
  "Salão de Festas": Users, Quadra: Dumbbell, Churrasqueira: Home, "Área Verde": Trees,
  "Wi-Fi": Wifi, Elevador: Layers, Estacionamento: ParkingCircle, "Energia Solar": Zap,
};

function generateUnits(floors: number, unitsPerFloor: number): Unit[] {
  const types = ["Studio", "1 Quarto", "2 Quartos", "3 Quartos", "Cobertura"];
  const units: Unit[] = [];
  let id = 1;
  for (let floor = 1; floor <= floors; floor++) {
    const count = floor === floors ? Math.max(1, Math.floor(unitsPerFloor / 2)) : unitsPerFloor;
    for (let u = 1; u <= count; u++) {
      const typeIdx = floor === floors ? 4 : Math.floor(Math.random() * 4);
      const type = types[typeIdx];
      const bedrooms = typeIdx === 0 ? 0 : typeIdx;
      const area = 35 + bedrooms * 30 + (floor === floors ? 80 : 0);
      const price = area * (2800 + floor * 100 + (floor === floors ? 3000 : 0));
      const statusRand = Math.random();
      const status = statusRand < 0.35 ? "Vendido" : statusRand < 0.55 ? "Reservado" : statusRand < 0.65 ? "Alugado" : "Disponível";
      units.push({
        id: String(id++), number: `${floor}${String(u).padStart(2, "0")}`, floor, type, area, bedrooms,
        bathrooms: Math.max(1, bedrooms), parking: bedrooms >= 2 ? 2 : 1, price, status,
        buyer: status === "Vendido" ? ["João Silva", "Maria Santos", "Pedro Lima", "Ana Costa"][Math.floor(Math.random() * 4)] : undefined,
      });
    }
  }
  return units;
}

const mockBuildings: Record<string, BuildingInfo> = {
  "1": {
    id: "1", name: "Edifício Aurora", address: "Av. Paulista, 1500", city: "São Paulo",
    floors: 25, totalUnits: 120, builder: "Construtora ABC", yearBuilt: "2024", status: "Pronto",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop",
    amenities: ["Piscina", "Academia", "Salão de Festas", "Playground", "Segurança 24h", "Área Verde"],
    infrastructure: ["3 Elevadores sociais", "1 Elevador de serviço", "Gerador de emergência", "Sistema de combate a incêndio", "Cisterna 50.000L", "Portaria blindada", "CFTV 24h", "Bicicletário"],
    infraPhotos: [
      { url: "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=600&h=400&fit=crop", label: "Piscina" },
      { url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop", label: "Academia" },
      { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop", label: "Salão de Festas" },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop", label: "Playground" },
      { url: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=600&h=400&fit=crop", label: "Hall de Entrada" },
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop", label: "Área Verde" },
    ],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    downloadUrl: "#",
    units: generateUnits(25, 5),
  },
  "2": {
    id: "2", name: "Torre Horizonte", address: "Rua Augusta, 2200", city: "São Paulo",
    floors: 32, totalUnits: 180, builder: "Incorporadora XYZ", yearBuilt: "2025", status: "Em construção",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=500&fit=crop",
    amenities: ["Piscina", "Academia", "Salão de Festas", "Quadra", "Segurança 24h", "Wi-Fi", "Estacionamento"],
    infrastructure: ["4 Elevadores sociais", "2 Elevadores de serviço", "Energia Solar", "Reuso de água", "Gerador full", "Portaria inteligente", "CFTV com IA", "Pet Place"],
    infraPhotos: [
      { url: "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=600&h=400&fit=crop", label: "Piscina" },
      { url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop", label: "Academia" },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop", label: "Quadra" },
      { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop", label: "Coworking" },
    ],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    downloadUrl: "#",
    units: generateUnits(32, 6),
  },
  "3": {
    id: "3", name: "Residencial Parque Verde", address: "Al. Santos, 800", city: "São Paulo",
    floors: 18, totalUnits: 72, builder: "Green Build", yearBuilt: "2026", status: "Lançamento",
    image: "https://images.unsplash.com/photo-1567449303078-57ad995bd329?w=800&h=500&fit=crop",
    amenities: ["Piscina", "Academia", "Churrasqueira", "Área Verde", "Segurança 24h"],
    infrastructure: ["2 Elevadores sociais", "Gerador parcial", "Cisterna 30.000L", "Portaria 24h", "CFTV", "Coworking"],
    infraPhotos: [
      { url: "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=600&h=400&fit=crop", label: "Piscina" },
      { url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop", label: "Academia" },
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop", label: "Churrasqueira" },
    ],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    downloadUrl: "#",
    units: generateUnits(18, 4),
  },
};

function InfraGallery({ photos, onSelect }: { photos: InfraPhoto[]; onSelect: (idx: number) => void }) {
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

function PhotoLightbox({ photos, startIdx, onClose }: { photos: InfraPhoto[]; startIdx: number; onClose: () => void }) {
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

function shareWhatsApp(name: string, address: string, city: string, stats: Record<string, number>, url: string) {
  const text = `🏢 *${name}*\n📍 ${address}, ${city}\n\n📊 Espelho de Vendas:\n✅ ${stats.disponivel} Disponíveis\n🔴 ${stats.vendido} Vendidos\n🟡 ${stats.reservado} Reservados\n🔵 ${stats.alugado} Alugados\n\n🔗 Veja mais: ${url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

export default function BuildingDetail() {
  const { id } = useParams<{ id: string }>();
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const building = mockBuildings[id || ""];

  if (!building) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-muted-foreground">
          <Building className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p className="text-lg">Edifício não encontrado</p>
          <Link to="/edificios" className="text-accent hover:underline mt-2 inline-block">Voltar</Link>
        </div>
      </AppLayout>
    );
  }

  const stats = {
    disponivel: building.units.filter((u) => u.status === "Disponível").length,
    vendido: building.units.filter((u) => u.status === "Vendido").length,
    reservado: building.units.filter((u) => u.status === "Reservado").length,
    alugado: building.units.filter((u) => u.status === "Alugado").length,
  };

  const totalRevenue = building.units.filter((u) => u.status === "Vendido").reduce((s, u) => s + u.price, 0);
  const totalPotential = building.units.reduce((s, u) => s + u.price, 0);
  const soldPercent = building.units.length > 0 ? Math.round((stats.vendido / building.units.length) * 100) : 0;

  const floors = Array.from({ length: building.floors }, (_, i) => building.floors - i);
  const displayedUnits = selectedFloor
    ? building.units.filter((u) => u.floor === selectedFloor)
    : building.units;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/edificios" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{building.name}</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{building.address}, {building.city}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start">
            <button
              onClick={() => shareWhatsApp(building.name, building.address, building.city, stats, window.location.href)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-success text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Share2 className="w-4 h-4" /> WhatsApp
            </button>
            <a href={building.downloadUrl} download className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">
              <Download className="w-4 h-4" /> Baixar
            </a>
            {building.videoUrl && (
              <a href={building.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors">
                <Play className="w-4 h-4" /> Vídeo
              </a>
            )}
          </div>
        </div>

        {/* Hero Image + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-xl overflow-hidden h-64">
            <img src={building.image} alt={building.name} className="w-full h-full object-cover" />
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
            { icon: Layers, label: `${building.floors} andares` },
            { icon: Building, label: `${building.units.length} unidades` },
            { icon: Wrench, label: building.builder },
            { icon: Calendar, label: `Ano ${building.yearBuilt}` },
            { icon: TrendingUp, label: `VGV: ${formatCurrency(totalPotential)}` },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
              <item.icon className="w-4 h-4 text-accent" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <Tabs defaultValue="unidades" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="unidades">Imóveis à Venda</TabsTrigger>
            <TabsTrigger value="espelho">Espelho de Vendas</TabsTrigger>
            <TabsTrigger value="infra">Infraestrutura</TabsTrigger>
          </TabsList>

          {/* Units for Sale (only available) */}
          <TabsContent value="unidades" className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setSelectedFloor(null)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", !selectedFloor ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted")}>Todos</button>
              {floors.map((f) => (
                <button key={f} onClick={() => setSelectedFloor(f)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", selectedFloor === f ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted")}>{f}º</button>
              ))}
            </div>
            {(() => {
              const activeUnits = displayedUnits.filter((u) => u.status === "Disponível");
              if (activeUnits.length === 0) return <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma unidade disponível neste filtro</p>;
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeUnits.map((unit) => {
                    const unitImage = building.infraPhotos[Math.abs(Number(unit.id)) % building.infraPhotos.length]?.url || building.image;
                    return (
                      <div key={unit.id} className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedUnit(unit)}>
                        <div className="relative h-32 overflow-hidden">
                          <img src={unitImage} alt={`Unidade ${unit.number}`} className="w-full h-full object-cover" />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-success text-primary-foreground">Disponível</span>
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-card/90 text-foreground backdrop-blur-sm">{unit.number}</span>
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">{unit.type}</span>
                            <span className="text-xs text-muted-foreground">{unit.floor}º andar</span>
                          </div>
                          <p className="text-base font-bold text-accent">{formatCurrency(unit.price)}</p>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground border-t border-border pt-2">
                            <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{unit.area}m²</span>
                            <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{unit.bedrooms}q</span>
                            <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{unit.bathrooms}b</span>
                            <span className="flex items-center gap-1"><Car className="w-3 h-3" />{unit.parking}v</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </TabsContent>

          {/* Sales Mirror */}
          <TabsContent value="espelho" className="space-y-4">
            {/* Legend + filter */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center">
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all",
                      statusFilter === key ? `${cfg.bgLight} ${cfg.border} ${cfg.color} font-semibold` : "border-transparent hover:bg-muted/50"
                    )}
                  >
                    <span className={cn("w-3 h-3 rounded-sm", cfg.bg)} />
                    <span>{key}</span>
                    <span className="text-muted-foreground">({key === "Disponível" ? stats.disponivel : key === "Vendido" ? stats.vendido : key === "Reservado" ? stats.reservado : stats.alugado})</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Progresso vendas:</span>
                <div className="w-32 h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${soldPercent}%` }} />
                </div>
                <span className="font-semibold text-accent">{soldPercent}%</span>
              </div>
            </div>

            {/* Mirror Grid */}
            <div className="overflow-x-auto rounded-xl border border-border bg-card p-4">
              <div className="min-w-[600px]">
                {floors.map((floor) => {
                  const floorUnits = building.units.filter((u) => u.floor === floor);
                  return (
                    <div key={floor} className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-12 text-right text-[11px] font-mono text-muted-foreground pr-2 flex-shrink-0">{floor}º</span>
                      <div className="flex gap-1.5 flex-1">
                        {floorUnits.map((unit) => {
                          const cfg = statusConfig[unit.status];
                          const dimmed = statusFilter && unit.status !== statusFilter;
                          return (
                            <button
                              key={unit.id}
                              onClick={() => setSelectedUnit(unit)}
                              className={cn(
                                "flex-1 h-11 rounded-lg text-[10px] font-bold transition-all hover:scale-105 hover:shadow-lg flex flex-col items-center justify-center text-primary-foreground border",
                                cfg.bg, cfg.border,
                                dimmed && "opacity-20"
                              )}
                              title={`${unit.number} - ${unit.type} - ${formatCurrency(unit.price)}`}
                            >
                              <span>{unit.number}</span>
                              <span className="text-[8px] font-normal opacity-80">{unit.type.split(" ")[0]}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Preço médio", value: formatCurrency(totalPotential / building.units.length) },
                { label: "Menor preço", value: formatCurrency(Math.min(...building.units.map((u) => u.price))) },
                { label: "Maior preço", value: formatCurrency(Math.max(...building.units.map((u) => u.price))) },
                { label: "VGV Total", value: formatCurrency(totalPotential) },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl bg-muted/50 border border-border text-center">
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Infrastructure + Gallery merged */}
          <TabsContent value="infra" className="space-y-5">
            {/* Gallery on top */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">Fotos da Infraestrutura</h3>
                <span className="text-xs text-muted-foreground">{building.infraPhotos.length} fotos</span>
              </div>
              <InfraGallery photos={building.infraPhotos} onSelect={setLightboxIdx} />
            </div>

            {building.videoUrl && (
              <a href={building.videoUrl} target="_blank" rel="noopener noreferrer"
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
                {building.amenities.map((a) => {
                  const Icon = amenityIcons[a] || Home;
                  return (
                    <div key={a} className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50 border border-border">
                      <Icon className="w-5 h-5 text-accent" /><span className="text-sm text-foreground">{a}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">Infraestrutura</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {building.infrastructure.map((item) => (
                  <div key={item} className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50 border border-border">
                    <Wrench className="w-4 h-4 text-accent" /><span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Lightbox */}
        {lightboxIdx !== null && (
          <PhotoLightbox photos={building.infraPhotos} startIdx={lightboxIdx} onClose={() => setLightboxIdx(null)} />
        )}

        {/* Unit Detail Modal */}
        {selectedUnit && (
          <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUnit(null)}>
            <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-bold text-card-foreground">Unidade {selectedUnit.number}</h3>
                <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold text-primary-foreground", statusConfig[selectedUnit.status].bg)}>{selectedUnit.status}</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-[10px] text-muted-foreground">Tipo</p><p className="text-sm font-semibold text-foreground">{selectedUnit.type}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-[10px] text-muted-foreground">Andar</p><p className="text-sm font-semibold text-foreground">{selectedUnit.floor}º andar</p></div>
                  <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2"><Ruler className="w-3.5 h-3.5 text-muted-foreground" /><div><p className="text-[10px] text-muted-foreground">Área</p><p className="text-sm font-semibold text-foreground">{selectedUnit.area}m²</p></div></div>
                  <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2"><BedDouble className="w-3.5 h-3.5 text-muted-foreground" /><div><p className="text-[10px] text-muted-foreground">Quartos</p><p className="text-sm font-semibold text-foreground">{selectedUnit.bedrooms}</p></div></div>
                  <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2"><Bath className="w-3.5 h-3.5 text-muted-foreground" /><div><p className="text-[10px] text-muted-foreground">Banheiros</p><p className="text-sm font-semibold text-foreground">{selectedUnit.bathrooms}</p></div></div>
                  <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2"><Car className="w-3.5 h-3.5 text-muted-foreground" /><div><p className="text-[10px] text-muted-foreground">Vagas</p><p className="text-sm font-semibold text-foreground">{selectedUnit.parking}</p></div></div>
                </div>
                <div className="p-4 rounded-lg bg-accent/10 text-center">
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="text-xl font-bold text-accent">{formatCurrency(selectedUnit.price)}</p>
                </div>
                {selectedUnit.buyer && (
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-[10px] text-muted-foreground">Comprador</p><p className="text-sm font-semibold text-foreground">{selectedUnit.buyer}</p></div>
                )}
              </div>
              <div className="p-5 border-t border-border flex justify-between">
                <button
                  onClick={() => {
                    const text = `🏢 ${building.name} — Unidade ${selectedUnit.number}\n📐 ${selectedUnit.area}m² | ${selectedUnit.bedrooms} quartos\n💰 ${formatCurrency(selectedUnit.price)}\n📊 ${selectedUnit.status}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Share2 className="w-3.5 h-3.5" /> Enviar
                </button>
                <button onClick={() => setSelectedUnit(null)} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">Fechar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
