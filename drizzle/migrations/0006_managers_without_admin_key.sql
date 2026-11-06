CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own profile" ON public.profiles;
CREATE POLICY "own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "admin read profiles" ON public.profiles;
CREATE POLICY "admin read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at) VALUES (NEW.id, coalesce(NEW.email, ''), coalesce(NEW.created_at, now()))
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS on_auth_user_profile ON auth.users;
CREATE TRIGGER on_auth_user_profile AFTER INSERT OR UPDATE OF email ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

INSERT INTO public.profiles (id, email, created_at)
SELECT id, coalesce(email, ''), created_at FROM auth.users ON CONFLICT (id) DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_role_key ON public.user_roles (user_id, role);

CREATE OR REPLACE FUNCTION public.grant_manager(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Action réservée à l''administrateur.'; END IF;
  IF target_user_id = auth.uid() OR public.has_role(target_user_id, 'admin') THEN RAISE EXCEPTION 'Impossible de modifier un compte administrateur.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN RAISE EXCEPTION 'Compte introuvable.'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'manager') ON CONFLICT (user_id, role) DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.revoke_manager(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Action réservée à l''administrateur.'; END IF;
  IF target_user_id = auth.uid() OR public.has_role(target_user_id, 'admin') THEN RAISE EXCEPTION 'Impossible de modifier un compte administrateur.'; END IF;
  DELETE FROM public.user_roles WHERE user_id = target_user_id AND role = 'manager';
END $$;

REVOKE ALL ON FUNCTION public.grant_manager(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_manager(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grant_manager(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_manager(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM PUBLIC, anon, authenticated;