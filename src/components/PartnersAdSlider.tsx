import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

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

export function PartnersAdSlider() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    supabase
      .from("partners")
      .select("id,slug,name,category,city,logo_url,cover_url,description")
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .then(({ data }) => setPartners(data || []));
  }, []);

  useEffect(() => {
    if (partners.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % partners.length), 5000);
    return () => clearInterval(t);
  }, [partners.length]);

  if (partners.length === 0) return null;
  const p = partners[index];

  const prev = () => setIndex((i) => (i - 1 + partners.length) % partners.length);
  const next = () => setIndex((i) => (i + 1) % partners.length);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border elevated-card group">
      <Link to={`/parceiros/${p.slug}`} className="block">
        <div className="relative h-32 sm:h-40 w-full">
          {p.cover_url && (
            <img
              src={p.cover_url}
              alt={p.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/20" />
          <div className="absolute inset-0 flex items-center gap-4 p-4 sm:p-6">
            {p.logo_url && (
              <img
                src={p.logo_url}
                alt={p.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border border-border bg-background shadow-lg shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-accent">
                  Parceiro {p.category}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground truncate">{p.name}</h3>
              {p.city && <p className="text-xs text-muted-foreground truncate">{p.city}</p>}
              {p.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1 hidden sm:block">
                  {p.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>

      {partners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 hover:bg-background border border-border opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 hover:bg-background border border-border opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Próximo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {partners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-accent" : "w-1.5 bg-foreground/30"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
