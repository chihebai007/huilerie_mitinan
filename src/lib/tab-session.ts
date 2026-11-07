/** Unique auth channel per tab, retained on reload, never shared via localStorage. */
export function tabSessionKey(storage: Storage, createId: () => string): string {
  const key = 'mitinan-auth-tab';
  const existing = storage.getItem(key);
  if (existing) return existing;
  const id = `mitinan-staff-${createId()}`;
  storage.setItem(key, id);
  return id;
}

export const STAFF_SIGN_OUT = { scope: 'local' } as const;