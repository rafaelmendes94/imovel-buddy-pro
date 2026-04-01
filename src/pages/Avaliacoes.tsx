import { useState } from "react";
import { SmartLayout } from "@/components/SmartLayout";
import { BackButton } from "@/components/BackButton";
import { properties, formatCurrency } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Home,
  MapPin,
  Ruler,
  BedDouble,
  Bath,
  Car,
  Eye,
  Paintbrush,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ExternalLink,
  Loader2,
  ClipboardCheck,
  ArrowRight,
  Zap,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

interface ValuationResult {
  marketValue: number;
  quickSaleValue: number;
  pricePerSqm: number;
  internalComparables: {
    id: string;
    title: string;
    price: number;
    similarity: string;
  }[];
  externalAnalysis: {
    zapMinPrice: number;
    zapMaxPrice: number;
    zapAvgPrice: number;
    totalListings: number;
    platforms: string;
    marketTrend: string;
  };
  justification: string;
  premiums: { factor: string; percentage: string }[];
}

const CITIES = ["Capão da Canoa", "Xangri-lá", "Atlântida", "Torres", "Tramandaí", "Imbé", "Cidreira"];
const TYPES = ["Apartamento", "Casa", "Comercial", "Terreno"];

export default function Avaliacoes() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);

  // Form state
  const [form, setForm] = useState({
    type: "Apartamento",
    city: "Capão da Canoa",
    address: "",
    area: "",
    bedrooms: "",
    bathrooms: "",
    parking: "",
    seaView: false,
    decorated: false,
    floor: "",
    condominium: "",
    description: "",
  });

  const updateForm = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.area || !form.city || !form.type) {
      toast.error("Preencha ao menos tipo, cidade e área.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const propertyData = {
        type: form.type,
        city: form.city,
        address: form.address,
        area: Number(form.area),
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        parking: Number(form.parking) || 0,
        seaView: form.seaView,
        decorated: form.decorated,
        floor: form.floor,
        condominium: form.condominium,
        description: form.description,
      };

      const existingProperties = properties.map((p) => ({
        id: p.id,
        title: p.title,
        city: p.city,
        type: p.type,
        price: p.price,
        area: p.area,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        parking: p.parking,
        seaView: p.seaView,
        decorated: p.decorated,
        empreendimento: p.empreendimento,
      }));

      const { data, error } = await supabase.functions.invoke("property-valuation", {
        body: { propertyData, existingProperties },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data);
      toast.success("Avaliação concluída!");
    } catch (err) {
      console.error("Valuation error:", err);
      toast.error("Erro ao gerar avaliação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const trendIcon = result?.externalAnalysis?.marketTrend === "alta"
    ? <TrendingUp className="w-4 h-4 text-green-500" />
    : result?.externalAnalysis?.marketTrend === "baixa"
    ? <TrendingDown className="w-4 h-4 text-red-500" />
    : <BarChart3 className="w-4 h-4 text-yellow-500" />;

  return (
    <SmartLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-accent" />
            Avaliações de Imóveis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Insira os dados do imóvel para obter uma avaliação de mercado com comparativos internos e pesquisa externa
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 elevated-card rounded-xl p-5 space-y-4 h-fit">
            <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <Home className="w-4 h-4 text-accent" />
              Dados do Imóvel
            </h3>

            {/* Type */}
            <div>
              <label className="text-xs text-muted-foreground font-medium">Tipo</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {TYPES.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => updateForm("type", t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      form.type === t
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* City */}
            <div>
              <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Cidade
              </label>
              <select
                value={form.city}
                onChange={(e) => updateForm("city", e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-card-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Address */}
            <div>
              <label className="text-xs text-muted-foreground font-medium">Endereço</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => updateForm("address", e.target.value)}
                placeholder="Av. Beira Mar, 500"
                className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-card-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>

            {/* Area + Bedrooms + Bathrooms + Parking */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Ruler className="w-3 h-3" /> Área (m²)
                </label>
                <input
                  type="number"
                  value={form.area}
                  onChange={(e) => updateForm("area", e.target.value)}
                  placeholder="120"
                  required
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-card-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <BedDouble className="w-3 h-3" /> Quartos
                </label>
                <input
                  type="number"
                  value={form.bedrooms}
                  onChange={(e) => updateForm("bedrooms", e.target.value)}
                  placeholder="3"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-card-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Bath className="w-3 h-3" /> Banheiros
                </label>
                <input
                  type="number"
                  value={form.bathrooms}
                  onChange={(e) => updateForm("bathrooms", e.target.value)}
                  placeholder="2"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-card-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Car className="w-3 h-3" /> Vagas
                </label>
                <input
                  type="number"
                  value={form.parking}
                  onChange={(e) => updateForm("parking", e.target.value)}
                  placeholder="2"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-card-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            </div>

            {/* Floor + Condo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Andar</label>
                <input
                  type="text"
                  value={form.floor}
                  onChange={(e) => updateForm("floor", e.target.value)}
                  placeholder="8º andar"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-card-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Condomínio/Edifício
                </label>
                <input
                  type="text"
                  value={form.condominium}
                  onChange={(e) => updateForm("condominium", e.target.value)}
                  placeholder="Ed. Atlântico Sul"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-card-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.seaView}
                  onChange={(e) => updateForm("seaView", e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-xs text-card-foreground flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Vista Mar
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.decorated}
                  onChange={(e) => updateForm("decorated", e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-xs text-card-foreground flex items-center gap-1">
                  <Paintbrush className="w-3 h-3" /> Decorado
                </span>
              </label>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-muted-foreground font-medium">Observações</label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Informações adicionais sobre o imóvel..."
                rows={3}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-card-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Avaliando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Avaliar Imóvel
                </>
              )}
            </button>
          </form>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            {!result && !loading && (
              <div className="elevated-card rounded-xl p-12 flex flex-col items-center justify-center text-center">
                <ClipboardCheck className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-card-foreground">Nenhuma avaliação realizada</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Preencha os dados do imóvel ao lado e clique em "Avaliar Imóvel" para obter uma análise completa de mercado.
                </p>
              </div>
            )}

            {loading && (
              <div className="elevated-card rounded-xl p-12 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
                <h3 className="text-lg font-semibold text-card-foreground">Analisando imóvel...</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Buscando comparativos internos e pesquisando plataformas externas
                </p>
              </div>
            )}

            {result && (
              <>
                {/* Main Values */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="elevated-card rounded-xl p-5 text-center border-2 border-accent/30">
                    <DollarSign className="w-6 h-6 text-accent mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Valor de Mercado</p>
                    <p className="text-xl font-bold text-accent mt-1">{formatCurrency(result.marketValue)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatCurrency(result.pricePerSqm)}/m²
                    </p>
                  </div>
                  <div className="elevated-card rounded-xl p-5 text-center">
                    <Zap className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Venda Rápida</p>
                    <p className="text-xl font-bold text-orange-500 mt-1">{formatCurrency(result.quickSaleValue)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {(((result.marketValue - result.quickSaleValue) / result.marketValue) * 100).toFixed(0)}% abaixo do mercado
                    </p>
                  </div>
                  <div className="elevated-card rounded-xl p-5 text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {trendIcon}
                      <span className="text-xs font-medium capitalize">{result.externalAnalysis.marketTrend}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Tendência</p>
                    <p className="text-lg font-bold text-card-foreground mt-1">
                      {formatCurrency(result.externalAnalysis.zapAvgPrice)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Média externa ({result.externalAnalysis.totalListings} anúncios)
                    </p>
                  </div>
                </div>

                {/* Premiums */}
                {result.premiums && result.premiums.length > 0 && (
                  <div className="elevated-card rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-card-foreground mb-3">
                      Fatores de Valorização / Desvalorização
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.premiums.map((p, i) => (
                        <Badge key={i} variant="outline" className="text-xs py-1 px-2.5">
                          {p.factor}: <span className="font-bold ml-1">{p.percentage}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Internal Comparables */}
                <div className="elevated-card rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
                    <Home className="w-4 h-4 text-accent" />
                    Comparativos Internos
                  </h3>
                  {result.internalComparables.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum comparativo encontrado na base interna.</p>
                  ) : (
                    <div className="space-y-2">
                      {result.internalComparables.map((comp) => (
                        <div key={comp.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <div className="flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-accent" />
                            <span className="text-sm font-medium text-card-foreground">{comp.title}</span>
                            <Badge variant="secondary" className="text-[10px]">{comp.similarity}</Badge>
                          </div>
                          <span className="text-sm font-bold text-accent">{formatCurrency(comp.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* External Analysis */}
                <div className="elevated-card rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-accent" />
                    Pesquisa Externa ({result.externalAnalysis.platforms})
                  </h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">Mínimo</p>
                      <p className="text-sm font-bold text-card-foreground">{formatCurrency(result.externalAnalysis.zapMinPrice)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">Média</p>
                      <p className="text-sm font-bold text-accent">{formatCurrency(result.externalAnalysis.zapAvgPrice)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">Máximo</p>
                      <p className="text-sm font-bold text-card-foreground">{formatCurrency(result.externalAnalysis.zapMaxPrice)}</p>
                    </div>
                  </div>
                  {/* Price bar */}
                  <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="absolute h-full bg-gradient-to-r from-green-500 via-accent to-red-500 rounded-full"
                      style={{ width: "100%" }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-card border-2 border-accent rounded-full"
                      style={{
                        left: `${Math.min(
                          100,
                          Math.max(
                            0,
                            ((result.marketValue - result.externalAnalysis.zapMinPrice) /
                              (result.externalAnalysis.zapMaxPrice - result.externalAnalysis.zapMinPrice)) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center mt-1">
                    Posição do valor de mercado na faixa externa
                  </p>
                </div>

                {/* Justification */}
                <div className="elevated-card rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-card-foreground mb-3">
                    Justificativa da Avaliação
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {result.justification}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </SmartLayout>
  );
}
