CREATE OR REPLACE FUNCTION public.delete_manager_account(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Action réservée à l''administrateur.'; END IF;
  IF target_user_id = auth.uid() OR public.has_role(target_user_id, 'admin') THEN RAISE EXCEPTION 'Impossible de supprimer un compte administrateur.'; END IF;
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END $$;
REVOKE ALL ON FUNCTION public.delete_manager_account(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_manager_account(uuid) TO authenticated;