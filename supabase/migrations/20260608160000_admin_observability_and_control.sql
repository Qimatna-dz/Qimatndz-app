-- ==============================================================================
-- ADMIN OBSERVABILITY AND CONTROL (THE 4 PILLARS)
-- ==============================================================================

-- 1. OBSERVABILITY TABLES

-- 1a. pipeline_metrics
-- Tracks daily ingestion volume and Claude rejection rate
CREATE TABLE IF NOT EXISTS public.pipeline_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  ingested_volume integer DEFAULT 0,
  rejected_volume integer DEFAULT 0,
  rejection_rate numeric GENERATED ALWAYS AS (
    CASE WHEN (ingested_volume + rejected_volume) > 0 
         THEN (rejected_volume::numeric / (ingested_volume + rejected_volume)) * 100 
         ELSE 0 END
  ) STORED,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(date)
);

ALTER TABLE public.pipeline_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny public read pipeline metrics" ON public.pipeline_metrics FOR SELECT TO anon USING (false);
CREATE POLICY "Admins can read pipeline metrics" ON public.pipeline_metrics FOR ALL TO authenticated USING (auth.role() = 'admin');


-- 1b. ai_cost_logs
-- Tracks AI budget consumption (API calls)
CREATE TABLE IF NOT EXISTS public.ai_cost_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_name text NOT NULL,
  tokens_in integer DEFAULT 0,
  tokens_out integer DEFAULT 0,
  cost_usd numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ai_cost_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny public read ai cost" ON public.ai_cost_logs FOR SELECT TO anon USING (false);
CREATE POLICY "Admins can read ai cost" ON public.ai_cost_logs FOR ALL TO authenticated USING (auth.role() = 'admin');


-- 1c. failed_queries
-- Tracks user searches that resulted in low confidence (Chemin 3)
CREATE TABLE IF NOT EXISTS public.failed_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  query_count integer DEFAULT 1,
  last_requested_at timestamp with time zone DEFAULT now(),
  UNIQUE(brand, model, year)
);

ALTER TABLE public.failed_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny public read failed queries" ON public.failed_queries FOR SELECT TO anon USING (false);
-- We allow insertion from the backend (anon/authenticated) to log the failed query
CREATE POLICY "Allow insert failed queries" ON public.failed_queries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update failed queries" ON public.failed_queries FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Admins can read failed queries" ON public.failed_queries FOR SELECT TO authenticated USING (auth.role() = 'admin');


-- 2. SURGICAL CONTROL TABLES

-- 2a. banned_users
-- Bans malicious users or IPs
CREATE TABLE IF NOT EXISTS public.banned_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  ip_address text,
  reason text,
  banned_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny public read banned users" ON public.banned_users FOR SELECT TO anon USING (false);
CREATE POLICY "Admins can read banned users" ON public.banned_users FOR ALL TO authenticated USING (auth.role() = 'admin');


-- Ensure expert_prices exists (from previous migrations, but tightening RLS)
-- We already have expert_prices from 20260515132000_add_expert_prices.sql
-- We ensure admins can insert/update it
DROP POLICY IF EXISTS "Admins can manage expert prices" ON public.expert_prices;
CREATE POLICY "Admins can manage expert prices" ON public.expert_prices FOR ALL TO authenticated USING (auth.role() = 'admin');

-- 3. PROACTIVE ALERTING
-- (The webhooks will be handled in Python/Edge functions, no schema needed here).
