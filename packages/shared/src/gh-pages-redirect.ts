export type StorageLike = Pick<Storage, 'getItem' | 'removeItem'>;

export function consumeSessionRedirect(
  storage: StorageLike,
  key = '__fluxby_redirect__'
): string | null {
  const value = storage.getItem(key);
  if (!value) return null;
  storage.removeItem(key);
  return value;
}

export function getRedirectToRestore(
  redirectUrl: string,
  allowedPrefix: string
): string | null {
  if (!redirectUrl) return null;
  if (!allowedPrefix) return null;
  return redirectUrl.startsWith(allowedPrefix) ? redirectUrl : null;
}
