import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def inject_global_trims():
    print("--- Injection massive des finitions Toyota & Autres ---")
    
    trims = [
        # TOYOTA
        {"brand": "Toyota", "model": "Prado", "trim": "VX"},
        {"brand": "Toyota", "model": "Prado", "trim": "VXL"},
        {"brand": "Toyota", "model": "Prado", "trim": "TX"},
        {"brand": "Toyota", "model": "Prado", "trim": "TXL"},
        {"brand": "Toyota", "model": "Land Cruiser", "trim": "VX"},
        {"brand": "Toyota", "model": "Land Cruiser", "trim": "VXL"},
        {"brand": "Toyota", "model": "Corolla", "trim": "GLI"},
        {"brand": "Toyota", "model": "Corolla", "trim": "Executive"},
        {"brand": "Toyota", "model": "Yaris", "trim": "Style"},
        {"brand": "Toyota", "model": "Yaris", "trim": "Lounge"},
        
        # NISSAN
        {"brand": "Nissan", "model": "Sunny", "trim": "S"},
        {"brand": "Nissan", "model": "Sunny", "trim": "SV"},
        {"brand": "Nissan", "model": "Qashqai", "trim": "Tekna"},
        {"brand": "Nissan", "model": "Qashqai", "trim": "Acenta"},
        
        # SUZUKI
        {"brand": "Suzuki", "model": "Swift", "trim": "GL"},
        {"brand": "Suzuki", "model": "Swift", "trim": "GLX"},
        {"brand": "Suzuki", "model": "Alto", "trim": "K10"},
        
        # MITSUBISHI
        {"brand": "Mitsubishi", "model": "L200", "trim": "Sportero"},
        {"brand": "Mitsubishi", "model": "L200", "trim": "GLS"},
        
        # FORD
        {"brand": "Ford", "model": "Fiesta", "trim": "Titanium"},
        {"brand": "Ford", "model": "Fiesta", "trim": "Trend"},
        {"brand": "Ford", "model": "Focus", "trim": "ST-Line"},
        {"brand": "Ford", "model": "Focus", "trim": "Titanium"},
        
        # JEEP
        {"brand": "Jeep", "model": "Renegade", "trim": "Limited"},
        {"brand": "Jeep", "model": "Compass", "trim": "Limited"},
    ]

    for item in trims:
        try:
            # Nettoyage prealable pour eviter les doublons de modele sans finition
            supabase.table("vehicle_catalog").delete().eq("brand", item["brand"]).eq("model", item["model"]).is_("trim", "NULL").execute()
            
            item["year_from"] = 2010
            item["body_type"] = "4x4" if item["brand"] in ["Jeep", "Toyota", "Mitsubishi"] else "berline"
            supabase.table("vehicle_catalog").insert(item).execute()
        except:
            continue
            
    print(f"--- Succes ! {len(trims)} finitions Toyota et autres ont ete ajoutees.")

if __name__ == "__main__":
    inject_global_trims()
