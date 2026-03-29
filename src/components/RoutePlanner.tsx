import { useState, useEffect } from "react";
import { formatCurrency, type Property } from "@/data/mockData";
import {
  Navigation,
  X,
  MapPin,
  Trash2,
  ChevronUp,
  ChevronDown,
  Route,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RoutePlannerProps {
  properties: Property[];
}

export function RoutePlanner({ properties }: RoutePlannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [showAppChoice, setShowAppChoice] = useState(false);

  // Sync ordered list with incoming favorites
  useEffect(() => {
    setOrderedIds((prev) => {
      const propIds = new Set(properties.map((p) => p.id));
      // Keep existing order for props that still exist, add new ones at end
      const kept = prev.filter((id) => propIds.has(id));
      const newOnes = properties
        .filter((p) => !kept.includes(p.id))
        .map((p) => p.id);
      return [...kept, ...newOnes];
    });
  }, [properties]);

  const orderedProperties = orderedIds
    .map((id) => properties.find((p) => p.id === id))
    .filter(Boolean) as Property[];

  const removeFromRoute = (id: string) => {
    setOrderedIds((prev) => prev.filter((x) => x !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setOrderedIds((prev) => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  };

  const moveDown = (index: number) => {
    setOrderedIds((prev) => {
      if (index >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  };

  const openGoogleMaps = () => {
    if (orderedProperties.length === 0) return;
    const waypoints = orderedProperties.map((p) => `${p.lat},${p.lng}`);
    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const waypointsParam =
      waypoints.length > 2
        ? `&waypoints=${waypoints.slice(1, -1).join("|")}`
        : "";
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsParam}&travelmode=driving`;
    window.open(url, "_blank");
    setShowAppChoice(false);
  };

  const openWaze = () => {
    if (orderedProperties.length === 0) return;
    const dest = orderedProperties[orderedProperties.length - 1];
    const url = `https://waze.com/ul?ll=${dest.lat},${dest.lng}&navigate=yes`;
    window.open(url, "_blank");
    setShowAppChoice(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 left-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl font-bold text-sm transition-all hover:scale-105",
          properties.length > 0
            ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white"
            : "bg-white text-gray-800 border border-gray-200 hover:border-blue-300"
        )}
      >
        <Route className={cn("w-5 h-5", properties.length > 0 && "fill-current")} />
        Traçar Rota
        {properties.length > 0 && (
          <span className="ml-1 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">
            {properties.length}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-md">
                  <Route className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">
                    Rota de Visitas
                  </h2>
                  <p className="text-xs text-gray-500">
                    Imóveis selecionados para rota 📍
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {orderedProperties.length === 0 ? (
                <div className="p-8 text-center">
                  <Route className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-700 mb-1">
                    Nenhum imóvel na rota
                  </p>
                  <p className="text-xs text-gray-400">
                    Clique no 📍 dos imóveis para adicioná-los à rota de visitas
                  </p>
                </div>
              ) : (
                <div className="p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Ordem de visita ({orderedProperties.length} paradas)
                  </p>
                  <div className="space-y-2">
                    {orderedProperties.map((p, i) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 border border-rose-100"
                      >
                        <div className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-black flex-shrink-0">
                          {i + 1}
                        </div>
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {p.title}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">
                            {p.address}, {p.city}
                          </p>
                          <p className="text-xs font-bold text-amber-600">
                            {formatCurrency(p.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => moveUp(i)}
                            className="p-1 rounded hover:bg-rose-100 text-rose-600 disabled:opacity-30"
                            disabled={i === 0}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveDown(i)}
                            className="p-1 rounded hover:bg-rose-100 text-rose-600 disabled:opacity-30"
                            disabled={i === orderedProperties.length - 1}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFromRoute(p.id)}
                            className="p-1 rounded hover:bg-red-100 text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer action */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              {showAppChoice ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 text-center mb-3">
                    Escolha o aplicativo de navegação
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={openGoogleMaps}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border-2 border-gray-200 hover:border-blue-400 transition-all hover:shadow-md"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                        <Navigation className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        Google Maps
                      </span>
                      {orderedProperties.length > 2 && (
                        <span className="text-[10px] text-gray-500">
                          Com paradas intermediárias
                        </span>
                      )}
                    </button>
                    <button
                      onClick={openWaze}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border-2 border-gray-200 hover:border-cyan-400 transition-all hover:shadow-md"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                        <Navigation className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        Waze
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {orderedProperties.length > 1
                          ? "Último destino"
                          : "Navegação direta"}
                      </span>
                    </button>
                  </div>
                  <button
                    onClick={() => setShowAppChoice(false)}
                    className="w-full text-center text-xs text-gray-500 hover:text-gray-700 py-2"
                  >
                    Voltar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAppChoice(true)}
                  disabled={orderedProperties.length === 0}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold transition-all shadow-md",
                    orderedProperties.length > 0
                      ? "bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 hover:shadow-lg"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  <Navigation className="w-5 h-5" />
                  {orderedProperties.length > 0
                    ? `Iniciar Rota (${orderedProperties.length} ${orderedProperties.length === 1 ? "imóvel" : "imóveis"})`
                    : "Favorite imóveis para traçar rota"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
