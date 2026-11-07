import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/staff-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — MITINAN" },
      { name: "description", content: "Choisir un nouveau mot de passe pour l’espace MITINAN." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Nouveau mot de passe — MITINAN" },
      { property: "og:description", content: "Choisir un nouveau mot de passe pour l’espace MITINAN." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data: d }) => d.session && setReady(true));
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 10) return toast.error("Au moins 10 caractères.");
    if (pw !== pw2) return toast.error("Les deux mots de passe ne correspondent pas.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Mot de passe modifié.");
    setTimeout(() => (window.location.href = "/admin"), 800);
    return;
  }

  return (
    <div className="grid min-h-screen place-items-center bg-muted/40 p-4">
      <Toaster />
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
        {!ready ? (
          <p className="text-sm text-muted-foreground">Ouvrez cette page depuis le lien reçu par email.</p>
        ) : (
          <>
            <div className="space-y-2"><Label>Nouveau mot de passe</Label><Input type="password" autoComplete="new-password" required value={pw} onChange={(e) => setPw(e.target.value)} /></div>
            <div className="space-y-2"><Label>Confirmer</Label><Input type="password" autoComplete="new-password" required value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
            <Button className="w-full" disabled={busy}>Enregistrer</Button>
          </>
        )}
      </form>
    </div>
  );
}
