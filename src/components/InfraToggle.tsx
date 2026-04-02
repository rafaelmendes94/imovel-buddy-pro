import { useState } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

interface InfraToggleProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  allowCustom?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function InfraToggle({ label, options, selected, onChange, allowCustom = true, icon, className }: InfraToggleProps) {
  const [customInput, setCustomInput] = useState("");
  const [showInput, setShowInput] = useState(false);

  const toggle = (val: string) => {
    onChange(
      selected.includes(val)
        ? selected.filter(s => s !== val)
        : [...selected, val]
    );
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setCustomInput("");
    setShowInput(false);
  };

  const allOptions = [...new Set([...options, ...selected])];

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs flex items-center gap-1">
        {icon}
        {label}
      </Label>
      <div className="flex flex-wrap gap-1.5">
        {allOptions.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-medium border transition-all",
              selected.includes(opt)
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
            )}
          >
            {opt}
          </button>
        ))}
        {allowCustom && !showInput && (
          <button
            type="button"
            onClick={() => setShowInput(true)}
            className="px-2.5 py-1 rounded-md text-xs font-medium border border-dashed border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-all flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Outro
          </button>
        )}
        {allowCustom && showInput && (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } if (e.key === "Escape") setShowInput(false); }}
              placeholder="Digite..."
              className="px-2 py-1 rounded-md text-xs border border-input bg-background w-28 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button type="button" onClick={addCustom} className="p-1 rounded bg-primary text-primary-foreground"><Plus className="w-3 h-3" /></button>
            <button type="button" onClick={() => setShowInput(false)} className="p-1 rounded bg-muted text-muted-foreground"><X className="w-3 h-3" /></button>
          </div>
        )}
      </div>
    </div>
  );
}
