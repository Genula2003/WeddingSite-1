CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  household_name TEXT,
  email TEXT,
  phone TEXT,
  preferred_language TEXT DEFAULT 'en',
  private_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'link_copied', 'share_initiated', 'sent', 'delivered', 'viewed', 'revoked', 'expired')),
  max_attendees INTEGER NOT NULL DEFAULT 1 CHECK (max_attendees >= 1 AND max_attendees <= 20),
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  revoked_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID UNIQUE NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
  attendance_status TEXT NOT NULL CHECK (attendance_status IN ('accepted', 'declined', 'pending')),
  attendee_count INTEGER NOT NULL DEFAULT 0 CHECK (attendee_count >= 0),
  attendee_names JSONB NOT NULL DEFAULT '[]'::jsonb,
  guest_message TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.invitation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'link_copied', 'share_initiated', 'sent', 'delivered', 'viewed', 'rsvp_submitted', 'rsvp_updated', 'token_replaced', 'revoked', 'reactivated')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.guest_wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  message TEXT NOT NULL CHECK (char_length(message) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_invitations_token_hash ON public.invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_guest_id ON public.invitations(guest_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_guests_full_name ON public.guests(full_name);
CREATE INDEX IF NOT EXISTS idx_guests_household_name ON public.guests(household_name);
CREATE INDEX IF NOT EXISTS idx_rsvps_invitation_id ON public.rsvps(invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_events_invitation_id ON public.invitation_events(invitation_id);
CREATE INDEX IF NOT EXISTS idx_guest_wishes_invitation_id ON public.guest_wishes(invitation_id);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_wishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_profiles_select_own ON public.admin_profiles;
CREATE POLICY admin_profiles_select_own ON public.admin_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS admin_profiles_update_own ON public.admin_profiles;
CREATE POLICY admin_profiles_update_own ON public.admin_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS admin_profiles_insert_own ON public.admin_profiles;
CREATE POLICY admin_profiles_insert_own ON public.admin_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS guests_admin_all ON public.guests;
CREATE POLICY guests_admin_all ON public.guests
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS invitations_admin_all ON public.invitations;
CREATE POLICY invitations_admin_all ON public.invitations
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS rsvps_admin_all ON public.rsvps;
CREATE POLICY rsvps_admin_all ON public.rsvps
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS events_admin_all ON public.invitation_events;
CREATE POLICY events_admin_all ON public.invitation_events
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS wishes_admin_all ON public.guest_wishes;
CREATE POLICY wishes_admin_all ON public.guest_wishes
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
