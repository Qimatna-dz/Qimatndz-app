-- ============================================================
-- Migration : Indices Macro Améliorés + Global Market Modifier
-- QimatnaDz — Sprint 3 : Signal de Tendance Marché
-- ============================================================

-- 1. S'assurer que macro_indices existe et supporte les valeurs texte ET numériques
CREATE TABLE IF NOT EXISTS macro_indices (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'macro_indices' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE macro_indices ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 2. Table global_market_modifier
--    Permet d'activer/désactiver un modificateur global sur tous les prix
--    (ex: +4% si EUR monte de 5% → toutes les estimations sont ajustées)
CREATE TABLE IF NOT EXISTS global_market_modifier (
  id             BIGSERIAL PRIMARY KEY,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  modifier_value NUMERIC(6,4) NOT NULL DEFAULT 1.0,  -- ex: 1.04 = +4%
  reason         TEXT,                                  -- ex: "EUR hausse +5% sur 7j"
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Assurer une seule ligne active (upsert sur is_active)
CREATE UNIQUE INDEX IF NOT EXISTS idx_global_market_modifier_active
  ON global_market_modifier (is_active)
  WHERE is_active = TRUE;

-- Insérer la valeur par défaut (neutre) si table vide
INSERT INTO global_market_modifier (is_active, modifier_value, reason)
SELECT TRUE, 1.0, 'Valeur initiale — aucun ajustement macro actif'
WHERE NOT EXISTS (SELECT 1 FROM global_market_modifier WHERE is_active = TRUE);

-- 3. Pré-remplir les clés macro_indices si elles n'existent pas
INSERT INTO macro_indices (key, value, updated_at)
VALUES
  ('market_trend',       'stable',  NOW()),
  ('market_trend_pct',   '0',       NOW()),
  ('eur_rate_current',   '0',       NOW()),
  ('eur_rate_30d_avg',   '0',       NOW())
ON CONFLICT (key) DO NOTHING;

-- 4. Index sur macro_indices.key (si manquant)
CREATE UNIQUE INDEX IF NOT EXISTS idx_macro_indices_key ON macro_indices (key);

-- ============================================================
-- RLS : global_market_modifier readable by all, writable only by service_role
-- ============================================================
ALTER TABLE global_market_modifier ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "global_market_modifier_read_all" ON global_market_modifier;
CREATE POLICY "global_market_modifier_read_all"
  ON global_market_modifier FOR SELECT
  TO public
  USING (true);

-- COMMENT récapitulatif
COMMENT ON TABLE global_market_modifier IS
  'Modificateur macro global appliqué à toutes les estimations de prix. '
  'Mis à jour automatiquement par update_macro_index.py si variation EUR/DZD > 5%.';
