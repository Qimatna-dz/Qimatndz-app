import './loadEnv';
import { supabase } from './lib/supabase';

async function checkDBMedians() {
  const checks = [
    { brand: 'Peugeot', year: 2016 },
    { brand: 'Toyota', year: 2017 },
    { brand: 'Toyota', year: 2025 },
    { brand: 'Hyundai', year: 2025 },
    { brand: 'Renault', year: 2022 },
    { brand: 'Dacia', year: 2021 },
    { brand: 'Kia', year: 2022 },
    { brand: 'Chery', year: 2024 },
  ];

  for (const c of checks) {
    const { data } = await supabase.from('prix_medians').select('brand, model, year, prix_median, prix_min, prix_max, nb_annonces').eq('brand', c.brand).eq('year', c.year);
    if (data && data.length > 0) {
      console.log(`\n[${c.brand} ${c.year}]`);
      data.forEach(d => console.log(`  ${d.model}: median=${d.prix_median?.toLocaleString()}, min=${d.prix_min?.toLocaleString()}, max=${d.prix_max?.toLocaleString()}, nb=${d.nb_annonces}`));
    } else {
      console.log(`\n[${c.brand} ${c.year}] → No DB median found (will use fallback)`);
    }
  }
}

checkDBMedians();
