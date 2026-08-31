ALTER TABLE public.access_requests
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

DROP INDEX IF EXISTS public.access_requests_email_unique;
DROP INDEX IF EXISTS public.access_requests_user_id_unique;

CREATE UNIQUE INDEX access_requests_email_unique
  ON public.access_requests (lower(email))
  WHERE approved_at IS NULL;

CREATE UNIQUE INDEX access_requests_user_id_unique
  ON public.access_requests (user_id)
  WHERE user_id IS NOT NULL AND approved_at IS NULL;

DROP POLICY IF EXISTS "access_requests_insert" ON public.access_requests;
DROP POLICY IF EXISTS "access_requests_delete_admin" ON public.access_requests;

CREATE POLICY "access_requests_insert"
  ON public.access_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND approved_at IS NULL
    AND public.is_verified_applicant()
    AND lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  );

CREATE POLICY "access_requests_delete_admin"
  ON public.access_requests FOR DELETE
  USING (public.get_my_role() = 'admin' AND approved_at IS NULL);

CREATE OR REPLACE FUNCTION public.approve_access_request(target_request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_row public.access_requests%ROWTYPE;
  target_profile_id UUID;
BEGIN
  IF public.get_my_role() IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO request_row
  FROM public.access_requests
  WHERE id = target_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found' USING ERRCODE = 'P0002';
  END IF;

  IF request_row.approved_at IS NOT NULL THEN
    RETURN FALSE;
  END IF;

  SELECT id
  INTO target_profile_id
  FROM public.profiles
  WHERE id = request_row.user_id
     OR lower(trim(email)) = lower(trim(request_row.email))
  ORDER BY (id = request_row.user_id) DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No member profile matches this application' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.profiles
  SET approved = TRUE
  WHERE id = target_profile_id;

  UPDATE public.access_requests
  SET user_id = target_profile_id,
      approved_at = NOW()
  WHERE id = target_request_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_access_request(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_access_request(UUID) TO authenticated;
