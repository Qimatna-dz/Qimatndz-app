-- ==========================================
-- AJOUT DES COLONNES MANQUANTES A REAL_TRANSACTIONS
-- ==========================================

ALTER TABLE public.real_transactions 
ADD COLUMN IF NOT EXISTS condition text,
ADD COLUMN IF NOT EXISTS paint text,
ADD COLUMN IF NOT EXISTS engine text;

-- Mise à jour de l'index pour inclure l'année
CREATE INDEX IF NOT EXISTS idx_transactions_lookup 
ON public.real_transactions(brand, model, year);
