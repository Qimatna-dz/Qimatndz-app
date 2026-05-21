-- Migration : Création de la table scraper_status pour le monitoring d'ingestion (Flux A)
CREATE TABLE IF NOT EXISTS public.scraper_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scraper_name text UNIQUE NOT NULL,
  last_run timestamp with time zone DEFAULT now(),
  status text NOT NULL DEFAULT 'OK', -- 'OK', 'ERROR'
  records_added integer DEFAULT 0,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Activation de RLS
ALTER TABLE public.scraper_status ENABLE ROW LEVEL SECURITY;

-- Autoriser la lecture publique
CREATE POLICY "Allow public read scraper status" ON public.scraper_status
  FOR SELECT USING (true);

-- Autoriser les administrateurs à modifier les statuts
CREATE POLICY "Allow admin full access scraper status" ON public.scraper_status
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Insertion de données de démonstration initiales
INSERT INTO public.scraper_status (scraper_name, status, records_added)
VALUES 
('Ouedkniss Crawler (Flux A)', 'OK', 148),
('Facebook Marketplace Scraper', 'OK', 42)
ON CONFLICT (scraper_name) DO UPDATE 
SET status = EXCLUDED.status, records_added = EXCLUDED.records_added, last_run = now();
