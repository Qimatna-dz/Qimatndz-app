import { supabase } from './supabase';

export interface ValuationRequest {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  condition: 'excellent' | 'bon' | 'moyen' | 'mauvais';
  paint?: string;
  engine?: 'neuf' | 'bon' | 'fatigue';
  fuel?: 'essence' | 'diesel' | 'gpl' | 'hybride';
  engine_details?: string;
  trim_details?: string;
  wilaya?: string;
  trim?: string;
  document_status?: 'safia' | 'licence_delai';
  transmission?: 'manuelle' | 'automatique';
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
  excellent: 1.08,
  bon:       1.00,
  moyen:     0.88,
  mauvais:   0.74,
};

const PAINT_MULTIPLIERS: Record<string, number> = {
  origine:  1.12,
  raccord:   1.00,
  retouches: 1.00,
  repeinte:  0.85,
  choc:      0.65,
};

const ENGINE_MULTIPLIERS: Record<string, number> = {
  neuf:    1.05,
  bon:     1.00,
  fatigue: 0.75,
};

const FUEL_MULTIPLIERS: Record<string, number> = {
  essence: 1.00,
  diesel:  1.15,
  hybride: 1.10,
  gpl:     1.04, // Fix #5: proportional ~4% premium instead of flat +200k DZD
};

