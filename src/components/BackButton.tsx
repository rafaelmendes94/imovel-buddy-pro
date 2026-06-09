import { ArrowLeft } from "lucide-react";
import { useSmartBack } from "@/lib/useSmartBack";

export function BackButton({ fallback = "/" }: { fallback?: string }) {
  const handleBack = useSmartBack(fallback);

  return (
    <button
      onClick={handleBack}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      Voltar
    </button>
  );
}
