-- Ajout du type de listing pour distinguer l'occasion de l'import neuf
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_category') THEN
        CREATE TYPE listing_category AS ENUM ('occasion', 'import_neuf', 'import_chine');
    ELSE
        -- Add the value if it doesn't exist
        ALTER TYPE listing_category ADD VALUE IF NOT EXISTS 'import_chine';
    END IF;
END $$;

ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_type listing_category DEFAULT 'occasion';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS price_before_taxes bigint;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS customs_taxes bigint;

-- Ajout du flag import aux valuations
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS is_import_logic boolean DEFAULT false;
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS import_data jsonb;
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS source_import_neuf integer DEFAULT 0;
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS source_import_chine integer DEFAULT 0;

-- Index pour filtrer par type
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(listing_type);
