import { Check } from "lucide-react";
import { TEMPLATES, type TemplateId } from "@/lib/tabelaTemplates";
import { cn } from "@/lib/utils";

/** Miniaturas dos modelos disponíveis. */
export function TemplateSelector({ value, onChange }: { value: TemplateId; onChange: (v: TemplateId) => void }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {TEMPLATES.map(t => {
        const active = value === t.id;
        const c = t.colors;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "rounded-xl border p-2 text-left transition-all",
              active ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50"
            )}
          >
            {/* miniatura */}
            <div className="rounded-lg overflow-hidden border" style={{ background: c.pageBg, borderColor: c.border }}>
              <div className="h-4 flex items-center px-1.5" style={{ background: c.headerBg }}>
                <div className="h-1 w-8 rounded" style={{ background: c.accent }} />
              </div>
              <div className="p-1.5 space-y-1">
                {t.layout === "rows"
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex gap-1 items-center" style={{ background: i % 2 ? c.rowAltBg : c.rowBg }}>
                        <div className="w-5 h-4 rounded-sm" style={{ background: c.border }} />
                        <div className="flex-1 space-y-0.5">
                          <div className="h-1 w-3/4 rounded" style={{ background: c.text, opacity: 0.7 }} />
                          <div className="h-1 w-1/2 rounded" style={{ background: c.muted, opacity: 0.5 }} />
                        </div>
                        <div className="h-1.5 w-5 rounded" style={{ background: c.priceText }} />
                      </div>
                    ))
                  : (
                    <div className="grid grid-cols-2 gap-1">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="rounded-sm p-1" style={{ background: c.rowBg, border: `1px solid ${c.border}` }}>
                          <div className="h-5 rounded-sm mb-1" style={{ background: c.border }} />
                          <div className="h-1 w-3/4 rounded mb-0.5" style={{ background: c.text, opacity: 0.7 }} />
                          <div className="h-1.5 w-1/2 rounded" style={{ background: c.priceText }} />
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
            <div className="flex items-start gap-1 mt-2">
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">{t.name}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{t.description}</p>
              </div>
              {active && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
