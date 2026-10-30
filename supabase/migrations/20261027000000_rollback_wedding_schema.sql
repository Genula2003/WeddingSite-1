DROP POLICY IF EXISTS wishes_admin_all ON public.guest_wishes;
DROP POLICY IF EXISTS events_admin_all ON public.invitation_events;
DROP POLICY IF EXISTS rsvps_admin_all ON public.rsvps;
DROP POLICY IF EXISTS invitations_admin_all ON public.invitations;
DROP POLICY IF EXISTS guests_admin_all ON public.guests;
DROP POLICY IF EXISTS admin_profiles_update_own ON public.admin_profiles;
DROP POLICY IF EXISTS admin_profiles_select_own ON public.admin_profiles;

DROP FUNCTION IF EXISTS public.is_admin();

DROP TABLE IF EXISTS public.guest_wishes;
DROP TABLE IF EXISTS public.invitation_events;
DROP TABLE IF EXISTS public.rsvps;
DROP TABLE IF EXISTS public.invitations;
DROP TABLE IF EXISTS public.guests;
DROP TABLE IF EXISTS public.admin_profiles;
