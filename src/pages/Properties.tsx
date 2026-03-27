import { useState } from "react";
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
  ChevronDown,
  PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  Disponível: "bg-success/10 text-success",
  Vendido: "bg-muted text-muted-foreground",
  Reservado: "bg-warning/10 text-warning",
  Alugado: "bg-info/10 text-info",
};

const allStatuses: Property["status"][] = ["Disponível", "Vendido", "Reservado", "Alugado"];

export default function Properties() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("Todos");
  const [view, setView] = useState<"grid" | "list" | "map">("grid");
  const [propertyList, setPropertyList] = useState<Property[]>(initialProperties);

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
        {/* Header */}
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

        {/* Filters */}
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
            {["Todos", "Apartamento", "Casa", "Comercial", "Terreno"].map(
              (type) => (
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
              )
            )}
          </div>
          <div className="flex border border-input rounded-lg overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "p-2.5 transition-colors",
                view === "grid" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "p-2.5 transition-colors",
                view === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("map")}
              className={cn(
                "p-2.5 transition-colors",
                view === "map" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
              )}
            >
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
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

// ---- Status Dropdown ----
function StatusDropdown({
  currentStatus,
  onChangeStatus,
}: {
  currentStatus: Property["status"];
  onChangeStatus: (status: Property["status"]) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors",
          statusColors[currentStatus]
        )}
      >
        {currentStatus}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 animate-scale-in overflow-hidden min-w-[130px]">
          {allStatuses.map((status) => (
            <button
              key={status}
              onClick={() => {
                onChangeStatus(status);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-muted",
                status === currentStatus && "bg-muted"
              )}
            >
              <span className={cn("inline-block w-2 h-2 rounded-full mr-2", {
                "bg-success": status === "Disponível",
                "bg-muted-foreground": status === "Vendido",
                "bg-warning": status === "Reservado",
                "bg-info": status === "Alugado",
              })} />
              {status}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Confetti Overlay ----
function SoldConfetti() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.5}s`,
    color: ["hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--info))", "hsl(var(--warning))"][
      Math.floor(Math.random() * 4)
    ],
    size: Math.random() * 6 + 4,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-20 rounded-xl">
      {/* VENDIDO stamp */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-sold-stamp border-4 border-success text-success font-black text-3xl px-6 py-2 rounded-lg opacity-80 tracking-widest">
          VENDIDO!
        </div>
      </div>
      {/* Confetti particles */}
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
  const [showConfetti, setShowConfetti] = useState(false);
  const [animatePulse, setAnimatePulse] = useState(false);

  const handleStatusChange = (newStatus: Property["status"]) => {
    if (newStatus === "Vendido" && property.status !== "Vendido") {
      setShowConfetti(true);
      setAnimatePulse(true);
      setTimeout(() => setShowConfetti(false), 2000);
      setTimeout(() => setAnimatePulse(false), 800);
    }
    onStatusChange(property.id, newStatus);
  };

  return (
    <div
      className={cn(
        "elevated-card rounded-xl overflow-hidden group relative",
        animatePulse && "animate-sold-pulse"
      )}
    >
      {showConfetti && <SoldConfetti />}
      <div className="relative h-48 overflow-hidden">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <StatusDropdown
            currentStatus={property.status}
            onChangeStatus={handleStatusChange}
          />
        </div>
        <div className="absolute top-3 right-3 flex gap-1.5">
          <button className="w-8 h-8 rounded-lg bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors">
            <Download className="w-3.5 h-3.5 text-foreground" />
          </button>
          <button className="w-8 h-8 rounded-lg bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors">
            <Send className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-card-foreground text-sm">
            {property.title}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{property.address}</p>
          </div>
        </div>
        <p className="text-lg font-bold text-accent">
          {formatCurrency(property.price)}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
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
  const [showConfetti, setShowConfetti] = useState(false);
  const [animatePulse, setAnimatePulse] = useState(false);

  const handleStatusChange = (newStatus: Property["status"]) => {
    if (newStatus === "Vendido" && property.status !== "Vendido") {
      setShowConfetti(true);
      setAnimatePulse(true);
      setTimeout(() => setShowConfetti(false), 2000);
      setTimeout(() => setAnimatePulse(false), 800);
    }
    onStatusChange(property.id, newStatus);
  };

  return (
    <div
      className={cn(
        "elevated-card rounded-xl p-4 flex items-center gap-4 relative overflow-hidden",
        animatePulse && "animate-sold-pulse"
      )}
    >
      {showConfetti && <SoldConfetti />}
      <img
        src={property.image}
        alt={property.title}
        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-card-foreground text-sm truncate">
            {property.title}
          </h3>
          <StatusDropdown
            currentStatus={property.status}
            onChangeStatus={handleStatusChange}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{property.address}</p>
        <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
          {property.bedrooms > 0 && <span>{property.bedrooms} quartos</span>}
          <span>{property.area}m²</span>
          <span>{property.type}</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-base font-bold text-accent">
          {formatCurrency(property.price)}
        </p>
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
