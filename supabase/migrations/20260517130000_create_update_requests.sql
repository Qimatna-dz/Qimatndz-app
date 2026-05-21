-- Create table for tracking update requests/leads for rare or new cars
CREATE TABLE IF NOT EXISTS update_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model text NOT NULL,
  contact_type text NOT NULL, -- 'email' or 'whatsapp'
  contact_info text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE update_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous guests) to insert their notification request
DROP POLICY IF EXISTS "Anyone can insert update requests" ON update_requests;
CREATE POLICY "Anyone can insert update requests"
  ON update_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated admins to view notification requests
DROP POLICY IF EXISTS "Authenticated can read update requests" ON update_requests;
CREATE POLICY "Authenticated can read update requests"
  ON update_requests FOR SELECT
  TO authenticated
  USING (true);
