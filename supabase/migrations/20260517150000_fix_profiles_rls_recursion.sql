-- ==========================================
-- FIX: Infinite Recursion in Profiles RLS Policy
-- ==========================================

-- 1. Create a security definer helper function to bypass RLS circular dependency
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the old circular policies
DROP POLICY IF EXISTS "Les admins peuvent tout voir" ON public.profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON public.profiles;

-- 3. Recreate the policies safely
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Les admins peuvent tout voir"
  ON public.profiles FOR ALL
  TO authenticated
  USING ( public.is_admin(auth.uid()) );
