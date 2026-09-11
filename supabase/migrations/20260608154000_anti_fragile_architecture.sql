-- ==============================================================================
-- ANTI-FRAGILE ARCHITECTURE: SECURITY & CONJUNCTURAL SHIELD
-- ==============================================================================

-- 1. REVOKE PUBLIC ACCESS & TIGHTEN RLS
-- Drop overly permissive policies that allow anyone to dump the database
DROP POLICY IF EXISTS "Public can read prix_medians" ON prix_medians;
DROP POLICY IF EXISTS "Public can read listings" ON listings;
DROP POLICY IF EXISTS "Public can read expert prices" ON expert_prices;

-- Create policies that explicitly DENY public reads.
-- The only way to read these tables as an anonymous user will be via the SECURITY DEFINER RPC.
CREATE POLICY "Deny public read prix_medians" ON prix_medians FOR SELECT TO anon USING (false);
CREATE POLICY "Deny public read listings" ON listings FOR SELECT TO anon USING (false);
CREATE POLICY "Deny public read expert prices" ON expert_prices FOR SELECT TO anon USING (false);

-- 2. CREATE GLOBAL MARKET MODIFIER
-- This table allows administrators to apply a universal multiplier to all valuations
-- in case of a sudden regulatory change (e.g., import restrictions lifted).
CREATE TABLE IF NOT EXISTS global_market_modifier (
  id integer PRIMARY KEY DEFAULT 1,
  modifier_value numeric NOT NULL DEFAULT 1.0,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert default value (no modification)
INSERT INTO global_market_modifier (id, modifier_value, is_active) 
VALUES (1, 1.0, true)
ON CONFLICT (id) DO NOTHING;

-- RLS for global_market_modifier
ALTER TABLE global_market_modifier ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read modifier" ON global_market_modifier FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can update modifier" ON global_market_modifier FOR ALL TO authenticated USING (auth.role() = 'admin');

-- 3. ADD KILL SWITCH TO VEHICLE CATALOG
-- Allows administrators to freeze a specific model if market manipulation is detected.
ALTER TABLE vehicle_catalog ADD COLUMN IF NOT EXISTS is_frozen boolean DEFAULT false;

-- 4. CREATE SECURE RPC FOR VALUATION DATA
-- This function runs with elevated privileges (SECURITY DEFINER) to bypass RLS internally.
-- It returns only the subset of data needed for a specific brand and year, preventing mass data scraping.
CREATE OR REPLACE FUNCTION get_valuation_data(
  p_brand text,
  p_model text,
  p_year integer
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_medians json;
  v_transactions json;
  v_experts json;
  v_listings json;
  v_catalog json;
  v_alerts json;
  v_baselines json;
  v_macro json;
  v_modifier json;
BEGIN
  -- Fetch medians
  SELECT COALESCE(json_agg(row_to_json(m)), '[]') INTO v_medians
  FROM prix_medians m
  WHERE m.brand = p_brand AND m.year = p_year;

  -- Fetch transactions
  SELECT COALESCE(json_agg(row_to_json(t)), '[]') INTO v_transactions
  FROM real_transactions t
  WHERE t.brand = p_brand AND t.year = p_year;

  -- Fetch expert prices
  SELECT COALESCE(json_agg(row_to_json(e)), '[]') INTO v_experts
  FROM expert_prices e
  WHERE e.brand = p_brand AND e.year = p_year;

  -- Fetch listings
  SELECT COALESCE(json_agg(row_to_json(l)), '[]') INTO v_listings
  FROM listings l
  WHERE l.brand = p_brand AND l.year = p_year;

  -- Fetch catalog (all models for the brand)
  SELECT COALESCE(json_agg(row_to_json(c)), '[]') INTO v_catalog
  FROM vehicle_catalog c
  WHERE c.brand = p_brand;

  -- Fetch market alerts
  SELECT COALESCE(json_agg(row_to_json(a)), '[]') INTO v_alerts
  FROM market_alerts a
  WHERE a.brand = p_brand AND a.year = p_year;

  -- Fetch baselines
  SELECT COALESCE(json_agg(row_to_json(b)), '[]') INTO v_baselines
  FROM market_baselines b
  WHERE b.brand = p_brand AND b.model = p_model AND b.year = p_year;

  -- Fetch macro indices
  SELECT COALESCE(json_agg(row_to_json(mi)), '[]') INTO v_macro
  FROM macro_indices mi
  WHERE mi.is_active = true;

  -- Fetch global modifier
  SELECT COALESCE(json_agg(row_to_json(g)), '[]') INTO v_modifier
  FROM global_market_modifier g
  WHERE g.is_active = true;

  RETURN json_build_object(
    'medians', v_medians,
    'transactions', v_transactions,
    'experts', v_experts,
    'listings', v_listings,
    'catalog', v_catalog,
    'alerts', v_alerts,
    'baselines', v_baselines,
    'macro', v_macro,
    'modifier', v_modifier
  );
END;
$$;
