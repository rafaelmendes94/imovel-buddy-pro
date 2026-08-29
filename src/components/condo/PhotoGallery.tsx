import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoGalleryProps {
  photos: string[];
  alt: string;
}

/** Galeria premium: 1 foto principal grande + carrossel de miniaturas + lightbox. */
export function PhotoGallery({ photos, alt }: PhotoGalleryProps) {
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  const total = photos.length;
  const next = useCallback(() => setIdx(i => (i + 1) % total), [total]);
  const prev = useCallback(() => setIdx(i => (i - 1 + total) % total), [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // mantém a miniatura ativa visível
  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>(`[data-thumb="${idx}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [idx]);

  if (total === 0) return null;

  const swipe = {
    onTouchStart: (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; },
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchX.current == null) return;
      const dx = e.changedTouches[0].clientX - touchX.current;
      if (Math.abs(dx) > 45) (dx < 0 ? next : prev)();
      touchX.current = null;
    },
  };

  const scrollStrip = (dir: 1 | -1) =>
    stripRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

  return (
    <div className="space-y-3">
      {/* foto principal */}
      <div className="relative rounded-2xl overflow-hidden bg-muted aspect-video border border-border shadow-lg" {...swipe}>
        <img
          key={photos[idx]}
          src={photos[idx]}
          alt={`${alt} — foto ${idx + 1}`}
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover cursor-zoom-in animate-in fade-in duration-300"
          onClick={() => setLightbox(true)}
        />
        {total > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Foto anterior"
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/45 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur transition-colors"
            ><ChevronLeft className="w-5 h-5" /></button>
            <button
              onClick={next}
              aria-label="Próxima foto"
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/45 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur transition-colors"
            ><ChevronRight className="w-5 h-5" /></button>
          </>
        )}
        <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 text-white text-[11px] font-semibold backdrop-blur">
          {idx + 1} / {total} fotos
        </span>
      </div>

      {/* carrossel de miniaturas */}
      {total > 1 && (
        <div className="relative">
          <button
            onClick={() => scrollStrip(-1)}
            aria-label="Rolar miniaturas para a esquerda"
            className="hidden sm:flex absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card border border-border text-foreground items-center justify-center shadow"
          ><ChevronLeft className="w-4 h-4" /></button>
          <div ref={stripRef} className="flex gap-2 overflow-x-auto scroll-smooth pb-1 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {photos.map((p, i) => (
              <button
                key={p + i}
                data-thumb={i}
                onClick={() => setIdx(i)}
                className={cn(
                  "relative flex-shrink-0 w-24 sm:w-28 aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all",
                  i === idx ? "border-primary ring-2 ring-primary/25" : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <img src={p} alt="" loading={i < 6 ? "eager" : "lazy"} decoding="async" className="w-full h-full object-cover" />
                <span className="absolute bottom-0.5 left-1 text-[9px] font-bold text-white drop-shadow">{String(i + 1).padStart(2, "0")}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => scrollStrip(1)}
            aria-label="Rolar miniaturas para a direita"
            className="hidden sm:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card border border-border text-foreground items-center justify-center shadow"
          ><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={() => setLightbox(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold uppercase tracking-wide text-foreground hover:bg-muted transition-colors"
        >
          <Images className="w-4 h-4" /> Ver todas as fotos
        </button>
      </div>

      {/* lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4" {...swipe}>
          <button onClick={() => setLightbox(false)} aria-label="Fechar" className="absolute top-4 right-4 text-white/80 hover:text-white">
            <X className="w-7 h-7" />
          </button>
          <span className="absolute top-5 left-5 text-white/70 text-xs font-semibold">{idx + 1} / {total}</span>
          {total > 1 && (
            <>
              <button onClick={prev} aria-label="Anterior" className="absolute left-3 sm:left-8 text-white/80 hover:text-white"><ChevronLeft className="w-9 h-9" /></button>
              <button onClick={next} aria-label="Próxima" className="absolute right-3 sm:right-8 text-white/80 hover:text-white"><ChevronRight className="w-9 h-9" /></button>
            </>
          )}
          <img src={photos[idx]} alt={`${alt} — foto ${idx + 1}`} className="max-h-[78vh] max-w-full object-contain rounded-lg" />
          <div className="flex gap-2 mt-4 overflow-x-auto max-w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {photos.map((p, i) => (
              <button
                key={p + i}
                onClick={() => setIdx(i)}
                className={cn("w-16 h-12 rounded overflow-hidden border-2 flex-shrink-0", i === idx ? "border-white" : "border-transparent opacity-60")}
              >
                <img src={p} alt="" loading="lazy" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
