import os
import sys
from pathlib import Path
from supabase import Client
from db import get_supabase_client
from credibility_filter import evaluate_credibility

# Force UTF-8 encoding for stdout on Windows terminal
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def purify_database():
    print("=================================================================")
    print("       PURIFICATION INTELLIGENTE DE LA BASE QIMATNADZ")
    print("=================================================================\n")
    
    try:
        supabase: Client = get_supabase_client()
    except Exception as e:
        print(f"Error initializing Supabase client: {e}")
        return

    print("1. Téléchargement de toutes les annonces de la table 'listings'...")
    try:
        res = supabase.table("listings").select("*").execute()
        listings = res.data or []
        print(f"   -> {len(listings)} annonces trouvées au total.")
    except Exception as e:
        print(f"Error fetching listings: {e}")
        return

    if not listings:
        print("Aucune annonce à traiter.")
        return

    deleted_count = 0
    updated_count = 0
    clean_count = 0

    print("\n2. Analyse et nettoyage en cours...")
    
    for l in listings:
        listing_id = l.get("id")
        brand = l.get("brand")
        model = l.get("model")
        year = l.get("year")
        price = l.get("price_asked")
        mileage = l.get("mileage")
        url = l.get("url")
        
        # Build evaluation payload
        payload = {
            "brand": brand,
            "model": model,
            "year": year,
            "mileage": mileage,
            "price_asked": price,
            "source": l.get("source"),
            "url": url
        }
        
        result = evaluate_credibility(payload)
        
        if not result.get("is_credible", True):
            # Suspicious - DELETE
            print(f"   [🔴 SUPPRIMER] {brand} {model} ({year}) - Prix initial: {price:,} DZD. Raison : {result.get('reason')}")
            try:
                supabase.table("listings").delete().eq("id", listing_id).execute()
                deleted_count += 1
            except Exception as delete_err:
                print(f"      [ERR] Erreur de suppression: {delete_err}")
                
        elif result.get("corrected_price") and result.get("corrected_price") != price:
            # Typo - UPDATE
            corrected = result.get("corrected_price")
            print(f"   [🟡 CORRIGER] {brand} {model} ({year}) - Prix corrigé: {price:,} DZD -> {corrected:,} DZD. Raison : {result.get('reason')}")
            try:
                supabase.table("listings").update({"price_asked": corrected}).eq("id", listing_id).execute()
                updated_count += 1
            except Exception as update_err:
                print(f"      [ERR] Erreur de mise à jour: {update_err}")
        else:
            # Already clean!
            clean_count += 1

    print("\n=================================================================")
    print("                    BILAN DE LA PURIFICATION                    ")
    print("=================================================================")
    print(f"   - Annonces conservées propres : {clean_count}")
    print(f"   - Annonces suspectes supprimées : {deleted_count}")
    print(f"   - Prix erronés corrigés : {updated_count}")
    print(f"   - Total traité : {len(listings)}")
    print("=================================================================\n")

    # 3. Recalculate medians using only cleaned listings!
    print("3. Lancement de la mise à jour des prix médians avec la base nettoyée...")
    try:
        from update_medians_optimized import run_optimized_aggregation
        run_optimized_aggregation()
    except Exception as agg_err:
        print(f"Erreur lors de la mise à jour des médians : {agg_err}")

if __name__ == "__main__":
    purify_database()
