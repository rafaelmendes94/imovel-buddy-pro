import { useState } from "react";
import { formatCurrency, type Property } from "@/data/mockData";
import {
  Navigation,
  X,
  MapPin,
  Check,
  Trash2,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Route,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RoutePlannerProps {
  properties: Property[];
}

export function RoutePlanner({ properties }: RoutePlannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAppChoice, setShowAppChoice] = useState(false);

  const toggleProperty = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const removeProperty = (id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setSelectedIds((prev) => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  };

  const moveDown = (index: number) => {
    setSelectedIds((prev) => {
      if (index >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  };

  const selectedProperties = selectedIds
    .map((id) => properties.find((p) => p.id === id))
    .filter(Boolean) as Property[];

  const filteredProperties = properties.filter(
    (p) =>
      !selectedIds.includes(p.id) &&
      (!searchTerm ||
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openGoogleMaps = () => {
    if (selectedProperties.length === 0) return;
    const waypoints = selectedProperties.map(
      (p) => `${p.lat},${p.lng}`
    );
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
    if (selectedProperties.length === 0) return;
    // Waze only supports single destination, so we open the last one
    // For multiple stops, we use the first as navigate and show a note
    const dest = selectedProperties[selectedProperties.length - 1];
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
          selectedIds.length > 0
            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white"
            : "bg-white text-gray-800 border border-gray-200 hover:border-blue-300"
        )}
      >
        <Route className="w-5 h-5" />
        Traçar Rota
        {selectedIds.length > 0 && (
          <span className="ml-1 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">
            {selectedIds.length}
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-md">
                  <Route className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">
                    Planejar Rota
                  </h2>
                  <p className="text-xs text-gray-500">
                    Selecione imóveis para visitar
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
              {/* Selected properties - route order */}
              {selectedProperties.length > 0 && (
                <div className="p-4 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Rota ({selectedProperties.length} paradas)
                  </p>
                  <div className="space-y-2">
                    {selectedProperties.map((p, i) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100"
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {p.title}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">
                            {p.address}, {p.city}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => moveUp(i)}
                            className="p-1 rounded hover:bg-blue-100 text-blue-600 disabled:opacity-30"
                            disabled={i === 0}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveDown(i)}
                            className="p-1 rounded hover:bg-blue-100 text-blue-600 disabled:opacity-30"
                            disabled={i === selectedProperties.length - 1}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeProperty(p.id)}
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

              {/* Search */}
              <div className="p-4 pb-2">
                <div className="flex items-center bg-gray-100 rounded-xl px-3 py-2">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Buscar imóvel..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm bg-transparent focus:outline-none text-gray-900 placeholder:text-gray-400"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm("")}>
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Available properties */}
              <div className="p-4 pt-2 space-y-1.5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Imóveis disponíveis ({filteredProperties.length})
                </p>
                {filteredProperties.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Nenhum imóvel encontrado.
                  </p>
                )}
                {filteredProperties.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => toggleProperty(p.id)}
                    className="flex items-center gap-3 p-3 rounded-xl w-full text-left hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                  >
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
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
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                      {selectedIds.includes(p.id) && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
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
                      {selectedProperties.length > 2 && (
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
                        {selectedProperties.length > 1
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
                  disabled={selectedProperties.length === 0}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold transition-all shadow-md",
                    selectedProperties.length > 0
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 hover:shadow-lg"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  <Navigation className="w-5 h-5" />
                  {selectedProperties.length > 0
                    ? `Iniciar Rota (${selectedProperties.length} ${selectedProperties.length === 1 ? "imóvel" : "imóveis"})`
                    : "Selecione imóveis para traçar rota"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
