import { describe, expect, it } from 'vitest';
import { STAFF_SIGN_OUT, tabSessionKey } from '../lib/tab-session';

function tabStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: key => values.get(key) ?? null,
    key: index => [...values.keys()][index] ?? null,
    removeItem: key => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}

describe('Simultaneous staff sessions', () => {
  it('keeps admin and manager auth channels and stored sessions separate', () => {
    const admin = tabStorage();
    const manager = tabStorage();
    const a = tabSessionKey(admin, () => 'admin-tab');
    const m = tabSessionKey(manager, () => 'manager-tab');
    expect(a).not.toBe(m);
    admin.setItem(a, 'admin-session');
    manager.setItem(m, 'manager-session');
    manager.removeItem(m);
    expect(admin.getItem(a)).toBe('admin-session');
    expect(manager.getItem(a)).toBeNull();
  });
  it('retains the same auth channel when a tab reloads', () => {
    const tab = tabStorage();
    expect(tabSessionKey(tab, () => 'first')).toBe('mitinan-staff-first');
    expect(tabSessionKey(tab, () => 'second')).toBe('mitinan-staff-first');
  });
  it('does not revoke sessions on other devices when signing out', () => {
    expect(STAFF_SIGN_OUT.scope).toBe('local');
  });
});