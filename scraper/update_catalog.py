import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def update_catalog():
    print("--- Mise a jour du catalogue avec les sous-modeles ---")
    
    new_items = [
        {"brand": "Toyota", "model": "Hilux", "trim": "Adventure"},
        {"brand": "Toyota", "model": "Hilux", "trim": "Revolution"},
        {"brand": "Toyota", "model": "Hilux", "trim": "GR Sport"},
        {"brand": "Toyota", "model": "Hilux", "trim": "Standard"},
        {"brand": "Volkswagen", "model": "Golf", "trim": "R-Line"},
        {"brand": "Volkswagen", "model": "Golf", "trim": "GTD"},
        {"brand": "Volkswagen", "model": "Golf", "trim": "GTI"},
        {"brand": "Renault", "model": "Clio", "trim": "GT-Line"},
        {"brand": "Seat", "model": "Ibiza", "trim": "Highline"},
        {"brand": "Seat", "model": "Leon", "trim": "FR"},
        {"brand": "Dacia", "model": "Duster", "trim": "Extreme"},
        {"brand": "Hyundai", "model": "Tucson", "trim": "N-Line"},
    ]
    
    try:
        # On insere seulement si ca n'existe pas deja (ou on insere simplement, le catalogue n'a pas forcement de contrainte unique sur trim)
        res = supabase.table("vehicle_catalog").insert(new_items).execute()
        print(f"--- Succes ! {len(new_items)} sous-modeles ajoutes au catalogue.")
    except Exception as e:
        print(f"Erreur: {e}")

if __name__ == "__main__":
    update_catalog()
