import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def list_catalog():
    print("--- Catalogue des Vehicules Scrapes ---")
    try:
        response = supabase.table("vehicle_catalog").select("brand, model").execute()
        data = response.data
        if not data:
            print("Le catalogue est vide.")
            return
            
        # Trier par marque puis modele
        sorted_data = sorted(data, key=lambda x: (x['brand'], x['model']))
        
        current_brand = ""
        for entry in sorted_data:
            if entry['brand'] != current_brand:
                current_brand = entry['brand']
                print(f"\n[{current_brand}]")
            print(f"  - {entry['model']}")
            
        print(f"\nTotal: {len(data)} modeles configures.")
        
    except Exception as e:
        print(f"Erreur: {e}")

if __name__ == "__main__":
    list_catalog()
