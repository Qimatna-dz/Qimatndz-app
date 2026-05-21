import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def rebuild_catalog():
    print("--- RECONSTRUCTION TOTALE DU CATALOGUE VEHICULES ---")
    
    # 1. Truncate existing table to wipe out bad data
    print("1. Suppression des anciennes données...")
    try:
        # Note: supabase-js doesn't have a direct TRUNCATE without a filter, 
        # so we delete where id is not null (which is everything).
        supabase.table("vehicle_catalog").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    except Exception as e:
        print(f"Erreur lors du nettoyage: {e}")

    # 2. Curated Database
    vehicles = [
        # ==========================================
        # RENAULT
        # ==========================================
        {"brand": "Renault", "model": "Symbol", "trim": "Extrême", "body_type": "berline", "fuel_type": "essence"},
        {"brand": "Renault", "model": "Symbol", "trim": "Exception", "body_type": "berline", "fuel_type": "essence"},
        {"brand": "Renault", "model": "Symbol", "trim": "Standard", "body_type": "berline", "fuel_type": "essence"},
        {"brand": "Renault", "model": "Clio 4", "trim": "GT-Line", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Renault", "model": "Clio 4", "trim": "Intens", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Renault", "model": "Clio 4", "trim": "Limited", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Renault", "model": "Clio 5", "trim": "RS Line", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Renault", "model": "Clio Campus", "trim": "Standard", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Renault", "model": "Kangoo", "trim": "Standard", "body_type": "utilitaire", "fuel_type": "diesel"},
        {"brand": "Renault", "model": "Express", "trim": "Standard", "body_type": "utilitaire", "fuel_type": "diesel"},
        {"brand": "Renault", "model": "Megane", "trim": "GT-Line", "body_type": "berline", "fuel_type": "diesel"},
        {"brand": "Renault", "model": "Captur", "trim": "Intens", "body_type": "SUV", "fuel_type": "essence"},

        # ==========================================
        # DACIA
        # ==========================================
        {"brand": "Dacia", "model": "Logan", "trim": "Lauréate", "body_type": "berline", "fuel_type": "essence"},
        {"brand": "Dacia", "model": "Logan", "trim": "Privilège", "body_type": "berline", "fuel_type": "essence"},
        {"brand": "Dacia", "model": "Sandero", "trim": "Stepway", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Dacia", "model": "Sandero", "trim": "Extreme", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Dacia", "model": "Duster", "trim": "Prestige", "body_type": "SUV", "fuel_type": "diesel"},
        {"brand": "Dacia", "model": "Duster", "trim": "Extreme", "body_type": "SUV", "fuel_type": "diesel"},

        # ==========================================
        # PEUGEOT
        # ==========================================
        {"brand": "Peugeot", "model": "208", "trim": "Active", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Peugeot", "model": "208", "trim": "Allure", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Peugeot", "model": "208", "trim": "GT-Line", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Peugeot", "model": "308", "trim": "Allure", "body_type": "berline", "fuel_type": "diesel"},
        {"brand": "Peugeot", "model": "301", "trim": "Active", "body_type": "berline", "fuel_type": "essence"},
        {"brand": "Peugeot", "model": "301", "trim": "Allure", "body_type": "berline", "fuel_type": "essence"},
        {"brand": "Peugeot", "model": "2008", "trim": "Allure", "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Peugeot", "model": "3008", "trim": "GT-Line", "body_type": "SUV", "fuel_type": "diesel"},
        {"brand": "Peugeot", "model": "Partner", "trim": "Tepee", "body_type": "utilitaire", "fuel_type": "diesel"},

        # ==========================================
        # VOLKSWAGEN
        # ==========================================
        {"brand": "Volkswagen", "model": "Polo", "trim": "Match", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Volkswagen", "model": "Polo", "trim": "Highline", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Volkswagen", "model": "Polo", "trim": "Beats", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Volkswagen", "model": "Golf 7", "trim": "Join", "body_type": "citadine", "fuel_type": "diesel"},
        {"brand": "Volkswagen", "model": "Golf 7", "trim": "R-Line", "body_type": "citadine", "fuel_type": "diesel"},
        {"brand": "Volkswagen", "model": "Golf 8", "trim": "R-Line", "body_type": "citadine", "fuel_type": "diesel"},
        {"brand": "Volkswagen", "model": "Golf 8", "trim": "Style", "body_type": "citadine", "fuel_type": "diesel"},
        {"brand": "Volkswagen", "model": "Tiguan", "trim": "R-Line", "body_type": "SUV", "fuel_type": "diesel"},
        {"brand": "Volkswagen", "model": "Caddy", "trim": "Life", "body_type": "utilitaire", "fuel_type": "diesel"},
        {"brand": "Volkswagen", "model": "Amarok", "trim": "Aventura", "body_type": "pickup", "fuel_type": "diesel"},

        # ==========================================
        # SEAT & SKODA
        # ==========================================
        {"brand": "Seat", "model": "Ibiza", "trim": "Style", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Seat", "model": "Ibiza", "trim": "FR", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Seat", "model": "Leon", "trim": "FR", "body_type": "berline", "fuel_type": "diesel"},
        {"brand": "Seat", "model": "Arona", "trim": "FR", "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Skoda", "model": "Fabia", "trim": "Style", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Skoda", "model": "Octavia", "trim": "Style", "body_type": "berline", "fuel_type": "diesel"},

        # ==========================================
        # HYUNDAI & KIA
        # ==========================================
        {"brand": "Hyundai", "model": "i10", "trim": "Grand", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Hyundai", "model": "Accent", "trim": "GLS", "body_type": "berline", "fuel_type": "essence"},
        {"brand": "Hyundai", "model": "Tucson", "trim": "N-Line", "body_type": "SUV", "fuel_type": "diesel"},
        {"brand": "Hyundai", "model": "Tucson", "trim": "Ultimate", "body_type": "SUV", "fuel_type": "diesel"},
        {"brand": "Hyundai", "model": "Creta", "trim": "Highline", "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Kia", "model": "Picanto", "trim": "LX", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Kia", "model": "Picanto", "trim": "GT-Line", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Kia", "model": "Rio", "trim": "EX", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Kia", "model": "Sportage", "trim": "GT-Line", "body_type": "SUV", "fuel_type": "diesel"},
        {"brand": "Kia", "model": "Sportage", "trim": "Premium", "body_type": "SUV", "fuel_type": "diesel"},

        # ==========================================
        # TOYOTA
        # ==========================================
        {"brand": "Toyota", "model": "Yaris", "trim": "Style", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Toyota", "model": "Corolla", "trim": "Dynamic", "body_type": "berline", "fuel_type": "essence"},
        {"brand": "Toyota", "model": "Hilux", "trim": "Single Cabin", "body_type": "pickup", "fuel_type": "diesel"},
        {"brand": "Toyota", "model": "Hilux", "trim": "Double Cabin", "body_type": "pickup", "fuel_type": "diesel"},
        {"brand": "Toyota", "model": "Hilux", "trim": "Adventure", "body_type": "pickup", "fuel_type": "diesel"},
        {"brand": "Toyota", "model": "Hilux", "trim": "GR Sport", "body_type": "pickup", "fuel_type": "diesel"},
        {"brand": "Toyota", "model": "Prado", "trim": "TXL", "body_type": "SUV", "fuel_type": "diesel"},
        {"brand": "Toyota", "model": "Prado", "trim": "Adventure", "body_type": "SUV", "fuel_type": "diesel"},
        {"brand": "Toyota", "model": "Land Cruiser", "trim": "LC300 VXR", "body_type": "SUV", "fuel_type": "diesel"},
        {"brand": "Toyota", "model": "Land Cruiser", "trim": "LC300 GR Sport", "body_type": "SUV", "fuel_type": "diesel"},

        # ==========================================
        # PREMIUM (AUDI, MERCEDES, BMW, RANGE ROVER)
        # ==========================================
        {"brand": "Audi", "model": "A3", "trim": "S-Line", "body_type": "citadine", "fuel_type": "diesel"},
        {"brand": "Audi", "model": "Q3", "trim": "S-Line", "body_type": "SUV", "fuel_type": "diesel"},
        {"brand": "Audi", "model": "Q5", "trim": "S-Line", "body_type": "SUV", "fuel_type": "diesel"},
        {"brand": "Mercedes", "model": "Classe A", "trim": "AMG Line", "body_type": "citadine", "fuel_type": "diesel"},
        {"brand": "Mercedes", "model": "Classe C", "trim": "AMG Line", "body_type": "berline", "fuel_type": "diesel"},
        {"brand": "Mercedes", "model": "GLC", "trim": "AMG Line", "body_type": "SUV", "fuel_type": "diesel"},
        {"brand": "BMW", "model": "Série 1", "trim": "M Sport", "body_type": "citadine", "fuel_type": "diesel"},
        {"brand": "BMW", "model": "X1", "trim": "M Sport", "body_type": "SUV", "fuel_type": "diesel"},
        {"brand": "Range Rover", "model": "Evoque", "trim": "R-Dynamic", "body_type": "SUV", "fuel_type": "diesel"},
        {"brand": "Range Rover", "model": "Velar", "trim": "R-Dynamic", "body_type": "SUV", "fuel_type": "diesel"},

        # ==========================================
        # CHINESE (GEELY, CHERY, JETOUR, MG, DFSK)
        # ==========================================
        {"brand": "Geely", "model": "GX3 Pro", "trim": "Start", "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Geely", "model": "GX3 Pro", "trim": "GF", "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Geely", "model": "Coolray", "trim": "GL", "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Geely", "model": "Coolray", "trim": "GF", "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Chery", "model": "Tiggo 2 Pro", "trim": "Comfort", "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Chery", "model": "Tiggo 2 Pro", "trim": "Luxury", "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Chery", "model": "Tiggo 4 Pro", "trim": "Luxury", "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Jetour", "model": "Traveller T2", "trim": "Luxury", "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Jetour", "model": "Dashing", "trim": "Luxury", "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "MG", "model": "ZS", "trim": "Luxury", "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "MG", "model": "HS", "trim": "Luxury", "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "DFSK", "model": "Glory 580", "trim": "Luxury", "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "DFSK", "model": "K01S", "trim": "Standard", "body_type": "utilitaire", "fuel_type": "essence"},
        
        # ==========================================
        # SUZUKI & FIAT (Budget/Popular)
        # ==========================================
        {"brand": "Suzuki", "model": "Swift", "trim": "GLX", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Suzuki", "model": "Swift", "trim": "Dzire", "body_type": "berline", "fuel_type": "essence"},
        {"brand": "Suzuki", "model": "Alto", "trim": "Standard", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Fiat", "model": "500", "trim": "Club", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Fiat", "model": "500", "trim": "Dolcevita", "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Fiat", "model": "Tipo", "trim": "Life", "body_type": "berline", "fuel_type": "essence"},
        {"brand": "Fiat", "model": "Doblo", "trim": "Commercial", "body_type": "utilitaire", "fuel_type": "diesel"},
    ]

    print("2. Insertion des données pures...")
    success_count = 0
    
    # Batch insertion requires everything to be perfectly structured
    try:
        # Give them year_from 2010 to 2026 and popular flags
        for v in vehicles:
            v["year_from"] = 2010
            v["year_to"] = 2026
            v["popular"] = True
            
        res = supabase.table("vehicle_catalog").insert(vehicles).execute()
        success_count = len(vehicles)
        print(f"✅ Succès ! {success_count} véhicules insérés.")
    except Exception as e:
        print(f"❌ Erreur lors de l'insertion par lot : {e}")

if __name__ == "__main__":
    rebuild_catalog()
