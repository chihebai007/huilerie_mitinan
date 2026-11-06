-- Make public storefront writes (orders, contact messages, reviews, visits) work with the
-- publishable key only: no service-role key, so the app runs identically on Lovable, Vercel
-- or any other host.

-- 1. Pricing helper: the persisted order total is computed from the database row, never from
--    what the browser sent. Mirrors public/pack-pricing.js (change both together).
CREATE OR REPLACE FUNCTION public.order_line_price(p_product jsonb, p_quantity integer, p_offer_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base numeric := coalesce(nullif(p_product->>'price','')::numeric, 0);
  sale numeric := coalesce(nullif(p_product->>'sale_price','')::numeric, 0);
  unit numeric;
  offer jsonb;
  oq integer;
  op numeric;
  total numeric;
  label text;
BEGIN
  IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 100 THEN
    RAISE EXCEPTION 'Quantite invalide.';
  END IF;
  unit := CASE WHEN sale > 0 AND sale < base THEN sale ELSE base END;
  IF p_offer_id IS NULL OR p_offer_id = '' THEN
    RETURN jsonb_build_object('unit', unit, 'total', unit * p_quantity, 'label', '');
  END IF;
  IF coalesce((p_product->>'packs_enabled')::boolean, false)
     AND jsonb_typeof(coalesce(p_product->'quantity_offers','[]'::jsonb)) = 'array' THEN
    SELECT o INTO offer
      FROM jsonb_array_elements(p_product->'quantity_offers') o
     WHERE o->>'id' = p_offer_id AND o->>'enabled' = 'true';
  END IF;
  IF offer IS NULL THEN
    RAISE EXCEPTION 'Ce pack n''est plus disponible. Veuillez actualiser votre panier.';
  END IF;
  oq := coalesce(nullif(offer->>'quantity','')::integer, 0);
  op := coalesce(nullif(offer->>'price','')::numeric, 0);
  IF oq < 2 OR oq > 100 OR op <= 0 OR p_quantity % oq <> 0 OR op > base * oq THEN
    RAISE EXCEPTION 'Ce pack n''est plus disponible. Veuillez actualiser votre panier.';
  END IF;
  total := op * (p_quantity / oq);
  label := coalesce(nullif(offer->>'label',''), 'Pack ' || oq);
  RETURN jsonb_build_object('unit', total / p_quantity, 'total', total, 'label', label);
END $$;
REVOKE ALL ON FUNCTION public.order_line_price(jsonb, integer, text) FROM PUBLIC, anon, authenticated;

-- 2. Order placement: validates the customer, re-prices every line from the database, checks
--    stock, applies the admin-managed delivery rate, then writes the order atomically.
CREATE OR REPLACE FUNCTION public.place_order(p_customer jsonb, p_items jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item jsonb;
  v_product record;
  v_price jsonb;
  v_qty integer;
  v_total numeric := 0;
  v_shipping numeric := 0;
  v_lines jsonb := '[]'::jsonb;
  v_need jsonb := '{}'::jsonb;
  v_dest text;
  v_delivery text;
  v_code integer;
  v_rate record;
  v_stock integer;
  v_name text;
  v_order_id uuid;
  v_number integer;
BEGIN
  v_dest := coalesce(p_customer->>'destination', 'algerie');
  v_delivery := coalesce(p_customer->>'delivery_type', 'domicile');
  IF coalesce(p_customer->>'first_name','') = '' OR length(p_customer->>'first_name') > 100
     OR coalesce(p_customer->>'last_name','') = '' OR length(p_customer->>'last_name') > 100
     OR coalesce(p_customer->>'phone','') = '' OR length(p_customer->>'phone') > 20
     OR coalesce(p_customer->>'email','') = '' OR length(p_customer->>'email') > 255
     OR p_customer->>'email' NOT LIKE '%_@_%._%'
     OR coalesce(p_customer->>'address','') = '' OR length(p_customer->>'address') > 500
     OR coalesce(p_customer->>'wilaya','') = '' OR length(p_customer->>'wilaya') > 100
     OR coalesce(p_customer->>'commune','') = '' OR length(p_customer->>'commune') > 100
     OR coalesce(p_customer->>'country','') = '' OR length(p_customer->>'country') > 100
     OR length(coalesce(p_customer->>'acquisition_source','')) > 100
     OR v_dest NOT IN ('algerie','international')
     OR v_delivery NOT IN ('domicile','bureau') THEN
    RAISE EXCEPTION 'Merci de remplir correctement le formulaire.';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Panier vide.';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    IF v_item->>'product_id' IS NULL OR v_item->>'product_id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RAISE EXCEPTION 'Un produit du panier n''est plus disponible.';
    END IF;
    v_qty := coalesce(nullif(v_item->>'quantity','')::integer, 0);
    SELECT * INTO v_product FROM public.products WHERE id = (v_item->>'product_id')::uuid FOR UPDATE;
    IF NOT FOUND OR NOT coalesce(v_product.active, false) THEN
      RAISE EXCEPTION 'Un produit du panier n''est plus disponible.';
    END IF;
    v_price := public.order_line_price(to_jsonb(v_product), v_qty, coalesce(v_item->>'offer_id',''));
    v_total := v_total + (v_price->>'total')::numeric;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'product_id', v_item->>'product_id',
      'product_name', v_product.name,
      'quantity', v_qty,
      'unit_price', (v_price->>'unit')::numeric,
      'pack_label', coalesce(v_price->>'label','')));
    v_need := jsonb_set(v_need, array[v_item->>'product_id'],
      to_jsonb(coalesce(nullif(v_need->>(v_item->>'product_id'),'')::integer, 0) + v_qty));
  END LOOP;

  FOR v_item IN SELECT (kv).key AS id, (kv).value AS qty FROM (SELECT jsonb_each(v_need) AS kv) s LOOP
    SELECT stock, name INTO v_stock, v_name FROM public.products WHERE id = (v_item->>'id')::uuid FOR UPDATE;
    IF coalesce(v_stock, 0) < (v_item->>'qty')::integer THEN
      RAISE EXCEPTION 'Stock insuffisant pour « % » (reste %).', v_name, coalesce(v_stock, 0);
    END IF;
  END LOOP;

  IF v_dest = 'algerie' THEN
    v_code := nullif(split_part(p_customer->>'wilaya', ' ', 1), '')::integer;
    IF v_code IS NULL THEN RAISE EXCEPTION 'Choisissez votre wilaya'; END IF;
    SELECT * INTO v_rate FROM public.shipping_rates WHERE wilaya_code = v_code;
    IF NOT FOUND THEN RAISE EXCEPTION 'Choisissez votre wilaya'; END IF;
    IF NOT coalesce(v_rate.available, false) THEN RAISE EXCEPTION 'Livraison indisponible dans cette wilaya.'; END IF;
    v_shipping := CASE WHEN v_delivery = 'bureau' THEN v_rate.desk_price ELSE v_rate.home_price END;
    IF v_delivery = 'bureau' AND coalesce(v_shipping, 0) = 0 THEN v_shipping := v_rate.home_price; END IF;
  END IF;
  v_total := v_total + coalesce(v_shipping, 0);

  INSERT INTO public.orders (first_name, last_name, phone, email, wilaya, commune, address, total,
                             destination, country, shipping_fee, delivery_type, acquisition_source)
  VALUES (p_customer->>'first_name', p_customer->>'last_name', p_customer->>'phone',
          p_customer->>'email', p_customer->>'wilaya', p_customer->>'commune', p_customer->>'address',
          v_total, v_dest, p_customer->>'country', coalesce(v_shipping, 0), v_delivery,
          coalesce(nullif(p_customer->>'acquisition_source',''), 'Non renseignée'))
  RETURNING id, order_number INTO v_order_id, v_number;

  INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price, pack_label)
  SELECT v_order_id, (l->>'product_id')::uuid, l->>'product_name', (l->>'quantity')::integer,
         (l->>'unit_price')::numeric, l->>'pack_label'
    FROM jsonb_array_elements(v_lines) l;

  UPDATE public.products p
     SET stock = p.stock - q.qty
    FROM (SELECT (kv).key::uuid AS id, (kv).value::integer AS qty
            FROM (SELECT jsonb_each(v_need) AS kv) s) q
   WHERE p.id = q.id;

  RETURN v_number;
