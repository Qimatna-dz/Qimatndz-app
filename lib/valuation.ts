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
}

interface Factor {
  nom: string;
  adjustment: number;
  source: 'MARKET_DATA' | 'STATISTICAL_MODEL' | 'BUSINESS_FALLBACK';
  explication: string;
}

export interface ValuationResult {
  prix_estime: number; // compatibilité
  valuation_mode: 'MARKET_COMPARABLE' | 'SEGMENT_FALLBACK';
  quick_sale: number;
  estimated_value: number;
  patient_sale: number;
  confidence: number;
  confidence_level: 'VERY_LOW_DATA' | 'LOW_DATA' | 'MEDIUM_DATA' | 'HIGH_DATA' | 'VERY_HIGH_DATA';
  comparables_count: number;
  comparable_level: number;
  trim_matched: boolean;
  generation_matched: boolean;
  year_range: string;
  year_normalization_used: boolean;
  year_adjustment_rate: number;
  is_fallback: boolean;
  factors: Factor[];
  source_breakdown: {
    transactions: number;
    expert: number;
    listings: number;
  };
  geography_metrics?: {
    local_sample_size: number;
    national_sample_size: number;
    local_median: number;
    national_median: number;
    raw_local_factor: number;
    applied_local_factor: number;
  };
}

// ─────────────────────────────────────────
// UTILS & MATH
// ─────────────────────────────────────────

const CONFIG = {
  YEAR_DEPRECIATION_RATE: 0.05, // 5% configurable fallback rate for year mixing
};

function normalizeModelName(m: string): string {
  if (!m) return '';
  const romanMap: Record<string, string> = {
    'i': '1', 'ii': '2', 'iii': '3', 'iv': '4', 'v': '5', 'vi': '6', 'vii': '7', 'viii': '8', 'ix': '9', 'x': '10'
  };
  return m.toLowerCase()
    .split(/\s+/)
    .map(word => {
      const cleanWord = word.replace(/[^a-z]/g, '');
      if (romanMap[cleanWord]) return word.replace(cleanWord, romanMap[cleanWord]);
      return word;
    })
    .join('')
    .replace(/[^a-z0-9]/g, '');
}

function modelsMatchFuzzy(m1: string, m2: string): boolean {
  if(!m1 || !m2) return false;
  const n1 = normalizeModelName(m1);
  const n2 = normalizeModelName(m2);
  return n1.includes(n2) || n2.includes(n1);
}

function getMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function getQuartiles(arr: number[]): { q1: number, q3: number, iqr: number } {
  if (arr.length === 0) return { q1: 0, q3: 0, iqr: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  return { q1, q3, iqr: q3 - q1 };
}

function removeOutliersIQR(prices: number[]): number[] {
  if (prices.length < 4) return prices;
  const { q1, q3, iqr } = getQuartiles(prices);
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const filtered = prices.filter(p => p >= lowerBound && p <= upperBound);
  return filtered.length > 0 ? filtered : prices;
}

export function classifyVehicleSegment(brand: string, model: string, bodyType: string): string {
  const normBrand = brand.toLowerCase();
  const normModel = model.toLowerCase();
  const prestigeBrands = ['porsche', 'bentley', 'ferrari', 'lamborghini', 'maserati', 'rollsroyce'];
  const premiumBrands = ['mercedes', 'bmw', 'audi', 'landrover', 'rangerover', 'lexus', 'jaguar', 'volvo'];

  const utilityKeywords = ['partner', 'kangoo', 'caddy', 'berlingo', 'express', 'hilux'];
  if (bodyType === 'pickup' || bodyType === 'utilitaire' || utilityKeywords.some(k => normModel.includes(k))) return 'utilitaire_pickup';

  const crossoverKeywords = ['coolray', 'stepway', 'captur', '2008', 'creta', 'stonic'];
  if (crossoverKeywords.some(k => normModel.includes(k))) return 'crossover_compact';

  const prestigeSuvKeywords = ['q7', 'x5', 'x6', 'gle', 'g-class', 'cayenne', 'rangerover', 'prado', 'land cruiser'];
  if (prestigeSuvKeywords.some(k => normModel.includes(k))) return 'suv_prestige';

  if (bodyType === 'SUV' || ['tucson', 'sportage', 'tiguan', 'qashqai'].some(k => normModel.includes(k))) {
    if (premiumBrands.some(b => normBrand.includes(b)) || prestigeBrands.some(b => normBrand.includes(b))) return 'suv_premium';
    return 'suv_routier';
  }

  const citadineKeywords = ['alto', 'picanto', 'swift', 'i10', 'spark', '208', 'ibiza', 'yaris', 'clio', 'polo'];
  const isPremium = premiumBrands.some(b => normBrand.includes(b));
  if (bodyType === 'citadine' || citadineKeywords.some(k => normModel.includes(k))) {
    if (isPremium) return 'citadine_premium';
    if (['alto', 'qq', 'spark', 'atos'].some(k => normModel.includes(k))) return 'citadine_budget';
    return 'citadine_standard';
  }

  return isPremium ? 'berline_premium' : 'berline_standard';
}

function getSegmentFallbackMedian(segment: string): number {
  const bases: Record<string, number> = {
    citadine_budget: 1500000, citadine_standard: 2200000, citadine_premium: 3500000,
    berline_standard: 2400000, berline_premium: 6000000, crossover_compact: 3200000,
    suv_routier: 4500000, suv_premium: 7000000, suv_prestige: 15000000, utilitaire_pickup: 3500000,
  };
  return bases[segment] || 2200000;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 3000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Query Timeout')), timeoutMs)
    )
  ]);
}

