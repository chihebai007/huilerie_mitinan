import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { Shipping } from "@/components/admin/Shipping";
import { Team } from "@/components/admin/Team";
import { Traffic } from "@/components/admin/Traffic";
import { QuantityOffers } from "@/components/admin/QuantityOffers";
import { readOffers } from '../../public/pack-pricing.js';
import { canDeleteOrder, canOpenTab } from "@/lib/shop-access";
import { translateFields } from "@/lib/translate.functions";

type Translated = { en: Record<string, string>; ar: Record<string, string> };
// Always re-translates French text to EN/AR; returns null (and warns) if the service fails so saving still works.
async function autoTranslate(texts: Record<string, string>): Promise<Translated | null> {
  const id = toast.loading("Traduction automatique en anglais et en arabe…");
  try { const r = await translateFields({ data: { texts } }); toast.dismiss(id); return r; }
  catch (e) { toast.dismiss(id); toast.warning(`Enregistré sans traduction : ${e instanceof Error ? e.message : "erreur"}`); return null; }
}
import { LayoutDashboard, Package, ShoppingBag, Users, Star, Truck, Mail, FileText, Image as ImageIcon, Award, Type, ImagePlus, X } from "lucide-react";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Administration — MITINAN" },
      { name: "description", content: "Espace d’administration de la boutique MITINAN." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Administration — MITINAN" },
      { property: "og:description", content: "Espace d’administration de la boutique MITINAN." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const IMAGES = [
  "/images/IMG-20260706-WA0061.jpg",
  "/images/IMG-20260706-WA0062.jpg",
  "/images/IMG-20260706-WA0063.jpg",
  "/images/IMG-20260706-WA0064.jpg",
  "/images/IMG-20260706-WA0065.jpg",
] as const;
const money = (n: number) => new Intl.NumberFormat("fr-DZ").format(Number(n)) + " DA";
const date = (s: string) => new Date(s).toLocaleString("fr-FR");

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [tab, setTab] = useState("stats");
  const tabs = [{v:"stats",l:"Statistiques",icon:LayoutDashboard},{v:"orders",l:"Commandes",icon:ShoppingBag},{v:"products",l:"Produits",icon:Package},{v:"reviews",l:"Avis clients",icon:Star},{v:"shipping",l:"Livraison",icon:Truck},{v:"messages",l:"Messages",icon:Mail},{v:"articles",l:"Articles",icon:FileText},{v:"texts",l:"Textes du site",icon:Type},{v:"photos",l:"Photos du site",icon:ImageIcon},{v:"awards",l:"Distinctions",icon:Award},{v:"team",l:"Managers",icon:Users},{v:"account",l:"Mon mot de passe",icon:KeyRound}];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setRole(null);
    if (!session) return;
    let active = true;
    Promise.all([supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }), supabase.rpc("has_role", { _user_id: session.user.id, _role: "manager" })]).then(([a, m]) => { if (active) { setRole(a.data === true ? "admin" : m.data === true ? "manager" : "user"); setTab("stats"); } });
    return () => { active = false; };
  }, [session?.user.id]);

  return (
    <div className="admin-shell min-h-screen bg-muted/40">
      <Toaster />
      <header className="border-b bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <a href="/" className="text-xl font-bold tracking-wide">MITINAN · {role === "manager" ? "Gestion boutique" : "Administration"}</a>
          {session && (
            <Button variant="secondary" size="sm" onClick={() => supabase.auth.signOut()}>
              Se déconnecter
            </Button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        {!ready ? null : !session ? (
          <Login />
        ) : role === null ? (
          <p>Vérification…</p>
        ) : role === "user" ? (
          <div className="mx-auto max-w-md space-y-6"><p className="rounded-md border bg-card p-6">Ton accès n’a pas encore été activé par l’administrateur.</p><ChangePassword /></div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b pb-4"><div><p className="text-sm text-muted-foreground">{role === 'manager' ? 'Espace manager' : 'Votre boutique'}</p><h1 className="text-2xl font-semibold">{tabs.find((t) => t.v === tab)?.l}</h1></div><a href="/" className="text-sm underline">Voir la boutique ↗</a></div>
            <select aria-label="Section de gestion" className="mb-5 h-12 w-full rounded-md border bg-background px-3 sm:hidden" value={tab} onChange={(e) => setTab(e.target.value)}>{tabs.filter((t) => canOpenTab(role, t.v)).map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}</select>
            <TabsList className="mb-6 h-auto flex-wrap justify-start gap-1">{tabs.filter((t) => canOpenTab(role, t.v)).map((t) => <TabsTrigger key={t.v} value={t.v} className="gap-2"><t.icon className="h-4 w-4" />{t.l}</TabsTrigger>)}</TabsList>
            <TabsContent value="stats"><Stats /></TabsContent>
            <TabsContent value="products"><Products /></TabsContent>
            <TabsContent value="reviews"><Reviews /></TabsContent>
            <TabsContent value="orders"><Orders /></TabsContent>
            <TabsContent value="shipping"><Shipping /></TabsContent>
            <TabsContent value="messages"><Messages readOnly={role === 'manager'} /></TabsContent>
            <TabsContent value="account"><ChangePassword /></TabsContent>
            {role === 'admin' && <><TabsContent value="articles"><Articles /></TabsContent><TabsContent value="texts"><Texts /></TabsContent><TabsContent value="photos"><SitePhotos /></TabsContent><TabsContent value="awards"><Awards /></TabsContent><TabsContent value="team"><Team /></TabsContent></>}
          </Tabs>
        )}
      </main>
    </div>
  );
}

function Login() {
  const [mode, setMode] = useState<"in" | "forgot" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (mode === "up" && password !== password2) return toast.error("Les deux mots de passe ne correspondent pas.");
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("Si ce compte existe, un email de réinitialisation vient d’être envoyé.");
        setMode("in");
      } else if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
        if (error) throw error;
        if (data.user && data.user.identities?.length === 0) throw new Error("Cet email est déjà utilisé. Connectez-vous ou utilisez « Mot de passe oublié ».");
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(/confirm/i.test(error.message) ? "Confirmez d’abord votre email." : "Email ou mot de passe incorrect.");
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      toast.error(/fetch|network/i.test(m) ? "Connexion impossible. Vérifiez votre réseau." : /already|registered/i.test(m) ? "Cet email est déjà utilisé." : m || "Opération impossible");
    } finally { setBusy(false); }
  }
  if (sent) return <div className="mx-auto max-w-sm space-y-4 rounded-lg border bg-card p-6 shadow-sm"><h1 className="text-2xl font-bold">Compte créé</h1><p>Vérifie ton email pour confirmer ton compte, puis demande l’accès à l’administrateur.</p><Button variant="outline" className="w-full" onClick={() => { setSent(false); setMode("in"); }}>Retour à la connexion</Button></div>;
  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4 rounded-lg border bg-card p-6 shadow-sm">
      <h1 className="text-2xl font-bold">{mode === "in" ? "Connexion" : mode === "up" ? "Créer un compte" : "Mot de passe oublié"}</h1>
      <div className="space-y-2"><Label htmlFor="login-email">Email</Label><Input id="login-email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      {mode !== "forgot" && <div className="space-y-2"><Label htmlFor="login-password">Mot de passe</Label><Input id="login-password" type="password" required minLength={mode === "up" ? 8 : undefined} autoComplete={mode === "up" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></div>}
      {mode === "up" && <div className="space-y-2"><Label htmlFor="login-password2">Confirmer le mot de passe</Label><Input id="login-password2" type="password" required minLength={8} autoComplete="new-password" value={password2} onChange={(e) => setPassword2(e.target.value)} /><p className="text-xs text-muted-foreground">Au moins 8 caractères.</p></div>}
      <Button className="w-full" disabled={busy}>{busy ? "Veuillez patienter…" : mode === "in" ? "Se connecter" : mode === "up" ? "Créer mon compte" : "Recevoir le lien de réinitialisation"}</Button>
      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
        {mode !== "in" && <button type="button" className="underline" onClick={() => setMode("in")}>Retour à la connexion</button>}
        {mode === "in" && <button type="button" className="underline" onClick={() => setMode("forgot")}>Mot de passe oublié ?</button>}
        {mode === "in" && <button type="button" className="underline" onClick={() => setMode("up")}>Créer un compte manager</button>}
      </div>
    </form>
  );
}

