import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MITINAN — Huile d’olive de Kabylie" },
      { name: "description", content: "MITINAN — huile d’olive vierge et extra vierge des montagnes de Kabylie, Bouira, Algérie." },
      { property: "og:title", content: "MITINAN — Huile d’olive de Kabylie" },
      { property: "og:description", content: "Huile d’olive authentique, extraction à froid, 100% naturelle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    // Password-reset links can land on the home page: forward them to the reset form.
    const { hash, search } = window.location;
    if (/type=recovery/.test(hash + search) || /error_code=otp_expired/.test(hash)) {
      window.location.replace(`/reset-password${search}${hash}`);
    }
  }, []);
  return <iframe src="/site.html" title="MITINAN" className="fixed inset-0 h-full w-full border-0" />;
}
