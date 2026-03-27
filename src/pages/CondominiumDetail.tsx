import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { formatCurrency } from "@/data/mockData";
import {
  ArrowLeft,
  Fence,
  MapPin,
  Home,
  BedDouble,
  Bath,
  Car,
  Ruler,
  CheckCircle2,
  Clock,
  Key,
  ShieldCheck,
  Dumbbell,
  Trees,
  Users,
  Droplets,
  Wrench,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Unit {
  id: string;
  number: string;
  block: string;
  type: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  price: number;
  status: "Disponível" | "Vendido" | "Reservado" | "Alugado";
  buyer?: string;
}

interface CondoInfo {
  id: string;
  name: string;
  address: string;
  city: string;
  blocks: string[];
  totalUnits: number;
  monthlyFee: number;
  type: string;
  image: string;
  amenities: string[];
  infrastructure: string[];
  units: Unit[];
}

const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
  Disponível: { color: "text-success", bg: "bg-success", border: "border-success/30" },
  Vendido: { color: "text-destructive", bg: "bg-destructive", border: "border-destructive/30" },
  Reservado: { color: "text-warning", bg: "bg-warning", border: "border-warning/30" },
  Alugado: { color: "text-info", bg: "bg-info", border: "border-info/30" },
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
  Portaria: ShieldCheck,
};

function generateCondoUnits(blocks: string[], unitsPerBlock: number): Unit[] {
  const types = ["Casa Térrea", "Sobrado", "Apartamento 2Q", "Apartamento 3Q", "Casa Premium"];
  const units: Unit[] = [];
  let id = 1;

  for (const block of blocks) {
    for (let u = 1; u <= unitsPerBlock; u++) {
      const typeIdx = Math.floor(Math.random() * types.length);
      const type = types[typeIdx];
      const bedrooms = typeIdx < 2 ? 3 : typeIdx + 1;
      const area = 80 + bedrooms * 25 + Math.floor(Math.random() * 40);
      const price = area * (2200 + Math.floor(Math.random() * 1500));
      const statusRand = Math.random();
      const status: Unit["status"] = statusRand < 0.3 ? "Vendido" : statusRand < 0.45 ? "Reservado" : statusRand < 0.55 ? "Alugado" : "Disponível";

      units.push({
        id: String(id++),
        number: `${block}-${String(u).padStart(2, "0")}`,
        block,
        type,
        area,
        bedrooms,
        bathrooms: Math.max(1, bedrooms - 1),
        parking: bedrooms >= 3 ? 2 : 1,
        price,
        status,
        buyer: status === "Vendido" ? ["João Silva", "Maria Santos", "Pedro Lima", "Ana Costa"][Math.floor(Math.random() * 4)] : undefined,
      });
    }
  }
  return units;
}

const mockCondos: Record<string, CondoInfo> = {
  "1": {
    id: "1",
    name: "Alphaville Residencial",
    address: "Al. Araguaia, 1500",
    city: "Barueri",
    blocks: ["A", "B", "C", "D", "E"],
    totalUnits: 350,
    monthlyFee: 1800,
    type: "Horizontal",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=500&fit=crop",
    amenities: ["Piscina", "Academia", "Segurança 24h", "Playground", "Área Verde", "Churrasqueira"],
    infrastructure: ["Portaria blindada 24h", "CFTV com 120 câmeras", "Ruas asfaltadas", "Iluminação LED", "Rede de fibra óptica", "Coleta seletiva", "Reservatório 200.000L", "Parque linear"],
    units: generateCondoUnits(["A", "B", "C", "D", "E"], 12),
  },
  "2": {
    id: "2",
    name: "Condomínio Parque das Flores",
    address: "Rua das Orquídeas, 200",
    city: "São Paulo",
    blocks: ["T1", "T2", "T3"],
    totalUnits: 180,
    monthlyFee: 2500,
    type: "Vertical",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop",
    amenities: ["Piscina", "Salão de Festas", "Quadra", "Segurança 24h", "Academia"],
    infrastructure: ["3 Torres com 20 andares", "Elevadores inteligentes", "Gerador full", "Estação de tratamento", "Bicicletário", "Espaço coworking"],
    units: generateCondoUnits(["T1", "T2", "T3"], 15),
  },
  "3": {
    id: "3",
    name: "Vila Verde Condomínio",
    address: "Estrada Municipal, 3000",
    city: "Cotia",
    blocks: ["L1", "L2"],
    totalUnits: 90,
    monthlyFee: 950,
    type: "Horizontal",
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=500&fit=crop",
    amenities: ["Área Verde", "Portaria", "Churrasqueira"],
    infrastructure: ["Portaria com guarita", "CFTV básico", "Ruas de paralelepípedo", "Iluminação pública", "Poço artesiano"],
    units: generateCondoUnits(["L1", "L2"], 10),
  },
};