function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pw !== pw2) return toast.error("Les deux mots de passe ne correspondent pas.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw, current_password: current } as { password: string });
      if (error) throw error;
      toast.success("Mot de passe modifié");
      setCurrent(""); setPw(""); setPw2("");
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      toast.error(/fetch|network/i.test(m) ? "Connexion impossible. Vérifiez votre réseau." : /current|incorrect|invalid/i.test(m) ? "Mot de passe actuel incorrect." : /same|different/i.test(m) ? "Choisissez un mot de passe différent de l’actuel." : "Modification impossible : utilisez au moins 8 caractères.");
    } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="max-w-sm space-y-4 rounded-lg border bg-card p-6">
      <h2 className="text-xl font-semibold">Changer mon mot de passe</h2>
      <div className="space-y-2"><Label htmlFor="cp-current">Mot de passe actuel</Label><Input id="cp-current" type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="cp-new">Nouveau mot de passe</Label><Input id="cp-new" type="password" required minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="cp-new2">Confirmer le nouveau mot de passe</Label><Input id="cp-new2" type="password" required minLength={8} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
      <Button disabled={busy}>{busy ? "Veuillez patienter…" : "Enregistrer le mot de passe"}</Button>
    </form>
  );
}

async function fileToDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
    });
    const max = 1000;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    const context = c.getContext("2d");
    if (!context) throw new Error("Impossible de préparer l’image");
    context.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.8);
  } finally { URL.revokeObjectURL(url); }
}

function ImagePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [hidden, setHidden] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("mitinan_hidden_images") ?? "[]") as string[]; } catch { return []; }
  });
  const hidePreset = (src: string): void => {
    const next = hidden.includes(src) ? hidden : [...hidden, src];
    setHidden(next);
    try { localStorage.setItem("mitinan_hidden_images", JSON.stringify(next)); } catch { /* stockage indisponible */ }
    toast.success("Image retirée de la bibliothèque");
  };
  const restorePresets = (): void => {
    setHidden([]);
    try { localStorage.removeItem("mitinan_hidden_images"); } catch { /* stockage indisponible */ }
    toast.success("Bibliothèque d’images restaurée");
  };
  const presets = IMAGES.filter((src) => !hidden.includes(src));
  async function upload(f?: File): Promise<void> {
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Choisissez un fichier image"); return; }
    try { onChange(await fileToDataUrl(f)); toast.success("Image ajoutée"); }
    catch { toast.error("Impossible de lire cette image"); }
  }
  return (
    <div className="space-y-2">
      <Label>Image</Label>
      {value && <div className="relative mt-2 h-24 w-24">
        <img src={value} alt="Image sélectionnée" className="h-full w-full rounded-md border object-cover" />
        <Button type="button" variant="destructive" size="icon" title="Retirer l’image" aria-label="Retirer l’image" onClick={() => onChange("")}
          className="image-remove absolute -right-2 -top-2 rounded-full shadow-sm"><X /></Button>
      </div>}
      <details className="text-sm">
        <summary className="cursor-pointer py-2 text-muted-foreground">Choisir une image existante</summary>
        <div className="flex flex-wrap gap-3 py-2">
          {presets.map((src, index) =>
            <div key={src} className="relative">
              <Button type="button" variant="ghost" aria-label={`Sélectionner l’image ${index + 1}`} onClick={() => onChange(src)}
                className={`h-16 w-16 overflow-hidden rounded-md border-2 p-0 ${value === src ? "border-primary" : "border-transparent"}`}>
                <img src={src} alt="" className="h-full w-full object-cover" />
              </Button>
              <Button type="button" variant="destructive" size="icon" title="Retirer cette image de la bibliothèque"
                aria-label={`Retirer l’image ${index + 1} de la bibliothèque`} onClick={() => hidePreset(src)}
                className="image-remove absolute -right-2 -top-2 rounded-full shadow-sm"><X /></Button>
            </div>)}
          {presets.length === 0 && <p className="py-2 text-muted-foreground">Aucune image dans la bibliothèque.</p>}
        </div>
        {hidden.length > 0 && <button type="button" className="text-sm text-muted-foreground underline" onClick={restorePresets}>Restaurer les images retirées</button>}
      </details>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => fileInput.current?.click()} className="h-auto min-h-10 max-w-full py-2 text-left whitespace-normal">
          <ImagePlus /> Ajouter une image depuis mon appareil
        </Button>
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
        {!value && <span className="text-sm text-muted-foreground">Aucune image sélectionnée</span>}
      </div>
      <Input placeholder="ou collez un lien d’image (https://…)" value={value.startsWith("data:") ? "" : value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

const CATEGORIES = [{ v: "extra-vierge", l: "Extra Vierge" }, { v: "vierge", l: "Vierge" }];
function CategoryField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const known = CATEGORIES.some((c) => c.v === value);
  const [other, setOther] = useState(!known);
  return (
    <div className="space-y-2"><Label>Catégorie</Label>
      <select className="h-9 w-full rounded-md border bg-background px-2" value={other ? "__autre" : value}
        onChange={(e) => { if (e.target.value === "__autre") { setOther(true); onChange(""); } else { setOther(false); onChange(e.target.value); } }}>
        {CATEGORIES.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
        <option value="__autre">Autre…</option>
      </select>
      {other && <Input required placeholder="Nom de la catégorie" value={value} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

type Product = Tables<"products">;
const emptyProduct = { name: "", description: "", name_en: "", name_ar: "", description_en: "", description_ar: "", price: 0, stock: 0, size: "1 L", category: "extra-vierge", image_url: IMAGES[3], active: true, sort_order: 0 };

function Products() {
  const [list, setList] = useState<Product[]>([]);
  const [edit, setEdit] = useState<Partial<Product> | null>(null);
  const load = () => supabase.from("products").select("*").order("sort_order").then(({ data }) => setList(data ?? []));
  useEffect(() => { load(); }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!edit) return;
    const { id, created_at: _c, updated_at: _u, ...row } = edit as Product;
    const sale = row.sale_price == null || Number(row.sale_price) <= 0 ? null : Number(row.sale_price);
    if (sale !== null && sale >= Number(row.price)) return toast.error("Le prix promo doit être inférieur au prix normal.");
    const payload = { ...row, name: row.name.trim(), price: Number(row.price), sale_price: sale, stock: Math.max(0, Math.floor(Number(row.stock))) };
    const offers = readOffers(row.quantity_offers);
    const src: Record<string, string> = { name: payload.name, description: row.description ?? "" };
    offers.forEach((o, i) => { src[`l${i}`] = o.label ?? ""; src[`b${i}`] = o.badge ?? ""; });
    const t = await autoTranslate(src);
    if (t) {
      Object.assign(payload, { name_en: t.en["name"], name_ar: t.ar["name"], description_en: t.en["description"], description_ar: t.ar["description"],
        quantity_offers: offers.map((o, i) => ({ ...o, label_en: t.en[`l${i}`], label_ar: t.ar[`l${i}`], badge_en: t.en[`b${i}`], badge_ar: t.ar[`b${i}`] })) });
    }
    const { error } = id ? await supabase.from("products").update(payload).eq("id", id) : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Produit enregistré");
    setEdit(null);
    load();
    return;
  }
  async function toggle(p: Product) {
    await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
    load();
  }
  async function remove(p: Product) {
    if (!confirm(`Supprimer définitivement « ${p.name} » ?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) toast.error(error.message); else load();
  }

  if (edit) return (
    <form onSubmit={save} className="space-y-4 rounded-lg border bg-card p-6">
      <h2 className="text-xl font-semibold">{edit.id ? "Modifier le produit" : "Nouveau produit"}</h2>
      <div className="space-y-2"><Label>Nom</Label><Input required value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
      <div className="space-y-2"><Label>Description</Label><Textarea value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>Nom en anglais</Label><Input value={edit.name_en ?? ""} onChange={(e) => setEdit({ ...edit, name_en: e.target.value })} /></div>
        <div className="space-y-2"><Label>Nom en arabe</Label><Input dir="rtl" value={edit.name_ar ?? ""} onChange={(e) => setEdit({ ...edit, name_ar: e.target.value })} /></div>
        <div className="space-y-2"><Label>Description en anglais</Label><Textarea value={edit.description_en ?? ""} onChange={(e) => setEdit({ ...edit, description_en: e.target.value })} /></div>
        <div className="space-y-2"><Label>Description en arabe</Label><Textarea dir="rtl" value={edit.description_ar ?? ""} onChange={(e) => setEdit({ ...edit, description_ar: e.target.value })} /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-2"><Label>Prix (DA)</Label><Input type="number" min={0} step="1" required value={edit.price ?? 0} onChange={(e) => setEdit({ ...edit, price: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label>Stock</Label><Input type="number" min={0} required value={edit.stock ?? 0} onChange={(e) => setEdit({ ...edit, stock: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label>Contenance</Label><Input value={edit.size ?? ""} onChange={(e) => setEdit({ ...edit, size: e.target.value })} /></div>
        <CategoryField value={edit.category ?? ""} onChange={(v) => setEdit({ ...edit, category: v })} />
      </div>
      <div className="space-y-3 rounded-md border border-dashed p-4">
        <div className="flex items-center gap-2">
          <Switch checked={edit.sale_price != null} onCheckedChange={(v) => setEdit({ ...edit, sale_price: v ? Math.round(Number(edit.price || 0) * 0.9) : null })} />
          <Label>Mettre en promotion</Label>
        </div>
        {edit.sale_price != null && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Réduction (%)</Label><Input type="number" min={1} max={99} value={edit.price ? Math.round((1 - Number(edit.sale_price) / Number(edit.price)) * 100) : 0} onChange={(e) => setEdit({ ...edit, sale_price: Math.round(Number(edit.price || 0) * (1 - Number(e.target.value) / 100)) })} /></div>
            <div className="space-y-2"><Label>Nouveau prix promo (DA)</Label><Input type="number" min={1} step="1" required value={edit.sale_price ?? 0} onChange={(e) => setEdit({ ...edit, sale_price: Number(e.target.value) })} /></div>
          </div>
        )}
      </div>
      <ImagePicker value={edit.image_url ?? ""} onChange={(v) => setEdit({ ...edit, image_url: v })} />
      <QuantityOffers productName={edit.name ?? ''} normalPrice={Number(edit.price ?? 0)} enabled={!!edit.packs_enabled} offers={readOffers(edit.quantity_offers)} onToggle={v => setEdit({...edit,packs_enabled:v})} onChange={offers => setEdit({...edit,quantity_offers:JSON.parse(JSON.stringify(offers))})}/>
      <div className="flex items-center gap-2"><Switch checked={!!edit.active} onCheckedChange={(v) => setEdit({ ...edit, active: v })} /><Label>En vente sur le site</Label></div>
      <div className="flex gap-2"><Button>Enregistrer</Button><Button type="button" variant="outline" onClick={() => setEdit(null)}>Annuler</Button></div>
    </form>
  );

  return (
    <div className="space-y-4">
      <Button onClick={() => setEdit({ ...emptyProduct, sort_order: list.length + 1 })}>+ Ajouter un produit</Button>
      {list.map((p) => (
        <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
          {p.image_url && <img src={p.image_url} alt="" className="h-16 w-16 rounded object-cover" />}
          <div className="min-w-48 flex-1">
            <p className="font-semibold">{p.name}</p>
            <p className="text-sm text-muted-foreground">{p.sale_price ? <><s>{money(p.price)}</s> <b className="text-destructive">{money(p.sale_price)} (−{Math.round((1 - p.sale_price / p.price) * 100)} %)</b></> : money(p.price)} · {p.size} · stock {p.stock}</p>
          </div>
          <span className={`rounded px-2 py-1 text-xs ${p.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{p.active ? "En vente" : "Retiré"}</span>
          <Button size="sm" variant="outline" onClick={() => setEdit(p)}>Modifier</Button>
          <Button size="sm" variant="outline" onClick={() => toggle(p)}>{p.active ? "Retirer de la vente" : "Remettre en vente"}</Button>
          <Button size="sm" variant="destructive" onClick={() => remove(p)}>Supprimer</Button>
        </div>
      ))}
    </div>
  );
}

type Article = Tables<"articles">;
function Articles() {
  const [list, setList] = useState<Article[]>([]);
  const [edit, setEdit] = useState<Partial<Article> | null>(null);
  const load = () => supabase.from("articles").select("*").order("created_at", { ascending: false }).then(({ data }) => setList(data ?? []));
  useEffect(() => { load(); }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!edit) return;
    const { id, created_at: _c, updated_at: _u, ...row } = edit as Article;
    const t = await autoTranslate({ title: row.title, excerpt: row.excerpt ?? "", content: row.content ?? "" });
    if (t) row.translations = t;
    const { error } = id ? await supabase.from("articles").update(row).eq("id", id) : await supabase.from("articles").insert(row);
    if (error) return toast.error(error.message);
    toast.success("Article enregistré");
    setEdit(null);
    load();
    return;
  }
  async function remove(a: Article) {
    if (!confirm(`Supprimer « ${a.title} » ?`)) return;
    await supabase.from("articles").delete().eq("id", a.id);
    load();
  }

  if (edit) return (
    <form onSubmit={save} className="space-y-4 rounded-lg border bg-card p-6">
      <h2 className="text-xl font-semibold">{edit.id ? "Modifier l’article" : "Nouvel article"}</h2>
      <div className="space-y-2"><Label>Titre</Label><Input required value={edit.title ?? ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
      <div className="space-y-2"><Label>Résumé</Label><Textarea value={edit.excerpt ?? ""} onChange={(e) => setEdit({ ...edit, excerpt: e.target.value })} /></div>
      <ImagePicker value={edit.image_url ?? ""} onChange={(v) => setEdit({ ...edit, image_url: v })} />
      <div className="flex items-center gap-2"><Switch checked={!!edit.published} onCheckedChange={(v) => setEdit({ ...edit, published: v })} /><Label>Publié sur le site</Label></div>
      <div className="flex gap-2"><Button>Enregistrer</Button><Button type="button" variant="outline" onClick={() => setEdit(null)}>Annuler</Button></div>
    </form>
  );

  return (
    <div className="space-y-4">
      <Button onClick={() => setEdit({ title: "", excerpt: "", image_url: IMAGES[1], published: true })}>+ Ajouter un article</Button>
      {list.map((a) => (
        <div key={a.id} className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
          {a.image_url && <img src={a.image_url} alt="" className="h-16 w-16 rounded object-cover" />}
          <div className="min-w-48 flex-1"><p className="font-semibold">{a.title}</p><p className="line-clamp-1 text-sm text-muted-foreground">{a.excerpt}</p></div>
          <span className="text-xs text-muted-foreground">{a.published ? "Publié" : "Brouillon"}</span>
          <Button size="sm" variant="outline" onClick={() => setEdit(a)}>Modifier</Button>
          <Button size="sm" variant="destructive" onClick={() => remove(a)}>Supprimer</Button>
        </div>
      ))}
    </div>
  );
}

function SitePhotos() {
  const [list, setList] = useState<Tables<"site_texts">[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    supabase.from("site_texts").select("*").like("key", "image_%").order("sort_order").then(({ data, error }) => {
      if (error) {
        toast.error("Impossible de charger les photos");
        return;
      }
      setList(data ?? []);
      setDraft(Object.fromEntries((data ?? []).map((row) => [row.key, row.value])));
      setLoaded(true);
    });
  }, []);
  async function save() {
    setBusy(true);
    try {
      for (const row of list.filter((row) => row.value !== draft[row.key])) {
        const { data, error } = await supabase.from("site_texts").update({ value: draft[row.key] ?? "" }).eq("key", row.key).select("key");
        if (error || !data?.length) throw new Error("Impossible d’enregistrer les photos");
      }
      setList(list.map((row) => ({ ...row, value: draft[row.key] ?? row.value })));
      toast.success("Photos enregistrées");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d’enregistrer les photos");
    } finally { setBusy(false); }
  }
  return <div className="space-y-6">
    <h2 className="text-xl font-semibold">Photos du site</h2>
    {!loaded && <p>Chargement des photos…</p>}
    <div className="grid gap-6 md:grid-cols-2">
      {list.map((row) => <section key={row.key} aria-label={row.label} className="space-y-3 border-b pb-6">
        <h3 className="font-semibold">{row.label}</h3>
        <ImagePicker value={draft[row.key] ?? ""} onChange={(value) => setDraft((previous) => ({ ...previous, [row.key]: value }))} />
      </section>)}
    </div>
    <Button disabled={busy || !loaded} onClick={save}>{busy ? "Enregistrement…" : "Enregistrer les photos"}</Button>
  </div>;
}

function Texts() {
  const [list, setList] = useState<Tables<"site_texts">[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [trDraft, setTrDraft] = useState<Record<string, { en: string; ar: string }>>({});
  const [manual, setManual] = useState<Record<string, boolean>>({});
  const readTr = (t: Tables<"site_texts">) => { const v = (t.translations ?? {}) as Record<string, unknown>; return { en: typeof v["en"] === "string" ? v["en"] : "", ar: typeof v["ar"] === "string" ? v["ar"] : "" }; };
  useEffect(() => {
    supabase.from("site_texts").select("*").order("sort_order").then(({ data }) => {
      const texts = (data ?? []).filter((row) => !row.key.startsWith("image_"));
      setList(texts);
      setDraft(Object.fromEntries(texts.map((t) => [t.key, t.value])));
      setTrDraft(Object.fromEntries(texts.map((t) => [t.key, readTr(t)])));
    });
  }, []);
  async function save() {
    const changed = list.filter((t) => draft[t.key] !== t.value || manual[t.key]);
    const toTranslate = changed.filter((t) => draft[t.key] !== t.value && !manual[t.key]);
    const tr = toTranslate.length ? await autoTranslate(Object.fromEntries(toTranslate.map((t) => [t.key, draft[t.key] ?? ""]))) : null;
    const next = { ...trDraft };
    for (const t of changed) {
      const auto = !manual[t.key] && tr;
      const translations = auto ? { en: tr.en[t.key] ?? "", ar: tr.ar[t.key] ?? "" } : (next[t.key] ?? readTr(t));
      const { error } = await supabase.from("site_texts").update({ value: draft[t.key] ?? "", translations }).eq("key", t.key);
      if (error) return toast.error(error.message);
      next[t.key] = translations;
    }
    setTrDraft(next); setManual({});
    setList(list.map((t) => (changed.includes(t) ? { ...t, value: draft[t.key] ?? t.value, translations: next[t.key] ?? t.translations } : t)));
    if (tr) toast.success("Textes non modifiés à la main traduits automatiquement");
    toast.success(changed.length ? `${changed.length} texte(s) enregistré(s)` : "Aucun changement");
    return;
  }
  const field = (t: Tables<"site_texts">) => {
    const long = t.value.length > 60;
    const tv = trDraft[t.key] ?? { en: "", ar: "" };
    const setLang = (l: "en" | "ar", v: string) => { setTrDraft({ ...trDraft, [t.key]: { ...tv, [l]: v } }); setManual({ ...manual, [t.key]: true }); };
    return (
      <div key={t.key} className="space-y-1">
        <Label htmlFor={`site-text-${t.key}`}>{t.label} (français)</Label>
        {long ? <Textarea id={`site-text-${t.key}`} value={draft[t.key] ?? ""} onChange={(e) => setDraft({ ...draft, [t.key]: e.target.value })} />
          : <Input id={`site-text-${t.key}`} value={draft[t.key] ?? ""} onChange={(e) => setDraft({ ...draft, [t.key]: e.target.value })} />}
        <details className="rounded-md border px-3 py-2 text-sm">
          <summary className="cursor-pointer text-muted-foreground">Anglais et arabe{manual[t.key] ? " — modifié à la main" : ""}</summary>
          <div className="mt-2 space-y-2">
            <Label htmlFor={`site-text-${t.key}-en`}>Anglais</Label>
            {long ? <Textarea id={`site-text-${t.key}-en`} value={tv.en} onChange={(e) => setLang("en", e.target.value)} /> : <Input id={`site-text-${t.key}-en`} value={tv.en} onChange={(e) => setLang("en", e.target.value)} />}
            <Label htmlFor={`site-text-${t.key}-ar`}>Arabe</Label>
            {long ? <Textarea dir="rtl" id={`site-text-${t.key}-ar`} value={tv.ar} onChange={(e) => setLang("ar", e.target.value)} /> : <Input dir="rtl" id={`site-text-${t.key}-ar`} value={tv.ar} onChange={(e) => setLang("ar", e.target.value)} />}
            <p className="text-xs text-muted-foreground">Si vous modifiez l’anglais ou l’arabe, votre version est gardée telle quelle à l’enregistrement.</p>
          </div>
        </details>
      </div>
    );
  };
  const productKeys = ["products_eyebrow", "products_title", "products_text", "see_range", "extra_eyebrow", "extra_title", "extra_text", "extra_button", "virgin_eyebrow", "virgin_title", "virgin_text", "virgin_button"];
  return (
    <div className="space-y-6">
      <section aria-label="Nos produits" className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">Nos produits</h2>
        {list.filter((t) => productKeys.includes(t.key)).map(field)}
      </section>
      {list.filter((t) => !productKeys.includes(t.key)).map(field)}
      <Button onClick={save} className="sticky bottom-4">Enregistrer les textes</Button>
    </div>
  );
}

type Order = Tables<"orders"> & { order_items: Tables<"order_items">[] };
const STATUSES = ["nouvelle", "confirmée", "expédiée", "livrée", "annulée"];
function Orders() {
  const [list, setList] = useState<Order[]>([]);
  const [filter, setFilter] = useState("à traiter");
  const load = () => supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).then(({ data }) => setList((data as Order[]) ?? []));
  useEffect(() => { load(); }, []);
  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else load();
  }
  async function remove(o: Order) {
    if (!canDeleteOrder(o.status) || !confirm(`Supprimer définitivement la commande #MIT-${String(o.order_number).padStart(6, '0')} annulée ?`)) return;
    const { data, error } = await supabase.from('orders').delete().eq('id', o.id).eq('status', 'annulée').select('id');
    if (error || !data?.length) { toast.error('Suppression impossible : la commande doit être annulée.'); return; }
    toast.success('Commande annulée supprimée'); load();
  }
  if (!list.length) return <p className="text-muted-foreground">Aucune commande pour le moment.</p>;
  const shown = list.filter((o) => filter === "toutes" || (filter === "à traiter" ? ["nouvelle", "confirmée"].includes(o.status) : o.status === filter));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["à traiter", "toutes", ...STATUSES].map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f} ({f === "toutes" ? list.length : f === "à traiter" ? list.filter((o) => ["nouvelle", "confirmée"].includes(o.status)).length : list.filter((o) => o.status === f).length})
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={load}>Actualiser</Button>
      </div>
      {!shown.length && <p className="text-muted-foreground">Aucune commande dans cette catégorie.</p>}
      {shown.map((o) => (
        <div key={o.id} className="space-y-2 rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">#MIT-{String(o.order_number).padStart(6, "0")} · {money(o.total)}</p>
            <div className="flex flex-wrap items-center gap-2">
            {o.status === "nouvelle" && <Button size="sm" onClick={() => setStatus(o.id, "confirmée")}>Confirmer</Button>}
            {o.status === "confirmée" && <Button size="sm" onClick={() => setStatus(o.id, "expédiée")}>Marquer comme envoyée</Button>}
            {o.status === "expédiée" && <Button size="sm" onClick={() => setStatus(o.id, "livrée")}>Marquer comme livrée</Button>}
            <select aria-label={`Statut commande ${o.order_number}`} className="h-9 rounded-md border bg-background px-2" value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            {canDeleteOrder(o.status) && <Button size="sm" variant="destructive" onClick={() => remove(o)}>Supprimer</Button>}
            </div>
          </div>
          <p className="text-sm">{o.first_name} {o.last_name} · <a className="underline" href={`tel:${o.phone}`}><bdi dir="ltr">{o.phone}</bdi></a>{o.email && ` · ${o.email}`}</p>
          <p className="text-sm text-muted-foreground">{o.destination === "international" ? <b>International (devis) · {o.country} · </b> : null}{o.address}, {o.commune}, {o.wilaya} · {date(o.created_at)}</p>
          <ul className="text-sm">
            {o.order_items.map((i) => <li key={i.id}>{i.quantity} × {i.product_name}{i.pack_label ? ` · ${i.pack_label}` : ''} ({money(i.unit_price * i.quantity)})</li>)}
            {o.destination !== "international" && <li>Livraison {o.delivery_type === "bureau" ? "au bureau" : "à domicile"} : {money(o.shipping_fee)}</li>}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Messages({ readOnly = false }: { readOnly?: boolean }) {
  const [list, setList] = useState<Tables<"contact_messages">[]>([]);
  const load = () => supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).then(({ data }) => setList(data ?? []));
  useEffect(() => { load(); }, []);
  async function remove(id: string) {
    if (!confirm("Supprimer ce message ?")) return;
    await supabase.from("contact_messages").delete().eq("id", id);
    load();
  }
  if (!list.length) return <p className="text-muted-foreground">Aucun message pour le moment.</p>;
  return (
    <div className="space-y-4">
      {list.map((m) => (
        <div key={m.id} className="space-y-1 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">{m.name} · <a className="underline" href={`mailto:${m.email}`}>{m.email}</a></p>
            {!readOnly && <Button size="sm" variant="outline" onClick={() => remove(m.id)}>Supprimer</Button>}
          </div>
          <p className="text-xs text-muted-foreground">{date(m.created_at)}</p>
          <p className="whitespace-pre-wrap text-sm">{m.message}</p>
        </div>
      ))}
    </div>
  );
}

type Award = Tables<"awards">;
function Awards() {
  const [list, setList] = useState<Award[]>([]);
  const [edit, setEdit] = useState<Partial<Award> | null>(null);
  const load = () => supabase.from("awards").select("*").order("sort_order").then(({ data }) => setList(data ?? []));
  useEffect(() => { load(); }, []);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!edit) return;
    const { id, created_at: _c, ...row } = edit as Award;
    const payload = { ...row, title: row.title.trim() };
    const t = await autoTranslate({ title: payload.title, description: row.description ?? "" });
    if (t) payload.translations = t;
    const { error } = id ? await supabase.from("awards").update(payload).eq("id", id) : await supabase.from("awards").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Distinction enregistrée");
    setEdit(null);
    load();
    return;
  }
  async function remove(a: Award) {
    if (!confirm(`Supprimer « ${a.title} » ?`)) return;
    await supabase.from("awards").delete().eq("id", a.id);
    load();
  }
  if (edit) return (
    <form onSubmit={save} className="space-y-4 rounded-lg border bg-card p-6">
      <h2 className="text-xl font-semibold">{edit.id ? "Modifier la distinction" : "Nouvelle médaille / trophée"}</h2>
      <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
        <div className="space-y-2"><Label>Titre (ex. Médaille d’or — Concours …)</Label><Input required value={edit.title ?? ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
        <div className="space-y-2"><Label>Année</Label><Input value={edit.year ?? ""} onChange={(e) => setEdit({ ...edit, year: e.target.value })} /></div>
      </div>
      <div className="space-y-2"><Label>Description</Label><Textarea value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
      <ImagePicker value={edit.image_url ?? ""} onChange={(v) => setEdit({ ...edit, image_url: v })} />
      <div className="flex items-center gap-2"><Switch checked={!!edit.published} onCheckedChange={(v) => setEdit({ ...edit, published: v })} /><Label>Afficher sur le site</Label></div>
      <div className="flex gap-2"><Button>Enregistrer</Button><Button type="button" variant="outline" onClick={() => setEdit(null)}>Annuler</Button></div>
    </form>
  );
  return (
    <div className="space-y-4">
      <Button onClick={() => setEdit({ title: "", year: "", description: "", image_url: "", published: true, sort_order: list.length + 1 })}>+ Ajouter une médaille / un trophée</Button>
      {!list.length && <p className="text-muted-foreground">Aucune distinction pour le moment.</p>}
      {list.map((a) => (
        <div key={a.id} className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
          {a.image_url && <img src={a.image_url} alt="" className="h-16 w-16 rounded object-cover" />}
          <div className="min-w-48 flex-1"><p className="font-semibold">{a.title}</p><p className="text-sm text-muted-foreground">{a.year}</p></div>
          <span className="text-xs text-muted-foreground">{a.published ? "Affichée" : "Masquée"}</span>
          <Button size="sm" variant="outline" onClick={() => setEdit(a)}>Modifier</Button>
          <Button size="sm" variant="destructive" onClick={() => remove(a)}>Supprimer</Button>
        </div>
      ))}
    </div>
  );
}

type Review = Tables<"reviews"> & { products: { name: string } | null };
function Reviews() {
  const [list, setList] = useState<Review[]>([]);
  const load = () => supabase.from("reviews").select("*, products(name)").order("created_at", { ascending: false }).then(({ data }) => setList((data as Review[]) ?? []));
  useEffect(() => { load(); }, []);
  async function toggle(r: Review) {
    const { error } = await supabase.from("reviews").update({ approved: !r.approved }).eq("id", r.id);
    if (error) toast.error(error.message); else load();
  }
  async function remove(r: Review) {
    if (!confirm("Supprimer cet avis ?")) return;
    await supabase.from("reviews").delete().eq("id", r.id);
    load();
  }
  if (!list.length) return <p className="text-muted-foreground">Aucun avis pour le moment.</p>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Les nouveaux avis n’apparaissent sur le site qu’après votre validation.</p>
      {list.map((r) => (
        <div key={r.id} className="space-y-1 rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">{r.name} · <span className="text-yellow-600">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span> · {r.products?.name ?? "Produit supprimé"}</p>
            <div className="flex gap-2">
              <Button size="sm" variant={r.approved ? "outline" : "default"} onClick={() => toggle(r)}>{r.approved ? "Masquer" : "Valider"}</Button>
              <Button size="sm" variant="destructive" onClick={() => remove(r)}>Supprimer</Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{date(r.created_at)} · {r.approved ? "Publié" : "En attente"}</p>
          <p className="whitespace-pre-wrap text-sm">{r.comment}</p>
        </div>
      ))}
    </div>
  );
}

function Stats() {
  type O = { id: string; total: number; shipping_fee: number; status: string; email: string; country: string; acquisition_source: string; wilaya: string; destination: string; created_at: string; order_items: { product_name: string; quantity: number; unit_price: number }[] };
  const [orders, setOrders] = useState<O[] | null>(null);
  const [period, setPeriod] = useState(30);
  const [chartDays, setChartDays] = useState(14);
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [reviews, setReviews] = useState<Tables<"reviews">[]>([]);
  const [messages, setMessages] = useState(0);
  useEffect(() => {
    async function loadOrders() {
      const all: O[] = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await supabase.from("orders").select("id,total,shipping_fee,status,email,country,acquisition_source,wilaya,destination,created_at,order_items(product_name,quantity,unit_price)").order('created_at', { ascending: false }).range(offset, offset + 999);
        if (error) { toast.error('Statistiques indisponibles'); return; }
        all.push(...(data as O[])); if (data.length < 1000) break;
      }
      setOrders(all);
    }
    void loadOrders();
    supabase.from("products").select("*").then(({ data }) => setProducts(data ?? []));
    supabase.from("reviews").select("*").then(({ data }) => setReviews(data ?? []));
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).then(({ count }) => setMessages(count ?? 0));
  }, []);
  if (!orders) return <p className="text-muted-foreground">Chargement…</p>;

  const selected = orders.filter((o) => Date.now() - new Date(o.created_at).getTime() < period * 864e5);
  const valid = selected.filter((o) => o.status !== "annulée");
  const revenue = valid.reduce((s, o) => s + Number(o.total), 0);
  const delivered = selected.filter((o) => o.status === "livrée").reduce((s, o) => s + Number(o.total), 0);
  const since = (d: number) => valid.filter((o) => Date.now() - new Date(o.created_at).getTime() < d * 864e5);
  const m30 = since(30);
  const byStatus = ["nouvelle", "confirmée", "expédiée", "livrée", "annulée"].map((s) => [s, selected.filter((o) => o.status === s).length] as const);
  const count = (keyOf: (o: O) => [string, number][]) => {
    const m = new Map<string, number>();
    valid.forEach((o) => keyOf(o).forEach(([k, n]) => m.set(k, (m.get(k) ?? 0) + n)));
    return [...m].sort((a, b) => b[1] - a[1]).slice(0, 8);
  };
  const topProducts = count((o) => o.order_items.map((i) => [i.product_name, i.quantity]));
  const topWilayas = count((o) => [[o.destination === "international" ? o.country || "International" : o.wilaya, 1]]);
  const approved = reviews.filter((r) => r.approved);
  const avg = approved.length ? approved.reduce((s, r) => s + r.rating, 0) / approved.length : 0;
  const lowStock = products.filter((p) => p.active && p.stock <= 5);

  const chartData = (() => {
    const dayStart = (d: Date) => { d.setHours(0, 0, 0, 0); return d; };
    if (chartDays <= 60) {
      return Array.from({ length: chartDays }, (_, i) => {
        const d = dayStart(new Date()); d.setDate(d.getDate() - (chartDays - 1) + i);
        const n = valid.filter((o) => new Date(o.created_at).toDateString() === d.toDateString());
        return { label: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), n: n.length, total: n.reduce((s, o) => s + Number(o.total), 0) };
      });
    }
    const months = chartDays === 180 ? 6 : 12;
    return Array.from({ length: months }, (_, i) => {
      const d = dayStart(new Date()); d.setDate(1); d.setMonth(d.getMonth() - (months - 1) + i);
      const next = new Date(d); next.setMonth(next.getMonth() + 1);
      const n = valid.filter((o) => { const t = new Date(o.created_at); return t >= d && t < next; });
      return { label: d.toLocaleDateString("fr-FR", { month: "short", ...(chartDays === 365 ? { year: "2-digit" } : {}) }), n: n.length, total: n.reduce((s, o) => s + Number(o.total), 0) };
    });
  })();
  const maxDay = Math.max(1, ...chartData.map((d) => d.total));
  const customerSources = count((o) => [[o.acquisition_source, 1]]);
  const customers = new Map<string, number>(); valid.forEach((o) => customers.set(o.email.toLowerCase(), (customers.get(o.email.toLowerCase()) ?? 0) + 1));

  const Card = ({ t, v, s }: { t: string; v: string | number; s?: string }) => (
    <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">{t}</p><p className="mt-1 text-xl font-bold sm:text-2xl">{v}</p>{s && <p className="text-xs text-muted-foreground">{s}</p>}</div>
  );
  const List = ({ title, rows, empty }: { title: string; rows: readonly (readonly [string, number])[]; empty: string }) => {
    const max = Math.max(1, ...rows.map((r) => r[1]));
    return (
      <div className="rounded-lg border bg-card p-4"><h3 className="mb-3 font-semibold">{title}</h3>
        {rows.length ? rows.map(([k, n]) => (
          <div key={k} className="mb-2"><div className="flex justify-between text-sm"><span>{k}</span><span className="font-medium">{n}</span></div>
            <div className="h-2 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${(n / max) * 100}%` }} /></div></div>
        )) : <p className="text-sm text-muted-foreground">{empty}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Vue d’ensemble</h2><select aria-label="Période des statistiques" className="h-11 rounded-md border bg-background px-3" value={period} onChange={(e) => setPeriod(Number(e.target.value))}><option value={7}>7 derniers jours</option><option value={30}>30 derniers jours</option><option value={90}>90 derniers jours</option><option value={365}>12 derniers mois</option></select></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card t="Valeur des commandes" v={money(revenue)} s={`hors annulées · livré : ${money(delivered)}`} />
        <Card t="Commandes" v={selected.length} s={`${selected.filter((o) => o.status === "annulée").length} annulées`} />
        <Card t="Panier moyen" v={money(valid.length ? Math.round(revenue / valid.length) : 0)} />
        <Card t="À traiter" v={orders.filter((o) => o.status === "nouvelle" || o.status === "confirmée").length} s="nouvelles + confirmées" />
        <Card t="Produits en vente" v={`${products.filter((p) => p.active).length} / ${products.length}`} />
        <Card t="Note moyenne des avis" v={approved.length ? `${avg.toFixed(1)} / 5` : "—"} s={`${approved.length} publiés · ${reviews.length - approved.length} en attente`} />
        <Card t="Messages reçus" v={messages} />
        <Card t="Ventes produits" v={money(valid.reduce((s, o) => s + Number(o.total) - Number(o.shipping_fee), 0))} s="hors frais de livraison" />
        <Card t="Clients" v={customers.size} s={`${[...customers.values()].filter((n) => n > 1).length} clients récurrents`} />
        <Card t="Frais de livraison" v={money(valid.reduce((s, o) => s + Number(o.shipping_fee), 0))} />
      </div>
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Ventes</h3>
          <select aria-label="Période du graphique des ventes" className="h-10 rounded-md border bg-background px-2 text-sm" value={chartDays} onChange={(e) => setChartDays(Number(e.target.value))}>
            <option value={5}>5 derniers jours</option>
            <option value={14}>14 derniers jours</option>
            <option value={30}>Mois dernier (30 jours)</option>
            <option value={180}>6 derniers mois</option>
            <option value={365}>Année dernière</option>
          </select>
        </div>
        <div className="overflow-x-auto"><div className="flex h-40 min-w-[460px] items-end gap-1">
          {chartData.map((d) => (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-1" title={`${d.n} commande(s) · ${money(d.total)}`}>
              <div className="w-full rounded-t bg-primary" style={{ height: `${(d.total / maxDay) * 120}px`, minHeight: d.total ? 4 : 1 }} />
              <span className="text-[10px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div></div>
      </div>
      <Traffic days={period} />
      <div className="grid gap-4 md:grid-cols-2">
        <List title="Produits les plus vendus (quantité)" rows={topProducts} empty="Aucune vente" />
        <List title="Origine des clients (wilayas / pays)" rows={topWilayas} empty="Aucune commande" />
        <List title="Commandes par statut" rows={byStatus} empty="—" />
        <List title="Sources des commandes" rows={customerSources} empty="Aucune commande" />
      </div>
      {lowStock.length > 0 && (
        <div className="rounded-lg border border-destructive bg-card p-4"><h3 className="mb-2 font-semibold text-destructive">Stock faible (≤ 5)</h3>
          {lowStock.map((p) => <p key={p.id} className="text-sm">{p.name} : {p.stock} restant(s)</p>)}</div>
      )}
    </div>
  );
}
