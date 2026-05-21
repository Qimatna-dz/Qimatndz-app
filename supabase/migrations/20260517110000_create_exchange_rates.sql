CREATE TABLE IF NOT EXISTS exchange_rates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    currency_code text NOT NULL, -- 'EUR', 'USD', 'AED'
    buy_rate decimal NOT NULL,
    sell_rate decimal NOT NULL,
    source_url text DEFAULT 'https://devisesquare.com/',
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_code_date ON exchange_rates(currency_code, created_at DESC);

-- Insertion initiale (Taux actuels du Square)
INSERT INTO exchange_rates (currency_code, buy_rate, sell_rate)
VALUES 
('EUR', 282.0, 280.0),
('USD', 240.0, 238.0),
('AED', 65.0, 64.0);
