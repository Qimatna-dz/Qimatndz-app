-- ==========================================
-- SOURCE B : PRIX EXPERTS / MARCHANDS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.expert_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model text NOT NULL,
  year int NOT NULL,
  price int NOT NULL,
  source_name text, -- Nom du marchand ou de l'expert
  created_at timestamptz DEFAULT now()
);

-- Activation RLS
ALTER TABLE public.expert_prices ENABLE ROW LEVEL SECURITY;

-- Lecture publique
DROP POLICY IF EXISTS "Public can read expert prices" ON public.expert_prices;
CREATE POLICY "Public can read expert prices"
  ON public.expert_prices FOR SELECT
  TO anon, authenticated
  USING (true);

-- Index pour la performance
CREATE INDEX IF NOT EXISTS idx_expert_prices_model ON public.expert_prices(brand, model, year);
