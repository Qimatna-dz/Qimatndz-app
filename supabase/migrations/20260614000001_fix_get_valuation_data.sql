-- ==============================================================================
-- FIX: get_valuation_data RPC
-- Remove the non-existent 'is_active' filter from macro_indices query
-- ==============================================================================

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
  WHERE b.brand = p_brand AND b.model = p_model;

  -- Fetch macro indices (FIXED: removed is_active=true since the column doesn't exist)
  SELECT COALESCE(json_agg(row_to_json(mi)), '[]') INTO v_macro
  FROM macro_indices mi;

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
