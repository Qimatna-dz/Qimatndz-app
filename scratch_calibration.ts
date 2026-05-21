import './loadEnv';
import { calculateValuation } from './lib/valuation';

interface TestCase {
  name: string;
  params: any;
  realMarketMin: number;
  realMarketMax: number;
  source: string;
}

const testCases: TestCase[] = [
  // ── BRAND NEW CARS ──────────────────────────────────────────────
  {
    name: 'Kia Picanto 2026 (00KM, BVM, Safia)',
    params: { brand: 'Kia', model: 'Picanto', year: 2026, mileage: 0, condition: 'excellent', paint: 'origine', engine: 'neuf', fuel: 'essence', transmission: 'manuelle', document_status: 'safia' },
    realMarketMin: 3600000, realMarketMax: 4000000, source: 'Ouedkniss scrape + dealer quotes'
  },
  {
    name: 'Hyundai Tucson 2025 (00KM, BVA, Safia)',
    params: { brand: 'Hyundai', model: 'Tucson', year: 2025, mileage: 0, condition: 'excellent', paint: 'origine', engine: 'neuf', fuel: 'essence', transmission: 'automatique', document_status: 'safia' },
    realMarketMin: 6800000, realMarketMax: 7800000, source: 'Ouedkniss / dealer'
  },
  {
    name: 'Toyota Corolla 2025 (00KM, BVA, Safia)',
    params: { brand: 'Toyota', model: 'Corolla', year: 2025, mileage: 0, condition: 'excellent', paint: 'origine', engine: 'neuf', fuel: 'essence', transmission: 'automatique', document_status: 'safia' },
    realMarketMin: 5800000, realMarketMax: 6800000, source: 'Ouedkniss / dealer'
  },

  // ── RECENT USED (2019–2023) ──────────────────────────────────────
  {
    name: 'VW Golf 7 2019 (85k km, bon, origine)',
    params: { brand: 'Volkswagen', model: 'Golf 7', year: 2019, mileage: 85000, condition: 'bon', paint: 'origine', engine: 'bon', fuel: 'essence' },
    realMarketMin: 4200000, realMarketMax: 5200000, source: 'Ouedkniss listings'
  },
  {
    name: 'Renault Clio 5 2022 (45k km, excellent, origine)',
    params: { brand: 'Renault', model: 'Clio 5', year: 2022, mileage: 45000, condition: 'excellent', paint: 'origine', engine: 'bon', fuel: 'essence' },
    realMarketMin: 3000000, realMarketMax: 3800000, source: 'Ouedkniss listings'
  },
  {
    name: 'Hyundai Creta 2023 (30k km, excellent, origine)',
    params: { brand: 'Hyundai', model: 'Creta', year: 2023, mileage: 30000, condition: 'excellent', paint: 'origine', engine: 'bon', fuel: 'essence' },
    realMarketMin: 5500000, realMarketMax: 6500000, source: 'Ouedkniss listings'
  },

  // ── OLDER USED (2015–2018) ────────────────────────────────────────
  {
    name: 'Peugeot 208 2016 (130k km, bon, raccord)',
    params: { brand: 'Peugeot', model: '208', year: 2016, mileage: 130000, condition: 'bon', paint: 'raccord', engine: 'bon', fuel: 'essence' },
    realMarketMin: 1400000, realMarketMax: 1900000, source: 'Ouedkniss listings'
  },
  {
    name: 'Toyota Yaris 2017 (110k km, bon, origine)',
    params: { brand: 'Toyota', model: 'Yaris', year: 2017, mileage: 110000, condition: 'bon', paint: 'origine', engine: 'bon', fuel: 'essence' },
    realMarketMin: 2200000, realMarketMax: 2800000, source: 'Ouedkniss listings'
  },
  {
    name: 'Renault Symbol 2016 (150k km, moyen, raccord)',
    params: { brand: 'Renault', model: 'Symbol', year: 2016, mileage: 150000, condition: 'moyen', paint: 'raccord', engine: 'bon', fuel: 'essence' },
    realMarketMin: 1000000, realMarketMax: 1400000, source: 'Ouedkniss listings'
  },

  // ── EXTRA EDGE CASES ─────────────────────────────────────────────
  {
    name: 'Dacia Sandero Stepway 2021 (60k km, bon, origine)',
    params: { brand: 'Dacia', model: 'Sandero Stepway', year: 2021, mileage: 60000, condition: 'bon', paint: 'origine', engine: 'bon', fuel: 'essence' },
    realMarketMin: 3000000, realMarketMax: 3800000, source: 'Ouedkniss listings'
  },
  {
    name: 'Kia Sportage 2022 (50k km, excellent, origine)',
    params: { brand: 'Kia', model: 'Sportage', year: 2022, mileage: 50000, condition: 'excellent', paint: 'origine', engine: 'bon', fuel: 'essence' },
    realMarketMin: 5800000, realMarketMax: 7200000, source: 'Ouedkniss listings'
  },
  {
    name: 'Chery Tiggo 4 Pro 2024 (10k km, excellent, origine)',
    params: { brand: 'Chery', model: 'Tiggo 4 Pro', year: 2024, mileage: 10000, condition: 'excellent', paint: 'origine', engine: 'bon', fuel: 'essence' },
    realMarketMin: 3200000, realMarketMax: 4000000, source: 'Ouedkniss listings'
  },
];

async function runCalibration() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║          QIMATNA DZ — CALIBRATION BENCHMARK SUITE            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const tc of testCases) {
    console.log(`\n► ${tc.name}`);
    try {
      const result = await calculateValuation(tc.params);
      if (!result || !result.prix_estime) {
        console.error('  ✗ FAIL: No result returned');
        failed++;
        failures.push(`${tc.name}: No result`);
        continue;
      }

      const price = result.prix_estime;
      const min = result.fourchette_min;
      const max = result.fourchette_max;
      const inRange = price >= tc.realMarketMin && price <= tc.realMarketMax;

      console.log(`  App Estimate : ${price.toLocaleString()} DZD`);
      console.log(`  Fourchette   : ${min?.toLocaleString()} → ${max?.toLocaleString()} DZD`);
      console.log(`  Real Market  : ${tc.realMarketMin.toLocaleString()} → ${tc.realMarketMax.toLocaleString()} DZD  (${tc.source})`);

      if (inRange) {
        console.log(`  ✓ PASS`);
        passed++;
      } else {
        const diff = price - ((tc.realMarketMin + tc.realMarketMax) / 2);
        const pct = ((diff / ((tc.realMarketMin + tc.realMarketMax) / 2)) * 100).toFixed(1);
        const direction = diff > 0 ? 'OVER' : 'UNDER';
        console.warn(`  ✗ FAIL — ${direction} by ${Math.abs(Number(pct))}% (${Math.abs(diff).toLocaleString()} DZD off)`);
        failed++;
        failures.push(`${tc.name}: ${direction} by ${pct}% → got ${price.toLocaleString()} expected ${tc.realMarketMin.toLocaleString()}–${tc.realMarketMax.toLocaleString()}`);
      }
    } catch (err: any) {
      console.error(`  ✗ ERROR: ${err.message}`);
      failed++;
      failures.push(`${tc.name}: Exception — ${err.message}`);
    }
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  RESULTS: ${passed} PASSED / ${failed} FAILED out of ${testCases.length} test cases`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  if (failures.length > 0) {
    console.log('\n📋 FAILURES TO FIX:');
    failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  } else {
    console.log('\n🎉 All calibration tests passed!');
  }
}

runCalibration();
