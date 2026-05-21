-- Migration : Droits d'écriture complets pour les administrateurs sur les tables Flux C et Exchange Rates

-- 1. Table macro_indices
DROP POLICY IF EXISTS "Admins can manage macro indices" ON public.macro_indices;
CREATE POLICY "Admins can manage macro indices" ON public.macro_indices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- 2. Table market_trends
DROP POLICY IF EXISTS "Admins can manage market trends" ON public.market_trends;
CREATE POLICY "Admins can manage market trends" ON public.market_trends
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- 3. Table exchange_rates
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read exchange rates" ON public.exchange_rates;
CREATE POLICY "Public can read exchange rates" ON public.exchange_rates
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage exchange rates" ON public.exchange_rates;
CREATE POLICY "Admins can manage exchange rates" ON public.exchange_rates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- 4. Insertion initiale de taux du Square si absente dans macro_indices (en plus de exchange_rates pour la compatibilité)
INSERT INTO public.macro_indices (key, value)
VALUES 
('euro_square_rate', 242.0),
('asian_brand_markup', 1.05),
('under_3y_markup', 1.03)
ON CONFLICT (key) DO NOTHING;
