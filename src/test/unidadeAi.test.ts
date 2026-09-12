import { normalizeUnidade, extractUnitBoxFromText } from "@/lib/aiImovelFields";
import { describe, it, expect } from "vitest";
describe("unidade", () => {
  it("prefixos", () => {
    expect(normalizeUnidade("Apartamento 1006")).toBe("1006");
    expect(normalizeUnidade("AP 402")).toBe("402");
    expect(normalizeUnidade("Unidade 1203B")).toBe("1203B");
    expect(normalizeUnidade("Apto: 402")).toBe("402");
    expect(normalizeUnidade("AP-1006")).toBe("1006");
    expect(normalizeUnidade("Q06/L44")).toBe("");
  });
  it("texto", () => {
    expect(extractUnitBoxFromText("Farol Park, apto 402").unidade).toBe("402");
    expect(extractUnitBoxFromText("Milano, apartamento 1006 - box 76")).toMatchObject({ unidade: "1006", box: "76" });
    expect(extractUnitBoxFromText("Rua Begônias 844 - Noiva do Mar").unidade).toBeUndefined();
  });
});
