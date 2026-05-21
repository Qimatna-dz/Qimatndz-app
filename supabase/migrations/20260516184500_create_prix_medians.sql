/*
  # Table des Prix Médians Hebdomadaires
  Sert de base de connaissance fraîche pour l'IA Claude.
*/

CREATE TABLE IF NOT EXISTS prix_medians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model text NOT NULL,
  trim text, -- Ajouté pour gérer les finitions (Adventure, etc.)
  year integer NOT NULL,
  prix_median integer NOT NULL,
  prix_min integer NOT NULL,
  prix_max integer NOT NULL,
  nb_annonces integer DEFAULT 0,
  variation_semaine float DEFAULT 0.0,
  volatile boolean DEFAULT false,
  derniere_maj timestamptz DEFAULT now(),
  UNIQUE (brand, model, trim, year)
);

ALTER TABLE prix_medians ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read prix_medians" ON prix_medians FOR SELECT TO anon, authenticated USING (true);

-- Index pour des recherches rapides par l'IA
CREATE INDEX IF NOT EXISTS idx_prix_medians_lookup ON prix_medians(brand, model, year);
