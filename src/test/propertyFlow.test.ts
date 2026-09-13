import { describe, expect, it } from "vitest";
import { resolveBrokerPageAvatar, resolvePropertyBrokerName } from "@/lib/propertyFlow";

describe("property/broker public flow", () => {
  it("prioriza foto personalizada da página pública do corretor", () => {
    expect(resolveBrokerPageAvatar("site.png", "profile.png", "fallback.png")).toBe("site.png");
    expect(resolveBrokerPageAvatar(null, "profile.png", "fallback.png")).toBe("profile.png");
    expect(resolveBrokerPageAvatar(null, null, "fallback.png")).toBe("fallback.png");
  });

  it("resolve corretor_nome sem manter vínculo antigo quando o corretor interno é limpo", () => {
    expect(resolvePropertyBrokerName({
      internalBrokerName: "Corretor Interno",
      loadedOwnerName: "Dono Original",
      profileName: "Admin",
      existingBrokerName: "Antigo",
    })).toBe("Corretor Interno");

    expect(resolvePropertyBrokerName({
      internalBrokerName: "",
      loadedOwnerName: "Dono Original",
      profileName: "Admin",
      existingBrokerName: "Antigo",
    })).toBe("Dono Original");

    expect(resolvePropertyBrokerName({
      internalBrokerName: null,
      loadedOwnerName: "",
      profileName: "Corretor Logado",
      existingBrokerName: "Antigo",
    })).toBe("Corretor Logado");
  });
});
