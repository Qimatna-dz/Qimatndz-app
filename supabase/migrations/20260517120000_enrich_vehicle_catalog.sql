-- Enrichment of the vehicle catalog in Algeria
-- Focus on modern models (Jetour, Chery, Geely, BYD, DFSK, MG) and active importers (Fiat, Opel)
-- Unifying and seeding exact models and trims popular in the Algerian market.

INSERT INTO vehicle_catalog (brand, model, trim, year_from, year_to, body_type, fuel_type) VALUES
-- ==========================================
-- JETOUR
-- ==========================================
('Jetour', 'Traveller T2', 'Luxury', 2023, 2026, 'SUV', 'essence'),
('Jetour', 'Traveller T2', '4WD', 2023, 2026, 'SUV', 'essence'),
('Jetour', 'Dashing', 'Comfort', 2022, 2026, 'SUV', 'essence'),
('Jetour', 'Dashing', 'Luxury', 2022, 2026, 'SUV', 'essence'),
('Jetour', 'X70', 'Comfort', 2020, 2026, 'SUV', 'essence'),
('Jetour', 'X70', 'Luxury', 2020, 2026, 'SUV', 'essence'),
('Jetour', 'X70 Plus', 'Comfort', 2021, 2026, 'SUV', 'essence'),
('Jetour', 'X70 Plus', 'Luxury', 2021, 2026, 'SUV', 'essence'),
('Jetour', 'X90 Plus', 'Luxury', 2021, 2026, 'SUV', 'essence'),

-- ==========================================
-- CHERY
-- ==========================================
('Chery', 'Tiggo 2 Pro', 'Comfort', 2020, 2026, 'SUV', 'essence'),
('Chery', 'Tiggo 2 Pro', 'Luxury', 2020, 2026, 'SUV', 'essence'),
('Chery', 'Tiggo 4 Pro', 'Comfort', 2021, 2026, 'SUV', 'essence'),
('Chery', 'Tiggo 4 Pro', 'Luxury', 2021, 2026, 'SUV', 'essence'),
('Chery', 'Tiggo 7 Pro', 'Comfort', 2020, 2026, 'SUV', 'essence'),
('Chery', 'Tiggo 7 Pro', 'Luxury', 2020, 2026, 'SUV', 'essence'),
('Chery', 'Tiggo 8 Pro', 'Comfort', 2020, 2026, 'SUV', 'essence'),
('Chery', 'Tiggo 8 Pro', 'Luxury', 2020, 2026, 'SUV', 'essence'),
('Chery', 'Tiggo 8 Max', 'Luxury', 2022, 2026, 'SUV', 'essence'),
('Chery', 'Arrizo 5', 'Comfort', 2016, 2026, 'berline', 'essence'),
('Chery', 'Arrizo 5', 'Luxury', 2016, 2026, 'berline', 'essence'),
('Chery', 'Arrizo 8', 'Luxury', 2022, 2026, 'berline', 'essence'),

-- ==========================================
-- GEELY
-- ==========================================
('Geely', 'GX3 Pro', 'Start', 2020, 2026, 'SUV', 'essence'),
('Geely', 'GX3 Pro', 'GF', 2020, 2026, 'SUV', 'essence'),
('Geely', 'Coolray', 'GL', 2020, 2026, 'SUV', 'essence'),
('Geely', 'Coolray', 'GK', 2020, 2026, 'SUV', 'essence'),
('Geely', 'Coolray', 'GF', 2020, 2026, 'SUV', 'essence'),
('Geely', 'Emgrand', 'GL', 2020, 2026, 'berline', 'essence'),
('Geely', 'Emgrand', 'GF', 2020, 2026, 'berline', 'essence'),
('Geely', 'Monjaro', 'GF', 2021, 2026, 'SUV', 'essence'),
('Geely', 'Starray', 'GL', 2022, 2026, 'SUV', 'essence'),
('Geely', 'Starray', 'GF', 2022, 2026, 'SUV', 'essence'),

-- ==========================================
-- BYD
-- ==========================================
('BYD', 'Dolphin', 'Standard', 2022, 2026, 'citadine', 'electrique'),
('BYD', 'Dolphin', 'Premium', 2022, 2026, 'citadine', 'electrique'),
('BYD', 'Seagull', 'Standard', 2023, 2026, 'citadine', 'electrique'),
('BYD', 'Seagull', 'Premium', 2023, 2026, 'citadine', 'electrique'),
('BYD', 'Song Plus', 'DM-i', 2020, 2026, 'SUV', 'hybride'),
('BYD', 'Han', 'Premium', 2020, 2026, 'berline', 'electrique'),

