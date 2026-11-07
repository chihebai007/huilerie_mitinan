import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/staff-auth";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { parseShippingPdf } from "@/lib/shipping.functions";

type Rate = Tables<"shipping_rates">;

async function pdfToText(file: File) {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  let text = "";
  for (let i = 1; i <= Math.min(doc.numPages, 30); i++) {
    const page = await doc.getPage(i);
    const c = await page.getTextContent();
    text += c.items.map((it) => ("str" in it ? it.str : "")).join(" ") + "\n";
  }
  return text;
}

export function Shipping() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = () => {
    supabase.from("shipping_rates").select("*").order("wilaya_code").then(({ data }) => setRates(data ?? []));
    supabase.from("site_texts").select("value").eq("key", "shipping_company").maybeSingle().then(({ data }) => setCompany(data?.value ?? ""));
    setDirty(false);
  };
  useEffect(load, []);

  const set = (code: number, patch: Partial<Rate>) => {
    setRates((r) => r.map((x) => (x.wilaya_code === code ? { ...x, ...patch } : x)));
    setDirty(true);
  };

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from("shipping_rates").upsert(
      rates.map(({ wilaya_code, wilaya, home_price, desk_price, available }) => ({ wilaya_code, wilaya, home_price, desk_price, available })),
    );
    const { error: e2 } = await supabase.from("site_texts").update({ value: company.trim().slice(0, 100) }).eq('key', 'shipping_company');
    setBusy(false);
    if (error || e2) { toast.error("Enregistrement impossible"); return; }
    toast.success("Tarifs enregistrés");
    setDirty(false);
  };

  const importPdf = async (file: File) => {
    if (file.size > 15 * 1024 * 1024) { toast.error("PDF trop lourd (15 Mo max)"); return; }
    setBusy(true);
    try {
      const text = await pdfToText(file);
      if (text.trim().length < 20) throw new Error("Ce PDF ne contient pas de texte lisible (PDF scanné ?).");
      const found = await parseShippingPdf({ data: { text, wilayas: rates.map((r) => r.wilaya) } });
      const map = new Map(found.map((f) => [f.code, f]));
      setRates((r) => r.map((x) => { const f = map.get(x.wilaya_code); return f ? { ...x, home_price: f.home, desk_price: f.desk } : x; }));
      setDirty(true);
      toast.success(`${found.length} wilayas remplies depuis le PDF. Vérifiez puis cliquez sur « Enregistrer ».`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lecture du PDF impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 rounded-md border bg-card p-4 md:grid-cols-2">
        <div>
          <Label>Société de livraison</Label>
          <Input value={company} maxLength={100} placeholder="ex. Yalidine, ZR Express…" onChange={(e) => { setCompany(e.target.value); setDirty(true); }} />
        </div>
        <div>
          <Label>Remplir automatiquement depuis le PDF des tarifs</Label>
          <Input type="file" accept="application/pdf" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) importPdf(f); }} />
          <p className="mt-1 text-xs text-muted-foreground">{busy ? "Analyse en cours…" : "Les prix trouvés remplacent ceux du tableau. Rien n’est enregistré avant votre validation."}</p>
        </div>
      </div>
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-3">
        <span className="text-sm">{dirty ? "Modifications non enregistrées" : "Tarifs à jour"} · Un bureau à 0 DA n’est pas proposé au client.</span>
        <Button onClick={save} disabled={busy || !dirty}>Enregistrer</Button>
      </div>
      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="shipping-table w-full text-sm">
          <thead><tr className="border-b text-left"><th className="p-2">Wilaya</th><th className="p-2">Domicile (DA)</th><th className="p-2">Bureau (DA)</th><th className="p-2">Livrée</th></tr></thead>
          <tbody>
            {rates.map((r) => (
              <tr key={r.wilaya_code} className="border-b">
                <td className="p-2" data-label="Wilaya">{String(r.wilaya_code).padStart(2, "0")} - {r.wilaya}</td>
                <td className="p-2" data-label="Domicile (DA)"><Input aria-label={`Domicile ${r.wilaya}`} type="number" min={0} className="w-28" value={r.home_price} onChange={(e) => set(r.wilaya_code, { home_price: Math.max(0, Number(e.target.value)) })} /></td>
                <td className="p-2" data-label="Bureau (DA)"><Input aria-label={`Bureau ${r.wilaya}`} type="number" min={0} className="w-28" value={r.desk_price} onChange={(e) => set(r.wilaya_code, { desk_price: Math.max(0, Number(e.target.value)) })} /></td>
                <td className="p-2" data-label="Livrée"><Switch aria-label={`Livraison ${r.wilaya}`} checked={r.available} onCheckedChange={(v) => set(r.wilaya_code, { available: v })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
