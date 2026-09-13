export function resolveBrokerPageAvatar(
  configPhotoUrl: string | null | undefined,
  profileAvatarUrl: string | null | undefined,
  fallbackUrl: string,
) {
  return configPhotoUrl || profileAvatarUrl || fallbackUrl;
}

export function resolvePropertyBrokerName({
  internalBrokerName,
  loadedOwnerName,
  profileName,
  existingBrokerName,
}: {
  internalBrokerName?: string | null;
  loadedOwnerName?: string | null;
  profileName?: string | null;
  existingBrokerName?: string | null;
}) {
  return internalBrokerName || loadedOwnerName || profileName || existingBrokerName || "";
}
