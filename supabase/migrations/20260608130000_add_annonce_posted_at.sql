-- Migration: 20260608130000_add_annonce_posted_at.sql
-- Ajoute le champ annonce_posted_at à la table listings.
--
-- DISTINCTION IMPORTANTE :
--   scraped_at       = date à laquelle NOUS avons collecté l'annonce (notre timestamp)
--   annonce_posted_at = date à laquelle LE VENDEUR a publié l'annonce sur Ouedkniss/Sogauto
--
-- Ces deux dates sont essentielles pour :
--   1. Détecter la vitesse de vente (combien de temps reste une annonce en ligne)
--   2. Distinguer une annonce "fraîche" d'une annonce ancienne re-scrapée
--   3. Futurs modèles ML : corrélation entre prix demandé et durée de publication

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS annonce_posted_at timestamp with time zone;

-- Index pour les requêtes temporelles (ex: "annonces des 7 derniers jours")
CREATE INDEX IF NOT EXISTS idx_listings_annonce_posted_at
  ON listings(annonce_posted_at DESC)
  WHERE annonce_posted_at IS NOT NULL;

-- Index composite pour les analyses par modèle + date
CREATE INDEX IF NOT EXISTS idx_listings_brand_model_posted
  ON listings(brand, model, annonce_posted_at DESC)
  WHERE annonce_posted_at IS NOT NULL;

COMMENT ON COLUMN listings.annonce_posted_at IS
  'Date de publication originale de l''annonce sur la plateforme source (Ouedkniss createdAt / Sogauto publishedAt). Différent de scraped_at qui est la date de collecte par notre scraper.';
