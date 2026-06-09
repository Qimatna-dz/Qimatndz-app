import { supabase } from './supabase';

export interface ValuationRequest {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  condition: 'excellent' | 'bon' | 'moyen' | 'mauvais';
  paint?: string;
  engine?: 'neuf' | 'bon' | 'fatigue' | 'swappe';
  fuel?: 'essence' | 'diesel' | 'gpl' | 'hybride';
  engine_details?: string;
  trim_details?: string;
  wilaya?: string;
  trim?: string;
  document_status?: 'safia' | 'licence_delai';
  transmission?: 'manuelle' | 'automatique';
  is_gulf_spec?: boolean;
  has_aftermarket?: boolean;
}

export interface ValuationResult {
  prix_estime: number;
  price_median: number; // For compatibility
  fourchette_min: number;
  fourchette_max: number;
  devise: "DZD";
  verdict: "bonne_affaire" | "prix_marche" | "surevalue";
  score_justification: number;
  confiance: "haute" | "moyenne" | "faible";
  facteurs: Array<{
    nom: string;
    impact: "positif" | "negatif" | "neutre";
    poids: "fort" | "moyen" | "faible";
    explication: string;
  }>;
  conseil_negociation: string;
  alertes: string[];
  donnees_marche: {
    prix_median: number;
    nb_annonces: number;
    variation_semaine: number;
    derniere_maj: string;
  };
  import_option?: {
    disponible: boolean;
    prix_total_estime: number | null;
    details: string | null;
  };
  // Compatibility fields for existing UI
  price_min?: number;
  price_median_compat?: number;
  price_max?: number;
  data_points?: number;
  ai_explanation?: string | null;
  source_breakdown?: any;
  error?: string;
}

function getVerdict(price: number, min: number, max: number): "bonne_affaire" | "prix_marche" | "surevalue" {
  if (price < min) return "bonne_affaire";
  if (price > max) return "surevalue";
  return "prix_marche";
}

const CONDITION_MULTIPLIERS: Record<string, number> = {
  excellent: 1.05,
  bon:       1.00,
  moyen:     0.95,
  mauvais:   0.85,
};

const PAINT_MULTIPLIERS: Record<string, number> = {
  origine:  1.05,
  raccord:   1.00,
  retouches: 1.00,
  repeinte:  0.92,
  choc:      0.75,
};

const ENGINE_MULTIPLIERS: Record<string, number> = {
  neuf:    1.03,
  bon:     1.00,
  fatigue: 0.90,
  swappe:  0.95, // Moteur changé : décote pour traçabilité inconnue
};

const FUEL_MULTIPLIERS: Record<string, number> = {
  essence: 1.00,
  diesel:  1.15,
  hybride: 1.10,
  gpl:     1.04, // Fix #5: proportional ~4% premium instead of flat +200k DZD
};

// Fix #3: Absolute segment price floors (2026 values) — no car can go below these
const SEGMENT_FLOORS: Record<string, number> = {
  citadine:  800_000,
  berline:   1_200_000,
  SUV:     1_800_000,
  pickup:  2_500_000,
};

const TRIM_MULTIPLIERS: Record<string, number> = {
  'GR Sport': 1.30,
  'GR-S':      1.30,
  'Adventure': 1.15,
  'Legend':    1.10,
  'Shine':     1.15,
  'Sensation': 1.12,
  'Essentiel': 0.90,
  'Work':      0.85,
  'Standard':  1.00,
  'Luxury':    1.15,
  'Comfort':   1.02,
  'Flagship':  1.18,
  'Premium':   1.15,
  'Active':    1.00,
  'Dynamic':   1.05,
  'AMG Line':  1.35,
  'AMG-Line':  1.35,
  'M Sport':   1.30,
  'M-Sport':   1.30,
  'S Line':    1.25,
  'S-Line':    1.25,
  'Highline':  1.22,
  'Carat':     1.22,
  'FR':        1.35,
  'Style':     1.08,
  'Dolcevita': 1.10,
  'Club':      1.05,
  'Cult':      1.00,
};

const DOCUMENT_MULTIPLIERS: Record<string, number> = {
  safia: 1.00,
  licence_delai: 0.85, // 15% discount for Mujahideen / Ansej license with lock period
};

const TRANSMISSION_MULTIPLIERS: Record<string, number> = {
  manuelle: 1.00,
  automatique: 1.08, // 8% premium for automatic transmission (BVA) comfort in used market
};

const FALLBACK_MEDIANS: Record<string, number> = {
  // Renault — Générations séparées
  'Renault Symbol G1':        1_300_000, // 2008-2012
  'Renault Symbol G2':        1_800_000, // 2013-2017
  'Renault Symbol G3':        2_400_000, // 2018-2022
  'Renault Clio 2':           1_100_000,
  'Renault Clio 3':           1_500_000,
  'Renault Clio 4':           2_500_000,
  'Renault Clio 5':           3_500_000,
  'Renault Megane 3':         1_400_000, // 2009-2015 — prix réel marché DZ
  'Renault Megane 4':         4_000_000,
  'Renault Kangoo':           3_200_000,
  'Renault Express':          3_400_000,

  // Dacia
  'Dacia Logan G1':           1_100_000, // 2006-2012
  'Dacia Logan G2':           1_800_000, // 2013-2020
  'Dacia Logan G3':           2_600_000, // 2021+
  'Dacia Sandero G2':         2_200_000,
  'Dacia Sandero Stepway G2': 2_800_000, // 2013-2020
  'Dacia Sandero Stepway G3': 3_600_000, // 2021+
  'Dacia Duster G1':          2_200_000,
  'Dacia Duster G2':          4_000_000,

  // Toyota
  'Toyota Yaris G2':          1_500_000, // 2006-2011
  'Toyota Yaris G3':          2_500_000, // 2012-2019
  'Toyota Yaris G4':          4_200_000, // 2020+
  'Toyota Corolla G10':       2_000_000, // 2007-2013
  'Toyota Corolla G11':       3_500_000, // 2014-2019
  'Toyota Corolla G12':       5_500_000, // 2020+
  'Toyota Hilux G7':          4_500_000, // 2005-2015
  'Toyota Hilux G8':          8_500_000, // 2016+
  'Toyota Land Cruiser J200': 12_000_000,
  'Toyota Land Cruiser J300': 26_000_000,

  // Peugeot
  'Peugeot 206':              1_000_000,
  'Peugeot 207':              1_300_000,
  'Peugeot 208 G1':           1_800_000, // 2012-2019
  'Peugeot 208 G2':           3_400_000, // 2020+
  'Peugeot 301':              1_800_000,
  'Peugeot 308 G1':           1_500_000, // 2007-2013
  'Peugeot 308 G2':           3_000_000, // 2014-2021
  'Peugeot 3008 G1':          2_200_000, // 2009-2016
  'Peugeot 3008 G2':          5_500_000, // 2017+
  'Peugeot Partner':          3_200_000,

  // Volkswagen
  'Volkswagen Polo 5':        1_800_000, // 2009-2017
  'Volkswagen Polo 6':        3_600_000, // 2018+
  'Volkswagen Golf 5':        1_500_000, // 2003-2008
  'Volkswagen Golf 6':        2_500_000, // 2009-2012
  'Volkswagen Golf 7':        5_200_000, // 2013-2020 — prix réel marché DZ
  'Volkswagen Golf 8':        6_200_000, // 2020+
  'Volkswagen Tiguan G1':     2_800_000, // 2007-2015
  'Volkswagen Tiguan G2':     6_500_000, // 2016+
  'Volkswagen Caddy G3':      2_500_000, // 2004-2015
  'Volkswagen Caddy G4':      4_500_000, // 2015-2020
  'Volkswagen Caddy G5':      6_500_000, // 2021+

  // Seat / Skoda
  'Seat Ibiza 3':             1_200_000, // 2002-2008
  'Seat Ibiza 4':             1_700_000, // 2008-2017
  'Seat Ibiza 5':             3_200_000, // 2017+
  'Seat Leon 2':              1_600_000, // 2005-2012
  'Seat Leon 3':              3_800_000, // 2012-2020
  'Seat Leon 4':              5_500_000, // 2020+
  'Skoda Octavia 2':          1_800_000, // 2004-2013
  'Skoda Octavia 3':          4_200_000, // 2013-2020
  'Skoda Octavia 4':          6_000_000, // 2020+
  'Skoda Fabia 2':            1_400_000, // 2007-2014
  'Skoda Fabia 3':            2_500_000, // 2014-2021

  // Hyundai
  'Hyundai Accent Era':       1_500_000, // 2006-2011
  'Hyundai Accent RB':        2_400_000, // 2011-2017
  'Hyundai Tucson G2':        2_500_000, // 2009-2015
  'Hyundai Tucson G3':        4_500_000, // 2015-2020
  'Hyundai Tucson G4':        6_800_000, // 2020+
  'Hyundai i10 G1':           1_200_000, // 2007-2013
  'Hyundai Grand i10':        2_200_000, // 2013-2019
  'Hyundai Creta G1':         3_800_000, // 2015-2020

  // Kia
  'Kia Picanto G1':           1_100_000, // 2004-2011
  'Kia Picanto G2':           1_800_000, // 2011-2017
  'Kia Picanto G3':           3_200_000, // 2017+
  'Kia Sportage G3':          3_000_000, // 2010-2015
  'Kia Sportage G4':          4_800_000, // 2015-2021
  'Kia Sportage G5':          7_500_000, // 2021+
  'Kia Rio G3':               1_600_000, // 2011-2017
  'Kia Rio G4':               3_000_000, // 2017+

  // Chinese Brands
  'Jetour Dashing':           4_500_000,
  'Jetour Traveller T2':      8_000_000,
  'Geely Coolray':            3_800_000,
  'Geely Coolray GF':         4_200_000,
  'Geely Coolray GL':         3_800_000,
  'Geely Monjaro':            7_800_000,
  'Geely GX3 Pro':            2_800_000,
  'Geely GX3 Pro GF':         3_200_000,
  'Geely Emgrand':            3_000_000,
  'Geely Emgrand GF':         3_200_000,
  'Chery Tiggo 2 Pro':        2_600_000,
  'Chery Tiggo 2 Pro Luxury': 3_000_000,
  'Chery Tiggo 4 Pro':        3_200_000,
  'Chery Tiggo 4 Pro Luxury': 3_600_000,
  'Chery Tiggo 7 Pro':        3_800_000,
  'Chery Tiggo 7 Pro Luxury': 4_200_000,
  'Chery Tiggo 8 Pro':        4_500_000,
  'Chery Tiggo 8 Pro Luxury': 4_900_000,
  'Chery Arrizo 5':           3_000_000,
  'Chery Arrizo 5 Luxury':    3_300_000,
  'BYD Dolphin':              5_200_000,
  'BYD Dolphin Premium':      5_500_000,
  'BYD Seagull':              3_500_000,
  'BYD Seagull Standard':     3_800_000,
  'DFSK Glory 580':           3_200_000,
  'DFSK Glory 600':           4_500_000,
  'MG ZS':                    4_200_000,
  'MG HS':                    6_000_000,
  'Changan Alsvin':           3_000_000,
  'Fiat 500':                 2_600_000,
  'Fiat Tipo':                3_000_000,
  'Opel Astra':               4_800_000,
  'Opel Corsa':               3_500_000,
  'Opel Mokka':               4_500_000,

  // ── Mercedes SUV — Générations réelles marché DZ ──
  'Mercedes GLC G1':          9_500_000,  // X253 2015-2022 — prix réel marché DZ
  'Mercedes GLC G2':         14_500_000,  // X254 2023+ — neuf importé
  'Mercedes GLA G1':          7_000_000,  // H247 2020+
  'Mercedes GLA G2':          9_000_000,  // AMG Line / haut de gamme
  'Mercedes GLB':             8_500_000,  // H247 2020+
  'Mercedes GLE G2':         14_000_000,  // V167 2019+
  'Mercedes GLC Coupe G1':   10_500_000,  // C253 Coupé 2016-2022

  // ── BMW SUV — Générations réelles marché DZ ──
  'BMW X3 G2':                9_000_000,  // F25 2011-2017
  'BMW X3 G3':               13_000_000,  // G01 2018+
  'BMW X5 G3':               15_000_000,  // F15 2014-2018
  'BMW X5 G4':               20_000_000,  // G05 2019+
  'BMW X1 G2':                7_500_000,  // F48 2015-2022
  'BMW X1 G3':               11_000_000,  // U11 2022+

  // ── Audi SUV — Générations réelles marché DZ ──
  'Audi Q5 G1':               7_500_000,  // 8R 2008-2016
  'Audi Q5 G2':              10_500_000,  // FY 2017+
  'Audi Q3 G1':               6_500_000,  // 8U 2011-2018
  'Audi Q3 G2':               9_000_000,  // F3 2019+
  'Audi Q7 G2':              16_000_000,  // 4M 2015+
};

