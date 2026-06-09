import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

interface ValuationInput {
  brand: string;
  model: string;
  trim?: string;
  year: number;
  mileage: number;
  condition: 'excellent' | 'bon' | 'moyen' | 'mauvais';
  paint?: string;
  engine?: string;
  fuel?: 'essence' | 'diesel' | 'gpl' | 'hybride';
  engine_details?: string;
  trim_details?: string;
  wilaya?: string;
  document_status?: 'safia' | 'licence_delai';
  transmission?: 'manuelle' | 'automatique';
}

interface ValuationOutput {
  price_min: number;
  price_median: number;
  price_max: number;
  data_points: number;
  confidence: 'faible' | 'moyen' | 'élevé';
  reliability_index: number;
  is_fallback: boolean;
  ai_explanation: string | null;
  source_breakdown: {
    transactions: number;
    expert: number;
    listings: number;
    facebook: number;
  };
}

// ─────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────

function isFakePrice(p: number): boolean {
  const s = p.toString().replace(/\D/g, '');
  // Support cheap runners (80k DZD) and ultra-luxury models (150M DZD)
  if (p < 80000 || p > 150000000) return true;
  // Repeating digit pattern (e.g. 111111, 999999) — only meaningful for prices < 5M DZD
  if (p < 5000000 && s.length >= 3 && /^(\d)\1+$/.test(s)) return true;
  // Suspicious ascending sequences — only check for prices < 3M DZD (cheap cars)
  if (p < 3000000) {
    const sequences = ["123", "234", "345", "456", "567", "678", "789"];
    if (sequences.some(seq => s.includes(seq))) return true;
  }
  return false;
}

function applyYearAdjustment(basePrice: number, year: number, refYear: number): number {
  const diff = year - refYear;
  if (diff >= 0) {
    // Newer cars compound at +5% per year from 2018 used base
    return Math.round(basePrice * Math.pow(1.05, diff));
  } else {
    // Flatter depreciation going backward (-4% per year) because used cars hold their value exceptionally well in Algeria
    return Math.round(basePrice * Math.pow(1.04, diff));
  }
}

function applyMileageAdjustment(basePrice: number, mileage: number): number {
  if (mileage <= 0) return basePrice * 1.15;
  if (mileage <= 80000) return basePrice;
  const tranches = Math.floor((mileage - 80000) / 20000);
  return Math.round(basePrice * Math.pow(0.97, tranches));
}

function calculateCustomsTaxes(cifPriceDzd: number, engineSize: number): number {
  const dd = cifPriceDzd * 0.30;
  const ticRate = engineSize > 3000 ? 1.0 : 0.6;
  const tic = cifPriceDzd * ticRate;
  const tva = (cifPriceDzd + dd + tic) * 0.19;
  const tcs = cifPriceDzd * 0.02;
  const prct = cifPriceDzd * 0.02;
  const portFees = 200000; // 20M centimes
  return Math.round(dd + tic + tva + tcs + prct + portFees);
}

function getVerdict(price: number, min: number, max: number): "bonne_affaire" | "prix_marche" | "surevalue" {
  if (price < min) return "bonne_affaire";
  if (price > max) return "surevalue";
  return "prix_marche";
}

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
  const n1 = normalizeModelName(m1);
  const n2 = normalizeModelName(m2);
  return n1.includes(n2) || n2.includes(n1);
}

