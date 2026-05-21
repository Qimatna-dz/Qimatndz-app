import os
from pathlib import Path
from datetime import datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv

# Always load .env from the scraper/ directory, and fallback to root .env
load_dotenv(dotenv_path=Path(__file__).parent / ".env")
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

_client = None

def get_supabase_client() -> Client:
    global _client
    if _client:
        return _client
    
    url = os.getenv("SUPABASE_URL") or os.getenv("EXPO_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("EXPO_PUBLIC_SUPABASE_ANON_KEY")
    
    if key and key.startswith("sb_secret_"):
        print("\n⚠️  [QimatnaDz API WARNING] ⚠️")
        print("La clé SUPABASE_SERVICE_ROLE_KEY fournie commence par 'sb_secret_'.")
        print("Il s'agit d'une clé de gestion pour la CLI Supabase (41 caractères), et non de la clé API du projet.")
        print("Veuillez utiliser la clé 'service_role / secret' de l'API (qui commence par 'eyJhbGciOi...' et fait ~200+ caractères).")
        print("Le script bascule temporairement sur la clé Anon Key pour éviter de crasher.\n")
        key = os.getenv("EXPO_PUBLIC_SUPABASE_ANON_KEY")
        
    if not key or key == "...":
        key = os.getenv("EXPO_PUBLIC_SUPABASE_ANON_KEY")
        
    if not url or not key:
        raise ValueError(
            "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in scraper/.env and no root Expo keys found"
        )
    _client = create_client(url, key)
    return _client

def init_db():
    """Initializes the global Supabase client."""
    return get_supabase_client()

def listing_exists(url: str) -> bool:
    """Checks if a listing with the given URL already exists."""
    try:
        client = get_supabase_client()
        res = client.table("listings").select("id").eq("url", url).execute()
        return len(res.data) > 0
    except Exception as e:
        print(f"Error checking existence: {e}")
        return False

def insert_listing(data: dict, client: Client = None) -> bool:
    """Inserts a listing; skips duplicates by URL (deduplication) and filters suspicious listings using AI."""
    try:
        if client is None:
            client = get_supabase_client()
            
        url = data.get("url")
        if not url:
            print("Skipping listing with no URL.")
            return False

        # Internal check to avoid duplicates if not already checked
        if listing_exists(url):
            return False

        # Apply AI Credibility & Price Correction Filter
        try:
            from credibility_filter import evaluate_credibility
            cred_res = evaluate_credibility(data)
            
            if not cred_res.get("is_credible", True):
                print(f"   [FILTER SUSPECT REJECT] {data.get('brand')} {data.get('model')} ({data.get('year')}) "
                      f"annoncé à {data.get('price_asked'):,} DZD rejeté ! Raison : {cred_res.get('reason')} "
                      f"(Score: {cred_res.get('score')}/100)")
                return False
                
            old_price = data.get("price_asked")
            corrected_price = cred_res.get("corrected_price")
            
            if corrected_price and corrected_price != old_price:
                print(f"   [AI PRICE FIXED] 👍 {data.get('brand')} {data.get('model')} ({data.get('year')}) "
                      f"corrigé de {old_price:,} DZD à {corrected_price:,} DZD ! Raison : {cred_res.get('reason')}")
                data["price_asked"] = corrected_price
                
        except Exception as filter_err:
            print(f"   [WARN] Filtre de crédibilité inaccessible : {filter_err}. Passage direct.")

        # Ensure correct source weights
        if "source_weight" not in data:
            source = data.get("source", "unknown")
            if source == "sogauto":
                data["source_weight"] = 0.95
            elif source == "ouedkniss":
                data["source_weight"] = 0.85
            else:
                data["source_weight"] = 0.75

        client.table("listings").insert(data).execute()
        return True
    except Exception as e:
        print(f"Database error: {e}")
        return False

def get_vehicle_catalog(client: Client = None) -> list:
    """Fetches the reference catalog of vehicles."""
    try:
        if client is None:
            client = get_supabase_client()
        res = client.table("vehicle_catalog").select("brand, model").execute()
        return res.data
    except Exception as e:
        print(f"Error fetching catalog: {e}")
        return []

def update_scraper_status(scraper_name: str, status: str, records_added: int = 0, error_message: str = None) -> bool:
    """
    Updates or inserts the execution health status of a scraper in Supabase.
    status must be 'OK' or 'ERROR'.
    """
    try:
        client = get_supabase_client()
        row = {
            "scraper_name": scraper_name,
            "status": status,
            "records_added": records_added,
            "error_message": error_message,
            "last_run": datetime.now(timezone.utc).isoformat()
        }
        client.table("scraper_status").upsert(row, on_conflict="scraper_name").execute()
        print(f"[{scraper_name}] Status updated successfully in Supabase: '{status}' (+{records_added} cotes)")
        return True
    except Exception as e:
        print(f"[{scraper_name}] Failed to update status in Supabase: {e}")
        return False