const CATEGORY_FALLBACK_MEDIANS: Record<string, number> = {
  citadine:   2_800_000,
  berline:    2_400_000,
  SUV:        6_200_000,
  pickup:     8_500_000,
  utilitaire: 8_500_000,
  citadine_budget: 1_600_000,
  citadine_standard: 2_800_000,
  citadine_premium: 5_000_000,
  berline_standard: 2_400_000,
  berline_premium: 9_000_000,
  crossover_compact: 3_600_000,
  suv_routier: 6_000_000,
  suv_premium: 9_000_000,
  suv_prestige: 22_000_000,
  utilitaire_pickup: 8_500_000,
};

const DEFAULT_REF_YEAR = 2026;

// ─────────────────────────────────────────
// FIX #1 — AJUSTEMENT SOUK DÉGRESSIF
// Remplace le coefficient fixe ×0.91 par une fonction basée sur la tranche de prix.
// Sur le marché DZ, la marge de négociation n'est pas linéaire :
//   • <2M DZD : le vendeur gonfle de ~9% → ×0.91
//   • 2-4M DZD : il gonfle de ~6%      → ×0.94
//   • >4M DZD  : il gonfle de ~4%      → ×0.96
// ─────────────────────────────────────────
function getSoukAdjustmentFactor(rawMedianPrice: number): number {
  if (rawMedianPrice < 2_000_000) return 0.91; // -9% voitures < 200M centimes
  if (rawMedianPrice < 4_000_000) return 0.94; // -6% voitures 200-400M centimes
  return 0.96;                                   // -4% véhicules premium > 400M centimes
}

// ─────────────────────────────────────────────────────────────────────────────
// SEGMENT_BASES — Référentiel module (utilisé par le bouclier et le fallback)
// Prix de base 2026 pour chaque segment du marché algérien
// ─────────────────────────────────────────────────────────────────────────────
const SEGMENT_BASES: Record<string, number> = {
  citadine_budget:    1_600_000,
  citadine_standard:  2_800_000,
  citadine_premium:   5_000_000,
  berline_standard:   2_400_000,
  berline_premium:    9_000_000,
  crossover_compact:  3_600_000,
  suv_routier:        6_000_000,
  suv_premium:        9_000_000,
  suv_prestige:      22_000_000,
  utilitaire_pickup:  8_500_000,
};

// ─────────────────────────────────────────────────────────────────────────────
// FIX 3 — BRAND_SEGMENT_MEDIANS
// Médianes réelles observées par marque × segment pour l'interpolation
// des modèles inconnus (absents de FALLBACK_MEDIANS et de la DB).
// Mis à jour manuellement sur base des données Ouedkniss — révision mensuelle.
// ─────────────────────────────────────────────────────────────────────────────
const BRAND_SEGMENT_MEDIANS: Record<string, Partial<Record<string, number>>> = {
  // Marques japonaises
  'Mazda':      { berline_standard: 3_800_000, crossover_compact: 4_600_000, suv_routier: 5_800_000 },
  'Honda':      { citadine_standard: 3_200_000, berline_standard: 4_000_000, suv_routier: 5_200_000 },
  'Subaru':     { berline_standard: 3_500_000, suv_routier: 5_200_000, utilitaire_pickup: 6_500_000 },
  'Mitsubishi': { citadine_standard: 2_800_000, suv_routier: 4_800_000, utilitaire_pickup: 7_800_000 },
  'Nissan':     { citadine_standard: 2_600_000, suv_routier: 4_800_000, suv_premium: 7_500_000 },
  'Infiniti':   { suv_routier: 7_000_000, suv_premium: 10_000_000 },
  'Lexus':      { suv_routier: 9_000_000, suv_premium: 13_000_000, berline_premium: 11_000_000 },
  // Marques américaines
  'Ford':       { suv_routier: 5_200_000, utilitaire_pickup: 9_000_000 },
  'Chevrolet':  { berline_standard: 3_000_000, suv_routier: 5_500_000 },
  'Jeep':       { suv_routier: 5_500_000, suv_premium: 9_000_000 },
  // Marques européennes non-premium
  'Seat':       { citadine_standard: 2_600_000, berline_standard: 3_000_000 },
  'Skoda':      { citadine_standard: 2_500_000, berline_standard: 3_200_000, suv_routier: 5_000_000 },
  'Opel':       { citadine_standard: 2_300_000, berline_standard: 2_800_000, crossover_compact: 3_500_000 },
  'Fiat':       { citadine_budget: 1_800_000, citadine_standard: 2_200_000 },
  // Marques premium européennes
  'Volvo':      { crossover_compact: 5_500_000, suv_routier: 8_500_000, suv_premium: 12_000_000 },
  'Jaguar':     { berline_premium: 9_000_000, suv_routier: 9_500_000 },
  'Land Rover': { suv_premium: 12_000_000, suv_prestige: 18_000_000 },
  // Marques chinoises
  'Haval':      { crossover_compact: 3_200_000, suv_routier: 4_200_000 },
  'JAC':        { citadine_standard: 2_400_000, berline_standard: 2_600_000, suv_routier: 3_800_000 },
  'Changan':    { citadine_budget: 1_900_000, berline_standard: 2_400_000 },
  'Bestune':    { berline_standard: 2_200_000, suv_routier: 3_500_000 },
  // Marques coréennes non-couvertes
  'Genesis':    { berline_premium: 8_500_000, suv_premium: 10_000_000 },
  'Ssangyong':  { suv_routier: 3_800_000 },
};

// ─────────────────────────────────────────────────────────────────────────────
// FIX 4 — CAPS ASYMÉTRIQUES PAR SEGMENT
// Remplacent les constantes plates MAX_BOOST=1.20 / MAX_DEPRECIATION=0.65.
// Calibrés selon la liquidité du marché DZ par segment :
//   - Les citadines sont un marché liquide → peu de variabilité → caps serrés
//   - Les SUV prestige rares → prime de rareté pouvant aller à +35%
//   - Les pickups (Hilux) : valeur refuge → plancher très haut, bonus rare
// ─────────────────────────────────────────────────────────────────────────────
const SEGMENT_BOOST_CAPS: Record<string, number> = {
  citadine_budget:   1.10, // Alto parfaite : max +10% (marché ultra-liquide)
  citadine_standard: 1.12, // Clio parfaite : max +12%
  citadine_premium:  1.18, // Mini 00 : max +18% (plus rare)
  berline_standard:  1.12, // Symbol 00 : max +12%
  berline_premium:   1.25, // BMW Série 3 parfaite : max +25%
  crossover_compact: 1.15, // Coolray excellent : max +15%
  suv_routier:       1.22, // Tucson/GLC excellent : max +22%
  suv_premium:       1.30, // X5/Q7 parfait, introuvable : max +30%
  suv_prestige:      1.35, // Cayenne/G-Class quasi-neuf : max +35%
  utilitaire_pickup: 1.25, // Hilux 00 : max +25% (valeur refuge)
};

const SEGMENT_DEPRECIATION_CAPS: Record<string, number> = {
  citadine_budget:   0.55, // Alt épave : jusqu'à -45%
  citadine_standard: 0.62, // Clio accidentée : max -38%
  citadine_premium:  0.65, // Mini abîmée : max -35%
  berline_standard:  0.62, // Symbol mauvais état : max -38%
  berline_premium:   0.68, // Série 3 accidentée : max -32%
  crossover_compact: 0.65, // Coolray mauvais état : max -35%
  suv_routier:       0.68, // GLC mauvais état : max -32% (marché sec)
  suv_premium:       0.70, // X5 accidenté : max -30%
  suv_prestige:      0.72, // G-Class même abîmé : max -28% (valeur plancher élevée)
  utilitaire_pickup: 0.65, // Hilux cassé : max -35%
};

