export type PropertyAction = "edit" | "delete";

type PropertyAccessInput = {
  viewerId?: string | null;
  ownerId?: string | null;
  isSuperAdmin: boolean;
  isAdminStaff: boolean;
  staffCanEdit?: boolean;
  staffCanDelete?: boolean;
};

export function canManageProperty(
  input: PropertyAccessInput,
  action: PropertyAction,
): boolean {
  if (input.isSuperAdmin) return true;

  if (input.isAdminStaff) {
    return action === "delete" ? !!input.staffCanDelete : !!input.staffCanEdit;
  }

  return !!input.viewerId && input.viewerId === input.ownerId;
}
