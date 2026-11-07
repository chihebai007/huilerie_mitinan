import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { tabSessionKey } from './tab-session';

let client: SupabaseClient<Database> | undefined;

function getStaffClient(): SupabaseClient<Database> {
  if (client) return client;
  if (typeof window === 'undefined') throw new Error('La connexion nécessite un navigateur.');
  const url = import.meta.env['VITE_SUPABASE_URL'];
  const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('Connexion indisponible.');
  // sessionStorage survives reloads, but new tabs and other devices keep separate accounts.
  const storage = window.sessionStorage;
  const storageKey = tabSessionKey(storage, () => window.crypto.randomUUID());
  client = createClient<Database>(url, key, {
    auth: { storage, storageKey, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(input instanceof Request ? input.headers : undefined);
        new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
        if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
        headers.set('apikey', key);
        return fetch(input, { ...init, headers });
      },
    },
  });
  return client;
}

// Lazy: no browser storage is touched during server module evaluation.
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, property) {
    const current = getStaffClient();
    const value = Reflect.get(current, property);
    return typeof value === 'function' ? value.bind(current) : value;
  },
});