// ─────────────────────────────────────────────────────────────────────────────
// BOUCLIER GLOBAL ANTI-EFFONDREMENT — applyGlobalSafetyShield()
// FIX 5 : Le plancher segment s'applique UNIQUEMENT aux véhicules ≤ 15 ans.
// Au-delà de 15 ans, la voiture est sur le marché de pièces détachées ou de
// collection — le plancher segment DZ 2026 est irrelevant et crée de la sur-estimation.
//
// GARDE ACTIFS sur les +15 ans :
//   - Plancher absolu universel 200 000 DZD (évite les zéros absurdes)
//   - Bouclier premium sur les marques de luxe (Mercedes, BMW... ≤ 15 ans seulement)
// ─────────────────────────────────────────────────────────────────────────────
function applyGlobalSafetyShield(price: number, segment: string, brand: string, year: number): number {
  let securedPrice = price;
  const now = new Date();
  const currentYearDecimal = now.getFullYear() + (now.getMonth() / 12);
  const carAge = Math.max(0, currentYearDecimal - year);

  // FIX 5 : Plancher segment conditionnel — voitures ≤ 15 ans uniquement
  if (carAge <= 15) {
    // Planchers ancrés sur SEGMENT_BASES (valeur fixe indépendante des données DB)
    const segmentFloorRatios: Record<string, number> = {
      citadine_budget:   0.40, // 1.6M × 40% = 640k  — vieux Alto fonctionnel
      citadine_standard: 0.52, // 2.8M × 52% = 1.46M — Clio/Symbol accidentée mais roulante
      citadine_premium:  0.50, // 5.0M × 50% = 2.5M  — Mini/Audi A1
      berline_standard:  0.52, // 2.4M × 52% = 1.25M — Symbol/Logan
      berline_premium:   0.58, // 9.0M × 58% = 5.22M — Série 3, A4
      crossover_compact: 0.52, // 3.6M × 52% = 1.87M — Coolray, KX1
      suv_routier:       0.62, // 6.0M × 62% = 3.72M — GLC, Tucson → + premium floor
      suv_premium:       0.62, // 9.0M × 62% = 5.58M — X5, Q7
      suv_prestige:      0.58, // 22M × 58%  = 12.76M — Cayenne, G-Class
      utilitaire_pickup: 0.62, // 8.5M × 62% = 5.27M — Hilux
    };

    const ratio = segmentFloorRatios[segment] || 0.50;
    const baseSegmentPrice = SEGMENT_BASES[segment] || 2_400_000;
    const segmentMinFloor = Math.round(baseSegmentPrice * ratio);

    if (securedPrice < segmentMinFloor) {
      console.log(`[SHIELD ↑ ≤15ans] ${segment} (${carAge}ans) | ${securedPrice.toLocaleString()} → ${segmentMinFloor.toLocaleString()} DZD (${(ratio * 100).toFixed(0)}% × ${baseSegmentPrice.toLocaleString()})`);
      securedPrice = segmentMinFloor;
    }

    // Bouclier Marques Premium — Plancher Relatif
    const premiumShieldBrands = [
      'mercedes', 'bmw', 'audi', 'porsche',
      'land rover', 'landrover', 'range rover', 'rangerover',
      'lexus', 'volvo', 'jaguar', 'infiniti', 'lincoln', 'cadillac',
    ];
    if (premiumShieldBrands.some(b => brand.toLowerCase().includes(b))) {
      // Le plancher premium est 1.3x le plancher standard de son segment (remplace les 4M fixes)
      const premiumFloorRatio = 1.30;
      const premiumRelativeFloor = Math.round(segmentMinFloor * premiumFloorRatio);
      
      if (securedPrice < premiumRelativeFloor) {
        console.log(`[SHIELD PREMIUM ↑] ${brand} ${year} (${carAge}ans) : ${securedPrice.toLocaleString()} → ${premiumRelativeFloor.toLocaleString()} DZD (Relatif 1.3x)`);
        securedPrice = premiumRelativeFloor;
      }
    }
  } else {
    // Voiture > 15 ans : plancher absolu universel seulement (pas de distorsion marché)
    const ancienFloor = 200_000; // Plancher absolu — évite les résultats nuls ou négatifs
    if (securedPrice < ancienFloor) securedPrice = ancienFloor;
    console.log(`[SHIELD SKIP > 15ans] ${brand} ${year} (${carAge}ans) : plancher segment ignoré, prix libre = ${securedPrice.toLocaleString()} DZD`);
  }

  return securedPrice;
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 6 — PSYCHOLOGIE DU MARCHÉ PREMIUM (Le "Reality Check")
// La rue sanctionne violemment les Allemandes à fort kilométrage (>120k)
// et les transactions au-delà de 500 Millions se négocient avec une décote cash agressive.
// ─────────────────────────────────────────────────────────────────────────────
function applyPremiumPsychologyCorrection(finalPrice: number, brand: string, mileage: number): { correctedPrice: number, appliedMalus: string[] } {
  let realWorldPrice = finalPrice;
  const appliedMalus: string[] = [];
  const premiumBrands = ['mercedes-benz', 'mercedes', 'bmw', 'audi', 'porsche', 'land rover', 'landrover', 'range rover', 'rangerover'];

  if (premiumBrands.includes(brand.toLowerCase())) {
    // 1. Durcir la pénalité de kilométrage élevé sur le Premium uniquement
    if (mileage > 120000) {
      const premiumKmMalus = 0.18; // -18% d'office pour la barrière psychologique des gros kilomètres
      realWorldPrice = Math.round(realWorldPrice * (1 - premiumKmMalus));
      appliedMalus.push('km_premium');
    }

    // 2. Le coefficient de panique du vendeur (Liquidité du Luxe)
    if (realWorldPrice > 5000000) { // Si le prix calculé dépasse 500 Millions
      // On applique un terrainDelta de sécurité beaucoup plus fort
      realWorldPrice = Math.round(realWorldPrice * 0.82); // -18% d'ajustement souk réel au lieu des -4%
      appliedMalus.push('liquidity_luxe');
    }
  }

  return { correctedPrice: realWorldPrice, appliedMalus };
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 7 — LA MATRICE CHINOISE (Correction Macro-Origine)
// Prévient l'explosion des prix sur les nouvelles marques asiatiques 
// (ex: classées comme SUV Premium par erreur sémantique "Luxury").
// ─────────────────────────────────────────────────────────────────────────────
function applyChineseMarketCorrection(basePrice: number, brand: string, model: string): number {
  let correctedBase = basePrice;
  const chineseBrands = ['jetour', 'chery', 'geely', 'dfsk', 'baic', 'jac', 'sokon', 'changan', 'mg', 'gac', 'dongfeng'];
  
  if (chineseBrands.includes(brand.toLowerCase())) {
    const CHINESE_SUV_BASE = 4800000; 
    const CHINESE_SEDAN_BASE = 3200000;
    
    if (model.toLowerCase().includes('x') || model.toLowerCase().includes('tiggo') || model.toLowerCase().includes('suv') || model.toLowerCase().includes('coolray')) {
       correctedBase = CHINESE_SUV_BASE;
    } else {
       correctedBase = CHINESE_SEDAN_BASE;
    }

    // Appliquer le coefficient de décote rapide chinois
    correctedBase = correctedBase * 0.90; 
  }
  return correctedBase;
}

// ─────────────────────────────────────────
// LOGIQUE STATISTIQUE
// ─────────────────────────────────────────

function normalizeModelName(m: string): string {
  if (!m) return '';
  const romanMap: Record<string, string> = {
    'i': '1', 'ii': '2', 'iii': '3', 'iv': '4', 'v': '5', 'vi': '6', 'vii': '7', 'viii': '8', 'ix': '9', 'x': '10'
  };
  
  return m.toLowerCase()
    .split(/\s+/)
    .map(word => {
      const cleanWord = word.replace(/[^a-z]/g, '');
      if (romanMap[cleanWord]) {
        return word.replace(cleanWord, romanMap[cleanWord]);
      }
      return word;
    })
    .join('')
    .replace(/[^a-z0-9]/g, '');
}

function modelsMatchFuzzy(m1: string, m2: string): boolean {
  if (!m1 || !m2) return false;
  const n1 = normalizeModelName(m1);
  const n2 = normalizeModelName(m2);
  
  if (n1.includes(n2) || n2.includes(n1)) return true;
  
  const words1 = m1.toLowerCase().split(/\s+/);
  const words2 = m2.toLowerCase().split(/\s+/);
  
  return words1[0] === words2[0] && words1[0].length > 2;
}

function detect_trim_target(request: ValuationRequest): string {
  const details = `${request.trim || ''} ${request.trim_details || ''}`.toLowerCase();
  
  const high_keywords = ['fr', 'highline', 'gt line', 'allure', 'pack m', 's line', 'tout option', 'toute option', 'full', 'toit'];
  const low_keywords = ['sol', 'start', 'access', 'essentiel', 'de base'];
  
  if (high_keywords.some(k => details.includes(k))) return 'high_spec';
  if (low_keywords.some(k => details.includes(k))) return 'low_spec';
  
  // Options spécifiques cochées dans l'UI
  if (request.has_aftermarket || request.is_gulf_spec) return 'high_spec';
  
  return 'standard';
}

function getSegmentFloor(bodyType: string, year: number): number {
  const floors: Record<string, number> = {
    citadine: 1200000,
    berline:  1800000,
    SUV:      3000000,
    pickup:   4500000,
  };
  
  const bt = bodyType.toLowerCase();
  let floor = floors.berline;
  if (bt.includes('pickup') || bt.includes('utilitaire')) floor = floors.pickup;
  else if (bt.includes('suv')) floor = floors.SUV;
  else if (bt.includes('citadine')) floor = floors.citadine;
  
  if (year < 2018) {
    const yearsBefore = 2018 - year;
    floor = floor * Math.pow(0.90, yearsBefore);
  }
  
  return Math.round(floor);
}

function removeOutliers(prices: number[]): number[] {
  if (prices.length < 4) return prices;
  const sorted = [...prices].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const filtered = sorted.filter(x => x >= lowerBound && x <= upperBound);
  return filtered.length >= 3 ? filtered : sorted.slice(0, 3);
}

export function calculateVehicleConditionScore(mileage: number, condition: string, paint?: string, engine?: string): number {
  let mileageScore = 100;
  if (mileage > 0) {
    mileageScore = Math.max(10, Math.round(100 - (mileage / 3500)));
  }
  
  let generalScore = 80;
  if (condition === 'excellent') generalScore = 100;
  else if (condition === 'bon') generalScore = 80;
  else if (condition === 'moyen') generalScore = 50;
  else if (condition === 'mauvais') generalScore = 20;

  let paintScore = 100;
  if (paint) {
    if (paint === 'origine') paintScore = 100;
    else if (paint === 'raccord' || paint === 'retouches') paintScore = 80;
    else if (paint === 'repeinte') paintScore = 50;
    else if (paint === 'choc') paintScore = 15;
  }

  let engineScore = 80;
  if (engine) {
    if (engine === 'neuf') engineScore = 100;
    else if (engine === 'bon') engineScore = 80;
    else if (engine === 'fatigue') engineScore = 30;
  }

  const score = Math.round(
    (mileageScore * 0.35) + 
    (generalScore * 0.25) + 
    (paintScore * 0.20) + 
    (engineScore * 0.20)
  );

  return Math.min(100, Math.max(10, score));
}

export function classifyVehicleSegment(brand: string, model: string, bodyType: string): string {
  const normBrand = brand.toLowerCase();
  const normModel = model.toLowerCase();
  
  const prestigeBrands = ['porsche', 'bentley', 'ferrari', 'lamborghini', 'maserati', 'rollsroyce', 'rolls-royce', 'astonmartin', 'aston-martin', 'mclaren', 'bugatti'];
  const premiumBrands = ['mercedes', 'mercedes-benz', 'mercedesbenz', 'bmw', 'audi', 'landrover', 'land-rover', 'rangerover', 'range-rover', 'lexus', 'jaguar', 'volvo', 'alfaromeo', 'alfa-romeo', 'tesla', 'jeep', 'cadillac', 'lincoln', 'infiniti'];
  const chineseBrands = ['jetour', 'chery', 'geely', 'dfsk', 'baic', 'jac', 'sokon', 'changan', 'mg', 'gac', 'dongfeng'];
  const isChinese = chineseBrands.some(b => normBrand.includes(b));

  const utilityKeywords = ['partner', 'kangoo', 'caddy', 'berlingo', 'express', 'amarok', 'ranger', 'hilux', 'scudo', 'ducato', 'master', 'trafic', 'transit', 'jumper', 'boxer', 'expert', 'k2500', 'k2700'];
  if (bodyType === 'pickup' || bodyType === 'utilitaire' || utilityKeywords.some(k => normModel.includes(k))) {
    return 'utilitaire_pickup';
  }

  const isPremiumBrand = premiumBrands.some(b => normBrand.includes(b)) || prestigeBrands.some(b => normBrand.includes(b));
  
  // ── Intercept Premium Mid-SUVs AVANT le classement crossover/berline ──
  const premiumMidSuvKeywords = ['glc', 'glb', 'x3', 'x4', 'q5', 'q3', 'f-pace', 'fpace', 'e-pace', 'epace', 'xc60', 'xc40', 'stelvio', 'macan', 'evoque', 'velar'];
  if (isPremiumBrand && premiumMidSuvKeywords.some(k => normModel.includes(k))) {
    return 'suv_routier'; 
  }

  const prestigeSuvKeywords = ['q7', 'q8', 'x5', 'x6', 'x7', 'gle', 'gls', 'g-class', 'classe g', 'cayenne', 'macan', 'rangerover', 'range rover', 'vogue', 'velar', 'defender', 'prado', 'land cruiser', 'landcruiser', 'patrol', 'touareg'];
  if (!isChinese && prestigeSuvKeywords.some(k => normModel.includes(k))) {
    return 'suv_prestige';
  }

  const crossoverKeywords = ['kx1', 'coolray', 'tiggo 2', 'tiggo 3', 'tiggo2', 'tiggo3', 'stepway', 'captur', '2008', 'creta', 'kamiq', 'stonic', 't-cross', 't-roc', 'tcross', 'troc', 'q2', 'gla', 'x1', 'asx', 'juke', 'kicks', 'mokka'];
  if (crossoverKeywords.some(k => normModel.includes(k)) || (bodyType === 'SUV' && (normModel.includes('q2') || normModel.includes('x1') || normModel.includes('gla') || normModel.includes('stepway') || normModel.includes('kx1')))) {
    return 'crossover_compact';
  }


  if (bodyType === 'SUV' || normModel.includes('tucson') || normModel.includes('sportage') || normModel.includes('tiguan') || normModel.includes('qashqai') || normModel.includes('kuga') || normModel.includes('rav4') || normModel.includes('crv') || normModel.includes('koleos') || normModel.includes('dashing') || normModel.includes('traveller')) {
    if (isPremiumBrand) {
       return 'suv_premium';
    }
    return 'suv_routier';
  }

  const citadineKeywords = ['alto', 'picanto', 'swift', 'i10', 'spark', 'atos', '206', '207', '208', 'ibiza', 'fabia', 'yaris', 'micra', 'clio', 'polo', 'a1', 'classe a', 'série 1', 'cooper', 'mini'];
  const isPremium = premiumBrands.some(b => normBrand.includes(b)) || prestigeBrands.some(b => normBrand.includes(b));
  if (bodyType === 'citadine' || citadineKeywords.some(k => normModel.includes(k))) {
    if (isPremium) return 'citadine_premium';
    if (normModel.includes('alto') || normModel.includes('qq') || normModel.includes('spark') || normModel.includes('atos')) return 'citadine_budget';
    return 'citadine_standard';
  }

  if (isPremium) return 'berline_premium';
  return 'berline_standard';
}

function weightedMedian(items: Array<{price: number, weight: number}>): number {
  if (items.length === 0) return 0;
  const expanded: number[] = [];
  for (const { price, weight } of items) {
    for (let i = 0; i < weight; i++) expanded.push(price);
  }
  const sorted = [...expanded].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 3000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Query Timeout')), timeoutMs)
    )
  ]);
}

