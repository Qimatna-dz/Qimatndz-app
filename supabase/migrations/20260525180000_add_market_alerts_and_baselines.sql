-- ============================================================
-- Migration: Market Alerts & Dynamic Baselines
-- QimatnaDz — Défi 1, 2, 3 : Suivi volatilité marché algérien
-- ============================================================

-- 1. Ajouter les colonnes de suivi de variation sur prix_medians
ALTER TABLE prix_medians
  ADD COLUMN IF NOT EXISTS prix_median_precedent integer,
  ADD COLUMN IF NOT EXISTS delta_pct_semaine numeric(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nb_runs integer DEFAULT 1;

-- 2. Table des alertes de choc de marché
-- Enregistre chaque variation >= 10% détectée lors du recalcul des médians
CREATE TABLE IF NOT EXISTS market_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brand text NOT NULL,
    model text NOT NULL,
    trim text DEFAULT 'Standard',
    year integer NOT NULL,
    prix_ancien integer NOT NULL,
    prix_nouveau integer NOT NULL,
    delta_pct numeric(6,2) NOT NULL,
    direction text NOT NULL CHECK (direction IN ('hausse', 'baisse')),
    nb_annonces integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_market_alerts_brand_model
  ON market_alerts(brand, model, year, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_market_alerts_recent
  ON market_alerts(created_at DESC);

-- 3. Table des baselines dynamiques (remplace les valeurs codées en dur)
-- Alimentée automatiquement par update_medians_optimized.py quand nb_annonces >= 5
CREATE TABLE IF NOT EXISTS market_baselines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brand text NOT NULL,
    model text NOT NULL,
    segment text,                        -- citadine_standard, suv_routier, etc.
    baseline_price integer NOT NULL,     -- Prix médian de référence (année pivot 2026)
    nb_annonces integer DEFAULT 0,
    confiance text DEFAULT 'faible' CHECK (confiance IN ('haute', 'moyenne', 'faible')),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE (brand, model)
);

CREATE INDEX IF NOT EXISTS idx_market_baselines_brand_model
  ON market_baselines(brand, model);

-- 4. Ajouter rate_updated_at sur macro_indices pour valider la fraîcheur du taux EUR
ALTER TABLE macro_indices
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Mettre à jour les lignes existantes
UPDATE macro_indices SET updated_at = now() WHERE updated_at IS NULL;

-- RLS : market_alerts accessible en lecture pour tous (pour les alertes UI)
ALTER TABLE market_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market_alerts_read" ON market_alerts
    FOR SELECT USING (true);

-- RLS : market_baselines accessible en lecture pour tous
ALTER TABLE market_baselines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market_baselines_read" ON market_baselines
    FOR SELECT USING (true);

-- Les insertions/updates sur ces tables sont réservées au service_role (scraper)