export default function CondominiumDetail() {
  const { id } = useParams<{ id: string }>();
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const condo = mockCondos[id || ""];

  if (!condo) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-muted-foreground">
          <Fence className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p className="text-lg">Condomínio não encontrado</p>
          <Link to="/condominios" className="text-accent hover:underline mt-2 inline-block">Voltar</Link>
        </div>
      </AppLayout>
    );
  }

  const stats = {
    disponivel: condo.units.filter((u) => u.status === "Disponível").length,
    vendido: condo.units.filter((u) => u.status === "Vendido").length,
    reservado: condo.units.filter((u) => u.status === "Reservado").length,
    alugado: condo.units.filter((u) => u.status === "Alugado").length,
  };

  const totalRevenue = condo.units.filter((u) => u.status === "Vendido").reduce((s, u) => s + u.price, 0);
  const totalPotential = condo.units.reduce((s, u) => s + u.price, 0);

  const displayedUnits = selectedBlock ? condo.units.filter((u) => u.block === selectedBlock) : condo.units;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/condominios" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{condo.name}</h1>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{condo.address}, {condo.city}</p>
            </div>
          </div>
        </div>

        {/* Hero + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-xl overflow-hidden h-64">
            <img src={condo.image} alt={condo.name} className="w-full h-full object-cover" />
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
            { icon: Layers, label: `${condo.blocks.length} blocos` },
            { icon: Home, label: `${condo.units.length} unidades` },
            { icon: Fence, label: condo.type },
            { icon: MapPin, label: `Taxa: ${formatCurrency(condo.monthlyFee)}/mês` },
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

            {condo.blocks.map((block) => {
              const blockUnits = condo.units.filter((u) => u.block === block);
              return (
                <div key={block} className="space-y-2">
                  <h4 className="text-sm font-bold text-foreground">Bloco {block}</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5">
                    {blockUnits.map((unit) => {
                      const cfg = statusConfig[unit.status];
                      return (
                        <button
                          key={unit.id}
                          onClick={() => setSelectedUnit(unit)}
                          className={cn(
                            "h-10 rounded-md text-[10px] font-bold transition-all hover:scale-105 hover:shadow-md flex items-center justify-center text-primary-foreground",
                            cfg.bg
                          )}
                          title={`${unit.number} - ${unit.type} - ${formatCurrency(unit.price)}`}
                        >
                          {unit.number.split("-")[1]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Unit Detail Modal */}
            {selectedUnit && (
              <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUnit(null)}>
                <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
                  <div className="p-5 border-b border-border flex items-center justify-between">
                    <h3 className="text-lg font-bold text-card-foreground">Unidade {selectedUnit.number}</h3>
                    <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold text-primary-foreground", statusConfig[selectedUnit.status].bg)}>
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
                        <p className="text-[10px] text-muted-foreground">Bloco</p>
                        <p className="text-sm font-semibold text-foreground">{selectedUnit.block}</p>
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
              <button onClick={() => setSelectedBlock(null)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", !selectedBlock ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted")}>
                Todos
              </button>
              {condo.blocks.map((b) => (
                <button key={b} onClick={() => setSelectedBlock(b)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", selectedBlock === b ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted")}>
                  Bloco {b}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs">
                    <th className="text-left py-3 px-3">Unid.</th>
                    <th className="text-left py-3 px-3">Bloco</th>
                    <th className="text-left py-3 px-3">Tipo</th>
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
                        <td className="py-2.5 px-3 text-muted-foreground">{unit.block}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{unit.type}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{unit.area}m²</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{unit.bedrooms}</td>
                        <td className="py-2.5 px-3 font-semibold text-foreground">{formatCurrency(unit.price)}</td>
                        <td className="py-2.5 px-3">
                          <span className={cn("px-2 py-0.5 rounded text-[11px] font-semibold text-primary-foreground", cfg.bg)}>{unit.status}</span>
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
                {condo.amenities.map((a) => {
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
                {condo.infrastructure.map((item) => (
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
