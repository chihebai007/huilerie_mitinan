import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type Account = { id: string; email: string; created_at: string };
const day = (s: string) => new Date(s).toLocaleDateString('fr-FR');
const readable = (m?: string) => m && !/fetch|network/i.test(m) ? m : 'Connexion impossible. Vérifiez votre réseau et réessayez.';

export function Team() {
  const [managers, setManagers] = useState<Account[]>([]);
  const [pending, setPending] = useState<Account[]>([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>('load');

  async function load() {
    try {
      const [p, r] = await Promise.all([
        supabase.from('profiles').select('id,email,created_at').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id,role'),
      ]);
      if (p.error || r.error) throw new Error(readable((p.error ?? r.error)?.message));
      const roles = r.data ?? [];
      const has = (id: string, role: string) => roles.some((x) => x.user_id === id && x.role === role);
      const all = p.data ?? [];
      setManagers(all.filter((a) => has(a.id, 'manager') && !has(a.id, 'admin')));
      setPending(all.filter((a) => !has(a.id, 'manager') && !has(a.id, 'admin')));
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Chargement impossible'); }
    finally { setBusy(null); }
  }
  useEffect(() => { void load(); }, []);

  async function act(fn: 'grant_manager' | 'revoke_manager', a: Account) {
    if (fn === 'revoke_manager' && !confirm(`Retirer l’accès manager de ${a.email} ?`)) return;
    setBusy(a.id);
    try {
      const { error } = await supabase.rpc(fn, { target_user_id: a.id });
      if (error) throw new Error(readable(error.message));
      toast.success(fn === 'grant_manager' ? `Accès manager donné à ${a.email}` : `Accès retiré à ${a.email}`);
      await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Opération impossible'); setBusy(null); }
  }

  const q = search.trim().toLowerCase();
  const match = (a: Account) => !q || a.email.toLowerCase().includes(q);
  const row = (a: Account, action: JSX.Element) => <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-3"><div className="min-w-0"><p className="break-all font-medium">{a.email}</p><p className="text-sm text-muted-foreground">Inscrit le {day(a.created_at)}</p></div>{action}</div>;

  return <section className="space-y-6">
    <h2 className="text-2xl font-semibold">Managers</h2>
    <div className="space-y-1 rounded-md border bg-muted/40 p-4 text-sm">
      <p>1. Le manager crée son compte sur <span className="break-all font-medium">{typeof window !== 'undefined' ? `${window.location.origin}/admin` : '/admin'}</span> (« Créer un compte ») et confirme son email.</p>
      <p>2. Il apparaît dans « Comptes en attente » : donnez-lui l’accès.</p>
      <p>3. Il gère lui-même son mot de passe depuis son espace.</p>
    </div>
    <Input type="search" aria-label="Rechercher par email" placeholder="Rechercher par email…" value={search} onChange={(e) => setSearch(e.target.value)} />
    <div><h3 className="mb-2 font-semibold">Managers actifs ({managers.length})</h3>
      {busy === 'load' ? <p className="text-muted-foreground">Chargement…</p> : managers.filter(match).length === 0 ? <p className="text-muted-foreground">Aucun manager.</p>
        : managers.filter(match).map((a) => row(a, <Button variant="destructive" disabled={busy !== null} onClick={() => void act('revoke_manager', a)}>{busy === a.id ? 'Patientez…' : 'Retirer l’accès'}</Button>))}
    </div>
    <div><h3 className="mb-2 font-semibold">Comptes en attente ({pending.length})</h3>
      {busy === 'load' ? null : pending.filter(match).length === 0 ? <p className="text-muted-foreground">Aucun compte en attente.</p>
        : pending.filter(match).map((a) => row(a, <Button disabled={busy !== null} onClick={() => void act('grant_manager', a)}>{busy === a.id ? 'Patientez…' : 'Donner l’accès manager'}</Button>))}
    </div>
  </section>;
}
