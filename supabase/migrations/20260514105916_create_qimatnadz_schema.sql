/*
  # QimatnaDz — Schema Initial

  ## Tables créées

  1. `vehicle_catalog` — Catalogue de référence des véhicules
     - Utilisé pour les dropdowns marque/modèle dans l'app
     - Seeder manuel avec les 30 modèles les plus vendus en Algérie

  2. `listings` — Annonces scrappées (Ouedkniss, Facebook)
     - Source de données pour l'algorithme de cote
     - Déduplication par URL

  3. `real_transactions` — Vrais prix de vente collectés
     - Collecte silencieuse post-évaluation
     - Pondérées ×2 dans l'algorithme (données terrain)

  4. `valuations` — Résultats d'évaluation générés
     - Sauvegarde chaque cote calculée
     - user_id nullable (accès sans compte autorisé)

  ## Sécurité
  - RLS activé sur toutes les tables
  - Lecture vehicle_catalog et listings : public (données de référence)
  - Insertion real_transactions et valuations : public (collecte anonyme autorisée)
  - Lecture valuations : uniquement l'utilisateur propriétaire

  ## Notes
  - Les valuations anonymes ont user_id NULL
  - Le seeder vehicle_catalog couvre les 30 modèles populaires Algérie
*/

-- ==========================================
-- TABLE: vehicle_catalog
-- ==========================================
CREATE TABLE IF NOT EXISTS vehicle_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model text NOT NULL,
  trim text,
  year_from int NOT NULL,
  year_to int,
  body_type text NOT NULL DEFAULT 'berline',
  fuel_type text NOT NULL DEFAULT 'essence',
  created_at timestamptz DEFAULT now(),
  UNIQUE (brand, model, trim)
);

ALTER TABLE vehicle_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read vehicle catalog" ON vehicle_catalog;
CREATE POLICY "Public can read vehicle catalog"
  ON vehicle_catalog FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can insert catalog" ON vehicle_catalog;
CREATE POLICY "Authenticated can insert catalog"
  ON vehicle_catalog FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ==========================================
-- TABLE: listings
-- ==========================================
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'ouedkniss',
  brand text NOT NULL,
  model text NOT NULL,
  trim text,
  year int,
  mileage int,
  price_asked int,
  wilaya text,
  condition text,
  url text UNIQUE,
  scraped_at timestamptz DEFAULT now()
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read listings" ON listings;
CREATE POLICY "Public can read listings"
  ON listings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role can insert listings" ON listings;
CREATE POLICY "Service role can insert listings"
  ON listings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_listings_brand_model ON listings(brand, model);
CREATE INDEX IF NOT EXISTS idx_listings_year ON listings(year);
CREATE INDEX IF NOT EXISTS idx_listings_scraped_at ON listings(scraped_at DESC);

-- ==========================================
-- TABLE: real_transactions
-- ==========================================
CREATE TABLE IF NOT EXISTS real_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model text NOT NULL,
  trim text,
  year int,
  mileage int,
  final_price int NOT NULL,
  user_role text DEFAULT 'seller',
  wilaya text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE real_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert transactions" ON real_transactions;
CREATE POLICY "Anyone can insert transactions"
  ON real_transactions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can read own transactions" ON real_transactions;
CREATE POLICY "Authenticated can read own transactions"
  ON real_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_brand_model ON real_transactions(brand, model);

-- ==========================================
-- TABLE: valuations
-- ==========================================
CREATE TABLE IF NOT EXISTS valuations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model text NOT NULL,
  trim text,
  year int NOT NULL,
  mileage int NOT NULL,
  condition text NOT NULL DEFAULT 'bon',
  paint text,
  engine text,
  engine_details text,
  trim_details text,
  wilaya text,
  price_min int NOT NULL,
  price_median int NOT NULL,
  price_max int NOT NULL,
  data_points int NOT NULL DEFAULT 0,
  confidence text NOT NULL DEFAULT 'faible',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE valuations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert valuations" ON valuations;
CREATE POLICY "Anyone can insert valuations"
  ON valuations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can read own valuations" ON valuations;
CREATE POLICY "Authenticated can read own valuations"
  ON valuations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anon can read own valuations by session not supported — skip" ON valuations;
CREATE POLICY "Anon can read own valuations by session not supported — skip"
  ON valuations FOR SELECT
  TO anon
  USING (user_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_valuations_user_id ON valuations(user_id);
CREATE INDEX IF NOT EXISTS idx_valuations_created_at ON valuations(created_at DESC);

-- Table: Indices Macro (Flux C)
CREATE TABLE IF NOT EXISTS macro_indices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL, -- e.g., 'euro_square_rate', 'import_tax_coeff'
  value decimal NOT NULL,
  last_updated timestamptz DEFAULT now()
);

-- Table: Tendances Marché (Admin Master Switch)
CREATE TABLE IF NOT EXISTS market_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text,
  model text,
  trend_coeff decimal DEFAULT 1.0, -- e.g., 1.10 for +10%
  reason text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Update Listings for semantic normalization
ALTER TABLE listings ADD COLUMN IF NOT EXISTS source_weight decimal DEFAULT 0.6;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS paint_flag text; -- '00', 'raccord', 'voile'
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_duplicate boolean DEFAULT false;

-- Update Valuations for reliability score
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS reliability_score int DEFAULT 3;
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS source_distribution jsonb;

-- RLS for new tables
ALTER TABLE macro_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_trends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read macro indices" ON macro_indices;
CREATE POLICY "Anyone can read macro indices" ON macro_indices FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can read market trends" ON market_trends;
CREATE POLICY "Anyone can read market trends" ON market_trends FOR SELECT TO anon, authenticated USING (true);
