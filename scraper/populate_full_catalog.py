import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def populate_full_catalog():
    print("--- Enrichissement exhaustif du catalogue Qimatna DZ ---")
    
    vehicles = [
        # ==========================================
        # JETOUR
        # ==========================================
        {"brand": "Jetour", "model": "Traveller T2", "trim": "Luxury", "year_from": 2023, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Jetour", "model": "Traveller T2", "trim": "4WD", "year_from": 2023, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Jetour", "model": "Dashing", "trim": "Comfort", "year_from": 2022, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Jetour", "model": "Dashing", "trim": "Luxury", "year_from": 2022, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Jetour", "model": "X70", "trim": "Comfort", "year_from": 2020, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Jetour", "model": "X70", "trim": "Luxury", "year_from": 2020, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Jetour", "model": "X70 Plus", "trim": "Comfort", "year_from": 2021, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Jetour", "model": "X70 Plus", "trim": "Luxury", "year_from": 2021, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Jetour", "model": "X90 Plus", "trim": "Luxury", "year_from": 2021, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},

        # ==========================================
        # CHERY
        # ==========================================
        {"brand": "Chery", "model": "Tiggo 2 Pro", "trim": "Comfort", "year_from": 2020, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Chery", "model": "Tiggo 2 Pro", "trim": "Luxury", "year_from": 2020, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Chery", "model": "Tiggo 4 Pro", "trim": "Comfort", "year_from": 2021, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Chery", "model": "Tiggo 4 Pro", "trim": "Luxury", "year_from": 2021, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Chery", "model": "Tiggo 7 Pro", "trim": "Comfort", "year_from": 2020, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Chery", "model": "Tiggo 7 Pro", "trim": "Luxury", "year_from": 2020, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Chery", "model": "Tiggo 8 Pro", "trim": "Comfort", "year_from": 2020, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Chery", "model": "Tiggo 8 Pro", "trim": "Luxury", "year_from": 2020, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Chery", "model": "Tiggo 8 Max", "trim": "Luxury", "year_from": 2022, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Chery", "model": "Arrizo 5", "trim": "Comfort", "year_from": 2016, "year_to": 2026, "body_type": "berline", "fuel_type": "essence"},
        {"brand": "Chery", "model": "Arrizo 5", "trim": "Luxury", "year_from": 2016, "year_to": 2026, "body_type": "berline", "fuel_type": "essence"},
        {"brand": "Chery", "model": "Arrizo 8", "trim": "Luxury", "year_from": 2022, "year_to": 2026, "body_type": "berline", "fuel_type": "essence"},

        # ==========================================
        # GEELY
        # ==========================================
        {"brand": "Geely", "model": "GX3 Pro", "trim": "Start", "year_from": 2020, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Geely", "model": "GX3 Pro", "trim": "GF", "year_from": 2020, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Geely", "model": "Coolray", "trim": "GL", "year_from": 2020, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Geely", "model": "Coolray", "trim": "GK", "year_from": 2020, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Geely", "model": "Coolray", "trim": "GF", "year_from": 2020, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Geely", "model": "Emgrand", "trim": "GL", "year_from": 2020, "year_to": 2026, "body_type": "berline", "fuel_type": "essence"},
        {"brand": "Geely", "model": "Emgrand", "trim": "GF", "year_from": 2020, "year_to": 2026, "body_type": "berline", "fuel_type": "essence"},
        {"brand": "Geely", "model": "Monjaro", "trim": "GF", "year_from": 2021, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Geely", "model": "Starray", "trim": "GL", "year_from": 2022, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Geely", "model": "Starray", "trim": "GF", "year_from": 2022, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},

        # ==========================================
        # BYD
        # ==========================================
        {"brand": "BYD", "model": "Dolphin", "trim": "Standard", "year_from": 2022, "year_to": 2026, "body_type": "citadine", "fuel_type": "electrique"},
        {"brand": "BYD", "model": "Dolphin", "trim": "Premium", "year_from": 2022, "year_to": 2026, "body_type": "citadine", "fuel_type": "electrique"},
        {"brand": "BYD", "model": "Seagull", "trim": "Standard", "year_from": 2023, "year_to": 2026, "body_type": "citadine", "fuel_type": "electrique"},
        {"brand": "BYD", "model": "Seagull", "trim": "Premium", "year_from": 2023, "year_to": 2026, "body_type": "citadine", "fuel_type": "electrique"},
        {"brand": "BYD", "model": "Song Plus", "trim": "DM-i", "year_from": 2020, "year_to": 2026, "body_type": "SUV", "fuel_type": "hybride"},
        {"brand": "BYD", "model": "Han", "trim": "Premium", "year_from": 2020, "year_to": 2026, "body_type": "berline", "fuel_type": "electrique"},

        # ==========================================
        # DFSK
        # ==========================================
        {"brand": "DFSK", "model": "Glory 500", "trim": "Comfort", "year_from": 2021, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "DFSK", "model": "Glory 500", "trim": "Luxury", "year_from": 2021, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "DFSK", "model": "Glory 580", "trim": "Comfort", "year_from": 2018, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "DFSK", "model": "Glory 580", "trim": "Luxury", "year_from": 2018, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "DFSK", "model": "Glory 600", "trim": "Luxury", "year_from": 2023, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "DFSK", "model": "K01S", "trim": "Standard", "year_from": 2020, "year_to": 2026, "body_type": "utilitaire", "fuel_type": "essence"},
        {"brand": "DFSK", "model": "K02S", "trim": "Standard", "year_from": 2020, "year_to": 2026, "body_type": "utilitaire", "fuel_type": "essence"},

        # ==========================================
        # MG
        # ==========================================
        {"brand": "MG", "model": "ZS", "trim": "Comfort", "year_from": 2020, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "MG", "model": "ZS", "trim": "Luxury", "year_from": 2020, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "MG", "model": "3", "trim": "Standard", "year_from": 2018, "year_to": 2026, "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "MG", "model": "3", "trim": "Luxury", "year_from": 2018, "year_to": 2026, "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "MG", "model": "5", "trim": "Standard", "year_from": 2020, "year_to": 2026, "body_type": "berline", "fuel_type": "essence"},
        {"brand": "MG", "model": "5", "trim": "Luxury", "year_from": 2020, "year_to": 2026, "body_type": "berline", "fuel_type": "essence"},
        {"brand": "MG", "model": "HS", "trim": "Luxury", "year_from": 2018, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},

        # ==========================================
        # FIAT
        # ==========================================
        {"brand": "Fiat", "model": "500", "trim": "Cult", "year_from": 2020, "year_to": 2026, "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Fiat", "model": "500", "trim": "Club", "year_from": 2020, "year_to": 2026, "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Fiat", "model": "500", "trim": "Dolcevita", "year_from": 2020, "year_to": 2026, "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Fiat", "model": "500X", "trim": "Club", "year_from": 2020, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Fiat", "model": "500X", "trim": "Dolcevita", "year_from": 2020, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Fiat", "model": "Tipo", "trim": "Standard", "year_from": 2020, "year_to": 2026, "body_type": "berline", "fuel_type": "essence"},
        {"brand": "Fiat", "model": "Tipo", "trim": "City", "year_from": 2020, "year_to": 2026, "body_type": "berline", "fuel_type": "essence"},
        {"brand": "Fiat", "model": "Tipo", "trim": "Life", "year_from": 2020, "year_to": 2026, "body_type": "berline", "fuel_type": "essence"},
        {"brand": "Fiat", "model": "Doblo", "trim": "Commercial", "year_from": 2020, "year_to": 2026, "body_type": "utilitaire", "fuel_type": "diesel"},
        {"brand": "Fiat", "model": "Scudo", "trim": "Commercial", "year_from": 2020, "year_to": 2026, "body_type": "utilitaire", "fuel_type": "diesel"},
        {"brand": "Fiat", "model": "Ducato", "trim": "Commercial", "year_from": 2020, "year_to": 2026, "body_type": "utilitaire", "fuel_type": "diesel"},

        # ==========================================
        # OPEL
        # ==========================================
        {"brand": "Opel", "model": "Astra", "trim": "Edition", "year_from": 2021, "year_to": 2026, "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Opel", "model": "Astra", "trim": "GS Line", "year_from": 2021, "year_to": 2026, "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Opel", "model": "Corsa", "trim": "Edition", "year_from": 2021, "year_to": 2026, "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Opel", "model": "Corsa", "trim": "GS Line", "year_from": 2021, "year_to": 2026, "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Opel", "model": "Mokka", "trim": "Edition", "year_from": 2021, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Opel", "model": "Mokka", "trim": "GS Line", "year_from": 2021, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},
        {"brand": "Opel", "model": "Grandland", "trim": "GS Line", "year_from": 2021, "year_to": 2026, "body_type": "SUV", "fuel_type": "essence"},

        # ==========================================
        # TOYOTA ADDITIONAL
        # ==========================================
        {"brand": "Toyota", "model": "Land Cruiser", "trim": "LC300 VXR", "year_from": 2021, "year_to": 2026, "body_type": "SUV", "fuel_type": "diesel"},
        {"brand": "Toyota", "model": "Land Cruiser", "trim": "LC300 GR Sport", "year_from": 2021, "year_to": 2026, "body_type": "SUV", "fuel_type": "diesel"},
        {"brand": "Toyota", "model": "Prado", "trim": "Adventure", "year_from": 2020, "year_to": 2026, "body_type": "SUV", "fuel_type": "diesel"},
        {"brand": "Toyota", "model": "Prado", "trim": "Lounge", "year_from": 2020, "year_to": 2026, "body_type": "SUV", "fuel_type": "diesel"},
        {"brand": "Toyota", "model": "Yaris", "trim": "Active", "year_from": 2020, "year_to": 2026, "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Toyota", "model": "Yaris", "trim": "Style", "year_from": 2020, "year_to": 2026, "body_type": "citadine", "fuel_type": "essence"},
        {"brand": "Toyota", "model": "Corolla", "trim": "Active", "year_from": 2020, "year_to": 2026, "body_type": "berline", "fuel_type": "essence"},
        {"brand": "Toyota", "model": "Corolla", "trim": "Dynamic", "year_from": 2020, "year_to": 2026, "body_type": "berline", "fuel_type": "essence"},
        {"brand": "Toyota", "model": "Hilux", "trim": "Single Cabin", "year_from": 2015, "year_to": 2026, "body_type": "pickup", "fuel_type": "diesel"},
        {"brand": "Toyota", "model": "Hilux", "trim": "Double Cabin", "year_from": 2015, "year_to": 2026, "body_type": "pickup", "fuel_type": "diesel"},
    ]

    success_count = 0
    error_count = 0

    for vehicle in vehicles:
        try:
            # On vérifie d'abord si la ligne existe déjà
            existing = supabase.table("vehicle_catalog") \
                .select("id") \
                .eq("brand", vehicle["brand"]) \
                .eq("model", vehicle["model"]) \
                .eq("trim", vehicle["trim"]) \
                .execute()
                
            if existing.data and len(existing.data) > 0:
                # Si elle existe déjà, on passe
                continue

            supabase.table("vehicle_catalog").insert(vehicle).execute()
            success_count += 1
            print(f"Ajouté : {vehicle['brand']} {vehicle['model']} ({vehicle['trim']})")
        except Exception as e:
            error_count += 1
            print(f"Erreur sur {vehicle['brand']} {vehicle['model']} : {e}")

    print(f"\n--- Fin de l'enrichissement. Succès: {success_count} | Erreurs: {error_count}")

if __name__ == "__main__":
    populate_full_catalog()
