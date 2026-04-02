import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface QuickPickProps {
  label: string;
  options: (string | number)[];
  value: string | number;
  onChange: (value: string | number) => void;
  icon?: React.ReactNode;
  className?: string;
}

export function QuickPick({ label, options, value, onChange, icon, className }: QuickPickProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs flex items-center gap-1">
        {icon}
        {label}
      </Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={String(opt)}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150",
              String(value) === String(opt)
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-muted/50 text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
