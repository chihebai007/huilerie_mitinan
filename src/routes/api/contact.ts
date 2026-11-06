import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { publicDb, json } from "@/lib/public-db.server";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(2000),
  website: z.string().optional(),
  t: z.number().optional(),
});

export const Route = createFileRoute("/api/contact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ error: "Merci de remplir correctement le formulaire." }, 400);
        const { website, t, ...row } = parsed.data;
        if (website || (t !== undefined && t < 3000)) return json({ ok: true }); // robot
        const { error } = await publicDb().from("contact_messages").insert(row);
        if (error) return json({ error: "Erreur serveur" }, 500);
        return json({ ok: true });
      },
    },
  },
});