// ─────────────────────────────────────────
// CALCULATE VALUATION (OFFLINE SYNCED)
// ─────────────────────────────────────────

export async function calculateValuation(request: ValuationRequest): Promise<ValuationResult | null> {
  try {
    let { brand, model, trim, year, mileage, condition, paint, engine, fuel, wilaya, trim_details } = request;
    if (!trim && trim_details) trim = trim_details;

    const factors: Factor[] = [];

    // 1. FETCH RAW LISTINGS & COMPARABLES (with timeout)
    let listingsRes = { data: [] as any[] };
    let transactionsRes = { data: [] as any[] };
    let catalogRes = { data: [] as any[] };

    try {
      const [lRes, tRes, cRes] = await withTimeout(Promise.all([
        supabase.from('listings').select('price_asked, model, year, trim, mileage, wilaya, condition, status').eq('brand', brand).limit(1000),
        supabase.from('real_transactions').select('model, final_price, year, trim').eq('brand', brand).limit(100),
        supabase.from('vehicle_catalog').select('body_type, model').eq('brand', brand)
      ]), 5000);
      
      listingsRes = lRes as any;
      transactionsRes = tRes as any;
      catalogRes = cRes as any;
    } catch (e) {
      console.warn('Local Valuation: Supabase query failed or timed out. Running purely offline fallback.');
    }

    let allListings = (listingsRes.data || [])
      .filter((l: any) => l.status !== 'INVALID' && l.status !== 'SUSPECT') // Clean Data
      .filter((l: any) => modelsMatchFuzzy(l.model, model))
      .map((l: any) => ({ ...l, price: l.price_asked * 0.90 })); // 10% negotiation margin

    let transactions = (transactionsRes.data || [])
      .filter((t: any) => modelsMatchFuzzy(t.model, model))
      .map((t: any) => ({ ...t, price: t.final_price }));

    // 2. 5-TIER COMPARABLE MATCHING
    let comparables: any[] = [];
    let matchLevel = 0;
    let trimMatched = false;
    let yearRange = 'exact';

    const hasTrim = !!trim;
    const lowerTrim = trim?.toLowerCase() || '';

    let t1 = allListings.filter(l => l.year === year && (!hasTrim || l.trim?.toLowerCase() === lowerTrim));
    if (t1.length >= 5) {
      comparables = t1; matchLevel = 1; trimMatched = hasTrim; yearRange = 'exact';
    } else {
      let t2 = allListings.filter(l => Math.abs(l.year - year) <= 1 && (!hasTrim || l.trim?.toLowerCase() === lowerTrim));
      if (t2.length >= 5) {
        comparables = t2; matchLevel = 2; trimMatched = hasTrim; yearRange = '±1';
      } else {
        let t3 = allListings.filter(l => Math.abs(l.year - year) <= 3 && (!hasTrim || l.trim?.toLowerCase() === lowerTrim));
        if (t3.length >= 5) {
          comparables = t3; matchLevel = 3; trimMatched = hasTrim; yearRange = '±3';
        } else {
          let t4 = allListings.filter(l => Math.abs(l.year - year) <= 1);
          if (t4.length >= 5) {
            comparables = t4; matchLevel = 4; trimMatched = false; yearRange = '±1';
          } else {
            let t5 = allListings.filter(l => Math.abs(l.year - year) <= 3);
            comparables = t5; matchLevel = 5; trimMatched = false; yearRange = '±3';
          }
        }
      }
    }

    // Filter transactions correctly based on the Tier rules
    let validTransactions = transactions.filter(t => {
      const yDiff = Math.abs(t.year - year);
      const tTrim = t.trim?.toLowerCase() || '';
      const trimOk = !trimMatched || tTrim === lowerTrim;
      
      if (matchLevel === 1) return yDiff === 0 && trimOk;
      if (matchLevel === 2 || matchLevel === 4) return yDiff <= 1 && trimOk;
      return yDiff <= 3 && trimOk;
    });

    let allComparablesRaw = [
      ...comparables.map(c => ({ price: c.price, year: c.year, type: 'listing', mileage: c.mileage, wilaya: c.wilaya })),
      ...validTransactions.map(t => ({ price: t.price, year: t.year, type: 'transaction', mileage: null, wilaya: null }))
    ];

    // 3. YEAR NORMALIZATION
    let yearNormUsed = false;
    let normalizedPrices = allComparablesRaw.map(c => {
      if (c.year === year) return c.price;
      yearNormUsed = true;
      let diff = c.year - year; 
      return c.price * Math.pow(1 - CONFIG.YEAR_DEPRECIATION_RATE, diff);
    });

    const prices = removeOutliersIQR(normalizedPrices);
    const dataCount = prices.length;
    
    // 4. MULTI-FACTOR CONFIDENCE SCORE
    const { q1, q3, iqr } = getQuartiles(prices);
    const rawMedian = getMedian(prices);
    
    let baseScore = 0;
    if (dataCount >= 50) baseScore = 95;
    else if (dataCount >= 20) baseScore = 85;
    else if (dataCount >= 8) baseScore = 65;
    else if (dataCount >= 3) baseScore = 40;
    else baseScore = 15;

    // Dispersion penalty
    let dispersionPenalty = 0;
    if (rawMedian > 0 && dataCount >= 3) {
      const dispersionRatio = iqr / rawMedian;
      if (dispersionRatio > 0.20) dispersionPenalty = 30;
      else if (dispersionRatio > 0.15) dispersionPenalty = 20;
      else if (dispersionRatio > 0.10) dispersionPenalty = 10;
    }
    
    // Similarity penalty
    let similarityPenalty = 0;
    if (matchLevel === 2 || matchLevel === 4) similarityPenalty += 5;
    if (matchLevel === 3 || matchLevel === 5) similarityPenalty += 10;
    if (!trimMatched && hasTrim) similarityPenalty += 10;

    let confidenceScore = Math.max(0, baseScore - dispersionPenalty - similarityPenalty);
    
    let confidenceLevel: ValuationResult['confidence_level'];
    if (confidenceScore >= 80) confidenceLevel = 'VERY_HIGH_DATA';
    else if (confidenceScore >= 60) confidenceLevel = 'HIGH_DATA';
    else if (confidenceScore >= 40) confidenceLevel = 'MEDIUM_DATA';
    else if (confidenceScore >= 20) confidenceLevel = 'LOW_DATA';
    else confidenceLevel = 'VERY_LOW_DATA';

    // 5. BASELINE SELECTION
    let isFallback = false;
    let basePrice = 0;
    let valuationMode: ValuationResult['valuation_mode'] = 'MARKET_COMPARABLE';
    
    if (dataCount >= 3) {
      basePrice = rawMedian;
      factors.push({ nom: "Baseline Marché", adjustment: 0, source: 'MARKET_DATA', explication: `Basé sur ${dataCount} annonces comparables au niveau ${matchLevel}.` });
      if (yearNormUsed) {
        factors.push({ nom: "Normalisation Temporelle", adjustment: 0, source: 'BUSINESS_FALLBACK', explication: `Normalisation appliquée (${CONFIG.YEAR_DEPRECIATION_RATE*100}%/an) car mélange d'années (plage ${yearRange}).` });
      }
    } else {
      isFallback = true;
      valuationMode = 'SEGMENT_FALLBACK';
      const bodyType = catalogRes.data?.find((c: any) => modelsMatchFuzzy(c.model, model))?.body_type || 'berline';
      const segment = classifyVehicleSegment(brand, model, bodyType);
      const medianRef = getSegmentFallbackMedian(segment);
      
      const age = 2026 - year;
      if (age < 0) basePrice = medianRef * 1.10;
      else if (age <= 5) basePrice = medianRef * Math.pow(0.95, age);
      else basePrice = medianRef * Math.pow(0.95, 5) * Math.pow(0.98, age - 5);

      factors.push({ nom: "Mode Fallback Segment", adjustment: 0, source: 'STATISTICAL_MODEL', explication: "Données de marché insuffisantes. Utilisation du modèle de dépréciation du segment." });
    }

    let adjustedPrice = basePrice;
    
    // 6. ADJUSTMENTS
    // 6.1 Condition
    let conditionAdj = 0;
    if (condition === 'excellent') conditionAdj = 0.03;
    else if (condition === 'moyen') conditionAdj = -0.05;
    else if (condition === 'mauvais') conditionAdj = -0.15;
    if (conditionAdj !== 0) {
      adjustedPrice *= (1 + conditionAdj);
      factors.push({ nom: "État Général", adjustment: conditionAdj, source: 'BUSINESS_FALLBACK', explication: `Ajustement métier pour état ${condition}.` });
    }

    // 6.2 Mileage (Data-Driven if HIGH_DATA, otherwise Business Fallback)
    if (confidenceLevel === 'HIGH_DATA' || confidenceLevel === 'VERY_HIGH_DATA') {
      const avgMileage = getMedian(comparables.map(c => c.mileage).filter(m => m !== null));
      const mileageDiff = mileage - avgMileage;
      if (Math.abs(mileageDiff) > 10000) {
        const penalty = (mileageDiff / 10000) * 0.01;
        adjustedPrice *= (1 - penalty);
        factors.push({ nom: "Kilométrage Empirique", adjustment: -penalty, source: 'MARKET_DATA', explication: `Écart de ${(Math.abs(mileageDiff)/1000).toFixed(0)}k km par rapport à la médiane du marché.` });
      }
    } else {
      const expectedMileage = (2026 - year) * 20000;
      const diff = mileage - expectedMileage;
      if (diff > 0) {
        const penalty = 1 - Math.pow(0.98, diff / 20000);
        adjustedPrice *= (1 - penalty);
        factors.push({ nom: "Kilométrage", adjustment: -penalty, source: 'BUSINESS_FALLBACK', explication: "Kilométrage supérieur à la norme théorique." });
      } else if (diff < 0) {
        const bonus = Math.min(1.10, Math.pow(1.01, Math.abs(diff) / 20000)) - 1;
        adjustedPrice *= (1 + bonus);
        factors.push({ nom: "Faible Kilométrage", adjustment: bonus, source: 'BUSINESS_FALLBACK', explication: "Kilométrage inférieur à la norme théorique." });
      }
    }

    // 6.3 Paint
    if (paint) {
      let paintAdj = 0;
      if (paint === 'origine') paintAdj = 0.05;
      else if (paint === 'repeinte') paintAdj = -0.08;
      else if (paint === 'choc') paintAdj = -0.20;
      if (paintAdj !== 0) {
        adjustedPrice *= (1 + paintAdj);
        factors.push({ nom: "Carrosserie", adjustment: paintAdj, source: 'BUSINESS_FALLBACK', explication: "Ajustement métier sur la peinture/choc." });
      }
    }

    // 6.4 Engine Condition
    if (engine === 'neuf') {
      adjustedPrice *= 1.03;
      factors.push({ nom: "Moteur", adjustment: 0.03, source: 'BUSINESS_FALLBACK', explication: "Moteur déclaré neuf." });
    } else if (engine === 'fatigue' || engine === 'swappe') {
      adjustedPrice *= 0.85;
      factors.push({ nom: "Moteur", adjustment: -0.15, source: 'BUSINESS_FALLBACK', explication: "Moteur fatigué ou swappé." });
    }

    // 6.5 GPL
    if (fuel === 'gpl') {
      adjustedPrice *= 1.03;
      factors.push({ nom: "Installation GPL", adjustment: 0.03, source: 'BUSINESS_FALLBACK', explication: "Valorisation de l'équipement GPL (Heuristique)." });
    }

    // 6.6 Geography (Shrinkage)
    let geography_metrics;
    if (wilaya && dataCount >= 3) {
      const localComparables = comparables.filter(c => c.wilaya?.toLowerCase() === wilaya.toLowerCase());
      const nLocal = localComparables.length;
      if (nLocal >= 3) {
        const localMed = getMedian(localComparables.map(c => c.price));
        const rawFactor = localMed / basePrice;
        // Shrinkage towards 1.0 depending on sample size (max impact at 30+ samples)
        const shrinkage = Math.min(1, nLocal / 30);
        const appliedFactor = 1 + (rawFactor - 1) * shrinkage;
        
        adjustedPrice *= appliedFactor;
        geography_metrics = {
          local_sample_size: nLocal,
          national_sample_size: dataCount,
          local_median: localMed,
          national_median: basePrice,
          raw_local_factor: rawFactor,
          applied_local_factor: appliedFactor
        };
        factors.push({ nom: "Marché Régional", adjustment: appliedFactor - 1, source: 'STATISTICAL_MODEL', explication: `Ajustement calculé avec lissage (N=${nLocal}).` });
      }
    }

    // 7. PRICE RANGE (SPREAD)
    adjustedPrice = Math.round(adjustedPrice / 1000) * 1000;
    let minPrice = 0, maxPrice = 0;
    
    if (valuationMode === 'MARKET_COMPARABLE' && dataCount >= 5) {
      // Use IQR for spread but bound it with UI Safety Caps to prevent absurdity
      const minTheoretical = Math.max(q1, adjustedPrice * 0.80);
      const maxTheoretical = Math.min(q3, adjustedPrice * 1.20);
      minPrice = minTheoretical;
      maxPrice = maxTheoretical;
    } else {
      const spread = valuationMode === 'SEGMENT_FALLBACK' ? 0.20 : 0.15;
      minPrice = adjustedPrice * (1 - spread);
      maxPrice = adjustedPrice * (1 + spread);
    }
    
    minPrice = Math.round(minPrice / 1000) * 1000;
    maxPrice = Math.round(maxPrice / 1000) * 1000;

    // 8. OUTPUT
    const output: ValuationResult = {
      prix_estime: adjustedPrice, // Compat UI existante
      valuation_mode: valuationMode,
      quick_sale: minPrice,
      estimated_value: adjustedPrice,
      patient_sale: maxPrice,
      confidence: confidenceScore,
      confidence_level: confidenceLevel,
      comparables_count: dataCount,
      comparable_level: matchLevel,
      trim_matched: trimMatched,
      generation_matched: true,
      year_range: yearRange,
      year_normalization_used: yearNormUsed,
      year_adjustment_rate: CONFIG.YEAR_DEPRECIATION_RATE,
      is_fallback: isFallback,
      factors: factors,
      source_breakdown: {
        transactions: validTransactions.length,
        expert: 0,
        listings: comparables.length
      },
      geography_metrics
    };

    return output;
  } catch (error: any) {
    console.error('Local Valuation Error:', error);
    return null;
  }
}

export async function fetchHistory() {
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
