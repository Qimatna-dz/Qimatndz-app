import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def export_to_excel():
    print("--- Extraction des donnees de la table 'listings'...")
    
    try:
        # Recuperer toutes les annonces
        response = supabase.table("listings").select("*").execute()
        data = response.data
        
        if not data:
            print("Aucune donnee trouvee dans la table 'listings'.")
            return
            
        # Convertir en DataFrame
        df = pd.DataFrame(data)
        
        # Nettoyage et formatage pour l'export
        filename = "ouedkniss_listings_export.csv"
        df.to_csv(filename, index=False, encoding='utf-8-sig')
        
        print(f"\n--- Succes ! {len(df)} annonces exportees dans '{filename}'.")
        print("Vous pouvez ouvrir ce fichier avec Excel.")
        
    except Exception as e:
        print(f"Erreur lors de l'export: {e}")

if __name__ == "__main__":
    export_to_excel()
