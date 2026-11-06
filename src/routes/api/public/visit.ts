import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { publicDb } from '@/lib/public-db.server';
export const Route = createFileRoute('/api/public/visit')({ server: { handlers: {
  POST: async ({ request }) => {
    const origin = request.headers.get('origin');
    if (origin !== new URL(request.url).origin) return new Response(null, { status: 403 });
    if (Number(request.headers.get('content-length') ?? 0) > 2048) return new Response(null, { status: 413 });
    const raw = await request.text();
    if (raw.length > 2048) return new Response(null, { status: 413 });
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return new Response(null, { status: 400 }); }
    const parsed = z.object({ source: z.string().max(100), device: z.enum(['Téléphone', 'Ordinateur', 'Tablette']), language: z.enum(['fr', 'en', 'ar']) }).safeParse(body);
    if (!parsed.success) return new Response(null, { status: 400 });
    const countryHeader = request.headers.get('cf-ipcountry');
    const country = countryHeader && /^[A-Z]{2}$/.test(countryHeader) ? countryHeader : 'Inconnu';
    const { error } = await publicDb().rpc('record_shop_visit', { p_source: parsed.data.source, p_country: country, p_device: parsed.data.device, p_language: parsed.data.language });
    return new Response(null, { status: error ? 503 : 204 });
  },
} } });