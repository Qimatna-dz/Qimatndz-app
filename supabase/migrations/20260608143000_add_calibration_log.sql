-- Migration: 20260608143000_add_calibration_log.sql
-- Ajoute la table calibration_log pour surveiller l'écart entre les valeurs
-- hardcodées (FALLBACK_MEDIANS) et la réalité du marché (données DB actuelles).

CREATE TABLE IF NOT EXISTS calibration_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand text NOT NULL,
    model text NOT NULL,
    generation_key text NOT NULL,
    prix_fallback_median integer NOT NULL,
    prix_marche_reel integer NOT NULL,
    ecart_pct numeric(5,2) NOT NULL,
    action_recommandee text NOT NULL,
    nb_annonces integer NOT NULL,
    detected_at timestamptz DEFAULT now()
);

-- Index pour les tableaux de bord et filtres par statut
CREATE INDEX IF NOT EXISTS idx_calibration_log_action
  ON calibration_log(action_recommandee);

CREATE INDEX IF NOT EXISTS idx_calibration_log_detected
  ON calibration_log(detected_at DESC);

COMMENT ON TABLE calibration_log IS 'Logs de déviation entre le FALLBACK_MEDIANS hardcodé et le marché en temps réel.';
