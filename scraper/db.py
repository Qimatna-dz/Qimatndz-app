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

        # Garantir que scraped_at est toujours défini pour que time_decay_weight fonctionne
        # Sans ça, toutes les annonces reçoivent weight=1 (stale) au lieu de weight=3 (frais)
        if "scraped_at" not in data or not data["scraped_at"]:
            data["scraped_at"] = datetime.now(timezone.utc).isoformat()

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

def insert_listings_batch(listings: list, client: Client = None) -> tuple[int, int]:
    """Inserts a batch of listings, applying credibility filter in bulk."""
    if client is None:
        client = get_supabase_client()

    # 1. Efficient Bulk Deduplication
    scraped_urls = [lst.get("url") for lst in listings if lst.get("url")]
    existing_urls = set()
    
    # Query Supabase in chunks of 100 to avoid N+1 and connection limits
    chunk_size = 100
    for i in range(0, len(scraped_urls), chunk_size):
        chunk = scraped_urls[i:i + chunk_size]
        try:
            res = client.table("listings").select("url").in_("url", chunk).execute()
            for r in res.data:
                if 'url' in r:
                    existing_urls.add(r['url'])
        except Exception as e:
            print(f"Error checking duplicates chunk: {e}")

    new_listings = []
    skipped = 0
    for lst in listings:
        url = lst.get("url")
        if not url or url in existing_urls:
            skipped += 1
            continue
            
        # Remove fields that do not exist in the database schema
        lst.pop("description", None)
        
        if "scraped_at" not in lst or not lst["scraped_at"]:
            lst["scraped_at"] = datetime.now(timezone.utc).isoformat()
            
        source = lst.get("source", "unknown")
        if "source_weight" not in lst:
            lst["source_weight"] = 0.95 if source == "sogauto" else (0.85 if source == "ouedkniss" else 0.75)
            
        new_listings.append(lst)

    if not new_listings:
        return 0, skipped

    # 2. Batch AI Credibility Filter
    try:
        from credibility_filter import evaluate_credibility_batch
        cred_results = evaluate_credibility_batch(new_listings)
        
        valid_listings = []
        for i, cred_res in enumerate(cred_results):
            lst = new_listings[i]
            if not cred_res.get("is_credible", True):
                print(f"   [FILTER SUSPECT REJECT] {lst.get('brand')} {lst.get('model')} ({lst.get('year')}) "
                      f"annoncé à {lst.get('price_asked'):,} DZD rejeté ! Raison : {cred_res.get('reason')}")
                skipped += 1
                continue
                
            corrected_price = cred_res.get("corrected_price")
            if corrected_price and corrected_price != lst.get("price_asked"):
                print(f"   [AI PRICE FIXED] 👍 {lst.get('brand')} {lst.get('model')} ({lst.get('year')}) "
                      f"corrigé de {lst.get('price_asked'):,} DZD à {corrected_price:,} DZD !")
                lst["price_asked"] = corrected_price
                
            valid_listings.append(lst)
    except Exception as filter_err:
        print(f"   [WARN] Filtre de crédibilité batch inaccessible : {filter_err}. Passage direct.")
        valid_listings = new_listings

    # 3. Bulk Insert
    if not valid_listings:
        return 0, skipped
        
    inserted = 0
    try:
        # We manually deduplicated via existing_urls, so we can just bulk insert
        res = client.table("listings").insert(valid_listings).execute()
        inserted = len(res.data) if hasattr(res, 'data') and res.data else len(valid_listings)
    except Exception as e:
        print(f"Database bulk insert error: {e}")
        # Fallback to individual inserts if bulk fails
        for lst in valid_listings:
            try:
                client.table("listings").insert(lst).execute()
                inserted += 1
            except Exception as inner_e:
                print(f"Failed to insert {lst.get('url')}: {inner_e}")
                
    return inserted, skipped

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

