-- Ajout des colonnes pour la gestion déterministe des statuts (Phase 4 et 13)
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'VALID',
ADD COLUMN IF NOT EXISTS status_reason text,
ADD COLUMN IF NOT EXISTS previous_price numeric,
ADD COLUMN IF NOT EXISTS price_change_date timestamptz;

-- Le statut peut être : VALID, SUSPECT, OUTLIER, INVALID, DUPLICATE, REMOVED, POSSIBLY_SOLD, EXPIRED
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);

-- Création de la table pour le suivi de l'erreur (Phase 11)
CREATE TABLE IF NOT EXISTS valuation_accuracy_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
    brand text NOT NULL,
    model text NOT NULL,
    year integer NOT NULL,
    predicted_price numeric NOT NULL,
    actual_observed_price numeric NOT NULL, -- Prix final affiché avant vente
    prediction_date timestamptz NOT NULL DEFAULT now(),
    error_absolute numeric GENERATED ALWAYS AS (abs(predicted_price - actual_observed_price)) STORED,
    error_percentage numeric GENERATED ALWAYS AS (
        CASE 
            WHEN actual_observed_price = 0 THEN 0 
            ELSE (abs(predicted_price - actual_observed_price) / actual_observed_price) * 100 
        END
    ) STORED,
    vehicle_features jsonb
);

CREATE INDEX IF NOT EXISTS idx_valuation_accuracy_brand_model ON valuation_accuracy_log(brand, model);
