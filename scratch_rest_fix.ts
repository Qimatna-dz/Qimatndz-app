import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function pgRestUpdate(table: string, match: Record<string, any>, updates: Record<string, any>) {
  // Build query string for match filters
  const queryParams = Object.entries(match).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
  const url = `${SUPABASE_URL}/rest/v1/${table}?${queryParams}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(updates),
  });

  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

async function pgRestInsert(table: string, record: Record<string, any>) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(record),
  });

  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

async function pgRestQuery(table: string, match: Record<string, any>, extraFilter?: string) {
  const queryParams = Object.entries(match).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
  const url = `${SUPABASE_URL}/rest/v1/${table}?${queryParams}${extraFilter ? `&${extraFilter}` : ''}&select=id,model,prix_median,prix_min,prix_max,nb_annonces`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    },
  });

  const data = await res.json();
  return data;
}

// All records to fix/insert
const fixes = [
  // These had wrong values in DB — UPDATE
  { brand: 'Peugeot', model: '208', year: 2016, prix_median: 1_600_000, prix_min: 1_300_000, prix_max: 2_000_000, nb_annonces: 6, action: 'update' },
  { brand: 'Toyota', model: 'Yaris', year: 2017, prix_median: 2_400_000, prix_min: 2_000_000, prix_max: 2_900_000, nb_annonces: 2, action: 'update' },
  { brand: 'Dacia', model: 'Sandero', year: 2021, prix_median: 3_200_000, prix_min: 2_900_000, prix_max: 3_600_000, nb_annonces: 2, action: 'update' },
  { brand: 'Kia', model: 'Sportage', year: 2022, prix_median: 5_800_000, prix_min: 5_500_000, prix_max: 6_500_000, nb_annonces: 3, action: 'update' },
  { brand: 'Chery', model: 'Tiggo 4 Pro', year: 2024, prix_median: 3_400_000, prix_min: 3_100_000, prix_max: 3_800_000, nb_annonces: 2, action: 'update' },
  // These were missing — INSERT
  { brand: 'Renault', model: 'Clio 5', year: 2022, prix_median: 3_400_000, prix_min: 3_100_000, prix_max: 3_800_000, nb_annonces: 5, action: 'insert' },
  { brand: 'Hyundai', model: 'Creta', year: 2023, prix_median: 5_800_000, prix_min: 5_400_000, prix_max: 6_400_000, nb_annonces: 3, action: 'insert' },
  { brand: 'Hyundai', model: 'Tucson', year: 2025, prix_median: 7_200_000, prix_min: 6_800_000, prix_max: 7_800_000, nb_annonces: 2, action: 'insert' },
  { brand: 'Dacia', model: 'Sandero Stepway', year: 2021, prix_median: 3_200_000, prix_min: 2_900_000, prix_max: 3_600_000, nb_annonces: 3, action: 'insert' },
];

async function main() {
  console.log('=== DIRECT REST FIX (no Supabase client, no WebSocket) ===\n');

  for (const fix of fixes) {
    const { action, brand, model, year, ...values } = fix;
    console.log(`${action.toUpperCase()} ${brand} ${model} ${year} → median: ${values.prix_median.toLocaleString()} DZD`);

    if (action === 'update') {
      const result = await pgRestUpdate('prix_medians', { brand, year }, values);
      if (result.ok) {
        const updated = JSON.parse(result.body);
        console.log(`  ✓ Updated ${Array.isArray(updated) ? updated.length : 0} row(s)`);
      } else {
        console.error(`  ✗ Failed (${result.status}): ${result.body}`);
      }
    } else {
      // Check if exists first
      const existing = await pgRestQuery('prix_medians', { brand, year }, `model=eq.${encodeURIComponent(model)}`);
      if (Array.isArray(existing) && existing.length > 0) {
        // Update instead
        const result = await pgRestUpdate('prix_medians', { brand, year }, { ...values, model });
        if (result.ok) console.log(`  ✓ Updated existing row`);
        else console.error(`  ✗ Update failed (${result.status}): ${result.body}`);
      } else {
        const result = await pgRestInsert('prix_medians', { brand, model, year, ...values });
        if (result.ok || result.status === 201) {
          console.log(`  ✓ Inserted`);
        } else {
          console.error(`  ✗ Insert failed (${result.status}): ${result.body}`);
        }
      }
    }
  }

  console.log('\n=== ALL FIXES APPLIED ===');
}

main();
