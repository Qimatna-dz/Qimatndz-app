import './loadEnv';
import { supabase } from './lib/supabase';

async function debug() {
  console.log("=== SCANNING FOR KIA KX1 DATA ===");

  // Query prix_medians
  const { data: medians, error: mediansErr } = await supabase
    .from('prix_medians')
    .select('*')
    .eq('brand', 'Kia');
  
  if (mediansErr) {
    console.error("Error fetching medians:", mediansErr);
  } else {
    console.log("Medians for Kia:", medians?.map(m => `${m.model} (${m.year}): median=${m.prix_median}, min=${m.prix_min}, max=${m.prix_max}, nb_annonces=${m.nb_annonces}`));
  }

  // Query vehicle_catalog
  const { data: catalog, error: catalogErr } = await supabase
    .from('vehicle_catalog')
    .select('*')
    .eq('brand', 'Kia');
  
  if (catalogErr) {
    console.error("Error fetching catalog:", catalogErr);
  } else {
    console.log("Catalog for Kia:", catalog?.map(c => `${c.model} (${c.segment}): base_price_new=${c.base_price_new}`));
  }

  // Query real_transactions
  const { data: txs, error: txsErr } = await supabase
    .from('real_transactions')
    .select('*')
    .eq('brand', 'Kia');
  
  if (txsErr) {
    console.error("Error fetching real transactions:", txsErr);
  } else {
    console.log("Real transactions for Kia:", txs?.map(t => `${t.model} (${t.year}): price=${t.price_sold}`));
  }
}

debug();
