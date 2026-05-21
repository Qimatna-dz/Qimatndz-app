import './loadEnv';
import { supabase } from './lib/supabase';

async function testEdgeFunction() {
  console.log("=== CALLING DEPLOYED SUPABASE EDGE FUNCTION ===");
  const requestPayload = {
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
  };

  try {
    const { data, error } = await supabase.functions.invoke('calculate-valuation', { body: requestPayload });
    if (error) {
      console.error("Edge Function Invocation Error:", error);
    } else {
      console.log("Edge Function Response:");
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Exception invoking edge function:", err);
  }
}

testEdgeFunction();
