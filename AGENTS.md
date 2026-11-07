<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Store fixed public-page photo settings as `image_` keys in `site_texts`, separate from text editing, so existing admin permissions and public reads remain authoritative.
- Validate public image sources through `public/image-url.js`, allowing raster data URLs from the shared admin picker but rejecting executable sources.
- Treat empty saved image values as intentionally removed across public and admin views; the shared picker separates the selected preview from the optional preset library to avoid confusing removal with asset deletion.
- Enforce shop-staff permissions with database role policies and admin-only team server functions; UI visibility is not authorization.
- Keep anonymous analytics in daily aggregate rows without IP addresses or persistent visitor identifiers; acquisition sources are recorded on orders for customer attribution.
- Enforce cancelled-only order deletion in a database trigger as well as the shared UI rule, so every deletion path respects the restriction.
- Store quantity offers on products and share pack-pricing logic between the storefront and order handler; persist the chosen pack label with order items so historical orders remain understandable.
- Checkout offer changes use shared pricing validation and update the persisted cart and totals together, preserving pack counts and checking aggregate product stock.
- Keep the pack editor scoped to its parent product and collapse secondary translation fields; this keeps the primary price and quantity controls unambiguous.

- Render fixed public photos only from saved `image_` settings, without HTML/CSS preset sources, so refreshes and failed reads cannot resurrect old or removed photos.
- Render public product, article and award cards plus fixed image sources into the initial HTML using the shared image validator; injected data alone does not provide immediate visible content before browser scripts run.
- Admin saves re-translate French content to EN/AR through the staff-only translateFields server function (site_texts/articles/awards store it in a translations jsonb; products use name_*/description_* and pack label_*/badge_*), and saving still succeeds if translation fails.

- Manage managers only through the signed-in admin session: self sign-up fills `profiles`, and admin-only SECURITY DEFINER `grant_manager`/`revoke_manager` change roles, so it works on any host without the service-role key.
- Use the application-owned tab-scoped staff auth client for every staff page and bearer middleware, with local-scope sign-out; distinct storage/broadcast keys prevent one tab or device from replacing another account. Do not restore the generated bearer attacher, which uses shared browser auth.
