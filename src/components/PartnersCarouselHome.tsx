import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Handshake, MapPin, Sparkles } from "lucide-react";

interface Partner {
  id: string;
  slug: string;
  name: string;
  category: string;
  city: string | null;
  logo_url: string | null;
  cover_url: string | null;
  description: string | null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function PartnersCarouselHome() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("partners")
      .select("id,slug,name,category,city,logo_url,cover_url,description")
      .eq("status", "active")
      .eq("featured", true)
      .then(({ data }) => setPartners(shuffle(data || [])));
  }, []);

  const shuffled = useMemo(() => partners, [partners]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-partner-card]");
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step * 1.5, behavior: "smooth" });
  };

  if (shuffled.length === 0) return null;

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-[11px] uppercase tracking-wider font-bold text-blue-500">
                Em destaque
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Nossos Parceiros
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollBy(-1)}
              className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={() => scrollBy(1)}
              className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition"
              aria-label="Próximo"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
            <Link
              to="/parceiros"
              className="ml-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition shadow-sm"
            >
              <Handshake className="w-4 h-4" />
              Ver todos
            </Link>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-1 px-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {shuffled.map((p) => (
            <Link
              key={p.id}
              to={`/parceiro/${p.slug}`}
              data-partner-card
              className="snap-start shrink-0 w-[260px] sm:w-[280px] group rounded-2xl overflow-hidden border border-gray-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <div className="relative h-32 bg-gradient-to-br from-blue-500 to-blue-400 overflow-hidden">
                {p.cover_url && (
                  <img
                    src={p.cover_url}
                    alt={p.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                {p.logo_url && (
                  <img
                    src={p.logo_url}
                    alt={`${p.name} logo`}
                    className="absolute bottom-3 left-3 w-14 h-14 rounded-xl object-cover border-2 border-white bg-white shadow-lg"
                  />
                )}
                <span className="absolute top-3 right-3 px-2 py-1 rounded-md bg-white/90 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  {p.category}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-extrabold text-gray-900 text-base line-clamp-1">
                  {p.name}
                </h3>
                {p.city && (
                  <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <MapPin className="w-3 h-3" /> {p.city}
                  </p>
                )}
                {p.description && (
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                    {p.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
