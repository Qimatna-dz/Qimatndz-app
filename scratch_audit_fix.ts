import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

dotenv.config();

const supabaseAdmin = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { realtime: { transport: ws as any } }
);

async function auditAndFix() {
  console.log('=== AUDIT AND FIX DUPLICATE/STALE MEDIANS ===\n');

  // For each problematic brand+year combo, fetch ALL rows and clean up duplicates
  const targets = [
    { brand: 'Peugeot', model: '208', year: 2016, correct_median: 1_600_000, correct_min: 1_300_000, correct_max: 2_000_000 },
    { brand: 'Toyota', model: 'Yaris', year: 2017, correct_median: 2_400_000, correct_min: 2_000_000, correct_max: 2_900_000 },
    { brand: 'Dacia', model: 'Sandero', year: 2021, correct_median: 3_200_000, correct_min: 2_900_000, correct_max: 3_600_000 },
    { brand: 'Kia', model: 'Sportage', year: 2022, correct_median: 5_800_000, correct_min: 5_500_000, correct_max: 6_500_000 },
    { brand: 'Chery', model: 'Tiggo 4 Pro', year: 2024, correct_median: 3_400_000, correct_min: 3_100_000, correct_max: 3_800_000 },
  ];

  for (const t of targets) {
    console.log(`\n[${t.brand} ${t.model} ${t.year}]`);
    const { data: rows, error } = await supabaseAdmin
      .from('prix_medians')
      .select('id, model, prix_median, prix_min, prix_max, nb_annonces')
      .eq('brand', t.brand)
      .eq('year', t.year)
      .ilike('model', `%${t.model}%`);

    if (error) { console.error('Query error:', error.message); continue; }

    if (!rows || rows.length === 0) {
      console.log('  No matching rows found — inserting...');
      const { error: insertErr } = await supabaseAdmin.from('prix_medians').insert({
        brand: t.brand, model: t.model, year: t.year,
        prix_median: t.correct_median, prix_min: t.correct_min, prix_max: t.correct_max, nb_annonces: 5
      });
      if (insertErr) console.error('  Insert error:', insertErr.message);
      else console.log(`  ✓ Inserted: ${t.correct_median.toLocaleString()} DZD`);
      continue;
    }

    console.log(`  Found ${rows.length} row(s):`);
    rows.forEach(r => console.log(`    id=${r.id}: model="${r.model}", median=${r.prix_median?.toLocaleString()}`));

    // Update ALL matching rows to correct value (if there are duplicates, they'll all be corrected)
    const { error: updateErr } = await supabaseAdmin
      .from('prix_medians')
      .update({
        prix_median: t.correct_median,
        prix_min: t.correct_min,
        prix_max: t.correct_max,
        nb_annonces: 5,
      })
      .eq('brand', t.brand)
      .eq('year', t.year)
      .ilike('model', `%${t.model}%`);

    if (updateErr) console.error(`  ✗ Update error: ${updateErr.message}`);
    else console.log(`  ✓ Updated all rows → ${t.correct_median.toLocaleString()} DZD`);
  }

  // Also add Dacia Sandero Stepway specifically
  console.log('\n[Dacia Sandero Stepway 2021]');
  const { data: stepRows } = await supabaseAdmin.from('prix_medians').select('id, model, prix_median').eq('brand', 'Dacia').eq('year', 2021).ilike('model', '%Stepway%');
  if (stepRows && stepRows.length > 0) {
    const { error } = await supabaseAdmin.from('prix_medians').update({ prix_median: 3_200_000, prix_min: 2_900_000, prix_max: 3_600_000 }).eq('brand', 'Dacia').eq('year', 2021).ilike('model', '%Stepway%');
    console.log(error ? `  ✗ ${error.message}` : `  ✓ Updated Stepway → 3,200,000 DZD`);
  } else {
    const { error } = await supabaseAdmin.from('prix_medians').insert({ brand: 'Dacia', model: 'Sandero Stepway', year: 2021, prix_median: 3_200_000, prix_min: 2_900_000, prix_max: 3_600_000, nb_annonces: 3 });
    console.log(error ? `  ✗ ${error.message}` : `  ✓ Inserted Sandero Stepway 2021 → 3,200,000 DZD`);
  }

  console.log('\n=== AUDIT COMPLETE ===');
}

auditAndFix();
