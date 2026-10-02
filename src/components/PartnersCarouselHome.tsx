import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Building2, ChevronLeft, ChevronRight, Handshake, MapPin, Sparkles } from "lucide-react";
import partnerAdBanner from "@/assets/partner-ad-banner.jpg";

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

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/planos?tipo=parceiro"
          aria-label="Conhecer os planos para parceiros"
          className="group relative flex min-h-[340px] overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-lg sm:min-h-[300px]"
        >
          <img
            src={partnerAdBanner}
            alt="Profissionais fechando uma parceria no mercado imobiliário"
            className="absolute inset-0 h-full w-full object-cover object-[66%_center] transition-transform duration-700 group-hover:scale-[1.02] sm:object-center"
          />
          <div className="absolute inset-0 bg-slate-950/45 sm:bg-slate-950/25" />
          <div className="relative z-10 flex w-full max-w-xl flex-col justify-center p-6 text-white sm:p-9 lg:p-11">
            <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase text-cyan-300">
              <Building2 className="h-4 w-4" />
              MV Broker Connect Parceiros
            </div>
            <h2 className="max-w-md text-4xl font-extrabold leading-tight sm:text-5xl">
              Anuncie <span className="text-cyan-300">aqui</span>
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
              Sua empresa em destaque para corretores, investidores e clientes do mercado imobiliário.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-white/90 sm:text-sm">
              <span>Mais visibilidade</span>
              <span>Contato direto</span>
              <span>Presença regional</span>
            </div>
            <span className="mt-7 inline-flex w-fit items-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 text-sm font-extrabold text-slate-950 transition-colors group-hover:bg-cyan-300">
              Divulgue sua empresa <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>

        {shuffled.length > 0 && (
          <div className="mt-10">
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
                  className="ml-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition shadow-sm"
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
                  className="snap-start shrink-0 w-[260px] sm:w-[280px] group rounded-lg overflow-hidden border border-gray-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <div className="relative h-32 bg-blue-500 overflow-hidden">
                    {p.cover_url && (
                      <img
                        src={p.cover_url}
                        alt={p.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/35" />
                    {p.logo_url && (
                      <img
                        src={p.logo_url}
                        alt={`${p.name} logo`}
                        className="absolute bottom-3 left-3 w-14 h-14 rounded-lg object-cover border-2 border-white bg-white shadow-lg"
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
        )}
      </div>
    </section>
  );
}
