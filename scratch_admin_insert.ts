import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

dotenv.config();

// Use service role to bypass RLS for admin inserts
const supabaseAdmin = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { realtime: { transport: ws as any } }
);

const newRecords = [
  // Renault Clio 5 2022 — no existing row, need to insert
  {
    brand: 'Renault', model: 'Clio 5', year: 2022,
    prix_median: 3_400_000, prix_min: 3_100_000, prix_max: 3_800_000, nb_annonces: 5
  },
  // Hyundai Creta 2023 — no existing row, need to insert
  {
    brand: 'Hyundai', model: 'Creta', year: 2023,
    prix_median: 5_800_000, prix_min: 5_400_000, prix_max: 6_400_000, nb_annonces: 3
  },
  // Hyundai Tucson 2025 — add a proper new-car anchor
  {
    brand: 'Hyundai', model: 'Tucson', year: 2025,
    prix_median: 7_200_000, prix_min: 6_800_000, prix_max: 7_800_000, nb_annonces: 2
  },
];

async function insertMissingRecords() {
  console.log('=== INSERTING MISSING PRICE MEDIANS (service role) ===\n');

  for (const rec of newRecords) {
    console.log(`Processing ${rec.brand} ${rec.model} ${rec.year}...`);
    
    // Check if already exists
    const { data: existing } = await supabaseAdmin
      .from('prix_medians')
      .select('id, prix_median')
      .eq('brand', rec.brand)
      .eq('model', rec.model)
      .eq('year', rec.year)
      .limit(1);

    if (existing && existing.length > 0) {
      const { error } = await supabaseAdmin
        .from('prix_medians')
        .update({
          prix_median: rec.prix_median,
          prix_min: rec.prix_min,
          prix_max: rec.prix_max,
          nb_annonces: rec.nb_annonces,
        })
        .eq('brand', rec.brand)
        .eq('model', rec.model)
        .eq('year', rec.year);

      if (error) console.error(`  ✗ Update failed: ${error.message}`);
      else console.log(`  ✓ Updated: old median was ${existing[0].prix_median?.toLocaleString()} → new ${rec.prix_median.toLocaleString()} DZD`);
    } else {
      const { error } = await supabaseAdmin
        .from('prix_medians')
        .insert(rec);

      if (error) console.error(`  ✗ Insert failed: ${error.message}`);
      else console.log(`  ✓ Inserted: ${rec.prix_median.toLocaleString()} DZD`);
    }
  }

  console.log('\n=== DONE ===');
}

insertMissingRecords();
