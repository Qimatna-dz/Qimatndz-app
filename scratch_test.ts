import './loadEnv'; // Must be first!
import { calculateValuation } from './lib/valuation';

async function testCase(name: string, params: any, targetMin: number, targetMax: number) {
  console.log(`\n=== EXECUTING TEST CASE: ${name} ===`);
  console.log(`Params: ${JSON.stringify(params)}`);
  
  try {
    const result = await calculateValuation(params);
    
    if (result && result.prix_estime) {
      const priceDzd = result.prix_estime;
      const priceCentimes = priceDzd * 100;
      console.log(`Estimated Price: ${priceDzd.toLocaleString()} DZD (${priceCentimes.toLocaleString()} centimes)`);
      console.log(`Fourchette Basse (Min): ${result.fourchette_min?.toLocaleString()} DZD`);
      console.log(`Fourchette Haute (Max): ${result.fourchette_max?.toLocaleString()} DZD`);
      
      if (priceDzd >= targetMin && priceDzd <= targetMax) {
        console.log(`SUCCESS: ${name} estimation is perfectly aligned with real market cote!`);
      } else {
        console.warn(`WARNING: Price is out of expected real market range [${targetMin.toLocaleString()} - ${targetMax.toLocaleString()}]`);
      }
    } else {
      console.error("FAIL: Valuation result has no prix_estime!");
    }
  } catch (err) {
    console.error("Error running test case:", err);
  }
}

async function runTests() {
  // Test Case 1: Standard Symbol 2018
  await testCase(
    "Standard Symbol 2018 (Average mileage, paint retouches, condition bon)",
    {
      brand: 'Renault',
      model: 'Symbol',
      year: 2018,
      mileage: 160000,
      condition: 'bon',
      paint: 'raccord',
      engine: 'bon',
      fuel: 'essence'
    },
    1750000,
    1950000
  );

  // Test Case 2: Premium Symbol 2018
  await testCase(
    "Premium Symbol 2018 (Low mileage, original paint, condition excellent)",
    {
      brand: 'Renault',
      model: 'Symbol',
      year: 2018,
      mileage: 85000,
      condition: 'excellent',
      paint: 'origine',
      engine: 'bon',
      fuel: 'essence'
    },
    1950000,
    2150000
  );

  // Test Case 3: Kia KX1 2026 (00 Compteur, automatic, excellent condition)
  await testCase(
    "Kia KX1 2026 (00 Compteur, automatic, excellent condition)",
    {
      brand: 'Kia',
      model: 'KX1',
      year: 2026,
      mileage: 0,
      condition: 'excellent',
      paint: 'origine',
      engine: 'neuf',
      fuel: 'essence',
      transmission: 'automatique',
      document_status: 'safia'
    },
    4200000,
    4700000
  );
}

runTests();

