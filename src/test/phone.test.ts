import { describe, expect, it } from "vitest";
import { formatBrazilianPhone, onlyPhoneDigits } from "@/lib/phone";

describe("máscara de telefone brasileiro", () => {
  it("formata celular com DDD", () => {
    expect(formatBrazilianPhone("11932490045")).toBe("(11) 93249-0045");
  });

  it("formata telefone fixo com DDD", () => {
    expect(formatBrazilianPhone("1133224455")).toBe("(11) 3322-4455");
  });

  it("limita e normaliza o valor enviado", () => {
    expect(onlyPhoneDigits("(11) 93249-0045 ramal 99")).toBe("11932490045");
  });
});