-- ==========================================
-- DFSK
-- ==========================================
('DFSK', 'Glory 500', 'Comfort', 2021, 2026, 'SUV', 'essence'),
('DFSK', 'Glory 500', 'Luxury', 2021, 2026, 'SUV', 'essence'),
('DFSK', 'Glory 580', 'Comfort', 2018, 2026, 'SUV', 'essence'),
('DFSK', 'Glory 580', 'Luxury', 2018, 2026, 'SUV', 'essence'),
('DFSK', 'Glory 600', 'Luxury', 2023, 2026, 'SUV', 'essence'),
('DFSK', 'K01S', 'Standard', 2020, 2026, 'utilitaire', 'essence'),
('DFSK', 'K02S', 'Standard', 2020, 2026, 'utilitaire', 'essence'),

-- ==========================================
-- MG
-- ==========================================
('MG', 'ZS', 'Comfort', 2020, 2026, 'SUV', 'essence'),
('MG', 'ZS', 'Luxury', 2020, 2026, 'SUV', 'essence'),
('MG', '3', 'Standard', 2018, 2026, 'citadine', 'essence'),
('MG', '3', 'Luxury', 2018, 2026, 'citadine', 'essence'),
('MG', '5', 'Standard', 2020, 2026, 'berline', 'essence'),
('MG', '5', 'Luxury', 2020, 2026, 'berline', 'essence'),
('MG', 'HS', 'Luxury', 2018, 2026, 'SUV', 'essence'),

-- ==========================================
-- FIAT
-- ==========================================
('Fiat', '500', 'Cult', 2020, 2026, 'citadine', 'essence'),
('Fiat', '500', 'Club', 2020, 2026, 'citadine', 'essence'),
('Fiat', '500', 'Dolcevita', 2020, 2026, 'citadine', 'essence'),
('Fiat', '500X', 'Club', 2020, 2026, 'SUV', 'essence'),
('Fiat', '500X', 'Dolcevita', 2020, 2026, 'SUV', 'essence'),
('Fiat', 'Tipo', 'Standard', 2020, 2026, 'berline', 'essence'),
('Fiat', 'Tipo', 'City', 2020, 2026, 'berline', 'essence'),
('Fiat', 'Tipo', 'Life', 2020, 2026, 'berline', 'essence'),
('Fiat', 'Doblo', 'Commercial', 2020, 2026, 'utilitaire', 'diesel'),
('Fiat', 'Scudo', 'Commercial', 2020, 2026, 'utilitaire', 'diesel'),
('Fiat', 'Ducato', 'Commercial', 2020, 2026, 'utilitaire', 'diesel'),

-- ==========================================
-- OPEL
-- ==========================================
('Opel', 'Astra', 'Edition', 2021, 2026, 'citadine', 'essence'),
('Opel', 'Astra', 'GS Line', 2021, 2026, 'citadine', 'essence'),
('Opel', 'Corsa', 'Edition', 2021, 2026, 'citadine', 'essence'),
('Opel', 'Corsa', 'GS Line', 2021, 2026, 'citadine', 'essence'),
('Opel', 'Mokka', 'Edition', 2021, 2026, 'SUV', 'essence'),
('Opel', 'Mokka', 'GS Line', 2021, 2026, 'SUV', 'essence'),
('Opel', 'Grandland', 'GS Line', 2021, 2026, 'SUV', 'essence'),

-- ==========================================
-- TOYOTA ADDITIONAL TRIMS & MODELS
-- ==========================================
('Toyota', 'Land Cruiser', 'LC300 VXR', 2021, 2026, 'SUV', 'diesel'),
('Toyota', 'Land Cruiser', 'LC300 GR Sport', 2021, 2026, 'SUV', 'diesel'),
('Toyota', 'Prado', 'Adventure', 2020, 2026, 'SUV', 'diesel'),
('Toyota', 'Prado', 'Lounge', 2020, 2026, 'SUV', 'diesel'),
('Toyota', 'Yaris', 'Active', 2020, 2026, 'citadine', 'essence'),
('Toyota', 'Yaris', 'Style', 2020, 2026, 'citadine', 'essence'),
('Toyota', 'Corolla', 'Active', 2020, 2026, 'berline', 'essence'),
('Toyota', 'Corolla', 'Dynamic', 2020, 2026, 'berline', 'essence'),
('Toyota', 'Hilux', 'Single Cabin', 2015, 2026, 'pickup', 'diesel'),
('Toyota', 'Hilux', 'Double Cabin', 2015, 2026, 'pickup', 'diesel')

ON CONFLICT (brand, model, trim) DO NOTHING;
