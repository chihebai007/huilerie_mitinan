import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { publicDb, json } from "@/lib/public-db.server";

const schema = z.object({
  product_id: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(1000),
  website: z.string().optional(),
});

export const Route = createFileRoute("/api/reviews")({
  server: {
    handlers: {
      GET: async () => {
        const { data, error } = await publicDb()
          .from("reviews")
          .select("id,product_id,name,rating,comment,created_at")
          .eq("approved", true)
          .order("created_at", { ascending: false })
          .limit(500);
        if (error) return json([], 500);
        return json(data);
      },
      POST: async ({ request }) => {
        const parsed = schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ error: "Merci de remplir correctement l’avis." }, 400);
        const { website, ...row } = parsed.data;
        if (website) return json({ ok: true }); // robot (honeypot)
        const { error } = await publicDb().from("reviews").insert({ ...row, approved: false });
        if (error) return json({ error: "Erreur serveur" }, 500);
        return json({ ok: true });
      },
    },
  },
});
