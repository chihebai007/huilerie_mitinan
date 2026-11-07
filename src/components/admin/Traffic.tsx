import { useEffect, useState } from 'react';
import { supabase } from '@/lib/staff-auth';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
export function Traffic({ days }: { days: number }) {
  const [rows, setRows] = useState<Tables<'visit_daily'>[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    async function load() {
      const all: Tables<'visit_daily'>[] = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await supabase.from('visit_daily').select('*').gte('day', since).order('day').range(offset, offset + 999);
        if (error) { toast.error('Statistiques de visites indisponibles'); return; }
        all.push(...data); if (data.length < 1000) break;
      }
      setRows(all); setReady(true);
    }
    void load();
  }, [days]);
  const total = rows.reduce((n, r) => n + r.visits, 0);
  const group = (key: 'source' | 'country' | 'device' | 'language') => {
    const counts = new Map<string, number>();
    rows.forEach((r) => counts.set(r[key], (counts.get(r[key]) ?? 0) + r.visits));
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 10);
  };
  const countryName = (code: string) => { try { return new Intl.DisplayNames(['fr'], { type: 'region' }).of(code) ?? code; } catch { return code; } };
  return <section className="space-y-4 border-t pt-6"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Audience & acquisition</h2><span className="font-semibold">{total} visites</span></div>
    {!ready ? <p>Chargement…</p> : !rows.length ? <p className="text-sm text-muted-foreground">Aucune visite enregistrée sur cette période. Le suivi commence à partir de maintenant.</p> : null}
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{([['source', 'Sources de visites'], ['country', 'Pays des visiteurs'], ['device', 'Appareils'], ['language', 'Langues']] as const).map(([key, title]) => <div key={key}><h3 className="mb-3 font-semibold">{title}</h3>{group(key).map(([name, n]) => <div key={name} className="space-y-1 border-b py-2"><div className="flex justify-between gap-2 text-sm"><span className="min-w-0 break-all">{key === 'country' ? countryName(name) : name}</span><b>{n}</b></div><progress className="traffic-progress w-full" value={n} max={Math.max(1, total)} /></div>)}</div>)}</div>
    <p className="text-xs text-muted-foreground">Visites, pas visiteurs uniques. Pays approximatif, parfois inconnu. Aucun historique antérieur, aucune adresse IP conservée.</p>
  </section>;
}