// Fix #3: Absolute segment price floors (2026 values) — no car can go below these
const SEGMENT_FLOORS: Record<string, number> = {
  citadine:  600_000,
  berline:   900_000,
  SUV:     1_500_000,
  pickup:  2_500_000,
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

const DOCUMENT_MULTIPLIERS: Record<string, number> = {
  safia: 1.00,
  licence_delai: 0.85, // 15% discount for Mujahideen / Ansej license with lock period
};

const TRANSMISSION_MULTIPLIERS: Record<string, number> = {
  manuelle: 1.00,
  automatique: 1.08, // 8% premium for automatic transmission (BVA) comfort in used market
};

const FALLBACK_MEDIANS: Record<string, number> = {
  // Renault — recalibrated to 2025 Algerian market
  'Renault Symbol':           1_800_000, // 2026-ref: widespread used, stable
  'Renault Clio':             2_800_000,
  'Renault Clio 4':           2_600_000,
  'Renault Clio 5':           3_400_000, // FIX: was 3.8M, real market ~3.4M
  'Renault Symbol Sensation': 2_200_000,
  'Renault Megane':           3_800_000,
  'Renault Megane 4':         4_200_000,
  'Renault Kangoo':           3_200_000,
  'Renault Express':          3_400_000,

  // Dacia — recalibrated, supply improved since Chinese brands arrival
  'Dacia Logan':              2_200_000,
  'Dacia Sandero':            2_800_000,
  'Dacia Sandero Stepway':    3_400_000, // FIX: was 4.2M, real market ~3.4M
  'Dacia Duster':             4_200_000,

  // Toyota — split refuge models from standard
  'Toyota Corolla':           5_500_000, // import, strong demand, OK
  'Toyota Yaris':             2_500_000, // FIX: was 3.2M → real ~2.5M (older stock)
  'Toyota Yaris Style':       3_200_000,
  'Toyota Hilux':             8_500_000, // true refuge value
  'Toyota Hilux Single Cabin': 6_800_000,
  'Toyota Hilux Double Cabin': 9_500_000,
  'Toyota Land Cruiser':      26_000_000,
  'Toyota Land Cruiser LC300 VXR': 26_000_000,
  'Toyota Land Cruiser LC300 GR Sport': 28_500_000,
  'Toyota Prado':             16_500_000,
  'Toyota Prado Adventure':   18_000_000,

  // Hyundai — recalibrated
  'Hyundai Elantra':          5_000_000,
  'Hyundai Tucson':           6_500_000, // FIX: refined, BVA premium applies on top
  'Hyundai Tucson Ultimate':  8_000_000,
  'Hyundai Tucson Executive': 7_000_000,
  'Hyundai Tucson GLS':       6_000_000,
  'Hyundai Accent':           2_800_000,
  'Hyundai Accent Extreme':   3_200_000,
  'Hyundai Creta':            5_800_000, // FIX: was 5.2M → real ~5.8-6M
  'Hyundai Creta Executive':  6_200_000,
  'Hyundai i10':              2_000_000,
  'Hyundai Grand i10':        2_600_000,

  // Peugeot — recalibrated, Peugeot 208 ref is multi-year weighted
  'Peugeot 206':              1_000_000,
  'Peugeot 208':              1_800_000, // FIX: was 3.2M (was new price), ref is ~2018 median
  'Peugeot 208 GT Line':      2_200_000,
  'Peugeot 301':              2_000_000,
  'Peugeot 3008':             6_200_000,
  'Peugeot 3008 GT Line':     7_500_000,
  'Peugeot Partner':          3_200_000,

  // Volkswagen
  'Volkswagen Polo':          3_200_000,
  'Volkswagen Golf':          4_500_000,
  'Volkswagen Golf 7':        4_500_000,
  'Volkswagen Golf 7 Highline': 4_900_000,
  'Volkswagen Golf 8':        6_200_000,
  'Volkswagen Tiguan':        7_200_000,
  'Volkswagen Tiguan R-Line': 8_200_000,
  'Volkswagen Caddy':         5_000_000,

  // Kia
  'Kia Picanto':              3_200_000,
  'Kia Picanto GT-Line':      3_600_000,
  'Kia Sportage':             6_200_000, // FIX: was 6.8M → real ~6.2M used
  'Kia Sportage GT-Line':     7_800_000,
  'Kia Sportage EX':          6_800_000,
  'Kia Rio':                  3_200_000,

  // Suzuki
  'Suzuki Swift':             2_800_000,
  'Suzuki Alto':              1_600_000,

  // Seat / Skoda
  'Seat Ibiza':               3_000_000,
  'Seat Leon':                4_500_000,
  'Skoda Octavia':            5_000_000,

  // Chinese Brands — recalibrated with improved supply 2024-2025
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
  'Chery Tiggo 4 Pro':        3_200_000, // FIX: was 3.5M → real ~3.2M
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

  // Stellantis (Fiat / Opel)
  'Fiat 500':                 2_600_000,
  'Fiat Tipo':                3_000_000,
  'Opel Astra':               4_800_000,
  'Opel Corsa':               3_500_000,
  'Opel Mokka':               4_500_000,

  // Mercedes premium models
  'Mercedes G-Class':              38_000_000,
  'Mercedes-Benz G-Class':         38_000_000,
  'Mercedes Classe G':             38_000_000,
  'Mercedes-Benz Classe G':        38_000_000,
  'Mercedes G Class':              38_000_000,
  'Mercedes Classe G G63 AMG':     65_000_000,
  'Mercedes Classe G G350d':       38_000_000,
  'Mercedes Classe S':             26_000_000,
  'Mercedes-Benz Classe S':        26_000_000,
  'Mercedes Classe E':             15_000_000,
  'Mercedes-Benz Classe E':        15_000_000,
  'Mercedes Classe E E220d AMG':   18_000_000,
  'Mercedes Classe C':             11_000_000,
  'Mercedes-Benz Classe C':        11_000_000,
  'Mercedes GLE':                  22_000_000,
  'Mercedes-Benz GLE':             22_000_000,
  'Mercedes GLE AMG Line':         24_000_000,
  'Mercedes GLC':                  15_000_000,
  'Mercedes-Benz GLC':             15_000_000,

  // Land Rover premium models
  'Land Rover Range Rover': 26_000_000,
  'Range Rover':            26_000_000,
  'Range Rover Sport':      24_000_000,
  'Range Rover Vogue':      28_000_000,
  'Range Rover Evoque':     11_000_000,
  'Range Rover Velar':      15_000_000,

  // Porsche premium models
  'Porsche Cayenne':     24_000_000,
  'Porsche Cayenne GTS': 28_000_000,
  'Porsche Macan':       16_500_000,
  'Porsche 911':         38_000_000,

  // BMW premium models
  'BMW Série 5': 12_500_000,
  'BMW Série 7': 24_000_000,
  'BMW X5':      22_000_000,
  'BMW X5 M Sport': 24_000_000,
  'BMW X6':      24_000_000,

  // Audi premium models
  'Audi A6': 12_000_000,
  'Audi Q7': 18_500_000,
  'Audi Q8': 26_000_000,
};

const CATEGORY_FALLBACK_MEDIANS: Record<string, number> = {
  citadine:   2_800_000, // FIX: was 3.2M — market more balanced now
  berline:    2_400_000, // FIX: was 2.8M
  SUV:        6_200_000, // FIX: was 6.8M
  pickup:     8_500_000,
  utilitaire: 8_500_000,
};

const DEFAULT_REF_YEAR = 2026;

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
  const n1 = normalizeModelName(m1);
  const n2 = normalizeModelName(m2);
  return n1.includes(n2) || n2.includes(n1);
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
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const filtered = prices.filter(x => Math.abs(x - mean) <= 1.5 * stdDev);
  return filtered.length >= 3 ? filtered : prices.slice(0, 3);
}

