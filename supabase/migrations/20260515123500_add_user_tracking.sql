-- ==========================================
-- SUIVI DES UTILISATEURS & ADMIN
-- ==========================================

-- 1. Table des profils pour le suivi d'activité
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  last_seen timestamptz DEFAULT now(),
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2. Activation RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Politiques RLS
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON public.profiles;
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Les admins peuvent tout voir" ON public.profiles;
CREATE POLICY "Les admins peuvent tout voir"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 4. Trigger de création automatique de profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Fonction pour mettre à jour la dernière activité
CREATE OR REPLACE FUNCTION public.update_last_seen()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET last_seen = now()
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- SUIVI DES INVITÉS (GUESTS)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.guest_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id text UNIQUE NOT NULL,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Activation RLS
ALTER TABLE public.guest_sessions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS (Public can upsert its own session)
DROP POLICY IF EXISTS "Anyone can upsert guest sessions" ON public.guest_sessions;
CREATE POLICY "Anyone can upsert guest sessions"
  ON public.guest_sessions FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- RPC pour le tracking anonyme
CREATE OR REPLACE FUNCTION public.track_guest_activity(p_guest_id text)
RETURNS void AS $$
BEGIN
  INSERT INTO public.guest_sessions (guest_id, last_seen)
  VALUES (p_guest_id, now())
  ON CONFLICT (guest_id) 
  DO UPDATE SET last_seen = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
