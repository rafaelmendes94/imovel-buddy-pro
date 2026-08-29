import { useRef, useState } from "react";
import { GripVertical, X, ImageOff } from "lucide-react";
import { identityLines, money, type TabelaImovel } from "@/lib/tabelaData";
import { cn } from "@/lib/utils";

interface Props {
  items: TabelaImovel[];
  onReorder: (from: number, to: number) => void;
  onRemove: (id: string) => void;
}

/** Lista ordenável (drag and drop) dos imóveis selecionados. */
export function SelectedProperties({ items, onReorder, onRemove }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragging = useRef<number | null>(null);

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Selecione imóveis acima para definir a ordem da tabela.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {items.map((p, index) => {
        const lines = identityLines(p);
        return (
          <div
            key={p.id}
            draggable
            onDragStart={() => { dragging.current = index; setDragIndex(index); }}
            onDragOver={e => { e.preventDefault(); setOverIndex(index); }}
            onDragEnd={() => { setDragIndex(null); setOverIndex(null); dragging.current = null; }}
            onDrop={e => {
              e.preventDefault();
              if (dragging.current !== null && dragging.current !== index) onReorder(dragging.current, index);
              setDragIndex(null); setOverIndex(null); dragging.current = null;
            }}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg border border-border bg-card transition-all",
              dragIndex === index && "opacity-40",
              overIndex === index && dragIndex !== index && "ring-2 ring-primary/50"
            )}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0" />
            <span className="w-6 text-xs font-bold text-primary flex-shrink-0">{index + 1}</span>
            <div className="w-12 h-10 rounded overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
              {p.capa ? (
                <img src={p.capa} alt="" loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <ImageOff className="w-4 h-4 text-muted-foreground/50" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{p.titulo}</p>
              {lines.length > 0 && <p className="text-[11px] text-muted-foreground truncate">{lines.join(" • ")}</p>}
            </div>
            <span className="text-xs font-semibold text-foreground hidden sm:block">{money(p.preco)}</span>
            <button
              type="button"
              onClick={() => onRemove(p.id)}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              aria-label="Remover"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
