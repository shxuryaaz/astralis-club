ALTER TABLE public.access_requests
  ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'access_requests_user_id_fkey'
      AND conrelid = 'public.access_requests'::regclass
  ) THEN
    ALTER TABLE public.access_requests
      ADD CONSTRAINT access_requests_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END;
$$;

UPDATE public.access_requests AS request
SET user_id = auth_user.id
FROM auth.users AS auth_user
WHERE request.user_id IS NULL
  AND auth_user.email_confirmed_at IS NOT NULL
  AND lower(trim(request.email)) = lower(trim(auth_user.email));

CREATE UNIQUE INDEX IF NOT EXISTS access_requests_user_id_unique
  ON public.access_requests (user_id)
  WHERE user_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'access_requests_name_length'
      AND conrelid = 'public.access_requests'::regclass
  ) THEN
    ALTER TABLE public.access_requests
      ADD CONSTRAINT access_requests_name_length
      CHECK (char_length(name) BETWEEN 1 AND 100) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'access_requests_email_length'
      AND conrelid = 'public.access_requests'::regclass
  ) THEN
    ALTER TABLE public.access_requests
      ADD CONSTRAINT access_requests_email_length
      CHECK (char_length(email) BETWEEN 3 AND 320) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'access_requests_reason_length'
      AND conrelid = 'public.access_requests'::regclass
  ) THEN
    ALTER TABLE public.access_requests
      ADD CONSTRAINT access_requests_reason_length
      CHECK (char_length(reason) BETWEEN 1 AND 5000) NOT VALID;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_verified_applicant()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
      AND email_confirmed_at IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_verified_applicant() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_verified_applicant() TO authenticated;

DROP POLICY IF EXISTS "access_requests_insert" ON public.access_requests;
DROP POLICY IF EXISTS "access_requests_select_own" ON public.access_requests;

CREATE POLICY "access_requests_insert"
  ON public.access_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_verified_applicant()
    AND lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  );

CREATE POLICY "access_requests_select_own"
  ON public.access_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP FUNCTION IF EXISTS public.email_has_account(TEXT);

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_verified ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_verified
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();
