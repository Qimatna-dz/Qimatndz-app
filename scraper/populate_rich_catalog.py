import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def populate_rich_catalog():
    print("--- Enrichissement du catalogue avec les finitions Algerie ---")
    
    trims_to_add = [
        # DACIA
        {"brand": "Dacia", "model": "Logan", "trim": "Lauréate"},
        {"brand": "Dacia", "model": "Logan", "trim": "Privilège"},
        {"brand": "Dacia", "model": "Sandero", "trim": "Stepway"},
        {"brand": "Dacia", "model": "Sandero", "trim": "Black Edition"},
        
        # RENAULT
        {"brand": "Renault", "model": "Symbol", "trim": "Exception"},
        {"brand": "Renault", "model": "Symbol", "trim": "Extrême"},
        {"brand": "Renault", "model": "Clio 4", "trim": "GT-Line"},
        {"brand": "Renault", "model": "Clio 4", "trim": "Limited"},
        {"brand": "Renault", "model": "Clio 4", "trim": "Intens"},
        
        # PEUGEOT
        {"brand": "Peugeot", "model": "208", "trim": "GT-Line"},
        {"brand": "Peugeot", "model": "208", "trim": "Allure"},
        {"brand": "Peugeot", "model": "208", "trim": "Active"},
        {"brand": "Peugeot", "model": "301", "trim": "Allure"},
        {"brand": "Peugeot", "model": "3008", "trim": "Allure"},
        {"brand": "Peugeot", "model": "3008", "trim": "GT"},
        
        # VW
        {"brand": "Volkswagen", "model": "Polo", "trim": "Beats"},
        {"brand": "Volkswagen", "model": "Polo", "trim": "Match"},
        {"brand": "Volkswagen", "model": "Polo", "trim": "Highline"},
        {"brand": "Volkswagen", "model": "Golf 7", "trim": "Join"},
        {"brand": "Volkswagen", "model": "Golf 7", "trim": "Carat"},
        {"brand": "Volkswagen", "model": "Golf 8", "trim": "R-Line"},
        
        # HYUNDAI
        {"brand": "Hyundai", "model": "Accent", "trim": "GLS"},
        {"brand": "Hyundai", "model": "Tucson", "trim": "N-Line"},
        {"brand": "Hyundai", "model": "i10", "trim": "Grand"},
        
        # KIA
        {"brand": "Kia", "model": "Picanto", "trim": "GT-Line"},
        {"brand": "Kia", "model": "Picanto", "trim": "LX"},
        {"brand": "Kia", "model": "Rio", "trim": "EX"},
        {"brand": "Kia", "model": "Sportage", "trim": "GT-Line"},
        
        # SEAT
        {"brand": "Seat", "model": "Ibiza", "trim": "FR"},
        {"brand": "Seat", "model": "Ibiza", "trim": "Highline"},
    ]
    
    try:
        res = supabase.table("vehicle_catalog").insert(trims_to_add).execute()
        print(f"--- Succes ! {len(trims_to_add)} finitions majeures ajoutees.")
    except Exception as e:
        print(f"Erreur: {e}")

if __name__ == "__main__":
    populate_rich_catalog()
