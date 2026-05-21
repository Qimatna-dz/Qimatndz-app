import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def seed_china_imports():
    print("--- Seeding Import Chine (Geely, Chery, MG) ---")
    
    # Données basées sur les barèmes officiels 2024-2025 en Algérie
    # Ces prix sont déjà dédouanés ou "clés en main" (concessionnaires)
    listings = [
        {
            "brand": "Geely",
            "model": "GX3 Pro",
            "trim": "GC",
            "year": 2024,
            "price_asked": 1970000,
            "source": "geely-algerie.com",
            "listing_type": "import_chine",
            "url": "import/geely/gx3pro/2024/gc"
        },
        {
            "brand": "Geely",
            "model": "Coolray",
            "trim": "GF",
            "year": 2024,
            "price_asked": 3360000,
            "source": "geely-algerie.com",
            "listing_type": "import_chine",
            "url": "import/geely/coolray/2024/gf"
        },
        {
            "brand": "Chery",
            "model": "Tiggo 2 Pro",
            "trim": "Comfort",
            "year": 2024,
            "price_asked": 1990000,
            "source": "chery-algerie.com",
            "listing_type": "import_chine",
            "url": "import/chery/tiggo2pro/2024"
        },
        {
            "brand": "Chery",
            "model": "Tiggo 4 Pro",
            "trim": "Luxury",
            "year": 2024,
            "price_asked": 2990000,
            "source": "chery-algerie.com",
            "listing_type": "import_chine",
            "url": "import/chery/tiggo4pro/2024"
        }
    ]
    
    inserted = 0
    for listing in listings:
        try:
            supabase.table("listings").upsert(listing, on_conflict="url").execute()
            inserted += 1
            print(f"   [OK] {listing['brand']} {listing['model']} ({listing['year']}) ajouté.")
        except Exception as e:
            print(f"   [ERR] {e}")
            
    print(f"--- Terminé. {inserted} véhicules chinois ajoutés.")

if __name__ == "__main__":
    seed_china_imports()
