import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// The storefront is used by anonymous visitors, so its endpoints must work with the
// publishable key only. The privileged client needs a key the shop owner cannot export,
// so any route referencing it would break on Vercel or any other host.
const PUBLIC_ROUTES = [
  'src/routes/api/orders.ts',
  'src/routes/api/contact.ts',
  'src/routes/api/reviews.ts',
  'src/routes/api/public/visit.ts',
];

describe('Storefront endpoints stay host independent', () => {
  for (const file of PUBLIC_ROUTES) {
    it(`${file} works without the administrator key`, () => {
      const source = readFileSync(resolve(process.cwd(), file), 'utf8');
      expect(source).not.toMatch(/supabaseAdmin/);
      expect(source).not.toMatch(/client\.server/);
      expect(source).toMatch(/publicDb\(\)/);
    });
  }
});
