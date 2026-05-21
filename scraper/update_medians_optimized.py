import os
import statistics
from datetime import datetime, timezone, timedelta
from supabase import Client
from db import get_supabase_client

def get_percentile(data, percentile):
    if not data:
        return 0
    size = len(data)
    return sorted(data)[int(round(percentile * size + 0.5)) - 1]

def time_decay_weight(scraped_at_str: str | None) -> int:
    """
    Returns a weight multiplier based on how recent the listing is.
    - < 30 days : weight 3 (most reliable, reflects current market)
    - < 90 days : weight 2 (reasonably fresh)
    - >= 90 days : weight 1 (stale, less trust)
    """
    if not scraped_at_str:
        return 1
    try:
        scraped_at = datetime.fromisoformat(scraped_at_str.replace("Z", "+00:00"))
        age = datetime.now(timezone.utc) - scraped_at
        if age < timedelta(days=30):
            return 3
        elif age < timedelta(days=90):
            return 2
        else:
            return 1
    except Exception:
        return 1

def run_optimized_aggregation():
    print(f"--- Démarrage de l'agrégation optimisée des prix médians ({datetime.now().strftime('%Y-%m-%d %H:%M')}) ---")
    
    try:
        supabase: Client = get_supabase_client()
    except Exception as e:
        print(f"Error initializing Supabase client: {e}")
        return

    # 1. Fetch catalog in bulk
    print("1. Téléchargement du catalogue de véhicules...")
    try:
        catalog_res = supabase.table("vehicle_catalog").select("brand, model, trim").execute()
        catalog_items = catalog_res.data or []
        print(f"   -> {len(catalog_items)} véhicules dans le catalogue.")
    except Exception as e:
        print(f"Error fetching vehicle catalog: {e}")
        catalog_items = []

    # Map brand/model to standard trim to handle cases
    catalog_trims = {}
    for item in catalog_items:
        b = item['brand'].strip().lower()
        m = item['model'].strip().lower()
        t = item.get('trim') or 'Standard'
        catalog_trims[(b, m)] = t

    # 2. Fetch all listings in bulk
    print("2. Téléchargement de toutes les annonces de la table 'listings'...")
    try:
        listings_res = supabase.table("listings").select("brand, model, year, price_asked, scraped_at, source").execute()
        raw_listings = listings_res.data or []
        all_listings = [l for l in raw_listings if l.get('source') != 'ouedkniss_reference']
        print(f"   -> {len(all_listings)} annonces réelles récupérées (après filtrage de {len(raw_listings) - len(all_listings)} annonces de simulation).")
    except Exception as e:
        print(f"Error fetching listings: {e}")
        all_listings = []

    # 3. Fetch all transactions in bulk
    print("3. Téléchargement de toutes les transactions de la table 'real_transactions'...")
    try:
        trans_res = supabase.table("real_transactions").select("brand, model, year, final_price").execute()
        all_trans = trans_res.data or []
        print(f"   -> {len(all_trans)} transactions récupérées.")
    except Exception as e:
        print(f"Error fetching transactions (RLS may apply): {e}")
        all_trans = []

    # 4. Fetch all expert prices in bulk
    print("4. Téléchargement de tous les prix experts de la table 'expert_prices'...")
    try:
        expert_res = supabase.table("expert_prices").select("brand, model, year, price").execute()
        all_experts = expert_res.data or []
        print(f"   -> {len(all_experts)} prix experts récupérés.")
    except Exception as e:
        print(f"Error fetching expert prices (RLS may apply): {e}")
        all_experts = []

    # 5. Group prices in-memory
    print("5. Regroupement et calcul statistique des prix médians...")
    prices_by_group = {}  # Key: (brand, model, trim, year) -> list of prices

    # Process listings with time-decay weighting
    for l in all_listings:
        brand = l.get('brand')
        model = l.get('model')
        year = l.get('year')
        price = l.get('price_asked')
        
        if not brand or not model or not year or not price or price <= 150000:
            continue
            
        b_key = brand.strip()
        m_key = model.strip()
        trim = catalog_trims.get((b_key.lower(), m_key.lower()), 'Standard')
        
        g_key = (b_key, m_key, trim, int(year))
        if g_key not in prices_by_group:
            prices_by_group[g_key] = []
        
        # Apply time-decay: fresher listings carry more weight in the median
        weight = time_decay_weight(l.get('scraped_at'))
        prices_by_group[g_key].extend([price] * weight)

    # Process transactions (Weight x3)
    for t in all_trans:
        brand = t.get('brand')
        model = t.get('model')
        year = t.get('year')
        price = t.get('final_price')
        
        if not brand or not model or not year or not price or price <= 150000:
            continue
            
        b_key = brand.strip()
        m_key = model.strip()
        trim = catalog_trims.get((b_key.lower(), m_key.lower()), 'Standard')
        
        g_key = (b_key, m_key, trim, int(year))
        if g_key not in prices_by_group:
            prices_by_group[g_key] = []
        prices_by_group[g_key].extend([price] * 3)

    # Process expert prices (Weight x2)
    for e in all_experts:
        brand = e.get('brand')
        model = e.get('model')
        year = e.get('year')
        price = e.get('price')
        
        if not brand or not model or not year or not price or price <= 150000:
            continue
            
        b_key = brand.strip()
        m_key = model.strip()
        trim = catalog_trims.get((b_key.lower(), m_key.lower()), 'Standard')
        
        g_key = (b_key, m_key, trim, int(year))
        if g_key not in prices_by_group:
            prices_by_group[g_key] = []
        prices_by_group[g_key].extend([price] * 2)

    # 6. Batch Upsert to Supabase
    print(f"6. Upsert de {len(prices_by_group)} groupes calculés vers 'prix_medians'...")
    total_upserted = 0
    total_errors = 0
    
    for g_key, prices in prices_by_group.items():
        brand, model, trim, year = g_key
        
        median_val = int(statistics.median(prices))
        min_val = int(get_percentile(prices, 0.1))
        max_val = int(get_percentile(prices, 0.9))
        
        # Round to thousands
        median_val = round(median_val / 1000) * 1000
        min_val = round(min_val / 1000) * 1000
        max_val = round(max_val / 1000) * 1000
        
        # Count only standard listings for nb_annonces field
        nb_annonces = sum(1 for l in all_listings if l.get('brand') == brand and l.get('model') == model and int(l.get('year', 0)) == year)
        
        data = {
            "brand": brand,
            "model": model,
            "trim": trim,
            "year": year,
            "prix_median": median_val,
            "prix_min": min_val,
            "prix_max": max_val,
            "nb_annonces": nb_annonces,
            "derniere_maj": datetime.now().isoformat()
        }
        
        try:
            supabase.table("prix_medians").upsert(data, on_conflict="brand,model,trim,year").execute()
            total_upserted += 1
            print(f"   [UPSERT OK] {brand} {model} ({year}) -> Median: {median_val:,} DZD")
        except Exception as err:
            total_errors += 1
            print(f"   [UPSERT ERR] {brand} {model} ({year}): {err}")
            
    print(f"\n--- Fin de l'agrégation optimisée ! {total_upserted} entrées upsertées avec succès ({total_errors} échecs RLS/DB).")

if __name__ == "__main__":
    run_optimized_aggregation()
