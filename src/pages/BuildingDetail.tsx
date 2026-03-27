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
  units: Unit[];
}

const statusConfig: Record<string, { color: string; bg: string; border: string; icon: typeof Home; short: string }> = {
  Disponível: { color: "text-success", bg: "bg-success", border: "border-success/30", icon: Home, short: "D" },
  Vendido: { color: "text-destructive", bg: "bg-destructive", border: "border-destructive/30", icon: CheckCircle2, short: "V" },
  Reservado: { color: "text-warning", bg: "bg-warning", border: "border-warning/30", icon: Clock, short: "R" },
  Alugado: { color: "text-info", bg: "bg-info", border: "border-info/30", icon: Key, short: "A" },
};

const amenityIcons: Record<string, typeof Dumbbell> = {
  Piscina: Droplets,
  Academia: Dumbbell,
  "Segurança 24h": ShieldCheck,
  Playground: Home,
  "Salão de Festas": Users,
  Quadra: Dumbbell,
  Churrasqueira: Home,
  "Área Verde": Trees,
  "Wi-Fi": Wifi,
  Elevador: Layers,
  Estacionamento: ParkingCircle,
  "Energia Solar": Zap,
};

function generateUnits(floors: number, unitsPerFloor: number): Unit[] {
  const types = ["Studio", "1 Quarto", "2 Quartos", "3 Quartos", "Cobertura"];
  const statuses: Unit["status"][] = ["Disponível", "Vendido", "Reservado", "Alugado"];
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
        id: String(id++),
        number: `${floor}${String(u).padStart(2, "0")}`,
        floor,
        type,
        area,
        bedrooms,
        bathrooms: Math.max(1, bedrooms),
        parking: bedrooms >= 2 ? 2 : 1,
        price,
        status,
        buyer: status === "Vendido" ? ["João Silva", "Maria Santos", "Pedro Lima", "Ana Costa"][Math.floor(Math.random() * 4)] : undefined,
      });
    }
  }
  return units;
}

const mockBuildings: Record<string, BuildingInfo> = {
  "1": {
    id: "1",
    name: "Edifício Aurora",
    address: "Av. Paulista, 1500",
    city: "São Paulo",
    floors: 25,
    totalUnits: 120,
    builder: "Construtora ABC",
    yearBuilt: "2024",
    status: "Pronto",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop",
    amenities: ["Piscina", "Academia", "Salão de Festas", "Playground", "Segurança 24h", "Área Verde"],
    infrastructure: ["3 Elevadores sociais", "1 Elevador de serviço", "Gerador de emergência", "Sistema de combate a incêndio", "Cisterna 50.000L", "Portaria blindada", "CFTV 24h", "Bicicletário"],
    units: generateUnits(25, 5),
  },
  "2": {
    id: "2",
    name: "Torre Horizonte",
    address: "Rua Augusta, 2200",
    city: "São Paulo",
    floors: 32,
    totalUnits: 180,
    builder: "Incorporadora XYZ",
    yearBuilt: "2025",
    status: "Em construção",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=500&fit=crop",
    amenities: ["Piscina", "Academia", "Salão de Festas", "Quadra", "Segurança 24h", "Wi-Fi", "Estacionamento"],
    infrastructure: ["4 Elevadores sociais", "2 Elevadores de serviço", "Energia Solar", "Reuso de água", "Gerador full", "Portaria inteligente", "CFTV com IA", "Pet Place"],
    units: generateUnits(32, 6),
  },
  "3": {
    id: "3",
    name: "Residencial Parque Verde",
    address: "Al. Santos, 800",
    city: "São Paulo",
    floors: 18,
    totalUnits: 72,
    builder: "Green Build",
    yearBuilt: "2026",
    status: "Lançamento",
    image: "https://images.unsplash.com/photo-1567449303078-57ad995bd329?w=800&h=500&fit=crop",
    amenities: ["Piscina", "Academia", "Churrasqueira", "Área Verde", "Segurança 24h"],
    infrastructure: ["2 Elevadores sociais", "Gerador parcial", "Cisterna 30.000L", "Portaria 24h", "CFTV", "Coworking"],
    units: generateUnits(18, 4),
  },
};