export function calculateVehicleConditionScore(mileage: number, condition: string, paint?: string, engine?: string): number {
  // 1. Mileage Score (0-100)
  let mileageScore = 100;
  if (mileage > 0) {
    mileageScore = Math.max(10, Math.round(100 - (mileage / 3500)));
  }
  
  // 2. Condition Score (excellent = 100, bon = 80, moyen = 50, mauvais = 20)
  let generalScore = 80;
  if (condition === 'excellent') generalScore = 100;
  else if (condition === 'bon') generalScore = 80;
  else if (condition === 'moyen') generalScore = 50;
  else if (condition === 'mauvais') generalScore = 20;

  // 3. Paint/Body Score (origine = 100, raccord = 80, retouches = 80, repeinte = 50, choc = 15)
  let paintScore = 100;
  if (paint) {
    if (paint === 'origine') paintScore = 100;
    else if (paint === 'raccord' || paint === 'retouches') paintScore = 80;
    else if (paint === 'repeinte') paintScore = 50;
    else if (paint === 'choc') paintScore = 15;
  }

  // 4. Mechanical/Engine Score (neuf = 100, bon = 80, fatigue = 30)
  let engineScore = 80;
  if (engine) {
    if (engine === 'neuf') engineScore = 100;
    else if (engine === 'bon') engineScore = 80;
    else if (engine === 'fatigue') engineScore = 30;
  }

  // Weighted average: Mileage (35%), General Condition (25%), Paint (20%), Engine (20%)
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
  const budgetBrands = ['dacia', 'suzuki', 'fiat', 'geely', 'chery', 'changan', 'dfsk', 'jac', 'greatwall', 'great-wall', 'baic', 'byd', 'mg', 'gac', 'foton', 'maruti', 'lada', 'lifan', 'zotye'];

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
  if ((premiumBrands.some(b => normBrand.includes(b)) || prestigeBrands.some(b => normBrand.includes(b))) && (bodyType === 'SUV' || prestigeSuvKeywords.some(k => normModel.includes(k)))) {
    return 'suv_prestige';
  }

  // 4. Detect Family SUVs (Segment C/D-SUVs)
  if (bodyType === 'SUV' || normModel.includes('tucson') || normModel.includes('sportage') || normModel.includes('tiguan') || normModel.includes('qashqai') || normModel.includes('kuga') || normModel.includes('rav4') || normModel.includes('crv') || normModel.includes('koleos') || normModel.includes('dashing') || normModel.includes('traveller')) {
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

  // --- TENTATIVE EDGE FUNCTION (Full feature with AI) ---
  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke('calculate-valuation', { body: request }),
      3000
    ) as any;

    if (data && !error) {
      console.log('Valuation generated via Edge Function (AI Active)');
      output = data as ValuationResult;
      output.score_justification = calculateVehicleConditionScore(request.mileage, request.condition, request.paint, request.engine);
      totalDataPoints = data.donnees_marche?.nb_annonces || 0;
    } else {
      if (error) console.warn('Edge Function error, falling back to local:', error);
    }
  } catch (err) {
    console.warn('Edge Function unreachable or timed out, falling back to local:', err);
  }

  // --- FALLBACK LOGIQUE LOCALE (Offline/Dev reliability) ---
  if (!output) {
    try {
      const { brand, model, year, mileage, condition, paint, engine } = request;

      // 1. FETCH DATA (4 Sources) with a 3.5-second timeout safety net
      let listingsRes = { data: [] as any };
      let transactionsRes = { data: [] as any };
      let expertRes = { data: [] as any };
      let mediansRes = { data: [] as any };
      let catalogRes = { data: [] as any };

      try {
        const results = await withTimeout(
          Promise.all([
            supabase.from('listings').select('brand, model, price_asked, year, mileage, wilaya, url, source').eq('brand', brand).gte('year', year - 2).lte('year', year + 2).limit(200),
            supabase.from('real_transactions').select('brand, model, final_price, year').eq('brand', brand).gte('year', year - 1).lte('year', year + 1).limit(100),
            supabase.from('expert_prices').select('brand, model, price, year').eq('brand', brand).gte('year', year - 1).lte('year', year + 1).limit(100),
            supabase.from('prix_medians').select('*').eq('brand', brand).eq('year', year),
            supabase.from('vehicle_catalog').select('body_type, model').eq('brand', brand),
          ]),
          3500
        );
        listingsRes = results[0] as any;
        transactionsRes = results[1] as any;
        expertRes = results[2] as any;
        mediansRes = results[3] as any;
        catalogRes = results[4] as any;
      } catch (dbErr) {
        console.warn('Supabase DB queries timed out or failed, proceeding with smart catalog fallbacks:', dbErr);
      }

      const weightedPrices: Array<{price: number, weight: number}> = [];
      const breakdown = { transactions: 0, expert: 0, listings: 0, medians: 0 };

      // In-memory fuzzy model name filtering
      const matchedTransactions = (transactionsRes.data || []).filter((t: any) => modelsMatchFuzzy(t.model, model));
      const matchedExperts = (expertRes.data || []).filter((e: any) => modelsMatchFuzzy(e.model, model));
      let matchedMedians = (mediansRes.data || []).find((m: any) => modelsMatchFuzzy(m.model, model) && (m.trim || 'Standard') === (request.trim || 'Standard'));
      if (!matchedMedians) {
        matchedMedians = (mediansRes.data || []).find((m: any) => modelsMatchFuzzy(m.model, model));
      }
      const matchedCatalog = (catalogRes.data || []).find((c: any) => modelsMatchFuzzy(c.model, model));

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
      if (matchedMedians) {
        weightedPrices.push({ price: matchedMedians.prix_median, weight: 5 });
        breakdown.medians++;
      }

      // Source D : Listings (Weight 1 + Filtering)
      const rawListings = (listingsRes.data || [])
        .filter((l: any) => modelsMatchFuzzy(l.model, model) && l.source !== 'ouedkniss_reference')
        .map((l: any) => l.price_asked)
        .filter((p: number) => p > 100000);
      const filteredListings = removeOutliers(rawListings);
      filteredListings.forEach((p: number) => {
        weightedPrices.push({ price: Math.round(p * 0.88), weight: 1 });
        breakdown.listings++;
      });

      totalDataPoints = breakdown.transactions + breakdown.expert + breakdown.listings + breakdown.medians;
      const weightedPoints = breakdown.transactions * 3 + breakdown.expert * 2 + breakdown.listings + (breakdown.medians * 5);

      let priceMedian: number;
      let priceMin: number | undefined = undefined;
      let priceMax: number | undefined = undefined;
      let isFallback = false;

      if (matchedMedians) {
        priceMedian = matchedMedians.prix_median;
        priceMin = matchedMedians.prix_min || Math.round(priceMedian * 0.88);
        priceMax = matchedMedians.prix_max || Math.round(priceMedian * 1.12);
      } else if (weightedPoints >= 5) {
        priceMedian = weightedMedian(weightedPrices);
        const allPrices = weightedPrices.map(w => w.price).sort((a, b) => a - b);
        const p10 = allPrices[Math.floor(allPrices.length * 0.1)] || allPrices[0];
        const p90 = allPrices[Math.floor(allPrices.length * 0.9)] || allPrices[allPrices.length - 1];
        priceMin = p10;
        priceMax = p90;
      } else {
        isFallback = true;
        const key = `${brand} ${model}`;
        const bodyType = matchedCatalog?.body_type || 'berline';
        const categoryBase = CATEGORY_FALLBACK_MEDIANS[bodyType] || 1500000;
        
        // Smart fuzzy matching lookup with dynamic brand-prestige multiplier fallback
        let baseMedian = categoryBase;
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedModel = model.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (FALLBACK_MEDIANS[key]) {
          baseMedian = FALLBACK_MEDIANS[key];
        } else if (FALLBACK_MEDIANS[model]) {
          baseMedian = FALLBACK_MEDIANS[model];
        } else {
          const foundKey = Object.keys(FALLBACK_MEDIANS).find(k => {
            const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            return normalizedKey.includes(normK) || normK.includes(normalizedKey) || normalizedModel.includes(normK) || normK.includes(normalizedModel);
          });
          if (foundKey) {
            baseMedian = FALLBACK_MEDIANS[foundKey];
          } else {
            // Segment-based systematic classification!
            const segment = classifyVehicleSegment(brand, model, bodyType);
            const SEGMENT_BASES: Record<string, number> = {
              citadine_budget:   1_600_000, // small/budget city cars
              citadine_standard: 2_800_000, // FIX: was 3.2M
              citadine_premium:  5_000_000,
              berline_standard:  2_400_000, // FIX: was 2.8M
              berline_premium:   9_000_000,
              crossover_compact: 3_600_000, // FIX: was 4.2M → real market ~3.6M
              suv_routier:       6_000_000, // FIX: was 6.8M → real market ~6M
              suv_prestige:      22_000_000,
              utilitaire_pickup: 8_500_000,
            };

            const segmentBase = SEGMENT_BASES[segment] || 2_400_000;
            
            // Apply lightweight brand multipliers to fine-tune the segment base
            const normBrand = brand.toLowerCase();
            let brandMultiplier = 1.0;
            
            const prestigeBrands = ['porsche', 'bentley', 'ferrari', 'lamborghini', 'maserati', 'rollsroyce', 'rolls-royce', 'astonmartin', 'aston-martin', 'mclaren', 'bugatti'];
            const premiumBrands = ['mercedes', 'mercedes-benz', 'mercedesbenz', 'bmw', 'audi', 'landrover', 'land-rover', 'rangerover', 'range-rover', 'lexus', 'jaguar', 'volvo', 'alfaromeo', 'alfa-romeo', 'tesla', 'jeep', 'cadillac', 'lincoln', 'infiniti'];
            const budgetBrands = ['dacia', 'suzuki', 'fiat', 'geely', 'chery', 'changan', 'dfsk', 'jac', 'greatwall', 'great-wall', 'baic', 'byd', 'mg', 'gac', 'foton', 'maruti', 'lada', 'lifan', 'zotye'];

            if (prestigeBrands.some(b => normBrand.includes(b))) {
              brandMultiplier = 1.25;
            } else if (premiumBrands.some(b => normBrand.includes(b))) {
              brandMultiplier = 1.12;
            } else if (budgetBrands.some(b => normBrand.includes(b))) {
              brandMultiplier = 0.82;
            }
            
            baseMedian = Math.round(segmentBase * brandMultiplier);
          }
        }
        
        // All baselines are now 2026-aligned. refYear is always 2026.
        let refYear = DEFAULT_REF_YEAR;
        let yearlyCompoundingRate = 0.11; // Standard default for future years
        
        const normBrandForRate = brand.toLowerCase();
        
        const highDemandPremium = ['toyota land cruiser', 'toyota prado', 'toyota hilux', 'mercedes-benz g-class', 'mercedes g-class', 'mercedes-benz classe g', 'mercedes classe g', 'mercedes g class', 'porsche cayenne', 'porsche 911', 'bmw x5'];
        const isHighDemandPremium = highDemandPremium.some(h => normalizedKey.includes(h.replace(/[^a-z0-9]/g, '')));
        
        if (isHighDemandPremium) {
          yearlyCompoundingRate = 0.175; // Premium imports: +17.5% per year due to exceptional demand & imports restrictions
        } else if (['porsche', 'bentley', 'ferrari', 'lamborghini', 'maserati', 'rollsroyce', 'rolls-royce', 'astonmartin', 'aston-martin', 'mclaren', 'bugatti', 'mercedes', 'mercedes-benz', 'bmw', 'audi', 'landrover', 'land-rover', 'rangerover', 'range-rover', 'lexus', 'jaguar'].some(b => normBrandForRate.includes(b))) {
          yearlyCompoundingRate = 0.14; // Premium/luxury: +14% per year
        } else if (['fiat', 'geely', 'chery', 'changan', 'dfsk', 'jac', 'byd', 'mg', 'gac', 'opel', 'dacia', 'suzuki'].some(b => normBrandForRate.includes(b))) {
          yearlyCompoundingRate = 0.07; // Dealership imports (Fiat, Geely, Chery): stabilized +7% per year
        } else {
          yearlyCompoundingRate = 0.125; // Standard high demand (Renault, Clio, Golf, Tucson, Picanto): +12.5% per year
        }
 
        const referenceYearForAdjust = Math.min(year, 2026); // Go up to 2026
        const yearDiff = referenceYearForAdjust - refYear;
        let adjusted = baseMedian;
        if (yearDiff >= 0) {
          // Newer cars compound at our custom segment-aware Algerian macro inflation rates
          adjusted = baseMedian * Math.pow(1 + yearlyCompoundingRate, yearDiff);
        } else {
          // Brand-aware retroactive depreciation going backward because used cars hold their value exceptionally well in Algeria
          let decayRate = 0.05; // Standard: -5% per year (FIX: was 0.04, too optimistic)
          const normBrand = brand.toLowerCase();
          const normModel = model.toLowerCase();

          // FIX: Only true refuge/workhorse models get slow decay — NOT all Toyotas
          const isTrueRefuge = normModel.includes('hilux') || normModel.includes('landcruiser') ||
            normModel.includes('land cruiser') || normModel.includes('prado') ||
            (normBrand === 'dacia' && (normModel.includes('duster') || normModel.includes('logan')));
          const isPremium = ['mercedes', 'mercedes-benz', 'bmw', 'audi', 'landrover', 'land-rover', 'rangerover', 'range-rover', 'porsche', 'lexus'].some(b => normBrand.includes(b));
          const isBudgetOrChinese = ['geely', 'chery', 'changan', 'dfsk', 'jac', 'baic', 'byd', 'mg', 'gac', 'foton', 'maruti', 'lada', 'lifan', 'zotye'].some(b => normBrand.includes(b));

          if (isTrueRefuge) {
            decayRate = 0.025; // True refuge: Hilux, Land Cruiser, Prado, Logan/Duster
          } else if (isPremium) {
            decayRate = 0.060; // Premium: -6% per year (slightly faster, parts costs)
          } else if (isBudgetOrChinese) {
            decayRate = 0.080; // Budget/Chinese: -8% per year (reliability concerns)
          }
          
          adjusted = baseMedian * Math.pow(1 - decayRate, Math.abs(yearDiff));
        }
        
        // Ajustement par Finition (Trim) dans le fallback
        if (request.trim) {
          const trimKey = Object.keys(TRIM_MULTIPLIERS).find(k => request.trim?.includes(k));
          if (trimKey) {
            adjusted *= TRIM_MULTIPLIERS[trimKey];
          }
        }
        priceMedian = Math.round(adjusted);
      }

      const priceMedianOriginal = priceMedian;

      // ─────────────────────────────────────────
      // AJUSTEMENTS PERSONNALISÉS (Post-Médiane)
      // ─────────────────────────────────────────
      
      // 1. Ajustement Kilométrage (Lissage sur base 20k km/an)
      const expectedMileage = (2026 - year) * 20000;
      const mileageDiff = mileage - expectedMileage;
      // -3% par tranche de 15 000 km au dessus de la moyenne
      if (mileageDiff > 0) {
        priceMedian *= Math.pow(0.97, mileageDiff / 15000);
      } else if (mileageDiff < 0) {
        // +2% par tranche de 15 000 km en dessous (gain limité à +15% max)
        priceMedian *= Math.min(1.15, Math.pow(1.02, Math.abs(mileageDiff) / 15000));
      }

      // 1.5 Wilaya Regional adjustment (Oran, Alger, Constantine have higher demand, south has slightly lower)
      if (request.wilaya) {
        const normWilaya = request.wilaya.toLowerCase();
        const highDemandWilayas = ['alger', 'oran', 'constantine', 'blida', 'setif'];
        const southWilayas = ['adrar', 'tamanrasset', 'illizi', 'tindouf', 'el oued', 'ouargla', 'ghardaia', 'bechar'];
        
        if (highDemandWilayas.includes(normWilaya)) {
          priceMedian *= 1.03; // +3% for high demand provinces
        } else if (southWilayas.includes(normWilaya)) {
          priceMedian *= 0.95; // -5% for southern provinces
        }
      }

      const multCondition = CONDITION_MULTIPLIERS[condition] || 1.0;
      const multPaint = paint ? (PAINT_MULTIPLIERS[paint] || 1.0) : 1.0;
      const multEngine = engine ? (ENGINE_MULTIPLIERS[engine] || 1.0) : 1.0;
      const multFuel = request.fuel ? (FUEL_MULTIPLIERS[request.fuel] || 1.0) : 1.0;
      const multDocument = request.document_status ? (DOCUMENT_MULTIPLIERS[request.document_status] || 1.0) : 1.0;
      const multTransmission = request.transmission ? (TRANSMISSION_MULTIPLIERS[request.transmission] || 1.0) : 1.0;
      
      // Fix 00 Compteur bug: do not apply condition / paint / engine multipliers to reduce price for a brand new car
      let stateMultiplier = 1.0;
      if (mileage > 100) {
        stateMultiplier = multCondition * multPaint * multEngine * multFuel * multDocument * multTransmission;
      } else {
        // For 00 Compteur, papers and transmission might still apply (e.g. automatic transmission premium or mujahideen license discount)
        stateMultiplier = multDocument * multTransmission;
      }

      // Apply condition, paint, and engine adjustments globally
      priceMedian *= stateMultiplier;

      // Apply dynamic trend markups from macro_indices table
      try {
        const { data: macroData } = await withTimeout(
          Promise.resolve(supabase.from('macro_indices').select('key, value')),
          1500
        ) as any;
        if (macroData) {
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

            // FIX: under_3y_markup only for 2-5 year old cars, NOT brand-new (year >= currentYear-1)
            // Brand-new cars already use a 2026-aligned base, no extra recency premium needed
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
        priceMedian *= 1.25;
      } else if (mileage <= 5000 && year >= currentYear - 5 && year < currentYear && isFallback) {
        // Zone Quasi-Neuf: Transition douce — fallback only
        const quasiNewFactor = 1.25 * Math.pow(0.992, mileage / 1000);
        priceMedian = (priceMedian / stateMultiplier) * quasiNewFactor * (multCondition * multPaint * multEngine);
      } else if (!isFallback) {
        // DB median mode: just enforce the cap — price cannot exceed what the DB median implies for a brand-new example
        const zeroKmPrice = matchedMedians.prix_median * 1.15;
        if (priceMedian > zeroKmPrice) {
          priceMedian = zeroKmPrice * 0.95;
        }
      } else {
        // Fallback + older/normal car: cap at inferred new price
        const zeroKmPrice = (priceMedian / stateMultiplier) * 1.15;
        if (priceMedian >= zeroKmPrice) {
          priceMedian = zeroKmPrice * 0.95;
        }
      }

      priceMedian = Math.round(priceMedian / 1000) * 1000;
      
      // Fix #3: Segment-aware absolute floor — far more meaningful than a flat 200k DZD minimum
      const bodyTypeFull = (matchedCatalog?.body_type || 'berline').toLowerCase();
      const segmentFloor = getSegmentFloor(bodyTypeFull, year);
      priceMedian = Math.max(priceMedian, segmentFloor);
      
      // Si on a des données réelles, on garde la fourchette p10/p90 ajustée (élargie pour la volatilité de l'occasion)
      if (!isFallback && priceMin !== undefined && priceMax !== undefined) {
        const ratio = priceMedianOriginal > 0 ? priceMedian / priceMedianOriginal : 1;
        priceMin = Math.round((priceMin * 0.95 * ratio) / 1000) * 1000;
        priceMax = Math.round((priceMax * 1.05 * ratio) / 1000) * 1000;
      } else {
        // Fourchette élargie : ±12% pour le standard, ±18% pour les imports rares ou fallbacks
        const spread = isFallback ? 0.18 : 0.12;
        priceMin = Math.round((priceMedian * (1 - spread)) / 1000) * 1000;
        priceMax = Math.round((priceMedian * (1 + spread)) / 1000) * 1000;
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
        const yearsOld = Math.max(1, 2026 - year);
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
          explication: 'Motorisation GPL : Bonus économique et autonomie (+200 000 DZD).'
        });
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

      output = {
        prix_estime: priceMedian,
        price_median: priceMedian,
        fourchette_min: priceMin,
        fourchette_max: priceMax,
        devise: "DZD",
        verdict: getVerdict(priceMedian, priceMin, priceMax),
        score_justification: scoreJustif,
        confiance: weightedPoints >= 20 ? 'haute' : (weightedPoints >= 5 ? 'moyenne' : 'faible'),
        facteurs: dynamicFacteurs,
        conseil_negociation: isFallback ? "Modèle rare, restez ferme sur votre prix si le véhicule est propre." : "Prix basé sur le marché local actuel, marge de négociation de 5-10%.",
        alertes: mileage < 5000 && year < 2024 ? ["Vérifier authenticité du compteur"] : [],
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
