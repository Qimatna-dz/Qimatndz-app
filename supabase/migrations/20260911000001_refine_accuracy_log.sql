-- 20260911000001_refine_accuracy_log.sql

-- Drop existing if needed (created in previous phase)
DROP TABLE IF EXISTS valuation_accuracy_log;

-- Recreate with proper V2.1 architecture requirements
CREATE TABLE valuation_accuracy_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    valuation_id UUID,
    vehicle_id UUID,
    brand VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    predicted_value NUMERIC NOT NULL,
    observed_outcome NUMERIC NOT NULL,
    outcome_type VARCHAR(50) NOT NULL CHECK (outcome_type IN ('TRANSACTION', 'LISTING_OBSERVED', 'OTHER')),
    prediction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    outcome_date TIMESTAMP WITH TIME ZONE NOT NULL,
    absolute_error NUMERIC GENERATED ALWAYS AS (ABS(predicted_value - observed_outcome)) STORED,
    percentage_error NUMERIC GENERATED ALWAYS AS (ABS(predicted_value - observed_outcome) / NULLIF(observed_outcome, 0)) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: We are explicitly not populating this table yet as per V2.1 audit (no transaction feedback loop exists).
CREATE INDEX idx_val_acc_brand_model ON valuation_accuracy_log(brand, model);
CREATE INDEX idx_val_acc_outcome_type ON valuation_accuracy_log(outcome_type);
