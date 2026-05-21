import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def cleanup_listings():
    print("--- Nettoyage de la base de donnees (Filtre anti-fake)...")
    
    try:
        # 1. Supprimer les prix trop bas ou trop hauts
        res1 = supabase.table("listings").delete().lt("price_asked", 150000).execute()
        res2 = supabase.table("listings").delete().gt("price_asked", 25000000).execute()
        
        # 2. Supprimer les donnees de test "ouedkniss_reference"
        res3 = supabase.table("listings").delete().eq("source", "ouedkniss_reference").execute()
        
        count = len(res1.data) + len(res2.data) + len(res3.data)
        print(f"--- Succes ! {count} annonces non-realistes supprimees.")
        
    except Exception as e:
        print(f"Erreur lors du nettoyage: {e}")

if __name__ == "__main__":
    cleanup_listings()
