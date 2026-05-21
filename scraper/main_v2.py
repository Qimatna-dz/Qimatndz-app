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
        listings = scrape_all(max_pages_per_model=15)

        if not listings:
            print("[WARN] Aucune annonce recuperee - lancement du seed de secours")
            seed()
            update_scraper_status("Ouedkniss Crawler (Flux A)", "OK", records_added=0)
            return

        inserted = 0
        skipped = 0

        for listing in listings:
            if insert_listing(listing, client):
                inserted += 1
            else:
                skipped += 1

        print("\n--- Scraping termine")
        print(f"   {inserted} nouvelles annonces insérées")
        print(f"   {skipped} doublons ignorés")
        print(f"   Total traité : {len(listings)}")
        
        update_scraper_status("Ouedkniss Crawler (Flux A)", "OK", records_added=inserted)
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