END $$;
REVOKE ALL ON FUNCTION public.place_order(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb) TO anon, authenticated;

-- 3. Contact messages and reviews: anonymous visitors may submit, but a review can never
--    approve itself.
GRANT SELECT, INSERT ON public.contact_messages TO anon;
DROP POLICY IF EXISTS "anon submit message" ON public.contact_messages;
CREATE POLICY "anon submit message" ON public.contact_messages
  FOR INSERT TO anon
  WITH CHECK (char_length(name) BETWEEN 1 AND 100
              AND email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
              AND char_length(message) BETWEEN 1 AND 2000);

GRANT SELECT, INSERT ON public.reviews TO anon;
DROP POLICY IF EXISTS "anon submit review" ON public.reviews;
CREATE POLICY "anon submit review" ON public.reviews
  FOR INSERT TO anon
  WITH CHECK (approved = false
              AND rating BETWEEN 1 AND 5
              AND char_length(name) BETWEEN 1 AND 80
              AND char_length(comment) BETWEEN 3 AND 1000);

-- 4. Visit counter: the existing security-definer helper validates its own inputs.
GRANT EXECUTE ON FUNCTION public.record_shop_visit(text, text, text, text) TO anon;

-- 5. Reads the order handler needs as an anonymous visitor.
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.shipping_rates TO anon;