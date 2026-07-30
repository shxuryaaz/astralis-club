CREATE OR REPLACE FUNCTION public.email_has_account(candidate_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE lower(email) = lower(trim(candidate_email))
  );
$$;

REVOKE ALL ON FUNCTION public.email_has_account(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_has_account(TEXT) TO anon, authenticated;