export default function BuildingDetail() {
  const { id } = useParams<{ id: string }>();
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

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

  const floors = Array.from({ length: building.floors }, (_, i) => building.floors - i);
  const displayedUnits = selectedFloor
    ? building.units.filter((u) => u.floor === selectedFloor)
    : building.units;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
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
            <div className="col-span-2 rounded-xl bg-accent/10 p-4 text-center">
              <p className="text-xs text-muted-foreground">Receita Vendas</p>
              <p className="text-lg font-bold text-accent">{formatCurrency(totalRevenue)}</p>
              <p className="text-[10px] text-muted-foreground">de {formatCurrency(totalPotential)} potencial</p>
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
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
              <item.icon className="w-4 h-4 text-accent" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <Tabs defaultValue="espelho" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="espelho">Espelho de Vendas</TabsTrigger>
            <TabsTrigger value="unidades">Unidades</TabsTrigger>
            <TabsTrigger value="infra">Infraestrutura</TabsTrigger>
          </TabsList>

          {/* Sales Mirror */}
          <TabsContent value="espelho" className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1.5 text-xs">
                  <span className={cn("w-3 h-3 rounded-sm", cfg.bg)} />
                  <span className="text-muted-foreground">{key}</span>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {floors.map((floor) => {
                  const floorUnits = building.units.filter((u) => u.floor === floor);
                  return (
                    <div key={floor} className="flex items-center gap-1 mb-1">
                      <span className="w-10 text-right text-[11px] font-mono text-muted-foreground pr-2">{floor}º</span>
                      <div className="flex gap-1 flex-1">
                        {floorUnits.map((unit) => {
                          const cfg = statusConfig[unit.status];
                          return (
                            <button
                              key={unit.id}
                              onClick={() => setSelectedUnit(unit)}
                              className={cn(
                                "flex-1 h-9 rounded-md text-[10px] font-bold transition-all hover:scale-105 hover:shadow-md flex items-center justify-center text-primary-foreground",
                                cfg.bg
                              )}
                              title={`${unit.number} - ${unit.type} - ${formatCurrency(unit.price)}`}
                            >
                              {unit.number}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Unit Detail Modal */}
            {selectedUnit && (
              <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUnit(null)}>
                <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
                  <div className="p-5 border-b border-border flex items-center justify-between">
                    <h3 className="text-lg font-bold text-card-foreground">Unidade {selectedUnit.number}</h3>
                    <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold border", statusConfig[selectedUnit.status].bg, "text-primary-foreground")}>
                      {selectedUnit.status}
                    </span>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground">Tipo</p>
                        <p className="text-sm font-semibold text-foreground">{selectedUnit.type}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground">Andar</p>
                        <p className="text-sm font-semibold text-foreground">{selectedUnit.floor}º andar</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2">
                        <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Área</p>
                          <p className="text-sm font-semibold text-foreground">{selectedUnit.area}m²</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2">
                        <BedDouble className="w-3.5 h-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Quartos</p>
                          <p className="text-sm font-semibold text-foreground">{selectedUnit.bedrooms}</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2">
                        <Bath className="w-3.5 h-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Banheiros</p>
                          <p className="text-sm font-semibold text-foreground">{selectedUnit.bathrooms}</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2">
                        <Car className="w-3.5 h-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Vagas</p>
                          <p className="text-sm font-semibold text-foreground">{selectedUnit.parking}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/10 text-center">
                      <p className="text-xs text-muted-foreground">Valor</p>
                      <p className="text-xl font-bold text-accent">{formatCurrency(selectedUnit.price)}</p>
                    </div>
                    {selectedUnit.buyer && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground">Comprador</p>
                        <p className="text-sm font-semibold text-foreground">{selectedUnit.buyer}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-5 border-t border-border flex justify-end">
                    <button onClick={() => setSelectedUnit(null)} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Units List */}
          <TabsContent value="unidades" className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setSelectedFloor(null)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", !selectedFloor ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted")}>
                Todos
              </button>
              {floors.map((f) => (
                <button key={f} onClick={() => setSelectedFloor(f)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", selectedFloor === f ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted")}>
                  {f}º
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs">
                    <th className="text-left py-3 px-3">Unid.</th>
                    <th className="text-left py-3 px-3">Tipo</th>
                    <th className="text-left py-3 px-3">Andar</th>
                    <th className="text-left py-3 px-3">Área</th>
                    <th className="text-left py-3 px-3">Quartos</th>
                    <th className="text-left py-3 px-3">Valor</th>
                    <th className="text-left py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedUnits.map((unit) => {
                    const cfg = statusConfig[unit.status];
                    return (
                      <tr key={unit.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedUnit(unit)}>
                        <td className="py-2.5 px-3 font-mono font-semibold text-foreground">{unit.number}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{unit.type}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{unit.floor}º</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{unit.area}m²</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{unit.bedrooms}</td>
                        <td className="py-2.5 px-3 font-semibold text-foreground">{formatCurrency(unit.price)}</td>
                        <td className="py-2.5 px-3">
                          <span className={cn("px-2 py-0.5 rounded text-[11px] font-semibold", cfg.bg, "text-primary-foreground")}>{unit.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Infrastructure */}
          <TabsContent value="infra" className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">Comodidades</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {building.amenities.map((a) => {
                  const Icon = amenityIcons[a] || Home;
                  return (
                    <div key={a} className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50 border border-border">
                      <Icon className="w-5 h-5 text-accent" />
                      <span className="text-sm text-foreground">{a}</span>
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
                    <Wrench className="w-4 h-4 text-accent" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
