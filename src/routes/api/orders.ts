import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { publicDb, json } from "@/lib/public-db.server";

const schema = z
  .object({
    destination: z.enum(["algerie", "international"]).default("algerie"),
    country: z.string().trim().max(100).optional().default(""),
    first_name: z.string().trim().min(1).max(100),
    last_name: z.string().trim().min(1).max(100),
    phone: z.string().trim().regex(/^[+\d\s().-]{8,20}$/, "Téléphone invalide"),
    email: z.string().trim().email("Email invalide").max(255),
    wilaya: z.string().trim().max(100).optional().default(""),
    commune: z.string().trim().max(100).optional().default(""),
    address: z.string().trim().min(3).max(500),
    delivery_type: z.enum(["domicile", "bureau"]).default("domicile"),
    website: z.string().optional(),
    acquisition_source: z.string().trim().max(100).optional().default("Non renseignée"),
    items: z
      .array(
        z.object({
          product_id: z.string().uuid(),
          quantity: z.number().int().min(1).max(100),
          offer_id: z.string().max(100).optional().default(""),
        }),
      )
      .min(1, "Panier vide")
      .max(50),
  })
  .superRefine((v, ctx) => {
    if (v.destination === "algerie") {
      if (!v.wilaya) ctx.addIssue({ code: "custom", message: "Choisissez votre wilaya" });
      if (!v.commune) ctx.addIssue({ code: "custom", message: "Indiquez votre commune" });
    } else if (!v.country) ctx.addIssue({ code: "custom", message: "Indiquez votre pays" });
  });

// Problems the customer can actually fix: the database raises these for a cart whose
// quantities, offers, stock or wilaya no longer match what is stored.
const CORRECTABLE = [
  "Quantite invalide",
  "Panier vide",
  "Un produit du panier",
  "Stock insuffisant",
  "Ce pack",
  "Choisissez votre wilaya",
  "Livraison indisponible",
  "Merci de remplir",
];

export const Route = createFileRoute("/api/orders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Requête invalide" }, 400);
        }
        const parsed = schema.safeParse(body);
        if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, 400);
        const { items, website, ...customer } = parsed.data;
        if (website) return json({ ok: true, order_number: 0 }); // robot (honeypot)
        if (customer.destination === "international") {
          customer.wilaya = customer.wilaya || "International";
          customer.commune = customer.commune || customer.country;
        }

        // The database re-prices every line from its own product rows, checks the stock,
        // applies the admin-managed delivery rate, then writes the order, its lines and the
        // stock in one transaction. No administrator key is needed.
        const { data, error } = await publicDb().rpc("place_order", {
          p_customer: customer,
          p_items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, offer_id: i.offer_id })),
        });
        if (error) {
          const message = error.message ?? "";
          if (CORRECTABLE.some((k) => message.includes(k))) return json({ error: message }, 400);
          return json({ error: "Erreur lors de l’enregistrement" }, 500);
        }
        return json({ ok: true, order_number: Number(data) });
      },
    },
  },
});