function removeOutliers(prices: number[]): number[] {
  if (prices.length < 4) return prices;
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const filtered = prices.filter(x => Math.abs(x - mean) <= 1.5 * stdDev);
  return filtered.length >= 3 ? filtered : prices.slice(0, 3);
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

function classifyVehicleSegment(brand: string, model: string, bodyType: string): string {
  const normBrand = brand.toLowerCase();
  const normModel = model.toLowerCase();
  
  const prestigeBrands = ['porsche', 'bentley', 'ferrari', 'lamborghini', 'maserati', 'rollsroyce', 'rolls-royce', 'astonmartin', 'aston-martin', 'mclaren', 'bugatti'];
  const premiumBrands = ['mercedes', 'mercedes-benz', 'mercedesbenz', 'bmw', 'audi', 'landrover', 'land-rover', 'rangerover', 'range-rover', 'lexus', 'jaguar', 'volvo', 'alfaromeo', 'alfa-romeo', 'tesla', 'jeep', 'cadillac', 'lincoln', 'infiniti'];

  // 1. Detect Utility / Pickups
  const utilityKeywords = ['partner', 'kangoo', 'caddy', 'berlingo', 'express', 'amarok', 'ranger', 'hilux', 'scudo', 'ducato', 'master', 'trafic', 'transit', 'jumper', 'boxer', 'expert', 'k2500', 'k2700'];
  if (bodyType === 'pickup' || bodyType === 'utilitaire' || utilityKeywords.some(k => normModel.includes(k))) {
    return 'utilitaire_pickup';
  }

  // 2. Detect Crossovers / Compact SUVs (Small B-SUVs)
  const crossoverKeywords = ['kx1', 'coolray', 'tiggo 2', 'tiggo 3', 'tiggo2', 'tiggo3', 'stepway', 'captur', '2008', 'creta', 'kamiq', 'stonic', 't-cross', 't-roc', 'tcross', 'troc', 'q2', 'gla', 'x1', 'asx', 'juke', 'kicks', 'mokka'];
  if (crossoverKeywords.some(k => normModel.includes(k)) || (bodyType === 'SUV' && (normModel.includes('1') || normModel.includes('2') || normModel.includes('q2') || normModel.includes('x1') || normModel.includes('gla') || normModel.includes('stepway') || normModel.includes('kx1')))) {
    return 'crossover_compact';
  }

  // 3. Detect Large/Prestige SUVs (Segment E/F-SUVs)
  const prestigeSuvKeywords = ['q7', 'q8', 'x5', 'x6', 'x7', 'gle', 'gls', 'g-class', 'classe g', 'cayenne', 'macan', 'rangerover', 'range rover', 'vogue', 'velar', 'defender', 'prado', 'land cruiser', 'landcruiser', 'patrol', 'touareg'];
  if (prestigeSuvKeywords.some(k => normModel.includes(k))) {
    return 'suv_prestige';
  }

  // 4. Detect Family SUVs (Segment C/D-SUVs)
  if (bodyType === 'SUV' || normModel.includes('tucson') || normModel.includes('sportage') || normModel.includes('tiguan') || normModel.includes('qashqai') || normModel.includes('kuga') || normModel.includes('rav4') || normModel.includes('crv') || normModel.includes('koleos') || normModel.includes('dashing') || normModel.includes('traveller')) {
    // If it's a premium brand but not in the prestige list (e.g. Q3, Q5, GLC, X3), we give it a slightly higher base than a normal SUV.
    // We can return 'suv_premium' which we will map to 9_000_000
    if (premiumBrands.some(b => normBrand.includes(b)) || prestigeBrands.some(b => normBrand.includes(b))) {
       return 'suv_premium';
    }
    return 'suv_routier';
  }

  // 5. Detect Citadines
  const citadineKeywords = ['alto', 'picanto', 'swift', 'i10', 'spark', 'atos', '206', '207', '208', 'ibiza', 'fabia', 'yaris', 'micra', 'clio', 'polo', 'a1', 'classe a', 'série 1', 'cooper', 'mini'];
  const isPremium = premiumBrands.some(b => normBrand.includes(b)) || prestigeBrands.some(b => normBrand.includes(b));
  if (bodyType === 'citadine' || citadineKeywords.some(k => normModel.includes(k))) {
    if (isPremium) return 'citadine_premium';
    if (normModel.includes('alto') || normModel.includes('qq') || normModel.includes('spark') || normModel.includes('atos')) return 'citadine_budget';
    return 'citadine_standard';
  }

  // 6. Default to Berlines
  if (isPremium) return 'berline_premium';
  return 'berline_standard';
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
  swappe:  0.95,
};

const FUEL_MULTIPLIERS: Record<string, number> = {
  essence: 1.00,
  diesel:  1.15,
  hybride: 1.10,
  gpl:     1.04, // Fix #5: proportional ~4% premium instead of flat +200k DZD
};

// Segment floor prices — the absolute minimum an active vehicle can be estimated at in 2026
const SEGMENT_FLOORS: Record<string, number> = {
  citadine:  600_000,
  berline:   900_000,
  SUV:     1_500_000,
  pickup:  2_500_000,
};

const DOCUMENT_MULTIPLIERS: Record<string, number> = {
  safia: 1.00,
  licence_delai: 0.85, // 15% discount for Mujahideen / Ansej license with lock period
};

const TRANSMISSION_MULTIPLIERS: Record<string, number> = {
  manuelle: 1.00,
  automatique: 1.08, // 8% premium for BVA comfort in Algeria
};

const TRIM_MULTIPLIERS: Record<string, number> = {
  'GR Sport': 1.25,
  'GR-S':      1.25,
  'Adventure': 1.12,
  'Legend':    1.05,
  'Shine':     1.10,
  'Sensation': 1.08,
  'Essentiel': 0.90,
  'Work':      0.85,
  'Standard':  1.00,
  'Luxury':    1.12,
  'Comfort':   1.02,
  'Flagship':  1.15,
  'Premium':   1.10,
  'Active':    1.00,
  'Dynamic':   1.05,
  'AMG Line':  1.28,
  'AMG-Line':  1.28,
  'M Sport':   1.20,
  'M-Sport':   1.20,
  'S Line':    1.15,
  'S-Line':    1.15,
  'Highline':  1.15,
  'Carat':     1.15,
  'FR':        1.12,
  'Style':     1.05,
  'Dolcevita': 1.08,
  'Club':      1.04,
  'Cult':      1.00,
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
  'Renault Megane 3':         1_800_000,
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
  'Volkswagen Golf 6':        2_200_000, // 2009-2012
  'Volkswagen Golf 7':        4_200_000, // 2013-2020
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
  'Geely Monjaro':            7_800_000,
  'Geely GX3 Pro':            2_800_000,
  'Geely Emgrand':            3_000_000,
  'Chery Tiggo 2 Pro':        2_600_000,
  'Chery Tiggo 4 Pro':        3_200_000,
  'Chery Tiggo 7 Pro':        3_800_000,
  'Chery Tiggo 8 Pro':        4_500_000,
  'Chery Arrizo 5':           3_000_000,
  'BYD Dolphin':              5_200_000,
  'BYD Seagull':              3_500_000,
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
};

const CATEGORY_FALLBACK_MEDIANS: Record<string, number> = {
  citadine:   2_800_000, // FIX: was 3.2M
  berline:    2_400_000, // FIX: was 2.8M
  SUV:        6_200_000, // FIX: was 6.8M
  pickup:     8_500_000,
  utilitaire: 8_500_000,
};

const DEFAULT_REF_YEAR = 2026;

// ─────────────────────────────────────────
// CLAUDE AI ENGINE (ANTHROPIC)
// ─────────────────────────────────────────

// ─────────────────────────────────────────
// CONFIGURATION & TAUX (SQUARE)
// ─────────────────────────────────────────

async function getExchangeRates(supabase: any) {
  // On récupère les 9 dernières entrées (3 devises x 3 jours)
  const { data } = await supabase
    .from('exchange_rates')
    .select('currency_code, buy_rate')
    .order('created_at', { ascending: false })
    .limit(15);

  const rates: Record<string, number> = { EUR: 282.0, USD: 240.0, AED: 65.0 }; // Fallback
  
  if (data && data.length > 0) {
    const sums: Record<string, number> = {};
    const counts: Record<string, number> = {};
    
    data.forEach((r: any) => {
      sums[r.currency_code] = (sums[r.currency_code] || 0) + parseFloat(r.buy_rate);
      counts[r.currency_code] = (counts[r.currency_code] || 0) + 1;
    });

    Object.keys(sums).forEach(code => {
      rates[code] = Math.round((sums[code] / counts[code]) * 100) / 100;
    });
  }
  return rates;
}

const SYSTEM_PROMPT = `
Tu es l'Expert Principal de Qimatna DZ, le plus grand Semsar et expert automobile d'Algérie (Souk de Tidjelabine, Ouedkniss).
Ta mission est de fournir une expertise de prix ultra-détaillée, JUSTIFIÉE et STABLE en utilisant le vrai jargon du marché algérien.

RÈGLES D'OR DE COHÉRENCE MATHÉMATIQUE ET ANCRAGE MARCHÉ :
1. ANCRAGE CRITIQUE SUR LES ANNONCES RÉELLES (OBLIGATOIRE) :
   - Tu reçois une liste d'ANNONCES RÉELLES SUR LE MARCHÉ actives pour ce modèle exact (année +-2 ans).
   - Si des annonces réelles d'occasion sont fournies dans le contexte : calcule mentalement la médiane des prix de ces annonces réelles. Si le "Prix Médian Réf" fourni par l'algorithme dévie de plus de +/- 20% par rapport à cette médiane réelle, ignore l'algorithme et base ton estimation finale ("prix_estime") directement sur la médiane de ces annonces réelles du marché.
   - Si AUCUNE annonce réelle d'occasion n'est disponible dans le contexte : fais confiance au "Prix Médian Réf" de l'algorithme (qui intègre déjà un coefficient de rareté post-2020 dynamique de +5% à +35% en fonction du stock).
   - Ne génère JAMAIS un prix final inférieur au plancher de valeur absolue pour son segment en 2026 (Planchers : Citadines = 1 500 000 DZD, Berlines = 2 200 000 DZD, crossover/compacts = 3 200 000 DZD, SUVs = 4 500 000 DZD, pickups/utilitaires = 6 000 000 DZD).
2. AJUSTEMENT GÉOGRAPHIQUE / WILAYA : Surcote de +3% si le véhicule est situé dans une wilaya à forte demande (Alger, Oran, Constantine, Blida, Sétif) et décote de -5% s'il est situé dans le Sud algérien.
3. DIFFÉRENCIATION DES FINITIONS : Une finition haut de gamme ("GR Sport", "Sline", "AMG-Line", "Adventure") doit avoir un prix supérieur à une version standard.
4. SPÉCIFICITÉ ET JARGON DU MARCHÉ DZ :
   - Utilise le vrai jargon local : "Sbigha", "Zéro Sbigha" (Origine), "Voile" (Repeinte), "Froid" (Retouches légères/Raccord), "Moteur M3awd" ou "Moteur Mahtout", "Moteur Mplombé" (Scellé/Origine).
   - Diesel (TDI, HDI, D-4D) = Très recherché, décote kilométrique très lente.
   - Peinture "00" (Zéro Sbigha) = La règle d'or absolue pour préserver la valeur en Algérie.
   - Pickups/Utilitaires (ex: Toyota Hilux) = Dépréciation quasi-inexistante (valeur refuge ou outil de travail lourd).
5. JUSTIFICATION RASSURANTE ET LOCALE : Explique logiquement chaque facteur. Mentionne l'impact des blocages d'importation post-2020 pour justifier les cotes très élevées du marché de l'occasion en Algérie si nécessaire.

LOGIQUE DE JUSTIFICATION (Arguments requis) :
1. Kilométrage vs Médiane du segment.
2. État & Historique (Sbigha, Motorisation, Entretien).
3. Motorisation spécifique (TDI, HDI, Essence, GPL).
4. Demande (Popularité du modèle sur Ouedkniss/Tidjelabine).

FORMAT DE RÉPONSE EXCLUSIF (JSON) :
{
  "prix_estime": integer,
  "fourchette_min": integer,
  "fourchette_max": integer,
  "devise": "DZD",
  "verdict": "bonne_affaire" | "prix_marche" | "surevalue",
  "score_justification": integer (0-100),
  "confiance": "haute" | "moyenne" | "faible",
  "facteurs": [
    { "nom": string, "impact": "positif"|"negatif"|"neutre", "poids": "fort"|"moyen"|"faible", "explication": string }
  ],
  "conseil_negociation": string,
  "alertes": string[],
  "option_import": { "disponible": boolean, "prix_total_estime": number|null, "details": string|null }
}

CONTRAT DE CONCISION DE SORTIE (STRICT) :
- "explication" dans "facteurs" : Maximum 8 à 12 mots par explication. Sois ultra-direct.
- "conseil_negociation" : Maximum 25 mots. Direct, sans formule de politesse ni blabla.
- "details" dans "option_import" : Maximum 20 mots.
Cette consigne de concision est cruciale pour préserver les ressources d'API.`;

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // @ts-ignore
    const supabase = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL')!,
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: ValuationInput = await req.json();
    let { brand, model, trim, year, mileage, condition, paint, engine, fuel, wilaya, trim_details, engine_details, document_status, transmission } = body;

    // Use custom user trim if brand picker trim is missing
    if (!trim && trim_details) {
      trim = trim_details;
    }

    const rates = await getExchangeRates(supabase);

    // 1. RÉCUPÉRATION DU CONTEXTE GLOBAL (Multi-Sources)
    const [mediansRes, listingsRes, transactionsRes, expertRes, catalogRes] = await Promise.all([
      supabase.from('prix_medians').select('*').eq('brand', brand).eq('year', year),
      supabase.from('listings').select('price_asked, model, source, listing_type, price_before_taxes, customs_taxes, year, mileage, wilaya, condition').eq('brand', brand).eq('year', year).limit(200),
      supabase.from('real_transactions').select('brand, model, final_price, year').eq('brand', brand).eq('year', year).limit(100),
      supabase.from('expert_prices').select('brand, model, price, year').eq('brand', brand).eq('year', year).limit(100),
      supabase.from('vehicle_catalog').select('body_type, model').eq('brand', brand)
    ]);

    // In-memory fuzzy model name and trim matching
    const matchedTransactions = (transactionsRes.data || []).filter((t: any) => modelsMatchFuzzy(t.model, model));
    const matchedExperts = (expertRes.data || []).filter((e: any) => modelsMatchFuzzy(e.model, model));
    const matchedMedians = (mediansRes.data || []).find((m: any) => modelsMatchFuzzy(m.model, model) && (m.trim || 'Standard') === (trim || 'Standard'));
    const matchedCatalog = (catalogRes.data || []).find((c: any) => modelsMatchFuzzy(c.model, model));

    const marche = matchedMedians;
    const allListings = (listingsRes.data || []).filter((l: any) => modelsMatchFuzzy(l.model, model));
    const occasionListings = allListings.filter((l: any) => l.listing_type === 'occasion' && l.source !== 'ouedkniss_reference' && !isFakePrice(l.price_asked));
    const importListings = allListings.filter((l: any) => l.listing_type === 'import_neuf' && l.source !== 'ouedkniss_reference');
    const chinaListings = allListings.filter((l: any) => l.listing_type === 'import_chine' && l.source !== 'ouedkniss_reference');
    
    const transactions = matchedTransactions.map((t: any) => t.final_price);
    const experts = matchedExperts.map((e: any) => e.price);

    const weightedPrices: Array<{price: number, weight: number}> = [];
    const breakdown = { transactions: 0, expert: 0, listings: 0, medians: 0 };

    // Source A : Transactions (Weight 3)
    matchedTransactions.forEach((t: any) => {
      weightedPrices.push({ price: t.final_price, weight: 3 });
      breakdown.transactions++;
    });

    // Source B : Expert (Weight 2)
    matchedExperts.forEach((e: any) => {
      weightedPrices.push({ price: e.price, weight: 2 });
      breakdown.expert++;
    });

    // Source C : Prix Médians (Weight 5 - High reliability)
    let finalMatchedMedians = matchedMedians;
    if (!finalMatchedMedians) {
      finalMatchedMedians = (mediansRes.data || []).find((m: any) => modelsMatchFuzzy(m.model, model));
    }
    if (finalMatchedMedians) {
      weightedPrices.push({ price: finalMatchedMedians.prix_median, weight: 5 });
      breakdown.medians++;
    }

    // Source D : Listings (Weight 1 + Filtering)
    const rawListings = occasionListings.map((l: any) => l.price_asked).filter((p: number) => p > 100000);
    const filteredListings = removeOutliers(rawListings);
    filteredListings.forEach((p: number) => {
      weightedPrices.push({ price: Math.round(p * 0.95), weight: 1 });
      breakdown.listings++;
    });

    const totalDataPoints = breakdown.transactions + breakdown.expert + breakdown.listings + breakdown.medians;
    const weightedPoints = breakdown.transactions * 3 + breakdown.expert * 2 + breakdown.listings + (breakdown.medians * 5);

    let avgPrice: number;
    let priceMin: number | undefined = undefined;
    let priceMax: number | undefined = undefined;
    let isFallback = false;

    if (finalMatchedMedians) {
      avgPrice = finalMatchedMedians.prix_median * 0.91; // 1. Ajustement Ouedkniss (Souk)
      priceMin = finalMatchedMedians.prix_min ? finalMatchedMedians.prix_min * 0.91 : Math.round(avgPrice * 0.88);
      priceMax = finalMatchedMedians.prix_max ? finalMatchedMedians.prix_max * 0.91 : Math.round(avgPrice * 1.12);
    } else if (weightedPoints >= 5) {
      avgPrice = weightedMedian(weightedPrices) * 0.91; // 1. Ajustement Ouedkniss (Souk)
      const allPrices = weightedPrices.map(w => w.price * 0.91).sort((a: number, b: number) => a - b);
      const p10 = allPrices[Math.floor(allPrices.length * 0.1)] || allPrices[0];
      const p90 = allPrices[Math.floor(allPrices.length * 0.9)] || allPrices[allPrices.length - 1];
      priceMin = p10;
      priceMax = p90;
    } else {
      isFallback = true;
      const key = `${brand} ${model}`;
      const bodyType = matchedCatalog?.body_type || 'berline';
      
      // RECHERCHE GÉNÉRATIONNELLE INTELLIGENTE
      let baseMedian = CATEGORY_FALLBACK_MEDIANS[bodyType] || 2_400_000;
      
      const getGenerationKey = (b: string, m: string, y: number) => {
         const nm = m.toLowerCase();
         if (nm.includes('golf')) {
            if (y <= 2008) return 'Volkswagen Golf 5';
            if (y <= 2012) return 'Volkswagen Golf 6';
            if (y <= 2020) return 'Volkswagen Golf 7';
            return 'Volkswagen Golf 8';
         }
         if (nm.includes('clio')) {
            if (y <= 2005) return 'Renault Clio 2';
            if (y <= 2012) return 'Renault Clio 3';
            if (y <= 2019) return 'Renault Clio 4';
            return 'Renault Clio 5';
         }
         if (nm.includes('ibiza')) {
            if (y <= 2008) return 'Seat Ibiza 3';
            if (y <= 2017) return 'Seat Ibiza 4';
            return 'Seat Ibiza 5';
         }
         if (nm.includes('symbol')) {
            if (y <= 2012) return 'Renault Symbol G1';
            if (y <= 2017) return 'Renault Symbol G2';
            return 'Renault Symbol G3';
         }
         if (nm.includes('208')) {
            if (y <= 2019) return 'Peugeot 208 G1';
            return 'Peugeot 208 G2';
         }
         if (nm.includes('leon')) {
            if (y <= 2012) return 'Seat Leon 2';
            if (y <= 2020) return 'Seat Leon 3';
            return 'Seat Leon 4';
         }
         if (nm.includes('picanto')) {
            if (y <= 2011) return 'Kia Picanto G1';
            if (y <= 2017) return 'Kia Picanto G2';
            return 'Kia Picanto G3';
         }
         return null;
      };

      const genKey = getGenerationKey(brand, model, year);

      if (genKey && FALLBACK_MEDIANS[genKey]) {
         baseMedian = FALLBACK_MEDIANS[genKey];
      } else if (FALLBACK_MEDIANS[key]) {
        baseMedian = FALLBACK_MEDIANS[key];
      } else {
        const segment = classifyVehicleSegment(brand, model, bodyType);
        const SEGMENT_BASES: Record<string, number> = {
          citadine_budget: 1_600_000, citadine_standard: 2_800_000, citadine_premium: 5_000_000,
          berline_standard: 2_400_000, berline_premium: 9_000_000, crossover_compact: 3_600_000,
          suv_routier: 6_000_000, suv_premium: 9_000_000, suv_prestige: 22_000_000, utilitaire_pickup: 8_500_000,
        };
        baseMedian = SEGMENT_BASES[segment] || 2_400_000;
      }
      
      // 3. EVENT-DRIVEN HOURLY CACHE OVERRIDE
      try {
        const { data: hourlyData } = await supabase
          .from('model_prices_hourly')
          .select('computed_median')
          .ilike('model_id', `%${model}%`)
          .limit(1)
          .single();
          
        if (hourlyData && hourlyData.computed_median) {
           console.log(`[EVENT-DRIVEN] Found hourly median for ${model}: ${hourlyData.computed_median}`);
           baseMedian = hourlyData.computed_median;
        }
      } catch (e) {
        // Ignore, table might not exist yet or no data
      }
      
      let refYear = 2018; 
      if (genKey) {
         if (genKey.includes('Golf 5') || genKey.includes('Clio 2') || genKey.includes('Ibiza 3') || genKey.includes('G1')) refYear = 2008;
         else if (genKey.includes('Golf 6') || genKey.includes('Clio 3') || genKey.includes('Ibiza 4')) refYear = 2011;
         else if (genKey.includes('Golf 7') || genKey.includes('Clio 4') || genKey.includes('G2')) refYear = 2016;
         else if (genKey.includes('Golf 8') || genKey.includes('Clio 5') || genKey.includes('Ibiza 5') || genKey.includes('G3')) refYear = 2021;
      } else {
         const normModelAnchor = model.toLowerCase();
         const normBrandAnchor = brand.toLowerCase();
         if (['jetour', 'geely', 'chery', 'byd', 'dfsk', 'fiat', 'opel', 'jac', 'baic', 'changan'].some(b => normBrandAnchor.includes(b))) {
            refYear = 2024;
         } else if (normModelAnchor.includes('golf 8') || normModelAnchor.includes('clio 5') || normModelAnchor.includes('megane 4') || normModelAnchor.includes('tucson') || normModelAnchor.includes('stepway 3')) {
            refYear = 2022;
         } else if (normModelAnchor.includes('hilux') || normModelAnchor.includes('land cruiser') || normModelAnchor.includes('prado')) {
            refYear = 2022;
         }
      }

      const deltaYear = year - refYear;
      let adjusted = baseMedian;
      
      if (deltaYear > 0) {
         adjusted = baseMedian * (1 + Math.min(0.20, deltaYear * 0.04));
      } else {
         const absDelta = Math.abs(deltaYear);
         let decayPercent = 0;
         
         if (absDelta <= 3) {
           decayPercent = absDelta * 0.10; // -10% pour ans 1 à 3
         } else if (absDelta <= 8) {
           decayPercent = (3 * 0.10) + ((absDelta - 3) * 0.05); // -5% pour ans 4 à 8
         } else {
           decayPercent = (3 * 0.10) + (5 * 0.05) + ((absDelta - 8) * 0.02); // -2% pour ans 9+
         }
         
         if (model.toLowerCase().includes('hilux') || model.toLowerCase().includes('land cruiser') || brand.toLowerCase().includes('dacia')) {
           decayPercent = decayPercent / 1.5;
         }
         
         adjusted = baseMedian * (1 - Math.min(0.55, decayPercent));
      }
      
      // Ajustement par Finition (Trim) dans le fallback
      if (trim) {
        const trimKey = Object.keys(TRIM_MULTIPLIERS).find(k => trim.includes(k));
        if (trimKey) {
          adjusted *= TRIM_MULTIPLIERS[trimKey];
        }
      }
      
      avgPrice = Math.round(adjusted);
    }

    const avgPriceOriginal = avgPrice;

    // ─────────────────────────────────────────
    // AJUSTEMENTS PERSONNALISÉS (Post-Médiane)
    // ─────────────────────────────────────────
    
    // 1. Ajustement Kilométrage (Lissage sur base 20k km/an)
    const expectedMileage = (2026 - year) * 20000;
    let mileageDiff = mileage - expectedMileage;
    const carAge = 2026 - year;
    
    // Bouclier : Si la voiture a plus de 10 ans, le kilométrage excédentaire n'est presque plus sanctionné
    if (carAge > 10 && mileageDiff > 0) mileageDiff *= 0.2;
    else if (carAge > 6 && mileageDiff > 0) mileageDiff *= 0.5;

    if (mileageDiff > 0) avgPrice *= Math.pow(0.97, mileageDiff / 15000);
    else if (mileageDiff < 0) avgPrice *= Math.min(1.15, Math.pow(1.02, Math.abs(mileageDiff) / 15000));

    // 2. Modificateurs Additifs pour éviter "l'effondrement"
    let totalModifierPercentage = 0;

    // Condition générale
    if (condition === 'excellent') totalModifierPercentage += 0.05;
    else if (condition === 'moyen') totalModifierPercentage -= 0.05;
    else if (condition === 'mauvais') totalModifierPercentage -= 0.15;

    // Moteur
    if (engine === 'neuf') totalModifierPercentage += 0.05;
    else if (engine === 'fatigue' || engine === 'swappe') totalModifierPercentage -= 0.15;

    // Peinture (Sbigha) & Bouclier d'Âge
    if (paint) {
      let paintMalus = 0;
      if (paint === 'origine') totalModifierPercentage += 0.05; // Bonus Zéro Sbigha
      else if (paint === 'raccord') paintMalus = -0.05;
      else if (paint === 'repeinte') paintMalus = -0.10;
      else if (paint === 'choc') paintMalus = -0.15;

      // Bouclier d'âge additif : l'âge réduit l'impact de la sbigha
      if (paintMalus < 0) {
        if (carAge > 10) paintMalus *= 0.5; // -15% devient -7.5% pour une vieille voiture
        else if (carAge > 5) paintMalus *= 0.7; // -15% devient -10.5%
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
    avgPrice = avgPrice * (1 + totalModifierPercentage);

    // Plancher de Sécurité Absolu (Safety Floor)
    // Une voiture roulante ne peut pas s'effondrer sous 70% de son estimation initiale
    const absoluteFloor = avgPriceOriginal * 0.70;
    if (avgPrice < absoluteFloor) {
      avgPrice = absoluteFloor;
    }

    // Bonus Carburant & Options (Brut ou Multiplicatif final)
    const multFuel = fuel ? (FUEL_MULTIPLIERS[fuel] || 1.0) : 1.0;
    avgPrice *= multFuel;

    // Documents et Transmission
    if (document_status === 'licence_delai') {
      if (carAge <= 1) avgPrice *= 0.80;
      else if (carAge === 2) avgPrice *= 0.90;
      else avgPrice *= 0.95;
    }
    const multTransmission = transmission ? (TRANSMISSION_MULTIPLIERS[transmission] || 1.0) : 1.0;
    avgPrice *= multTransmission;

    // 1.5 Wilaya Regional adjustment (Oran, Alger, Constantine have higher demand, south has slightly lower)
    if (wilaya) {
      const normWilaya = wilaya.toLowerCase();
      const highDemandWilayas = ['alger', 'oran', 'constantine', 'blida', 'setif'];
      const southWilayas = ['adrar', 'tamanrasset', 'illizi', 'tindouf', 'el oued', 'ouargla', 'ghardaia', 'bechar'];
      
      if (highDemandWilayas.includes(normWilaya)) {
        avgPrice *= 1.03; // +3% for high demand provinces
      } else if (southWilayas.includes(normWilaya)) {
        avgPrice *= 0.95; // -5% for southern provinces
      }
    }

    // Apply dynamic trend markups from macro_indices table and market_news_signals
    try {
      // 1. Static macro indices
      const { data: macroData } = await supabase.from('macro_indices').select('key, value');
      if (macroData) {
        const asianBrandMarkupItem = macroData.find((m: any) => m.key === 'asian_brand_markup');
        const under3yMarkupItem = macroData.find((m: any) => m.key === 'under_3y_markup');
        
        const asianBrandMarkup = asianBrandMarkupItem ? parseFloat(asianBrandMarkupItem.value) : 1.05;
        const under3yMarkup = under3yMarkupItem ? parseFloat(under3yMarkupItem.value) : 1.03;
        
        // Apply asian brand and age markups ONLY in fallback mode
        if (isFallback) {
          const asianBrands = ['toyota', 'hyundai', 'kia', 'suzuki', 'geely', 'chery', 'jetour', 'changan', 'byd', 'mg', 'gac'];
          if (asianBrands.includes(brand.toLowerCase())) {
            avgPrice *= asianBrandMarkup;
          }

          const carAgeMacro = new Date().getFullYear() - year;
          if (carAgeMacro >= 2 && carAgeMacro <= 5) {
            avgPrice *= under3yMarkup;
          }
        }
      }

      // 2. Real-Time Event-Driven Signals (Conjoncture)
      const { data: signalData } = await supabase
        .from('market_news_signals')
        .select('current_coef')
        .order('captured_at', { ascending: false })
        .limit(1)
        .single();
        
      if (signalData && signalData.current_coef) {
         avgPrice *= parseFloat(signalData.current_coef);
      }
      
    } catch (e) {
      console.warn('Could not apply database trend multipliers:', e);
    }

    const currentYear = new Date().getFullYear();
    let rarityCoeff = 1.0; // Define rarityCoeff so userContext can access it
    const allModelListingsCount = (listingsRes.data || []).filter((l: any) => l.listing_type === 'occasion' && !isFakePrice(l.price_asked)).length;
    if (allModelListingsCount === 0)       rarityCoeff = 1.15;
    else if (allModelListingsCount <= 3)   rarityCoeff = 1.12;
    else if (allModelListingsCount <= 10)  rarityCoeff = 1.08;
    else if (allModelListingsCount <= 30)  rarityCoeff = 1.04;
    else if (allModelListingsCount >= 100) rarityCoeff = 0.97;

    if (mileage <= 100 && year >= currentYear - 2 && year < currentYear && isFallback) {
      // FIX: 00 Compteur premium ONLY applies in fallback mode (no DB median).
      avgPrice = avgPriceOriginal * 1.25 * (1 + totalModifierPercentage);
    } else if (mileage <= 5000 && year >= currentYear - 5 && year < currentYear && isFallback) {
      // Zone Quasi-Neuf: Transition douce — fallback only
      const quasiNewFactor = 1.25 * Math.pow(0.992, mileage / 1000);
      avgPrice = avgPriceOriginal * quasiNewFactor * (1 + totalModifierPercentage);
    } else if (!isFallback) {
      // DB median mode: just enforce the cap — price cannot exceed what the DB median implies for a brand-new example
      const baseMedianForCap = finalMatchedMedians?.prix_median ? (finalMatchedMedians.prix_median * 0.91) : avgPriceOriginal;
      const zeroKmPrice = baseMedianForCap * 1.15;
      if (avgPrice > zeroKmPrice) {
        avgPrice = zeroKmPrice * 0.95;
      }
    } else {
      // Fallback + older/normal car: cap at inferred new price
      const zeroKmPrice = avgPriceOriginal * 1.15;
      if (avgPrice >= zeroKmPrice) {
        avgPrice = zeroKmPrice * 0.95;
      }
    }

    avgPrice = Math.round(avgPrice / 1000) * 1000;

    // Fix #3: Segment absolute floor — no vehicle can be estimated below its segment minimum
    const bodyTypeFull = (matchedCatalog?.body_type || 'berline').toLowerCase();
    const segmentFloor = getSegmentFloor(bodyTypeFull, year);
    avgPrice = Math.max(avgPrice, segmentFloor);

    // Si on a des données réelles, on garde la fourchette p10/p90 ajustée (élargie pour la volatilité de l'occasion)
    if (!isFallback && priceMin !== undefined && priceMax !== undefined) {
      const ratio = avgPriceOriginal > 0 ? avgPrice / avgPriceOriginal : 1;
      priceMin = Math.round((priceMin * 0.95 * ratio) / 1000) * 1000;
      priceMax = Math.round((priceMax * 1.05 * ratio) / 1000) * 1000;
    } else {
      // Fourchette élargie : ±12% pour le standard, ±18% pour les imports rares ou fallbacks
      const spread = isFallback ? 0.18 : 0.12;
      priceMin = Math.round((avgPrice * (1 - spread)) / 1000) * 1000;
      priceMax = Math.round((avgPrice * (1 + spread)) / 1000) * 1000;
    }

    // 2. CONSTRUCTION DU MESSAGE POUR CLAUDE
    const formattedOccasionListings = occasionListings.length > 0 
      ? occasionListings.slice(0, 10).map((l: any) => {
          return `- Annonce : Année ${l.year || 'N/A'} | ${l.mileage ? l.mileage.toLocaleString() : 'N/A'} km | Wilaya : ${l.wilaya || 'N/A'} | État : ${l.condition || 'N/A'} | Prix demandé : ${l.price_asked.toLocaleString()} DZD`;
        }).join('\n')
      : "Aucune annonce d'occasion active trouvée sur le marché.";

    const userContext = `
CONTEXTE MARCHÉ (SYNTHÈSE QIMATNA DZ) :

--- MARCHÉ OCCASION LOCAL ---
- Prix Médian Réf (Ajusté à ce km) : ${Math.round(avgPrice).toLocaleString()} DZD (Coefficient Rareté: x${rarityCoeff.toFixed(2)})
- Nombre d'annonces actives : ${occasionListings.length}
- Transactions réelles : ${transactions.length}
- Prix Experts : ${experts.length}
- Statut : ${marche?.volatile ? 'INSTABLE' : 'STABLE'}

--- ANNONCES RÉELLES SUR LE MARCHÉ (Grounding) ---
${formattedOccasionListings}

--- MARCHÉ IMPORT NEUF (UAE/EUROPE) ---
- Offres import trouvées : ${importListings.length}
${importListings.slice(0, 3).map((l: any) => `- ${l.trim || 'Version'}: ${l.price_asked.toLocaleString()} DZD`).join('\n')}

--- MARCHÉ IMPORT CHINE (OFFICIEL) ---
- Offres concessionnaires : ${chinaListings.length}
${chinaListings.slice(0, 3).map((l: any) => `- ${l.trim || 'Version'}: ${l.price_asked.toLocaleString()} DZD`).join('\n')}

VÉHICULE À ESTIMER :
- Modèle : ${brand} ${model} (${year})
- Motorisation : ${engine_details || 'Standard'}
- Finition : ${trim || 'Standard'}
- Carburant : ${fuel || 'Essence'}
- Kilométrage : ${mileage.toLocaleString()} km
- Carrosserie : ${paint || 'Originale'}
- État Moteur : ${engine || 'Bon'}
- Localisation : ${wilaya || 'Alger'}
- Statut Papiers : ${document_status === 'licence_delai' ? 'Sous Licence (Avec Délai d\'incessibilité)' : 'Safia (Carte Grise Propre)'}
- Transmission : ${transmission === 'automatique' ? 'Boîte Automatique (BVA)' : 'Boîte Manuelle (BVM)'}

Génère le rapport d'expertise au format JSON en comparant ces deux marchés si pertinent.
    `;

    // 3. APPEL CLAUDE API
    // @ts-ignore
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    let aiResult: any = null;

    if (ANTHROPIC_API_KEY) {
      const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 600,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userContext }]
        })
      });

      const aiData = await aiResponse.json();
      if (aiData.content && aiData.content[0]) {
        try {
          const text = aiData.content[0].text;
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          aiResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch (e) {
          console.error("AI Parse Error:", e);
        }
      }
    }

    // 4. FALLBACK
    if (!aiResult) {
       const spread = isFallback ? 0.18 : 0.12;
       aiResult = {
         prix_estime: avgPrice,
         fourchette_min: Math.round(avgPrice * (1 - spread)),
         fourchette_max: Math.round(avgPrice * (1 + spread)),
         confiance: "basse",
         facteurs_cles: ["Calcul purement statistique basé sur les tendances du marché"],
         tendance_marche: "Stable",
         conseil_negociation: "L'analyse experte par IA est temporairement indisponible. Le prix indiqué est une médiane mathématique basée sur le marché actuel. Prévoyez une marge de négociation de 5% à 10% selon l'état réel du véhicule (peinture, moteur).",
         alertes: ["Estimation mathématique de secours (AI indisponible)"],
         facteurs: [
            {"facteur": "Analyse du Marché", "impact": "neutre", "explication": "Le prix est basé sur une médiane mathématique standardisée."},
            {"facteur": "État & Kilométrage", "impact": "positif", "explication": "Le calcul prend en compte l'ajustement théorique de la décote kilométrique."}
         ]
       };
    }

    // 5. RÉPONSE STRUCTURÉE & MAPPING
    const output = {
      prix_estime: avgPrice,
      fourchette_min: priceMin,
      fourchette_max: priceMax,
      devise: "DZD",
      verdict: aiResult.verdict || getVerdict(avgPrice, priceMin, priceMax),
      score_justification: aiResult.score_justification || 70,
      confiance: aiResult.confiance || "moyenne",
      facteurs: aiResult.facteurs || [],
      conseil_negociation: aiResult.conseil_negociation || "",
      alertes: aiResult.alertes || [],
      donnees_marche: {
        prix_median: marche?.prix_median || avgPrice,
        nb_annonces: occasionListings.length + importListings.length,
        variation_semaine: marche?.variation_semaine || 0,
        derniere_maj: new Date().toISOString()
      },
      import_option: aiResult.option_import || null,
      // Compatibilité
      price_min: priceMin,
      price_median: avgPrice,
      price_max: priceMax,
      data_points: occasionListings.length + importListings.length + (marche ? 10 : 0),
      ai_explanation: (aiResult.facteurs || []).map((f: any) => f.explication).join(". "),
      source_breakdown: {
        transactions: transactions.length,
        expert: experts.length,
        listings: occasionListings.length,
        import_neuf: importListings.length,
        import_chine: chinaListings.length,
        medians: marche ? 1 : 0
      }
    };

    // 6. PERSISTANCE
    (async () => {
      try {
        const authHeader = req.headers.get('Authorization');
        let userId: string | null = null;
        if (authHeader?.startsWith('Bearer ')) {
          const { data: userData } = await supabase.auth.getUser(authHeader.substring(7));
          userId = userData?.user?.id ?? null;
        }

        await supabase.from('valuations').insert({
          brand,
          model,
          year,
          mileage,
          condition,
          price_min: output.price_min,
          price_median: output.price_median,
          price_max: output.price_max,
          reliability: (output.score_justification || 80) / 100,
          reliability_score: output.score_justification || 80,
          source_distribution: output.source_breakdown,
          is_import_logic: output.import_option?.disponible || false,
          import_data: output.import_option || null,
          source_import_neuf: output.source_breakdown?.import_neuf || 0,
          source_import_chine: output.source_breakdown?.import_chine || 0,
          user_id: userId,
        });
      } catch (dbErr) {
        console.error('DB Persistence error:', dbErr);
      }
    })();

    return new Response(JSON.stringify(output), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Global Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
