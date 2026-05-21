import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def fix_and_populate():
    print("--- Reprogrammation du catalogue (Mode Multi-Finition) ---")
    
    # Liste enrichie
    full_catalog = [
        # TOYOTA
        {"brand": "Toyota", "model": "Hilux", "trim": "Adventure"},
        {"brand": "Toyota", "model": "Hilux", "trim": "Revolution"},
        {"brand": "Toyota", "model": "Hilux", "trim": "GR Sport"},
        {"brand": "Toyota", "model": "Hilux", "trim": "Standard"},
        
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
        {"brand": "Peugeot", "model": "3008", "trim": "Allure"},
        {"brand": "Peugeot", "model": "3008", "trim": "GT"},
        
        # VW
        {"brand": "Volkswagen", "model": "Polo", "trim": "Match"},
        {"brand": "Volkswagen", "model": "Polo", "trim": "Highline"},
        {"brand": "Volkswagen", "model": "Golf 7", "trim": "Join"},
        {"brand": "Volkswagen", "model": "Golf 7", "trim": "R-Line"},
        {"brand": "Volkswagen", "model": "Golf 8", "trim": "R-Line"},
        
        # KIA / HYUNDAI / SEAT
        {"brand": "Kia", "model": "Picanto", "trim": "GT-Line"},
        {"brand": "Hyundai", "model": "Tucson", "trim": "N-Line"},
        {"brand": "Seat", "model": "Ibiza", "trim": "FR"},
        {"brand": "Seat", "model": "Leon", "trim": "FR"},
    ]

    try:
        # Pour contourner la contrainte unique (brand, model), on va supprimer les modeles generiques
        # qui n'ont pas de 'trim' avant d'inserer les versions specifiques.
        for item in full_catalog:
            supabase.table("vehicle_catalog").delete().eq("brand", item["brand"]).eq("model", item["model"]).is_("trim", "NULL").execute()
        
        # Insertion des nouvelles versions
        # On fait ca un par un pour eviter de tout bloquer si un doublon persiste
        count = 0
        for item in full_catalog:
            try:
                # Ajout des champs requis par la table
                item["year_from"] = 2010
                item["body_type"] = "berline"
                supabase.table("vehicle_catalog").insert(item).execute()
                count += 1
            except:
                continue
                
        print(f"--- Succes ! {count} versions specifiques sont maintenant disponibles.")
        
    except Exception as e:
        print(f"Erreur globale: {e}")

if __name__ == "__main__":
    fix_and_populate()
