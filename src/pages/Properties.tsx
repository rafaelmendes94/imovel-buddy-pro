import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PropertyMap } from "@/components/PropertyMap";
import { properties as initialProperties, formatCurrency, Property } from "@/data/mockData";
import {
  Building2,
  Search,
  Plus,
  MapPin,
  BedDouble,
  Bath,
  Car,
  Ruler,
  Download,
  Send,
  LayoutGrid,
  List,
  Map,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Home,
  Key,
  Trophy,
  FileCode,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type XmlPortal = "ZAP Imóveis" | "VivaReal" | "OLX" | "Imovelweb" | "Chaves na Mão" | "Personalizado";

const xmlPortals: { name: XmlPortal; description: string }[] = [
  { name: "ZAP Imóveis", description: "Formato padrão ZAP" },
  { name: "VivaReal", description: "Formato VivaReal/Grupo ZAP" },
  { name: "OLX", description: "Formato OLX Pro" },
  { name: "Imovelweb", description: "Formato Imovelweb" },
  { name: "Chaves na Mão", description: "Formato Chaves na Mão" },
  { name: "Personalizado", description: "XML genérico completo" },
];

function generateXml(properties: Property[], portal: XmlPortal): string {
  const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const items = properties
    .map(
      (p) => `    <Imovel>
      <CodigoImovel>${escapeXml(p.id)}</CodigoImovel>
      <TipoImovel>${escapeXml(p.type)}</TipoImovel>
      <SubTipoImovel>${escapeXml(p.type)}</SubTipoImovel>
      <TituloImovel>${escapeXml(p.title)}</TituloImovel>
      <Endereco>${escapeXml(p.address)}</Endereco>
      <Cidade>${escapeXml(p.city)}</Cidade>
      <Estado>SP</Estado>
      <CEP>00000-000</CEP>
      <PrecoVenda>${p.price}</PrecoVenda>
      <AreaUtil>${p.area}</AreaUtil>
      <QtdDormitorios>${p.bedrooms}</QtdDormitorios>
      <QtdBanheiros>${p.bathrooms}</QtdBanheiros>
      <QtdVagas>${p.parking}</QtdVagas>
      <StatusImovel>${escapeXml(p.status)}</StatusImovel>
      <Corretor>${escapeXml(p.broker)}</Corretor>
      <Latitude>${p.lat}</Latitude>
      <Longitude>${p.lng}</Longitude>
      <DataCriacao>${p.createdAt}</DataCriacao>
      <Fotos>
${p.images.map((img) => `        <Foto>${escapeXml(img)}</Foto>`).join("\n")}
      </Fotos>
    </Imovel>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Portal: ${portal} -->
<Imoveis xmlns="http://www.vivareal.com/schemas" portal="${portal}">
  <Header>
    <Publicador>MV Broker</Publicador>
    <DataExportacao>${new Date().toISOString()}</DataExportacao>
    <TotalImoveis>${properties.length}</TotalImoveis>
  </Header>
  <ListaImoveis>
${items}
  </ListaImoveis>
</Imoveis>`;
}

function downloadXml(xml: string, portal: string) {
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `imoveis_${portal.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xml`;
  a.click();
  URL.revokeObjectURL(url);
}

const statusConfig: Record<Property["status"], { color: string; bg: string; border: string; icon: typeof Home }> = {
  Disponível: { color: "text-success", bg: "bg-success/10", border: "border-success/30", icon: Home },
  Vendido: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", icon: CheckCircle2 },
  Reservado: { color: "text-warning", bg: "bg-warning/10", border: "border-warning/30", icon: Clock },
  Alugado: { color: "text-info", bg: "bg-info/10", border: "border-info/30", icon: Key },
};

const allStatuses: Property["status"][] = ["Disponível", "Vendido", "Reservado", "Alugado"];

export default function Properties() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("Todos");
  const [view, setView] = useState<"grid" | "list" | "map">("grid");
  const [propertyList, setPropertyList] = useState<Property[]>(initialProperties);
  const [showXmlMenu, setShowXmlMenu] = useState(false);
  const xmlMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (xmlMenuRef.current && !xmlMenuRef.current.contains(e.target as Node)) setShowXmlMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExportXml = (portal: XmlPortal) => {
    const available = propertyList.filter((p) => p.status === "Disponível");
    const xml = generateXml(available.length > 0 ? available : propertyList, portal);
    downloadXml(xml, portal);
    setShowXmlMenu(false);
  };

  const handleStatusChange = (propertyId: string, newStatus: Property["status"]) => {
    setPropertyList((prev) =>
      prev.map((p) => (p.id === propertyId ? { ...p, status: newStatus } : p))
    );
  };

  const filtered = propertyList.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "Todos" || p.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Imóveis</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {propertyList.length} imóveis cadastrados
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-opacity self-start">
            <Plus className="w-4 h-4" />
            Novo Imóvel
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome ou endereço..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            {["Todos", "Apartamento", "Casa", "Comercial", "Terreno"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                  filterType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                )}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="flex border border-input rounded-lg overflow-hidden">
            {([
              { key: "grid" as const, Icon: LayoutGrid },
              { key: "list" as const, Icon: List },
              { key: "map" as const, Icon: Map },
            ]).map(({ key, Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={cn(
                  "p-2.5 transition-colors",
                  view === key ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((property) => (
              <PropertyCard key={property.id} property={property} onStatusChange={handleStatusChange} />
            ))}
          </div>
        ) : view === "list" ? (
          <div className="space-y-3">
            {filtered.map((property) => (
              <PropertyRow key={property.id} property={property} onStatusChange={handleStatusChange} />
            ))}
          </div>
        ) : (
          <PropertyMap properties={filtered} />
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum imóvel encontrado</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ---- Image Carousel ----
function ImageCarousel({ images: rawImages, alt }: { images?: string[]; alt: string }) {
  const images = rawImages && rawImages.length > 0 ? rawImages : ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop"];
  const [current, setCurrent] = useState(0);

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));
  };

  return (
    <div className="relative h-48 overflow-hidden group/carousel">
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`${alt} ${i + 1}`}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-all duration-500",
            i === current ? "opacity-100 scale-100" : "opacity-0 scale-105"
          )}
        />
      ))}

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-foreground/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-foreground/80"
          >
            <ChevronLeft className="w-4 h-4 text-background" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-foreground/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-foreground/80"
          >
            <ChevronRight className="w-4 h-4 text-background" />
          </button>
          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  i === current ? "bg-background w-4" : "bg-background/50"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---- Status Bar (always visible, inline buttons) ----
