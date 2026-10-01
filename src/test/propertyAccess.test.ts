import { describe, expect, it } from "vitest";
import { canManageProperty } from "@/lib/propertyAccess";

describe("property access", () => {
  it("permite que o corretor administre apenas os próprios imóveis", () => {
    expect(canManageProperty({
      viewerId: "broker-a",
      ownerId: "broker-a",
      isSuperAdmin: false,
      isAdminStaff: false,
    }, "edit")).toBe(true);

    expect(canManageProperty({
      viewerId: "broker-a",
      ownerId: "broker-b",
      isSuperAdmin: false,
      isAdminStaff: false,
    }, "edit")).toBe(false);
  });

  it("respeita a ação liberada para funcionários", () => {
    const base = {
      viewerId: "staff",
      ownerId: "broker",
      isSuperAdmin: false,
      isAdminStaff: true,
      staffCanEdit: true,
      staffCanDelete: false,
    };

    expect(canManageProperty(base, "edit")).toBe(true);
    expect(canManageProperty(base, "delete")).toBe(false);
  });

  it("mantém acesso completo para o super admin", () => {
    expect(canManageProperty({
      viewerId: "admin",
      ownerId: "broker",
      isSuperAdmin: true,
      isAdminStaff: false,
    }, "delete")).toBe(true);
  });
});