export async function calculateValuation(request: ValuationRequest): Promise<ValuationResult | null> {
  let output: ValuationResult | null = null;
  let totalDataPoints = 0;

  try {
  } catch (err) {
    console.warn('Edge Function unreachable or timed out, falling back to local:', err);
  }

  if (!output) {
    try {
      const { brand, model, year, mileage, condition, paint, engine } = request;

      let listingsRes = { data: [] as any };
      let transactionsRes = { data: [] as any };
      let expertRes = { data: [] as any };
      let mediansRes = { data: [] as any };
      let catalogRes = { data: [] as any };
      let marketAlertsRes = { data: [] as any };
      let marketBaselineRes = { data: null as any };
      let macroRes = { data: [] as any };

      let modifierValue = 1.0;

      try {
        // [FAILLE API & TIMEOUT] Appel unique sécurisé via RPC avec timeout agressif de 5 secondes (Souk mode)
        const { data: rpcData, error } = await withTimeout<any>(
          supabase.rpc('get_valuation_data', { p_brand: brand, p_model: model, p_year: year }) as unknown as Promise<any>,
          5000
        );

        if (error || !rpcData) {
          throw new Error(error?.message || 'Empty RPC result');
        }

        listingsRes = { data: rpcData.listings };
        transactionsRes = { data: rpcData.transactions };
        expertRes = { data: rpcData.experts };
        mediansRes = { data: rpcData.medians };
        catalogRes = { data: rpcData.catalog };
        marketAlertsRes = { data: rpcData.alerts };
        marketBaselineRes = { data: rpcData.baselines && rpcData.baselines.length > 0 ? rpcData.baselines[0] : null };
        macroRes = { data: rpcData.macro };
        
        // [FAILLE CONJONCTURELLE] Récupérer le modificateur de marché global
        if (rpcData.modifier && rpcData.modifier.length > 0) {
          modifierValue = parseFloat(rpcData.modifier[0].modifier_value) || 1.0;
        }

      } catch (err) {
        console.warn('Supabase DB RPC timed out or failed, falling back to parallel queries:', err);
        // Fallback to direct queries
        const [lRes, tRes, eRes, mRes, cRes, aRes, bRes, macRes, gmmRes] = await Promise.all([
          supabase.from('listings').select('*').eq('brand', brand).eq('year', year),
          supabase.from('real_transactions').select('*').eq('brand', brand).eq('year', year),
          supabase.from('expert_prices').select('*').eq('brand', brand).eq('year', year),
          supabase.from('prix_medians').select('*').eq('brand', brand).eq('year', year),
          supabase.from('vehicle_catalog').select('*').eq('brand', brand),
          supabase.from('market_alerts').select('*').eq('brand', brand).eq('year', year),
          supabase.from('market_baselines').select('*').eq('brand', brand).eq('model', model),
          supabase.from('macro_indices').select('*').eq('is_active', true),
          supabase.from('global_market_modifier').select('*').eq('is_active', true).limit(1)
        ]);

        listingsRes = { data: lRes.data || [] };
        transactionsRes = { data: tRes.data || [] };
        expertRes = { data: eRes.data || [] };
        mediansRes = { data: mRes.data || [] };
        catalogRes = { data: cRes.data || [] };
        marketAlertsRes = { data: aRes.data || [] };
        marketBaselineRes = { data: bRes.data && bRes.data.length > 0 ? bRes.data[0] : null };
        macroRes = { data: macRes.data || [] };
        
        if (gmmRes.data && gmmRes.data.length > 0) {
          modifierValue = parseFloat(gmmRes.data[0].modifier_value) || 1.0;
        }
      }

      const weightedPrices: Array<{price: number, weight: number}> = [];
      const breakdown = { transactions: 0, expert: 0, listings: 0, medians: 0 };

      const matchedTransactions = (transactionsRes.data || []).filter((t: any) => modelsMatchFuzzy(t.model, model));
      const matchedExperts = (expertRes.data || []).filter((e: any) => modelsMatchFuzzy(e.model, model));
      const trimTarget = detect_trim_target(request);
      
      let matchedMedians = (mediansRes.data || []).find((m: any) => modelsMatchFuzzy(m.model, model) && m.trim === trimTarget);
      if (!matchedMedians && trimTarget !== 'standard') {
        // Fallback to standard if specific trim not found
        matchedMedians = (mediansRes.data || []).find((m: any) => modelsMatchFuzzy(m.model, model) && (m.trim === 'standard' || m.trim === 'Standard'));
      }
      if (!matchedMedians) {
        matchedMedians = (mediansRes.data || []).find((m: any) => modelsMatchFuzzy(m.model, model));
      }
      const matchedCatalog = (catalogRes.data || []).find((c: any) => modelsMatchFuzzy(c.model, model));

      matchedTransactions.forEach((t: any) => {
        weightedPrices.push({ price: t.final_price, weight: 3 });
        breakdown.transactions++;
      });

      matchedExperts.forEach((e: any) => {
        weightedPrices.push({ price: e.price, weight: 2 });
        breakdown.expert++;
      });

      if (matchedMedians) {
        weightedPrices.push({ price: matchedMedians.prix_median, weight: 5 });
        breakdown.medians++;
      }

      const rawListings = (listingsRes.data || [])
        .filter((l: any) => modelsMatchFuzzy(l.model, model) && l.source !== 'ouedkniss_reference')
        .map((l: any) => l.price_asked)
        .filter((p: number) => p > 100000);
      const filteredListings = removeOutliers(rawListings);
      filteredListings.forEach((p: number) => {
        weightedPrices.push({ price: Math.round(p * 0.95), weight: 1 });
        breakdown.listings++;
      });

      totalDataPoints = breakdown.transactions + breakdown.expert + breakdown.listings + breakdown.medians;
      const weightedPoints = breakdown.transactions * 3 + breakdown.expert * 2 + breakdown.listings + (breakdown.medians * 5);

      let priceMedian: number;
      let priceMin: number | undefined = undefined;
      let priceMax: number | undefined = undefined;
      let isFallback = false;
      // vehicleSegment : calculé dans chaque chemin pour alimenter le bouclier global
      let vehicleSegment = 'berline_standard';

      // ════════════════════════════════════════════════════════════════
      // DIAGNOSTIC : Affiche quelle source de prix est utilisée
      // Visible dans le terminal Expo (npx expo start)
      // ════════════════════════════════════════════════════════════════
      console.log(`\n╔══ QIMATNA DIAGNOSTIC ══════════════════════════════`);
      console.log(`║ Voiture  : ${brand} ${model} ${year} | ${mileage} km`);
      console.log(`║ DB prix_medians : ${matchedMedians ? `✅ TROUVÉ → ${matchedMedians.prix_median?.toLocaleString()} DZD` : '❌ VIDE'}`);
      console.log(`║ DB listings     : ${breakdown.listings} annonces`);
      console.log(`║ DB transactions : ${breakdown.transactions} transactions`);
      console.log(`║ DB expert       : ${breakdown.expert} prix expert`);
      console.log(`║ Points pondérés : ${weightedPoints} (seuil = 5)`);
      console.log(`╚════════════════════════════════════════════════════\n`);

      if (matchedMedians) {
        console.log(`[CHEMIN 1] Prix issu de prix_medians (Flux A) : ${matchedMedians.prix_median?.toLocaleString()} DZD`);
        
        // --- NOUVEAU COUPLAGE FLUX B ---
        let terrainDelta = 0;
        if (matchedExperts.length > 0 || matchedTransactions.length > 0) {
           const terrainAvg = [...matchedExperts.map((e: any) => e.price), ...matchedTransactions.map((t: any) => t.final_price)]
             .reduce((a, b) => a + b, 0) / (matchedExperts.length + matchedTransactions.length);
           terrainDelta = (terrainAvg - matchedMedians.prix_median) / matchedMedians.prix_median;
           terrainDelta = Math.max(-0.15, Math.min(0.15, terrainDelta));
           console.log(`[FLUX B] Correction terrain appliquée (Transactions/Experts) : ${terrainDelta > 0 ? '+' : ''}${(terrainDelta*100).toFixed(1)}%`);
        }
        const correctedMedian = matchedMedians.prix_median * (1 + terrainDelta);
        
        const soukFactor = getSoukAdjustmentFactor(correctedMedian);
        console.log(`[CHEMIN 1] Souk Factor dégressif : ×${soukFactor} (prix brut corrigé : ${correctedMedian.toLocaleString()} DZD)`);
        priceMedian = correctedMedian * soukFactor;
        priceMin = matchedMedians.prix_min ? (matchedMedians.prix_min * (1 + terrainDelta)) * soukFactor : Math.round(priceMedian * 0.88);
        priceMax = matchedMedians.prix_max ? (matchedMedians.prix_max * (1 + terrainDelta)) * soukFactor : Math.round(priceMedian * 1.12);
        
        vehicleSegment = classifyVehicleSegment(brand, model, matchedCatalog?.body_type || 'berline');
      } else if (weightedPoints >= 5) {
        // FIX #1 — Ajustement Souk dégressif sur la médiane pondérée
        const rawWeightedMedian = weightedMedian(weightedPrices);
        const soukFactor = getSoukAdjustmentFactor(rawWeightedMedian);
        priceMedian = rawWeightedMedian * soukFactor;
        console.log(`[CHEMIN 2] Prix issu de la médiane pondérée DB : ${priceMedian?.toLocaleString()} DZD (souk ×${soukFactor})`);
        const allPrices = weightedPrices.map(w => w.price * soukFactor).sort((a, b) => a - b);
        const p10 = allPrices[Math.floor(allPrices.length * 0.1)] || allPrices[0];
        const p90 = allPrices[Math.floor(allPrices.length * 0.9)] || allPrices[allPrices.length - 1];
        priceMin = p10;
        priceMax = p90;
        // Chemin 2 : déduire le segment pour le bouclier
        vehicleSegment = classifyVehicleSegment(brand, model, matchedCatalog?.body_type || 'berline');
      } else {
        isFallback = true;
        console.log(`[CHEMIN 3 - FALLBACK MATH] Aucune donnée DB suffisante. L'algorithme mathématique s'exécute.`);
        const key = `${brand} ${model}`;
        const bodyType = matchedCatalog?.body_type || 'berline';
        const categoryBase = CATEGORY_FALLBACK_MEDIANS[bodyType] || 1500000;
        
        const getGenerationKey = (b: string, m: string, y: number): string | null => {
          const nm = m.toLowerCase();
          const nb = b.toLowerCase();

          // ── Volkswagen ──
          if (nm.includes('golf')) {
             if (y <= 2008) return 'Volkswagen Golf 5';
             if (y <= 2012) return 'Volkswagen Golf 6';
             if (y <= 2020) return 'Volkswagen Golf 7';
             return 'Volkswagen Golf 8';
          }
          if (nm.includes('polo') && nb.includes('volkswagen')) {
             if (y <= 2017) return 'Volkswagen Polo 5';
             return 'Volkswagen Polo 6';
          }
          if (nm.includes('caddy')) {
             if (y <= 2014) return 'Volkswagen Caddy G3';
             if (y <= 2020) return 'Volkswagen Caddy G4';
             return 'Volkswagen Caddy G5';
          }
          if (nm.includes('tiguan')) {
             if (y <= 2015) return 'Volkswagen Tiguan G1';
             return 'Volkswagen Tiguan G2';
          }

          // ── Renault ──
          if (nm.includes('clio')) {
             if (y <= 2005) return 'Renault Clio 2';
             if (y <= 2012) return 'Renault Clio 3';
             if (y <= 2019) return 'Renault Clio 4';
             return 'Renault Clio 5';
          }
          if (nm.includes('megane') || nm.includes('mégane')) {
             if (y <= 2015) return 'Renault Megane 3';
             return 'Renault Megane 4';
          }
          if (nm.includes('symbol')) {
             if (y <= 2012) return 'Renault Symbol G1';
             if (y <= 2017) return 'Renault Symbol G2';
             return 'Renault Symbol G3';
          }

          // ── Dacia ──
          if (nm.includes('logan')) {
             if (y <= 2012) return 'Dacia Logan G1';
             if (y <= 2020) return 'Dacia Logan G2';
             return 'Dacia Logan G3';
          }
          if (nm.includes('stepway') || nm.includes('sandero stepway')) {
             if (y <= 2020) return 'Dacia Sandero Stepway G2';
             return 'Dacia Sandero Stepway G3';
          }
          if (nm.includes('sandero')) {
             if (y <= 2020) return 'Dacia Sandero G2';
             return 'Dacia Sandero G2';
          }
          if (nm.includes('duster')) {
             if (y <= 2017) return 'Dacia Duster G1';
             return 'Dacia Duster G2';
          }

          // ── Toyota ──
          if (nm.includes('yaris')) {
             if (y <= 2011) return 'Toyota Yaris G2';
             if (y <= 2019) return 'Toyota Yaris G3';
             return 'Toyota Yaris G4';
          }
          if (nm.includes('corolla')) {
             if (y <= 2013) return 'Toyota Corolla G10';
             if (y <= 2019) return 'Toyota Corolla G11';
             return 'Toyota Corolla G12';
          }
          if (nm.includes('hilux')) {
             if (y <= 2015) return 'Toyota Hilux G7';
             return 'Toyota Hilux G8';
          }

          // ── Peugeot ──
          if (nm.includes('308')) {
             if (y <= 2013) return 'Peugeot 308 G1';
             return 'Peugeot 308 G2';
          }
          if (nm.includes('3008')) {
             if (y <= 2016) return 'Peugeot 3008 G1';
             return 'Peugeot 3008 G2';
          }
          if (nm.includes('208')) {
             if (y <= 2019) return 'Peugeot 208 G1';
             return 'Peugeot 208 G2';
          }

          // ── Seat / Skoda ──
          if (nm.includes('ibiza')) {
             if (y <= 2008) return 'Seat Ibiza 3';
             if (y <= 2017) return 'Seat Ibiza 4';
             return 'Seat Ibiza 5';
          }
          if (nm.includes('leon')) {
             if (y <= 2012) return 'Seat Leon 2';
             if (y <= 2020) return 'Seat Leon 3';
             return 'Seat Leon 4';
          }
          if (nm.includes('octavia')) {
             if (y <= 2013) return 'Skoda Octavia 2';
             if (y <= 2020) return 'Skoda Octavia 3';
             return 'Skoda Octavia 4';
          }
          if (nm.includes('fabia')) {
             if (y <= 2014) return 'Skoda Fabia 2';
             return 'Skoda Fabia 3';
          }

          // ── Hyundai ──
          if (nm.includes('accent')) {
             if (y <= 2011) return 'Hyundai Accent Era';
             return 'Hyundai Accent RB';
          }
          if (nm.includes('tucson')) {
             if (y <= 2015) return 'Hyundai Tucson G2';
             if (y <= 2020) return 'Hyundai Tucson G3';
             return 'Hyundai Tucson G4';
          }
          if (nm.includes('i10') || nm.includes('grand i10')) {
             if (y <= 2013) return 'Hyundai i10 G1';
             return 'Hyundai Grand i10';
          }
          if (nm.includes('creta')) {
             return 'Hyundai Creta G1';
          }

          // ── Kia ──
          if (nm.includes('picanto')) {
             if (y <= 2011) return 'Kia Picanto G1';
             if (y <= 2017) return 'Kia Picanto G2';
             return 'Kia Picanto G3';
          }
          if (nm.includes('sportage')) {
             if (y <= 2015) return 'Kia Sportage G3';
             if (y <= 2021) return 'Kia Sportage G4';
             return 'Kia Sportage G5';
          }
          if (nm.includes('rio')) {
             if (y <= 2017) return 'Kia Rio G3';
             return 'Kia Rio G4';
          }

          // ── Mercedes SUV ──
          if (nm.includes('glc') && !nm.includes('coupe')) {
             if (y <= 2022) return 'Mercedes GLC G1';
             return 'Mercedes GLC G2';
          }
          if (nm.includes('glc') && nm.includes('coupe')) return 'Mercedes GLC Coupe G1';
          if (nm.includes('glb')) return 'Mercedes GLB';
          if (nm.includes('gla')) {
             if (y <= 2019) return 'Mercedes GLA G1';
             return 'Mercedes GLA G1'; // G2 = 2020+ (même clé pour simplifier)
          }
          if (nm.includes('gle')) return 'Mercedes GLE G2';

          // ── BMW SUV ──
          if (nm.includes('x3')) {
             if (y <= 2017) return 'BMW X3 G2';
             return 'BMW X3 G3';
          }
          if (nm.includes('x5')) {
             if (y <= 2018) return 'BMW X5 G3';
             return 'BMW X5 G4';
          }
          if (nm.includes('x1')) {
             if (y <= 2021) return 'BMW X1 G2';
             return 'BMW X1 G3';
          }

          // ── Audi SUV ──
          if (nm.includes('q5')) {
             if (y <= 2016) return 'Audi Q5 G1';
             return 'Audi Q5 G2';
          }
          if (nm.includes('q3')) {
             if (y <= 2018) return 'Audi Q3 G1';
             return 'Audi Q3 G2';
          }
          if (nm.includes('q7')) return 'Audi Q7 G2';

          return null;
        };

        const genKey = getGenerationKey(brand, model, year);
        let baseMedian = categoryBase;

        // FIX 3 & 4 : Priorité 1 = DB, Priorité 2 = Fallback_Medians, Priorité 3 = Brand_Segment_Medians, Priorité 4 = Segment_Bases
        if (marketBaselineRes?.data?.baseline_price > 0) {
          baseMedian = marketBaselineRes.data.baseline_price;
        } else if (genKey && FALLBACK_MEDIANS[genKey]) {
          baseMedian = FALLBACK_MEDIANS[genKey];
        } else if (FALLBACK_MEDIANS[key]) {
          baseMedian = FALLBACK_MEDIANS[key];
        } else {
          const segment = classifyVehicleSegment(brand, model, bodyType);
          vehicleSegment = segment; // Exposé au scope principal
          
          // Recherche dans BRAND_SEGMENT_MEDIANS (insensible à la casse)
          const brandKey = Object.keys(BRAND_SEGMENT_MEDIANS).find(b => brand.toLowerCase().includes(b.toLowerCase()));
          if (brandKey && BRAND_SEGMENT_MEDIANS[brandKey][segment]) {
            baseMedian = BRAND_SEGMENT_MEDIANS[brandKey][segment]!;
            console.log(`[FIX 3] Modèle inconnu: Interpolation via BRAND_SEGMENT_MEDIANS -> ${brandKey} | ${segment} = ${baseMedian}`);
          } else {
            baseMedian = SEGMENT_BASES[segment] || 2_400_000;
            console.log(`[FIX 3] Modèle inconnu: Fallback générique -> ${segment} = ${baseMedian}`);
          }
        }
        
        // --- NOUVEAU FIX : La Matrice Chinoise ---
        const originalBase = baseMedian;
        baseMedian = applyChineseMarketCorrection(baseMedian, brand, model);
        if (baseMedian !== originalBase) {
           console.log(`[MATRICE CHINOISE] Base segment redéfinie pour ${brand} : ${originalBase} → ${baseMedian}`);
        }

        // Fallback : si la génération ou les baselines ont été utilisées, classifier quand même
        if (!vehicleSegment || vehicleSegment === 'berline_standard') {
          vehicleSegment = classifyVehicleSegment(brand, model, bodyType);
        }
        
        // FIX FINAL : Dictionnaire explicite — chaque génération a son propre refYear au MILIEU de sa vie
        // Fin des collisions de patterns G1/G2/G3 qui causaient les faux résultats
        const REF_YEAR_MAP: Record<string, number> = {
          // Volkswagen
          'Volkswagen Golf 5':     2006, 'Volkswagen Golf 6':     2010, 'Volkswagen Golf 7':     2016, 'Volkswagen Golf 8':     2021,
          'Volkswagen Polo 5':     2013, 'Volkswagen Polo 6':     2020,
          'Volkswagen Tiguan G1':  2011, 'Volkswagen Tiguan G2':  2019,
          'Volkswagen Caddy G3':   2009, 'Volkswagen Caddy G4':   2017, 'Volkswagen Caddy G5':   2022,
          // Renault
          'Renault Clio 2':        2003, 'Renault Clio 3':        2009, 'Renault Clio 4':        2015, 'Renault Clio 5':        2021,
          'Renault Symbol G1':     2010, 'Renault Symbol G2':     2015, 'Renault Symbol G3':     2020,
          'Renault Megane 3':      2012, 'Renault Megane 4':      2018,
          // Dacia
          'Dacia Logan G1':        2009, 'Dacia Logan G2':        2016, 'Dacia Logan G3':        2022,
          'Dacia Sandero G2':      2015, 'Dacia Sandero Stepway G2': 2015, 'Dacia Sandero Stepway G3': 2022,
          'Dacia Duster G1':       2013, 'Dacia Duster G2':       2019,
          // Toyota
          'Toyota Yaris G2':       2009, 'Toyota Yaris G3':       2015, 'Toyota Yaris G4':       2022,
          'Toyota Corolla G10':    2010, 'Toyota Corolla G11':    2016, 'Toyota Corolla G12':    2021,
          'Toyota Hilux G7':       2010, 'Toyota Hilux G8':       2019,
          'Toyota Land Cruiser J200': 2015, 'Toyota Land Cruiser J300': 2023,
          // Peugeot
          'Peugeot 208 G1':        2015, 'Peugeot 208 G2':        2022,
          'Peugeot 308 G1':        2010, 'Peugeot 308 G2':        2017,
          'Peugeot 3008 G1':       2012, 'Peugeot 3008 G2':       2019,
          // Seat / Skoda
          'Seat Ibiza 3':          2005, 'Seat Ibiza 4':          2012, 'Seat Ibiza 5':          2019,
          'Seat Leon 2':           2009, 'Seat Leon 3':           2016, 'Seat Leon 4':           2022,
          'Skoda Octavia 2':       2008, 'Skoda Octavia 3':       2016, 'Skoda Octavia 4':       2022,
          'Skoda Fabia 2':         2010, 'Skoda Fabia 3':         2018,
          // Hyundai
          'Hyundai Accent Era':    2008, 'Hyundai Accent RB':     2014,
          'Hyundai Tucson G2':     2012, 'Hyundai Tucson G3':     2017, 'Hyundai Tucson G4':     2022,
          'Hyundai i10 G1':        2010, 'Hyundai Grand i10':     2016, 'Hyundai Creta G1':      2017,
          // Kia
          'Kia Picanto G1':        2007, 'Kia Picanto G2':        2014, 'Kia Picanto G3':        2019,
          'Kia Sportage G3':       2012, 'Kia Sportage G4':       2018, 'Kia Sportage G5':       2023,
          'Kia Rio G3':            2014, 'Kia Rio G4':            2019,
          // Mercedes SUV
          'Mercedes GLC G1':       2018, 'Mercedes GLC G2':       2024,
          'Mercedes GLC Coupe G1': 2019,
          'Mercedes GLA G1':       2017, 'Mercedes GLB':          2021, 'Mercedes GLE G2':       2021,
          // BMW SUV
          'BMW X3 G2':             2014, 'BMW X3 G3':             2021,
          'BMW X5 G3':             2016, 'BMW X5 G4':             2022,
          'BMW X1 G2':             2018, 'BMW X1 G3':             2024,
          // Audi SUV
          'Audi Q5 G1':            2012, 'Audi Q5 G2':            2020,
          'Audi Q3 G1':            2014, 'Audi Q3 G2':            2022, 'Audi Q7 G2': 2019,
        };
        const refYear: number = (genKey && REF_YEAR_MAP[genKey]) ? REF_YEAR_MAP[genKey] : 2018;

        const deltaYear = year - refYear;
        let adjusted = baseMedian;
        if (deltaYear > 0) {
           // Voiture plus récente que le milieu de génération → léger bonus (+4%/an, plafonné à +20%)
           adjusted = baseMedian * (1 + Math.min(0.20, deltaYear * 0.04));
        } else {
           // 3. Courbe de décote par paliers pour l'Algérie (Chemin 3)
           const absDelta = Math.abs(deltaYear);
           let decayPercent = 0;
           
           if (absDelta <= 3) {
             decayPercent = absDelta * 0.10; // -10% pour ans 1 à 3
           } else if (absDelta <= 8) {
             decayPercent = (3 * 0.10) + ((absDelta - 3) * 0.05); // -5% pour ans 4 à 8
           } else {
             decayPercent = (3 * 0.10) + (5 * 0.05) + ((absDelta - 8) * 0.02); // -2% pour ans 9+
           }
           
           // Les valeurs refuge (Hilux, Dacia, Land Cruiser) déprecient moins fort (on divise la décote par 1.5)
           if (model.toLowerCase().includes('hilux') || model.toLowerCase().includes('land cruiser') || brand.toLowerCase().includes('dacia')) {
             decayPercent = decayPercent / 1.5;
           }
           
           adjusted = baseMedian * (1 - Math.min(0.55, decayPercent)); // Toujours plafonné à -55%
        }
        
        const trimToUse = request.trim_details || request.trim;
        if (trimToUse) {
          const trimKey = Object.keys(TRIM_MULTIPLIERS).find(k => trimToUse.toLowerCase().includes(k.toLowerCase()));
          if (trimKey) adjusted *= TRIM_MULTIPLIERS[trimKey];
        }
        priceMedian = Math.round(adjusted);
      }

      const priceMedianOriginal = priceMedian;
      const carAge = 2026 - year;
      
      // FIX #1 : Suppression du faux bonus kilométrique
      // Règle : Au-delà de 100 000 km, il n'y a JAMAIS de bonus pour "moins de km que la moyenne"
      // (Sur le marché algérien, une voiture de 14 ans avec 250k km est normale, pas un bonus)
      if (mileage > 100_000) {
        // Seul le malus est possible
        const expectedMileage = (2026 - year) * 20_000;
        let mileageDiff = mileage - expectedMileage;
        // Bouclier kilométrique : vieille voiture = malus réduit
        if (carAge > 10 && mileageDiff > 0) mileageDiff *= 0.2;
        else if (carAge > 6 && mileageDiff > 0) mileageDiff *= 0.5;
        if (mileageDiff > 0) priceMedian *= Math.pow(0.97, mileageDiff / 15000);
        // Si mileageDiff <= 0 ici (moins km que prévu malgré > 100k), on ignore — pas de bonus
      } else if (mileage < 100_000) {
        // Petits kilométrages : bonus possible mais limité à +12%
        const expectedMileage = (2026 - year) * 20_000;
        const mileageDiff = mileage - expectedMileage;
        if (mileageDiff > 0) priceMedian *= Math.pow(0.97, mileageDiff / 15000);
        else if (mileageDiff < 0) priceMedian *= Math.min(1.12, Math.pow(1.02, Math.abs(mileageDiff) / 15000));
      }

      if (request.wilaya) {
        const normWilaya = request.wilaya.toLowerCase();
        if (['alger', 'oran', 'constantine', 'blida', 'setif'].includes(normWilaya)) priceMedian *= 1.03;
        else if (['adrar', 'tamanrasset', 'illizi'].includes(normWilaya)) priceMedian *= 1.05;
      }

      // 2. Modificateurs Additifs pour éviter "l'effondrement"
      let totalModifierPercentage = 0;

      // Condition générale
      if (condition === 'excellent') totalModifierPercentage += 0.05;
      else if (condition === 'moyen') totalModifierPercentage -= 0.05;
      else if (condition === 'mauvais') totalModifierPercentage -= 0.15;

      // Moteur
      if (engine === 'neuf') totalModifierPercentage += 0.05;
      else if (engine === 'fatigue' || engine === 'swappe') totalModifierPercentage -= 0.15;

      // FIX #3 — Peinture (Sbigha) avec malus dynamique selon l'âge exact du véhicule
      // Logique : plus la voiture est récente, plus un voile ou un choc détruit sa valeur
      // face à une concurrente 00 Sbigha. L'effet s'inverse progressivement avec l'âge.
      if (paint) {
        let paintMalus = 0;
        if (paint === 'origine') totalModifierPercentage += 0.05; // Bonus Zéro Sbigha
        else if (paint === 'raccord') paintMalus = -0.05;
        else if (paint === 'repeinte') paintMalus = -0.10;
        else if (paint === 'choc') paintMalus = -0.15;

        // Amplificateur jeune voiture (3-7 ans) : la Sbigha détruit encore plus la valeur
        // Bouclier ancien véhicule (>10 ans) : l'âge réduit l'impact
        if (paintMalus < 0) {
          if (carAge <= 3) {
            paintMalus *= 1.30;  // Voiture quasi-neuve : malus +30% plus sévère
          } else if (carAge <= 7) {
            paintMalus *= 1.15;  // Zone critique 3-7 ans : malus +15% plus sévère
          } else if (carAge > 10) {
            paintMalus *= 0.50;  // Vieille voiture : bouclier âge, malus divisé par 2
          } else if (carAge > 5) {
            paintMalus *= 0.75;  // 5-10 ans : impact modéré
          }
          // Entre 7 et 10 ans : aucun ajustement (malus de référence appliqué tel quel)
        }
        totalModifierPercentage += paintMalus;
      }

      // VTC penalty logic
      const localNormModel = model.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isVtcModel = ['symbol', 'logan', 'stepway', '301', 'celysee', 'ibiza', 'rapid'].some(m => localNormModel.includes(m));
      const annualAvgForVtc = mileage / Math.max(1, 2026 - year);
      let isExTaxi = false;

      if (isVtcModel && annualAvgForVtc > 40000) {
         isExTaxi = true;
         totalModifierPercentage -= 0.15; // -15% severe direct penalty for Ex-Taxi/VTC
      }

      // Application des modificateurs additifs
      priceMedian = priceMedian * (1 + totalModifierPercentage);

      // Plancher de Sécurité Absolu (Safety Floor)
      // Une voiture roulante ne peut pas s'effondrer sous 70% de son estimation initiale
      const absoluteFloor = priceMedianOriginal * 0.70;
      if (priceMedian < absoluteFloor) {
        priceMedian = absoluteFloor;
      }

      // FIX #2 — Anti Double Peine : Plafonnement du multiplicateur global
      // Tous les coefficients multiplicatifs sont calculés mais leur produit total est
      // capé à ×1.18 maximum pour éviter les dérives cumulées (+41% sur Tucson Diesel BVA Alger Gulf Asiatique).
      const multFuel = request.fuel ? (FUEL_MULTIPLIERS[request.fuel] || 1.0) : 1.0;
      const multTransmission = request.transmission ? (TRANSMISSION_MULTIPLIERS[request.transmission] || 1.0) : 1.0;
      const multGulf = request.is_gulf_spec ? 1.05 : 1.0;
      const multAftermarket = request.has_aftermarket ? 1.02 : 1.0;

      // Calcul du multiplicateur combiné brut
      let combinedMultiplier = multFuel * multTransmission * multGulf * multAftermarket;

      // Plafond anti-emballement : le cumul de toutes les options ne peut pas dépasser +18%
      const MAX_OPTIONS_MULTIPLIER = 1.18;
      if (combinedMultiplier > MAX_OPTIONS_MULTIPLIER) {
        console.log(`[FIX #2] Multiplicateur combiné (×${combinedMultiplier.toFixed(3)}) plafonné à ×${MAX_OPTIONS_MULTIPLIER}`);
        combinedMultiplier = MAX_OPTIONS_MULTIPLIER;
      }
      priceMedian *= combinedMultiplier;

      // Documents : décote licence Moudjahidine (traité séparément car c'est un malus, pas un bonus)
      if (request.document_status === 'licence_delai') {
        if (carAge <= 1) priceMedian *= 0.80;
        else if (carAge === 2) priceMedian *= 0.90;
        else priceMedian *= 0.95;
      }

      // [Défi 4] Apply dynamic trend markups — utilise les données déjà fetchées (macroRes)
      try {
        const macroData = (macroRes?.data || []) as any[];
        
        // [Défi 4] Vérifier la fraîcheur du taux EUR (avertir si > 48h)
        const euroRateItem = macroData.find((m: any) => m.key === 'euro_square_rate');
        if (euroRateItem?.updated_at) {
          const rateAge = (Date.now() - new Date(euroRateItem.updated_at).getTime()) / (1000 * 3600);
          if (rateAge > 48) {
            console.warn(`[Rate Warning] Le taux EUR/DZD a ${rateAge.toFixed(0)}h — peut être périmé !`);
          }
        }
        
        if (macroData.length > 0) {
          const asianBrandMarkupItem = macroData.find((m: any) => m.key === 'asian_brand_markup');
          const under3yMarkupItem = macroData.find((m: any) => m.key === 'under_3y_markup');
          
          const asianBrandMarkup = asianBrandMarkupItem ? parseFloat(asianBrandMarkupItem.value) : 1.05;
          const under3yMarkup = under3yMarkupItem ? parseFloat(under3yMarkupItem.value) : 1.03;
          
          // Apply asian brand and age markups ONLY in fallback mode (when no exact medians exist)
          if (isFallback) {
            const asianBrands = ['toyota', 'hyundai', 'kia', 'suzuki', 'geely', 'chery', 'jetour', 'changan', 'byd', 'mg', 'gac'];
            if (asianBrands.includes(brand.toLowerCase())) {
              priceMedian *= asianBrandMarkup;
            }

            // under_3y_markup only for 2-5 year old cars, NOT brand-new
            const carAge = new Date().getFullYear() - year;
            if (carAge >= 2 && carAge <= 5) {
              priceMedian *= under3yMarkup;
            }
          }
        }
      } catch (e) {
        console.warn('Could not apply database trend multipliers:', e);
      }

      const currentYear = new Date().getFullYear();
      if (mileage <= 100 && year >= currentYear - 2 && year < currentYear && isFallback) {
        // FIX: 00 Compteur premium ONLY applies in fallback mode (no DB median).
        // When we have a real DB median, it already reflects brand-new price — do NOT double-count.
        // Also only for recent cars 1-2 years old that are NOT the current year.
        priceMedian = priceMedianOriginal * 1.25 * (1 + totalModifierPercentage);
      } else if (mileage <= 5000 && year >= currentYear - 5 && year < currentYear && isFallback) {
        // Zone Quasi-Neuf: Transition douce — fallback only
        const quasiNewFactor = 1.25 * Math.pow(0.992, mileage / 1000);
        priceMedian = priceMedianOriginal * quasiNewFactor * (1 + totalModifierPercentage);
      } else if (!isFallback) {
        // DB median mode: just enforce the cap — price cannot exceed what the DB median implies for a brand-new example
        const baseMedianForCap = matchedMedians?.prix_median ? (matchedMedians.prix_median * 0.91) : priceMedianOriginal;
        const zeroKmPrice = baseMedianForCap * 1.15;
        if (priceMedian > zeroKmPrice) {
          priceMedian = zeroKmPrice * 0.95;
        }
      } else {
        // Fallback + older/normal car: cap at inferred new price
        const zeroKmPrice = priceMedianOriginal * 1.15;
        if (priceMedian >= zeroKmPrice) {
          priceMedian = zeroKmPrice * 0.95;
        }
      }

      priceMedian = Math.round(priceMedian / 1000) * 1000;

      // ═══════════════════════════════════════════════════════════════════
      // FIX 4 — CAPS ASYMÉTRIQUES PAR SEGMENT (remplace les plats ×1.20 / ×0.65)
      // Calibrés selon la liquidité et la rareté réelle de chaque segment DZ.
      // Un Hilux 00 peut valoir +25% de la médiane. Une Dacia Logan +12% max.
      // ═══════════════════════════════════════════════════════════════════
      const maxBoost        = SEGMENT_BOOST_CAPS[vehicleSegment]        ?? 1.20;
      const maxDepreciation = SEGMENT_DEPRECIATION_CAPS[vehicleSegment] ?? 0.65;

      if (priceMedianOriginal > 0) {
        if (priceMedian > priceMedianOriginal * maxBoost) {
          console.log(`[CAP BOOST ${vehicleSegment}] ${priceMedian.toLocaleString()} → ${Math.round(priceMedianOriginal * maxBoost).toLocaleString()} DZD (×${maxBoost})`);
          priceMedian = Math.round(priceMedianOriginal * maxBoost);
        }
        if (priceMedian < priceMedianOriginal * maxDepreciation) {
          console.log(`[CAP DEPRECIATION ${vehicleSegment}] ${priceMedian.toLocaleString()} → ${Math.round(priceMedianOriginal * maxDepreciation).toLocaleString()} DZD (×${maxDepreciation})`);
          priceMedian = Math.round(priceMedianOriginal * maxDepreciation);
        }
      }

      priceMedian = Math.round(priceMedian / 1000) * 1000;

      // Planchers de segment
      const bodyTypeFull = (matchedCatalog?.body_type || 'berline').toLowerCase();
      const segmentFloor = getSegmentFloor(bodyTypeFull, year);
      priceMedian = Math.max(priceMedian, segmentFloor);
      priceMedian = Math.max(priceMedian, 200000); // Plancher absolu universel

      // ═══════════════════════════════════════════════════════════════════════
      // BOUCLIER GLOBAL ANTI-EFFONDREMENT — Protection universelle de tout le catalogue
      // Appel de applyGlobalSafetyShield() : combine le plancher par segment
      // (ex: Hilux ≥ 50% de 8.5M, GLC ≥ 38% de 6M) + le bouclier absolu premium.
      // Remplace et consolide le PLANCHER PREMIUM précédent.
      // ═══════════════════════════════════════════════════════════════════════
      priceMedian = applyGlobalSafetyShield(priceMedian, vehicleSegment, brand, year);

      // ═══════════════════════════════════════════════════════════════════════
      // FIX 6 — PSYCHOLOGIE DU MARCHÉ PREMIUM (Le "Reality Check")
      // ═══════════════════════════════════════════════════════════════════════
      const premiumCorrection = applyPremiumPsychologyCorrection(priceMedian, brand, mileage);
      priceMedian = premiumCorrection.correctedPrice;
      const appliedPremiumMalus = premiumCorrection.appliedMalus;

      // FIX 1 — Fourchette ADAPTATIVE selon le niveau de confiance
      // Haute confiance (≥10 annonces DB) → fourchette serrée ±5%/+7%
      // Confiance moyenne (3-9 annonces)  → fourchette élargie -8%/+10%
      // Faible confiance (fallback)        → fourchette large -12%/+15%
      //   (signal visuel que l'estimation est algorithmique, pas statistique)
      const dataQuality: 'haute' | 'moyenne' | 'faible' =
        (!isFallback && totalDataPoints >= 20) ? 'haute' :
        (!isFallback && totalDataPoints >= 8)  ? 'moyenne' : 'faible';

      if (dataQuality === 'haute') {
        if (!isFallback && priceMin !== undefined && priceMax !== undefined) {
          const ratio = priceMedianOriginal > 0 ? priceMedian / priceMedianOriginal : 1;
          priceMin = Math.round((priceMin * 0.95 * ratio) / 1000) * 1000;
          priceMax = Math.round((priceMax * 1.05 * ratio) / 1000) * 1000;
        } else {
          priceMin = Math.round((priceMedian * 0.95) / 1000) * 1000;
          priceMax = Math.round((priceMedian * 1.07) / 1000) * 1000;
        }
      } else if (dataQuality === 'moyenne') {
        // Données limitées : fourchette légèrement élargie
        priceMin = Math.round((priceMedian * 0.92) / 1000) * 1000; // -8%
        priceMax = Math.round((priceMedian * 1.10) / 1000) * 1000; // +10%
      } else {
        // Estimation algorithmique pure : fourchette large pour honnêteté
        priceMin = Math.round((priceMedian * 0.88) / 1000) * 1000; // -12%
        priceMax = Math.round((priceMedian * 1.15) / 1000) * 1000; // +15%
      }

      // Plafond de la fourchette haute (cohérence avec les caps segment)
      const maxPlafondCoeff = dataQuality === 'faible' ? 1.18 : dataQuality === 'moyenne' ? 1.13 : 1.10;
      if (priceMax > (priceMedian * maxPlafondCoeff)) {
        priceMax = Math.round((priceMedian * maxPlafondCoeff) / 1000) * 1000;
      }

      // Sécurité basse
      if (priceMin < segmentFloor) {
        priceMin = segmentFloor;
      }

      // [FAILLE CONJONCTURELLE] Application finale du modificateur global d'état (ex: 0.85 si ouverture importation)
      if (modifierValue !== 1.0) {
        priceMedian = Math.round(priceMedian * modifierValue);
        priceMin = Math.round(priceMin * modifierValue);
        priceMax = Math.round(priceMax * modifierValue);
        console.log(`[GLOBAL MODIFIER] Appliqué: ${modifierValue}x. Nouveau Median: ${priceMedian} DZD`);
      }

      const dynamicFacteurs: {
        nom: string;
        impact: 'positif' | 'negatif' | 'neutre';
        poids: 'moyen' | 'faible' | 'fort';
        explication: string;
      }[] = [];

      // 1. Kilométrage factor
      if (mileage <= 100) {
        dynamicFacteurs.push({
          nom: 'Kilométrage',
          impact: 'positif',
          poids: 'fort',
          explication: 'Véhicule 00 Compteur (Neuf). Valorisation maximale appliquée.'
        });
      } else if (mileage <= 5000) {
        dynamicFacteurs.push({
          nom: 'Kilométrage',
          impact: 'positif',
          poids: 'moyen',
          explication: `Véhicule quasi-neuf (${mileage.toLocaleString()} km). Dépréciation minimale.`
        });
      } else {
        const now = new Date();
        const currentYearDecimal = now.getFullYear() + (now.getMonth() / 12);
        const yearsOld = Math.max(1, currentYearDecimal - year);
        const annualAvg = mileage / yearsOld;
        if (annualAvg < 12000) {
          dynamicFacteurs.push({
            nom: 'Kilométrage',
            impact: 'positif',
            poids: 'moyen',
            explication: `Kilométrage très faible (${mileage.toLocaleString()} km). Préservation optimale.`
          });
        } else if (annualAvg > 25000) {
          dynamicFacteurs.push({
            nom: 'Kilométrage',
            impact: 'negatif',
            poids: 'moyen',
            explication: `Kilométrage élevé (${mileage.toLocaleString()} km). Impact d'usure calculé.`
          });
        } else {
          dynamicFacteurs.push({
            nom: 'Kilométrage',
            impact: 'neutre',
            poids: 'faible',
            explication: `Kilométrage dans la moyenne (${mileage.toLocaleString()} km).`
          });
        }
      }

      // Facteurs Psychologie Premium
      if (appliedPremiumMalus.includes('km_premium')) {
        dynamicFacteurs.push({
          nom: 'Entretien Premium',
          impact: 'negatif',
          poids: 'fort',
          explication: `Kilométrage critique (>120k km) sur marque Premium. Forte décote appliquée due aux coûts d'entretien élevés.`
        });
      }
      if (appliedPremiumMalus.includes('liquidity_luxe')) {
        dynamicFacteurs.push({
          nom: 'Liquidité Luxe (Souk)',
          impact: 'negatif',
          poids: 'fort',
          explication: `Véhicule de prestige (>5M DZD). Le marché dicte une décote de négociation Cash agressive.`
        });
      }

      // 2. Peinture / Sbigha factor
      if (paint === 'origine') {
        dynamicFacteurs.push({
          nom: 'Carrosserie',
          impact: 'positif',
          poids: 'fort',
          explication: "Peinture d'origine (Sans Sbigha). Bonus maximum appliqué."
        });
      } else if (paint === 'raccord') {
        dynamicFacteurs.push({
          nom: 'Carrosserie',
          impact: 'neutre',
          poids: 'moyen',
          explication: 'Présence de retouches mineures / raccords à froid.'
        });
      } else if (paint === 'repeinte') {
        dynamicFacteurs.push({
          nom: 'Carrosserie',
          impact: 'negatif',
          poids: 'moyen',
          explication: 'Voile de peinture appliqué. Impact sur la cote pris en compte.'
        });
      } else if (paint === 'choc') {
        dynamicFacteurs.push({
          nom: 'Carrosserie',
          impact: 'negatif',
          poids: 'fort',
          explication: 'Choc réparé. Décote de sécurité carrosserie appliquée.'
        });
      }

      // 2.5 Papiers / Document factor
      if (request.document_status === 'licence_delai') {
        dynamicFacteurs.push({
          nom: 'Papiers / Licence',
          impact: 'negatif',
          poids: 'fort',
          explication: "Sous Licence Moudjahidine avec délai d'incessibilité. Décote de 15% appliquée."
        });
      } else {
        dynamicFacteurs.push({
          nom: 'Papiers / Carte Grise',
          impact: 'positif',
          poids: 'faible',
          explication: "Carte Grise Safia (propre et transférable immédiatement)."
        });
      }

      // 2.7 Transmission factor
      if (request.transmission === 'automatique') {
        dynamicFacteurs.push({
          nom: 'Transmission',
          impact: 'positif',
          poids: 'moyen',
          explication: 'Boîte Automatique (BVA) : Plus confortable et recherchée en ville (+8% de valorisation).'
        });
      } else {
        dynamicFacteurs.push({
          nom: 'Transmission',
          impact: 'neutre',
          poids: 'faible',
          explication: 'Boîte Manuelle (BVM) : Transmission mécanique standard.'
        });
      }

      // 3. État du moteur factor
      if (engine === 'neuf') {
        dynamicFacteurs.push({
          nom: 'Mécanique',
          impact: 'positif',
          poids: 'fort',
          explication: 'Moteur comme neuf. Compression et couple optimaux.'
        });
      } else if (engine === 'bon') {
        dynamicFacteurs.push({
          nom: 'Mécanique',
          impact: 'positif',
          poids: 'moyen',
          explication: 'Moteur en bon état. Entretien régulier validé.'
        });
      } else if (engine === 'fatigue') {
        dynamicFacteurs.push({
          nom: 'Mécanique',
          impact: 'negatif',
          poids: 'fort',
          explication: 'Moteur fatigué / À réviser. Décote de remise en état.'
        });
      }

      // 4. Carburant (GPL bonus!)
      if (request.fuel === 'gpl') {
        dynamicFacteurs.push({
          nom: 'Équipement',
          impact: 'positif',
          poids: 'moyen',
          explication: 'Motorisation GPL : Bonus économique et autonomie (+4%).'
        });
      }

      if (request.is_gulf_spec) {
        dynamicFacteurs.push({
          nom: 'Origine',
          impact: 'positif',
          poids: 'moyen',
          explication: 'Spécifications Gulf/Import (+5% pour options exclusives).'
        });
      }
      if (request.has_aftermarket) {
        dynamicFacteurs.push({
          nom: 'Équipement',
          impact: 'positif',
          poids: 'faible',
          explication: 'Accessoires ajoutés (Jantes, Sono, Écran) (+2%).'
        });
      }

      // [Défi 2] Construire les alertes choc de marché pour l'utilisateur
      const marketShockAlertes: string[] = [];
      const recentAlerts = (marketAlertsRes?.data || []) as any[];
      const cutoff14d = Date.now() - 14 * 24 * 3600 * 1000;
      for (const alert of recentAlerts) {
        if (new Date(alert.created_at).getTime() < cutoff14d) continue;
        const dirEmoji = alert.direction === 'hausse' ? '📈' : '📉';
        const absDelta = Math.abs(alert.delta_pct).toFixed(1);
        marketShockAlertes.push(
          `${dirEmoji} Choc de marché détecté : ${alert.direction} de ${absDelta}% sur ce modèle (${year}) dans les 14 derniers jours.`
        );
      }

      // 5. Marché / Données factor
      if (totalDataPoints > 0) {
        dynamicFacteurs.push({
          nom: 'Marché',
          impact: 'positif',
          poids: 'fort',
          explication: `Analyse basée sur ${totalDataPoints} transactions réelles et annonces du marché.`
        });
      } else {
        dynamicFacteurs.push({
          nom: 'Marché',
          impact: 'neutre',
          poids: 'fort',
          explication: "Cote de référence validée par l'expertise QimatnaDz."
        });
      }

      let scoreJustif = calculateVehicleConditionScore(mileage, condition, paint, engine);

      // Assembler toutes les alertes : chocs marché + alertes physiques
      const allAlertes: string[] = [];
      const yearsOld = Math.max(1, 2026 - year);
      const annualAvg = mileage / yearsOld;

      if (mileage < 5000 && year < 2024) {
         allAlertes.push("⚠️ Kilométrage extrêmement faible pour l'âge. Exigez un scanner OBD pour vérifier le compteur réel.");
      } else if (annualAvg < 8000 && yearsOld >= 4) {
         allAlertes.push("🚨 Attention : Kilométrage anormalement bas (Risque de compteur trafiqué). Faites vérifier par un professionnel.");
      }

      if (isExTaxi) {
         allAlertes.push("⚠️ Risque Ex-Taxi/VTC : Kilométrage annuel extrême pour ce modèle. Une décote de 15% a été appliquée sur l'usure prématurée.");
      }

      allAlertes.push(...marketShockAlertes); // [Défi 2] Alertes choc de marché

      // FIX 1 — Score de confiance final : combine weightedPoints + dataQuality + isFallback
      const finalConfiance: 'haute' | 'moyenne' | 'faible' =
        (dataQuality === 'haute' && weightedPoints >= 30) ? 'haute' :
        (dataQuality === 'moyenne' || weightedPoints >= 12) ? 'moyenne' : 'faible';

      // Conseil de négociation adapté au niveau de confiance et au segment
      const conseilNegociation = (() => {
        if (finalConfiance === 'haute') {
          return `Prix solidement ancré sur ${totalDataPoints} annonces marché. Marge de négociation : 5-8%.`;
        } else if (finalConfiance === 'moyenne') {
          return `Données de marché limitées (${totalDataPoints} annonces). Vérifiez sur Ouedkniss avant de conclure. Marge estimée : 8-12%.`;
        } else if (isFallback) {
          return `Modèle rare ou peu annoncé sur le marché algérien. Estimation algorithmique — restez ferme sur votre prix si le véhicule est propre. Fourchette large reflète l'incertitude.`;
        }
        return `Estimation basée sur le marché local. Marge de négociation standard : 7-10%.`;
      })();

      output = {
        prix_estime: priceMedian,
        price_median: priceMedian,
        fourchette_min: priceMin,
        fourchette_max: priceMax,
        devise: "DZD",
        verdict: getVerdict(priceMedian, priceMin, priceMax),
        score_justification: scoreJustif,
        confiance: finalConfiance,
        facteurs: dynamicFacteurs,
        conseil_negociation: conseilNegociation,
        alertes: allAlertes,
        donnees_marche: {
          prix_median: priceMedian,
          nb_annonces: totalDataPoints,
          variation_semaine: 0,
          derniere_maj: new Date().toISOString()
        },
        // Compatibility
        price_min: priceMin,
        price_max: priceMax,
        data_points: totalDataPoints,
        source_breakdown: breakdown as any
      };

      if (finalConfiance === 'faible' || isFallback) {
        // Log "failed" query in background
        const b = request.brand.toLowerCase().trim();
        const m = request.model.toLowerCase().trim();
        const y = request.year;
        supabase.from('failed_queries').insert({ brand: b, model: m, year: y })
          .then(({ error: insErr }) => {
            if (insErr && insErr.code === '23505') { // Unique constraint violation
              supabase.from('failed_queries').select('query_count').eq('brand', b).eq('model', m).eq('year', y).single()
                .then(({ data }) => {
                  if (data) {
                    supabase.from('failed_queries')
                      .update({ query_count: data.query_count + 1, last_requested_at: new Date().toISOString() })
                      .eq('brand', b).eq('model', m).eq('year', y).then();
                  }
                });
            }
          });
      }
    } catch (err: any) {
      console.error('Valuation Engine Fallback Error:', err);
      return { error: `Erreur: ${err.message}` } as any;
    }
  }

  // --- AUTO-SAVE HISTORY (Always runs & uses clean columns only) ---
  if (output) {
    // 1. Local Cache Save (Perfect for anonymous users, private, fast & robust)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const localItem = {
          id: 'local_' + Math.random().toString(36).substring(2, 11),
          brand: request.brand,
          model: request.model,
          year: request.year,
          mileage: request.mileage,
          condition: request.condition,
          paint: request.paint || null,
          engine: request.engine || null,
          engine_details: request.engine_details || null,
          trim_details: `${request.trim_details || ''} [${request.transmission === 'automatique' ? 'BVA' : 'BVM'}] [${request.document_status === 'licence_delai' ? 'Sous Licence' : 'Safia'}]`.trim(),
          wilaya: request.wilaya || null,
          trim: request.trim || null,
          price_min: output.fourchette_min,
          price_median: output.prix_estime,
          price_max: output.fourchette_max,
          data_points: totalDataPoints,
          confidence: output.confiance,
          created_at: new Date().toISOString(),
        };

        const existingRaw = window.localStorage.getItem('qimatnadz_history');
        let existingList = [];
        if (existingRaw) {
          try {
            existingList = JSON.parse(existingRaw);
            if (!Array.isArray(existingList)) existingList = [];
          } catch {
            existingList = [];
          }
        }

        existingList.unshift(localItem);
        if (existingList.length > 20) {
          existingList = existingList.slice(0, 20);
        }

        window.localStorage.setItem('qimatnadz_history', JSON.stringify(existingList));
        console.log('Valuation successfully saved to local storage history!');
      } catch (localErr) {
        console.warn('Error saving to local storage history:', localErr);
      }
    }

    // 2. Database Sync / Cloud Backup (Done asynchronously in the background, NON-BLOCKING)
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const insertData = {
          brand: request.brand,
          model: request.model,
          year: request.year,
          mileage: request.mileage,
          condition: request.condition,
          price_min: output!.fourchette_min,
          price_median: output!.prix_estime,
          price_max: output!.fourchette_max,
          reliability: (output!.score_justification || 80) / 100,
          reliability_score: output!.score_justification || 80,
          source_distribution: output!.source_breakdown || null,
          is_import_logic: output!.import_option?.disponible || false,
          import_data: output!.import_option || null,
          source_import_neuf: output!.source_breakdown?.import_neuf || 0,
          source_import_chine: output!.source_breakdown?.import_chine || 0,
          user_id: session?.user?.id || null,
        };

        const { error: saveError } = await supabase.from('valuations').insert(insertData);
        if (saveError) {
          console.warn('Error auto-saving valuation history:', saveError.message);
        } else {
          console.log('Valuation successfully saved to database history!');
        }
      } catch (dbErr) {
        console.warn('Database error while auto-saving history:', dbErr);
      }
    })();
  }

  return output;
}

export async function fetchHistory() {
  // Load local cache history first (always available, instant & offline)
  let localList: any[] = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem('qimatnadz_history');
      if (raw) {
        localList = JSON.parse(raw);
        if (!Array.isArray(localList)) localList = [];
      }
    } catch (e) {
      console.warn('Error parsing local history:', e);
    }
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user?.id) {
      // Authenticated user: fetch their private evaluations history from cloud
      const { data, error } = await supabase
        .from('valuations')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.warn('Error fetching Supabase history:', error.message);
        return localList;
      }
      
      return data && data.length > 0 ? data : localList;
    }
  } catch (err) {
    console.warn('Network issue fetching database history:', err);
  }

  return localList;
}
