import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Reconfigure stdout to use UTF-8 if possible
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Set up paths to import from scraper
sys.path.append(str(Path(__file__).parent))

from db import get_supabase_client
from update_medians_optimized import run_optimized_aggregation

def purify_database():
    print("=== DEMARRAGE DE LA PURIFICATION DE LA BASE DE DONNEES ===")
    
    try:
        supabase = get_supabase_client()
    except Exception as e:
        print(f"Erreur d'initialisation de Supabase : {e}")
        return

    # 1. Suppression des annonces de simulation (source == 'ouedkniss_reference')
    print("\n1. Suppression des annonces de simulation ('ouedkniss_reference')...")
    try:
        # Check count first
        check_sim = supabase.table("listings").select("id", count="exact").eq("source", "ouedkniss_reference").execute()
        sim_count = check_sim.count if hasattr(check_sim, 'count') else len(check_sim.data or [])
        print(f"   -> Nombre d'annonces de simulation detectees : {sim_count}")
        
        if sim_count > 0:
            del_res = supabase.table("listings").delete().eq("source", "ouedkniss_reference").execute()
            print(f"   -> Suppression reussie de {len(del_res.data or [])} annonces de simulation.")
        else:
            print("   -> Aucune annonce de simulation a supprimer.")
    except Exception as e:
        print(f"   -> Erreur lors de la suppression des simulations : {e}")

    # 2. Correction des vraies annonces corrompues par l'ancien filtre x10
    print("\n2. Detection et correction des vraies annonces corrompues par l'ancien filtre x10...")
    
    # Modeles standards et economiques qui ne depassent jamais 5 000 000 DZD dans la realite
    standard_models = [
        "symbol", "logan", "sandero", "clio", "208", "301", "swift", 
        "alto", "picanto", "rio", "ibiza", "qq", "spark", "atos", 
        "accent", "i10", "c3", "polo"
    ]
    
    try:
        # Fetch high-priced listings that are not simulation
        high_price_res = supabase.table("listings").select("id, brand, model, year, price_asked, source").neq("source", "ouedkniss_reference").gte("price_asked", 5000000).execute()
        candidate_listings = high_price_res.data or []
        print(f"   -> {len(candidate_listings)} annonces de prix >= 5 000 000 DZD detectees.")
        
        corrected_count = 0
        for l in candidate_listings:
            model_lower = (l.get("model") or "").lower()
            # If the model is in our standard/economic list, its price is definitely multiplied by 10 by mistake
            if any(m in model_lower for m in standard_models):
                old_price = l.get("price_asked")
                new_price = int(old_price / 10)
                
                # Round to nearest thousand
                new_price = round(new_price / 1000) * 1000
                
                print(f"   [CORRECTION] {l.get('brand')} {l.get('model')} ({l.get('year')}) de {l.get('source')} : {old_price:,} DZD -> {new_price:,} DZD")
                
                # Update in DB
                supabase.table("listings").update({"price_asked": new_price}).eq("id", l.get("id")).execute()
                corrected_count += 1
                
        print(f"   -> {corrected_count} annonces reelles corrompues ont ete corrigees avec succes.")
    except Exception as e:
        print(f"   -> Erreur lors de la correction des annonces reelles : {e}")

    # 3. Lancement de la re-agregation des prix medians
    print("\n3. Recalcul des prix medians de reference...")
    try:
        run_optimized_aggregation()
        print("\n=== PURIFICATION ET RE-CALCUL DES MEDIANS TERMINES AVEC SUCCES ===")
    except Exception as e:
        print(f"\n=== ERREUR PENDANT LE RE-CALCUL DES MEDIANS : {e} ===")

if __name__ == "__main__":
    purify_database()
