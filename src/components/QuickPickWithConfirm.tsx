import { useState } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QuickPickWithConfirmProps {
  label: string;
  options: (string | number)[];
  value: string | number;
  onChange: (value: string | number) => void;
  icon?: React.ReactNode;
  className?: string;
}

export function QuickPickWithConfirm({ label, options, value, onChange, icon, className }: QuickPickWithConfirmProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState<string | number>("");

  const handleClick = (opt: string | number) => {
    if (String(opt) === String(value)) return;
    setPendingValue(opt);
    setConfirmOpen(true);
  };

  return (
    <>
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
              onClick={() => handleClick(opt)}
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

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirmar alteração de status
            </AlertDialogTitle>
            <AlertDialogDescription>
              Deseja alterar o status de <strong className="text-foreground">{value}</strong> para{" "}
              <strong className="text-foreground">{pendingValue}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => onChange(pendingValue)}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
