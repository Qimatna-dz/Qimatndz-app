import requests
import json
import time
import os
import sys
from pathlib import Path

# Add the parent directory to sys.path to allow imports from db.py
sys.path.insert(0, str(Path(__file__).parent))

from db import get_supabase_client, insert_listing, get_vehicle_catalog, update_scraper_status

API_URL = "https://www.sogauto.dz/fr/api/listing/all"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.sogauto.dz/fr/acheter",
    "Accept": "application/json, text/plain, */*",
}

def clean_wilaya(wilaya_raw: str) -> str:
    """Nettoie le nom de la wilaya de Sogauto (ex: '10 - Bouira' -> 'Bouira')."""
    if not wilaya_raw:
        return "Alger"
    wilaya_raw = str(wilaya_raw).strip()
    if " - " in wilaya_raw:
        return wilaya_raw.split(" - ")[1].strip()
    return wilaya_raw

def scrape_sogauto(max_pages: int = 100) -> list:
    """
    Scrape le feed global de Sogauto.dz page par page.
    Filtre les véhicules selon notre catalogue de référence.
    """
    client = get_supabase_client()
    catalog = get_vehicle_catalog(client)
    
    # Créer un dictionnaire de mapping pour une recherche O(1) et insensible à la casse
    # Clé : (brand_lower, model_lower) -> Valeur : (brand_exact, model_exact)
    catalog_map = {}
    for entry in catalog:
        b = entry.get("brand")
        m = entry.get("model")
        if b and m:
            catalog_map[(b.lower().strip(), m.lower().strip())] = (b.strip(), m.strip())
            
    print(f"--- Catalogue de référence chargé : {len(catalog_map)} modèles uniques.")
    print(f"--- Lancement du scraping Sogauto.dz (max {max_pages} pages de 50 annonces soit ~{max_pages * 50:,} ann/cycle)...")
    
    all_results = []
    
    for page in range(1, max_pages + 1):
        params = {
            "limit": 50,
            "page": page,
            "sortBy": "newest"
        }
        
        print(f"   Page {page} - Requete API...")
        try:
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    response = requests.get(API_URL, params=params, headers=HEADERS, timeout=30)
                    break
                except requests.exceptions.RequestException as e:
                    if attempt == max_retries - 1:
                        raise
                    print(f"   [WARN] Erreur connexion (tentative {attempt+1}/{max_retries}): {e}. Nouvelle tentative...")
                    time.sleep(3)
                    
            if response.status_code != 200:
                print(f"   [WARN] Status code {response.status_code} page {page}. Fin du scraping.")
                break
                
            data = response.json()
            listings = data.get("data", [])
            if not listings:
                print(f"   Page {page} - Plus d'annonces disponibles.")
                break
                
            matched_count = 0
            for item in listings:
                try:
                    brand_name = (item.get("brandName") or "").strip()
                    model_name = (item.get("modelName") or "").strip()
                    
                    key = (brand_name.lower(), model_name.lower())
                    if key not in catalog_map:
                        # Skip if it is not in our vehicle catalog to keep data clean
                        continue
                        
                    # Obtenir les noms exacts du catalogue de référence
                    exact_brand, exact_model = catalog_map[key]
                    
                    # Convertir le prix
                    price_raw = item.get("price")
                    if not price_raw:
                        continue
                    price = int(float(price_raw))
                    
                    # Validation prix raisonnable (jusqu'à 250M pour le luxe)
                    if not (100000 <= price <= 25000000):
                        continue
                        
                    year = item.get("year")
                    if not year:
                        continue
                        
                    mileage = item.get("mileage")
                    if mileage is None or mileage < 0:
                        mileage = 80000
                        
                    # Extraire wilaya
                    wilaya_raw = item.get("user", {}).get("wilaya") or "Alger"
                    wilaya = clean_wilaya(wilaya_raw)
                    
                    # Créer l'URL unique basée sur l'ID
                    listing_id = item.get("id")
                    url = f"https://www.sogauto.dz/fr/acheter/details/{listing_id}"
                    
                    # Extraire finition et motorisation pour le sous-modèle (trim)
                    finition = item.get("finitionName")
                    motorisation = item.get("motorisationName")
                    
                    trim_parts = []
                    if finition and str(finition).strip() and str(finition).lower() != "none":
                        trim_parts.append(str(finition).strip())
                    if motorisation and str(motorisation).strip() and str(motorisation).lower() != "none":
                        trim_parts.append(str(motorisation).strip())
                        
                    trim = " ".join(trim_parts) if trim_parts else None

                    # Date de publication de l'annonce chez Sogauto (date du vendeur)
                    annonce_posted_raw = item.get("publishedAt") or item.get("createdAt") or item.get("created_at")

                    listing_data = {
                        "source": "sogauto",
                        "brand": exact_brand,
                        "model": exact_model,
                        "year": int(year),
                        "mileage": int(mileage),
                        "price_asked": price,
                        "wilaya": wilaya,
                        "condition": "bon",
                        "url": url,
                        "trim": trim,
                        # Horodatage d'origine : quand l'annonce a été publiée sur Sogauto
                        "annonce_posted_at": annonce_posted_raw,
                    }
                    
                    all_results.append(listing_data)
                    matched_count += 1
                    
                except Exception as ex:
                    # Ignorer les erreurs d'une annonce individuelle
                    continue
                    
            print(f"   Page {page} - {len(listings)} annonces traitees, {matched_count} concordantes avec le catalogue.")
            time.sleep(1.5)
            
        except Exception as e:
            print(f"   [ERROR] Erreur page {page}: {e}")
            break
            
    return all_results

def run_scraper():
    print("=" * 50)
    print("  Sogauto.dz Scraper Integration")
    print("=" * 50)
    
    try:
        try:
            client = get_supabase_client()
            print("--- Connexion Supabase OK")
        except Exception as e:
            print(f"[ERROR] Connexion Supabase echouee: {e}")
            update_scraper_status("Sogauto Crawler", "ERROR", error_message=f"DB connection failed: {e}")
            return
            
        listings = scrape_sogauto(max_pages=200)
        if not listings:
            print("[WARN] Aucune annonce recuperee de Sogauto.")
            update_scraper_status("Sogauto Crawler", "OK", records_added=0)
            return
            
        print(f"\n--- Debut de l'insertion en base ({len(listings)} annonces)")
        inserted = 0
        skipped = 0
        
        for l in listings:
            if insert_listing(l, client):
                inserted += 1
            else:
                skipped += 1
                
        print("\n--- Scraping Sogauto.dz termine !")
        print(f"   {inserted} nouvelles annonces insérées")
        print(f"   {skipped} doublons ignorés")
        print(f"   Total traité : {len(listings)}")
        
        update_scraper_status("Sogauto Crawler", "OK", records_added=inserted)
    except Exception as e:
        print(f"[ERROR] Erreur globale scraper Sogauto: {e}")
        update_scraper_status("Sogauto Crawler", "ERROR", error_message=str(e))

if __name__ == "__main__":
    run_scraper()
