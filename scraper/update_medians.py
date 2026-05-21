import os
import statistics
from datetime import datetime
from supabase import Client
from db import get_supabase_client

supabase: Client = get_supabase_client()

def get_percentile(data, percentile):
    if not data:
        return 0
    size = len(data)
    return sorted(data)[int(round(percentile * size + 0.5)) - 1]

def update_medians():
    print(f"--- Démarrage de la mise à jour des prix médians ({datetime.now().strftime('%Y-%m-%d %H:%M')}) ---")
    
    # 1. Récupérer tout le catalogue pour savoir quoi calculer
    catalog_res = supabase.table("vehicle_catalog").select("brand, model, trim").execute()
    catalog = catalog_res.data
    
    # 2. Définir les années à couvrir (ex: 2005 à 2025)
    current_year = datetime.now().year
    years = range(2005, current_year + 2)
    
    total_updated = 0
    
    for entry in catalog:
        brand = entry['brand']
        model = entry['model']
        trim = entry.get('trim', 'Standard') or 'Standard'
        
        for year in years:
            prices = []
            
            # Source A: Listings (Weight 1)
            listings_res = supabase.table("listings").select("price_asked").eq("brand", brand).eq("model", model).eq("year", year).execute()
            if listings_res.data:
                # Filtrer les prix aberrants (< 150k DZD)
                prices.extend([l['price_asked'] for l in listings_res.data if l['price_asked'] > 150000])
            
            # Source B: Transactions (Weight 3 - Duplicate data to simulate weight)
            trans_res = supabase.table("real_transactions").select("final_price").eq("brand", brand).eq("model", model).eq("year", year).execute()
            if trans_res.data:
                for t in trans_res.data:
                    prices.extend([t['final_price']] * 3)
            
            # Source C: Expert (Weight 2)
            expert_res = supabase.table("expert_prices").select("price").eq("brand", brand).eq("model", model).eq("year", year).execute()
            if expert_res.data:
                for e in expert_res.data:
                    prices.extend([e['price']] * 2)
            
            if not prices:
                continue
                
            # Calculs statistiques
            median_val = int(statistics.median(prices))
            min_val = int(get_percentile(prices, 0.1))
            max_val = int(get_percentile(prices, 0.9))
            nb_annonces = len(listings_res.data) if listings_res.data else 0
            
            # Arrondir au millier
            median_val = round(median_val / 1000) * 1000
            min_val = round(min_val / 1000) * 1000
            max_val = round(max_val / 1000) * 1000
            
            # Upsert dans prix_medians
            try:
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
                
                # Check if exists for UPSERT (Supabase .upsert uses unique constraint)
                supabase.table("prix_medians").upsert(data, on_conflict="brand,model,trim,year").execute()
                total_updated += 1
                
                if total_updated % 10 == 0:
                    print(f"   [{total_updated}] {brand} {model} {year} mis à jour...")
                    
            except Exception as e:
                print(f"   [ERR] Erreur lors de l'upsert pour {brand} {model} {year}: {e}")

    print(f"\n--- Mise à jour terminée ! {total_updated} entrées traitées.")

if __name__ == "__main__":
    update_medians()
