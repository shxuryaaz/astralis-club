-- ============================================================
-- Astralis — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to re-run: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Tables
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name       TEXT        NOT NULL DEFAULT '',
  email      TEXT        NOT NULL DEFAULT '',
  approved   BOOLEAN     NOT NULL DEFAULT FALSE,
  role       TEXT        NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add columns that may be missing if the table already existed
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name       TEXT        NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email      TEXT        NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved   BOOLEAN     NOT NULL DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role       TEXT        NOT NULL DEFAULT 'member';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add the role CHECK constraint only if it doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check' AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('admin', 'member'));
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hackathons (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT        NOT NULL,
  date        DATE        NOT NULL,
  mode        TEXT        NOT NULL CHECK (mode IN ('online', 'offline')),
  description TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_name TEXT        NOT NULL,
  content     TEXT        NOT NULL CHECK (char_length(content) <= 300),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_requests (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  reason      TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'access_requests_user_id_fkey'
      AND conrelid = 'access_requests'::regclass
  ) THEN
    ALTER TABLE access_requests
      ADD CONSTRAINT access_requests_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
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

-- ────────────────────────────────────────────────────────────
-- Security-definer helpers (avoids RLS recursion)
-- Using plpgsql to prevent compile-time column validation errors
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id::text = auth.uid()::text);
END;
$$;

CREATE OR REPLACE FUNCTION is_approved()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Admins bypass the approval flag so RLS matches the app (see ProtectedRoute).
  RETURN COALESCE(
    (SELECT (approved OR role = 'admin') FROM profiles WHERE id::text = auth.uid()::text),
    false
  );
END;
$$;

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

-- ────────────────────────────────────────────────────────────
-- Row Level Security
-- ────────────────────────────────────────────────────────────

ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

DROP INDEX IF EXISTS access_requests_email_unique;
DROP INDEX IF EXISTS access_requests_user_id_unique;

CREATE UNIQUE INDEX access_requests_email_unique
  ON access_requests (lower(email))
  WHERE approved_at IS NULL;

CREATE UNIQUE INDEX access_requests_user_id_unique
  ON access_requests (user_id)
  WHERE user_id IS NOT NULL AND approved_at IS NULL;

-- Drop existing policies before recreating (safe re-run)
DROP POLICY IF EXISTS "profiles_select"               ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin"         ON profiles;
DROP POLICY IF EXISTS "hackathons_select"             ON hackathons;
DROP POLICY IF EXISTS "hackathons_write_admin"        ON hackathons;
DROP POLICY IF EXISTS "messages_select"               ON messages;
DROP POLICY IF EXISTS "messages_insert"               ON messages;
DROP POLICY IF EXISTS "access_requests_insert"        ON access_requests;
DROP POLICY IF EXISTS "access_requests_select_admin"  ON access_requests;
DROP POLICY IF EXISTS "access_requests_select_own"    ON access_requests;
DROP POLICY IF EXISTS "access_requests_delete_admin"  ON access_requests;

-- profiles ───────────────────────────────────────────────────

CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (auth.uid()::text = id::text OR get_my_role() = 'admin');

CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- hackathons ─────────────────────────────────────────────────

CREATE POLICY "hackathons_select"
  ON hackathons FOR SELECT
  USING (is_approved());

CREATE POLICY "hackathons_write_admin"
  ON hackathons FOR ALL
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- messages ───────────────────────────────────────────────────

CREATE POLICY "messages_select"
  ON messages FOR SELECT
  USING (is_approved());

CREATE POLICY "messages_insert"
  ON messages FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text AND is_approved());

-- access_requests ────────────────────────────────────────────

-- Verified users can submit one pending request tied to their auth identity
CREATE POLICY "access_requests_insert"
  ON access_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND approved_at IS NULL
    AND is_verified_applicant()
    AND lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  );

-- Only admins can read requests
CREATE POLICY "access_requests_select_admin"
  ON access_requests FOR SELECT
  USING (get_my_role() = 'admin');

-- Signed-in applicants can detect their own submitted request
CREATE POLICY "access_requests_select_own"
  ON access_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Only admins can dismiss (delete) pending requests
CREATE POLICY "access_requests_delete_admin"
  ON access_requests FOR DELETE
  USING (get_my_role() = 'admin' AND approved_at IS NULL);

-- ────────────────────────────────────────────────────────────
-- Auto-create profile row on new signup
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_verified ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_verified
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- ────────────────────────────────────────────────────────────
-- Enable Realtime for the messages table (safe to re-run)
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- Notes
-- ────────────────────────────────────────────────────────────
-- 1. User flow:
--    a. User verifies their email with OTP or signs in with Google
--    b. The verified-user trigger creates a profile (approved=false)
--    c. User completes /request and the request is tied to auth.uid()
--    d. Admin goes to /admin → Requests tab → clicks Approve
--    e. Approval is retained on the request and the user can sign in at /login
--
-- 2. To bootstrap YOUR admin account (first time only), run either:
--      UPDATE profiles SET approved = true, role = 'admin' WHERE email = 'your@email.com';
--    or (role = admin alone is enough for app + RLS once is_approved() includes admins):
--      UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
--
-- 3. Email ownership is verified through the OTP flow before an application
--    can be inserted. Keep email authentication and OTP delivery enabled.
