import { Input } from "@/components/ui/input";
import { forwardRef } from "react";

interface CurrencyInputProps extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value: string | number;
  onValueChange: (numericString: string) => void;
}

function formatBRL(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Currency input with R$ mask. Stores the raw numeric value (e.g. "3000000.00")
 * via onValueChange while displaying it formatted as "R$ 3.000.000,00".
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, placeholder = "R$ 0,00", ...rest }, ref) => {
    const numeric = typeof value === "number" ? value : parseFloat(value || "0") || 0;
    const display = numeric > 0 ? formatBRL(String(Math.round(numeric * 100))) : "";

    return (
      <Input
        {...rest}
        ref={ref}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={display}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          if (!digits) return onValueChange("");
          const cents = parseInt(digits, 10);
          onValueChange((cents / 100).toString());
        }}
      />
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";
