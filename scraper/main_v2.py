"""
main_v2.py — Scraper principal QimatnaDz.
Utilise l'API GraphQL Ouedkniss + fallback seed si pas de connexion.

Usage:
  python main_v2.py           → scrape + seed
  python main_v2.py --seed    → seed uniquement (données référence)
  python main_v2.py --scrape  → scrape uniquement
"""

import sys
import os
from pathlib import Path

# Add the current directory to sys.path to allow absolute imports of local modules
sys.path.insert(0, os.path.dirname(__file__))

from db import get_supabase_client, insert_listing, update_scraper_status
from ouedkniss_api import scrape_all
from seed_data import seed


def run_scraper(client):
    print("\n--- Lancement du scraping Ouedkniss (GraphQL)...")
    try:
        from ouedkniss_api import get_models_to_scrape, scrape_model_graphql
        from db import insert_listings_batch
        import time

        models_to_scrape = get_models_to_scrape()
        
        if not models_to_scrape:
            print("[WARN] Aucun modèle trouvé - lancement du seed de secours")
            seed()
            update_scraper_status("Ouedkniss Crawler (Flux A)", "OK", records_added=0)
            return

        total_inserted = 0
        total_skipped = 0
        total_scraped = 0

        for brand, model in models_to_scrape:
            print(f"\n[MODEL] Scraping {brand} {model}...")
            results = scrape_model_graphql(brand, model, max_pages=15)
            
            if results:
                inserted, skipped = insert_listings_batch(results, client)
                total_inserted += inserted
                total_skipped += skipped
                total_scraped += len(results)
                print(f"   -> {len(results)} annonces extraites | {inserted} insérées en base")
            else:
                print(f"   -> 0 annonces valides")
            
            time.sleep(2)

        print("\n--- Scraping termine")
        print(f"   {total_inserted} nouvelles annonces insérées")
        print(f"   {total_skipped} doublons ou rejets ignorés")
        print(f"   Total traité : {total_scraped}")
        
        update_scraper_status("Ouedkniss Crawler (Flux A)", "OK", records_added=total_inserted)
    except Exception as e:
        print(f"[ERROR] Erreur pendant l'exécution d'Ouedkniss: {e}")
        update_scraper_status("Ouedkniss Crawler (Flux A)", "ERROR", error_message=str(e))


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "--all"

    print("=" * 50)
    print("  QimatnaDz Scraper v2")
    print("=" * 50)

    try:
        client = get_supabase_client()
        print("--- Connexion Supabase OK\n")
    except Exception as e:
        print(f"[ERROR] Connexion Supabase echouee: {e}")
        print("Vérifie ton fichier scraper/.env")
        return

    if mode == "--seed":
        print("--- Mode seed uniquement")
        seed()

    elif mode == "--scrape":
        print("--- Mode scraping uniquement")
        run_scraper(client)

    else:
        # Par défaut : seed d'abord, puis scrape
        print("--- Etape 1 - Seed des données de référence")
        seed()

        print("\n--- Etape 2 - Scraping Ouedkniss en temps réel")
        run_scraper(client)

    print("\n--- Termine. Lance l'app et teste une evaluation !")


if __name__ == "__main__":
    main()
