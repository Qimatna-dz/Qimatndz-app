import requests
import time
from datetime import datetime
import os
from pathlib import Path
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv(dotenv_path=Path(__file__).parent / ".env")
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

import supabase as sb
url = os.getenv("SUPABASE_URL") or os.getenv("EXPO_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("EXPO_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    raise ValueError("Missing SUPABASE credentials")

supabase = sb.create_client(url, key)

GRAPHQL_URL = "https://api.ouedkniss.com/graphql"

HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Origin": "https://www.ouedkniss.com",
    "Referer": "https://www.ouedkniss.com/",
}

SEARCH_QUERY = """
query SearchListings($query: String!, $page: Int!) {
  searchAnnouncements(
    q: $query
    categorySlug: "automobiles"
    page: $page
    count: 48
  ) {
    announcements {
      id
      title
      pricePreview {
        price
        priceUnit
      }
      params {
        label
        value
      }
      createdAt
    }
  }
}
"""

def extract_param(params: list, keywords: list) -> str:
    for param in params:
        label = str(param.get("label", "")).lower()
        if any(k in label for k in keywords):
            return param.get("value", "")
    return ""

def stream_latest_listings():
    print(f"[{datetime.now()}] Démarrage du Fast-Streamer Ouedkniss (Page 1)...")
    try:
        payload = {
            "query": SEARCH_QUERY,
            "variables": {"query": "", "page": 1}
        }
        
        response = requests.post(GRAPHQL_URL, json=payload, headers=HEADERS, timeout=15)
        if response.status_code != 200:
            print(f"[ERREUR] Impossible de joindre l'API GraphQL (Status: {response.status_code})")
            return
            
        data = response.json()
        announcements = data.get("data", {}).get("searchAnnouncements", {}).get("announcements", [])
        
        print(f"[{datetime.now()}] {len(announcements)} annonces récentes trouvées. Parsing...")
        
        new_listings = []
        for ann in announcements:
            title = ann.get("title", "")
            
            # Extract price
            price_data = ann.get("pricePreview")
            if not price_data:
                continue
            
            raw_price = str(price_data.get("price", "0"))
            unit = str(price_data.get("priceUnit", "")).lower()
            
            # Normalize price
            try:
                price_val = float(price_data.get("price", 0))
                if "centime" in unit:
                    price_val = price_val / 10
                elif "million" in unit:
                    price_val = price_val * 100000
                price_parsed = int(price_val)
            except:
                price_parsed = None
                
            # Filter fake prices
            if price_parsed and (price_parsed < 100_000 or price_parsed > 150_000_000):
                price_parsed = None
                
            # Extract Year
            params = ann.get("params") or []
            year_str = extract_param(params, ["année", "year", "annee", "سنة"])
            
            # Identify model simple heuristic
            title_lower = title.lower()
            model_id = None
            # Simple heuristic mapping for cache
            if "symbol" in title_lower: model_id = "symbol"
            elif "clio" in title_lower: model_id = "clio"
            elif "logan" in title_lower: model_id = "logan"
            elif "golf" in title_lower: model_id = "golf"
            elif "picanto" in title_lower: model_id = "picanto"
            elif "ibiza" in title_lower: model_id = "ibiza"
            elif "yaris" in title_lower: model_id = "yaris"
            elif "208" in title_lower: model_id = "208"
            elif "stepway" in title_lower: model_id = "stepway"
            elif "tucson" in title_lower: model_id = "tucson"
            elif "sportage" in title_lower: model_id = "sportage"
            
            if title and raw_price:
                new_listings.append({
                    "raw_title": title,
                    "raw_price": f"{raw_price} {unit}".strip(),
                    "price_parsed": price_parsed,
                    "source": "ouedkniss_stream",
                    "model_id": model_id,
                    "fetched_at": datetime.now().isoformat()
                })
        
        # Upsert to DB
        if new_listings:
            # Upsert requires a conflict target. Using raw_title and raw_price.
            # But the Python client doesn't support easy on_conflict without specifying it.
            # Let's insert and ignore errors on conflict.
            try:
                # We use the raw_title + raw_price as unique key.
                # In Supabase python we can use upsert(data).
                # But it depends on the primary key. If it fails, we will fallback to single inserts.
                res = supabase.table("raw_listings_stream").upsert(new_listings).execute()
                print(f"[{datetime.now()}] ✅ {len(new_listings)} annonces streamées insérées/mises à jour.")
            except Exception as e:
                print(f"[WARN] Erreur lors du bulk upsert: {e}. Tentative ligne par ligne...")
                inserted = 0
                for item in new_listings:
                    try:
                        supabase.table("raw_listings_stream").upsert([item]).execute()
                        inserted += 1
                    except:
                        pass
                print(f"[{datetime.now()}] ✅ {inserted} annonces streamées insérées.")

    except Exception as e:
        print(f"[{datetime.now()}] [STREAM ERROR] {e}")

if __name__ == "__main__":
    stream_latest_listings()
