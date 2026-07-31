CREATE UNIQUE INDEX IF NOT EXISTS access_requests_email_unique
  ON public.access_requests (lower(email));

DROP POLICY IF EXISTS "access_requests_select_own" ON public.access_requests;

CREATE POLICY "access_requests_select_own"
  ON public.access_requests FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