function StatusBar({
  currentStatus,
  onChangeStatus,
}: {
  currentStatus: Property["status"];
  onChangeStatus: (status: Property["status"]) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {allStatuses.map((status) => {
        const config = statusConfig[status];
        const Icon = config.icon;
        const isActive = status === currentStatus;
        return (
          <button
            key={status}
            onClick={() => onChangeStatus(status)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border transition-all duration-200",
              isActive
                ? `${config.bg} ${config.color} ${config.border} shadow-sm`
                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
            )}
          >
            <Icon className="w-3 h-3" />
            {status}
          </button>
        );
      })}
    </div>
  );
}

// ---- Sold Celebration Overlay ----
function SoldCelebration() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${5 + Math.random() * 90}%`,
    delay: `${Math.random() * 0.6}s`,
    color: [
      "hsl(var(--accent))",
      "hsl(var(--success))",
      "hsl(var(--info))",
      "hsl(38 100% 65%)",
      "hsl(0 84% 60%)",
    ][Math.floor(Math.random() * 5)],
    size: Math.random() * 8 + 4,
    rotate: Math.random() * 360,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-20 rounded-xl">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-foreground/40 animate-[fade-in_0.3s_ease-out]" />

      {/* Trophy + text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center animate-sold-stamp">
        <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center mb-2 shadow-lg">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <div className="bg-card/95 backdrop-blur-sm rounded-lg px-5 py-2 shadow-xl border border-accent/30">
          <p className="text-lg font-black text-accent tracking-wider">VENDIDO!</p>
        </div>
      </div>

      {/* Confetti */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: p.left,
            top: "-10px",
            animationDelay: p.delay,
            width: p.size,
            height: p.size,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            backgroundColor: p.color,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

// ---- PropertyCard ----
function PropertyCard({
  property,
  onStatusChange,
}: {
  property: Property;
  onStatusChange: (id: string, status: Property["status"]) => void;
}) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [animatePulse, setAnimatePulse] = useState(false);

  const handleStatusChange = (newStatus: Property["status"]) => {
    if (newStatus === "Vendido" && property.status !== "Vendido") {
      setShowCelebration(true);
      setAnimatePulse(true);
      setTimeout(() => setShowCelebration(false), 2500);
      setTimeout(() => setAnimatePulse(false), 800);
    }
    onStatusChange(property.id, newStatus);
  };

  return (
    <div
      className={cn(
        "elevated-card rounded-xl overflow-hidden relative transition-all duration-300",
        animatePulse && "animate-sold-pulse"
      )}
    >
      {showCelebration && <SoldCelebration />}

      <ImageCarousel images={property.images} alt={property.title} />

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-card-foreground text-sm">{property.title}</h3>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{property.address}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-accent">{formatCurrency(property.price)}</p>
          <div className="flex gap-1.5">
            <button className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
              <Download className="w-3.5 h-3.5 text-foreground" />
            </button>
            <button className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
              <Send className="w-3.5 h-3.5 text-foreground" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground py-2 border-y border-border">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" /> {property.bedrooms}
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" /> {property.bathrooms}
            </span>
          )}
          {property.parking > 0 && (
            <span className="flex items-center gap-1">
              <Car className="w-3.5 h-3.5" /> {property.parking}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Ruler className="w-3.5 h-3.5" /> {property.area}m²
          </span>
        </div>

        <StatusBar currentStatus={property.status} onChangeStatus={handleStatusChange} />
      </div>
    </div>
  );
}

// ---- PropertyRow ----
function PropertyRow({
  property,
  onStatusChange,
}: {
  property: Property;
  onStatusChange: (id: string, status: Property["status"]) => void;
}) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [animatePulse, setAnimatePulse] = useState(false);

  const handleStatusChange = (newStatus: Property["status"]) => {
    if (newStatus === "Vendido" && property.status !== "Vendido") {
      setShowCelebration(true);
      setAnimatePulse(true);
      setTimeout(() => setShowCelebration(false), 2500);
      setTimeout(() => setAnimatePulse(false), 800);
    }
    onStatusChange(property.id, newStatus);
  };

  return (
    <div
      className={cn(
        "elevated-card rounded-xl p-4 flex items-center gap-4 relative overflow-hidden transition-all duration-300",
        animatePulse && "animate-sold-pulse"
      )}
    >
      {showCelebration && <SoldCelebration />}
      <img
        src={property.images[0]}
        alt={property.title}
        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <h3 className="font-semibold text-card-foreground text-sm truncate">{property.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{property.address}</p>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            {property.bedrooms > 0 && <span>{property.bedrooms} quartos</span>}
            <span>{property.area}m²</span>
            <span>{property.type}</span>
          </div>
        </div>
        <StatusBar currentStatus={property.status} onChangeStatus={handleStatusChange} />
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-base font-bold text-accent">{formatCurrency(property.price)}</p>
        <p className="text-xs text-muted-foreground mt-1">{property.broker}</p>
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        <button className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
          <Download className="w-3.5 h-3.5 text-foreground" />
        </button>
        <button className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
          <Send className="w-3.5 h-3.5 text-foreground" />
        </button>
      </div>
    </div>
  );
}
