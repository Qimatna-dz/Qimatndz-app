"""
ouedkniss_api.py — Scrape via l'API GraphQL d'Ouedkniss (pas de BeautifulSoup).
Ouedkniss est une SPA React — le HTML est vide, tout passe par GraphQL.
"""

import requests
import time

GRAPHQL_URL = "https://api.ouedkniss.com/graphql"

HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Origin": "https://www.ouedkniss.com",
    "Referer": "https://www.ouedkniss.com/",
}

# Query GraphQL pour les annonces automobiles
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
        currency
      }
      store {
        wilaya { name code }
      }
      params {
        label
        value
        valueLabel
      }
      slug
      createdAt
    }
  }
}
"""


# Fallback list covering the most popular models in Algeria
# (used if Supabase catalog cannot be reached at startup)
FALLBACK_MODELS_TO_SCRAPE = [
    ("Renault", "Symbol"), ("Renault", "Clio"), ("Renault", "Clio 4"), ("Renault", "Clio 5"),
    ("Renault", "Megane"), ("Renault", "Kangoo"), ("Renault", "Express"),
    ("Dacia", "Logan"), ("Dacia", "Sandero"), ("Dacia", "Sandero Stepway"), ("Dacia", "Duster"),
    ("Toyota", "Corolla"), ("Toyota", "Yaris"), ("Toyota", "Hilux"), ("Toyota", "Prado"), ("Toyota", "Land Cruiser"),
    ("Hyundai", "Tucson"), ("Hyundai", "Elantra"), ("Hyundai", "Accent"), ("Hyundai", "Creta"),
    ("Hyundai", "i10"), ("Hyundai", "Grand i10"),
    ("Peugeot", "208"), ("Peugeot", "301"), ("Peugeot", "3008"), ("Peugeot", "206"), ("Peugeot", "Partner"),
    ("Volkswagen", "Golf"), ("Volkswagen", "Polo"), ("Volkswagen", "Tiguan"), ("Volkswagen", "Caddy"),
    ("Kia", "Sportage"), ("Kia", "Picanto"), ("Kia", "Rio"),
    ("Suzuki", "Swift"), ("Suzuki", "Alto"),
    ("Geely", "Coolray"), ("Geely", "Emgrand"), ("Geely", "GX3 Pro"), ("Geely", "Monjaro"),
    ("Chery", "Tiggo 4 Pro"), ("Chery", "Tiggo 7 Pro"), ("Chery", "Tiggo 8 Pro"), ("Chery", "Arrizo 5"),
    ("Jetour", "Dashing"), ("Jetour", "Traveller T2"),
    ("BYD", "Dolphin"), ("BYD", "Seagull"),
    ("MG", "ZS"), ("MG", "HS"),
    ("Changan", "Alsvin"),
    ("DFSK", "Glory 580"), ("DFSK", "Glory 600"),
    ("Fiat", "Tipo"), ("Fiat", "500"),
    ("Opel", "Astra"), ("Opel", "Corsa"), ("Opel", "Mokka"),
    ("Seat", "Ibiza"), ("Seat", "Leon"),
    ("Skoda", "Octavia"),
    ("Mercedes", "Classe C"), ("Mercedes", "Classe E"), ("Mercedes", "Classe G"),
    ("BMW", "Série 3"), ("BMW", "Série 5"), ("BMW", "X5"), ("BMW", "X6"),
    ("Audi", "A4"), ("Audi", "A6"), ("Audi", "Q5"), ("Audi", "Q7"),
    ("Porsche", "Cayenne"), ("Porsche", "Macan"),
]

def get_models_to_scrape() -> list:
    """
    Dynamically fetches the full list of (brand, model) pairs from the
    Supabase vehicle_catalog table. Falls back to FALLBACK_MODELS_TO_SCRAPE
    if the database is unreachable.
    """
    try:
        import os
        from pathlib import Path
        from dotenv import load_dotenv
        load_dotenv(dotenv_path=Path(__file__).parent / ".env")
        load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

        import supabase as sb
        url = os.getenv("SUPABASE_URL") or os.getenv("EXPO_PUBLIC_SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("EXPO_PUBLIC_SUPABASE_ANON_KEY")
        if not url or not key:
            raise ValueError("Missing SUPABASE credentials")

        client = sb.create_client(url, key)
        res = client.table("vehicle_catalog").select("brand, model").execute()
        catalog = res.data or []

        # Deduplicate (brand, model) pairs preserving order
        seen = set()
        models = []
        for entry in catalog:
            pair = (entry["brand"].strip(), entry["model"].strip())
            if pair not in seen:
                seen.add(pair)
                models.append(pair)

        if models:
            print(f"   [CATALOG] {len(models)} modèles uniques chargés dynamiquement depuis Supabase.")
            return models
        else:
            raise ValueError("Empty catalog returned from Supabase")

    except Exception as e:
        print(f"   [CATALOG WARN] Impossible de charger le catalogue Supabase ({e}). Utilisation de la liste statique ({len(FALLBACK_MODELS_TO_SCRAPE)} modèles).")
        return FALLBACK_MODELS_TO_SCRAPE


def extract_param(params: list, label_keywords: list) -> str | None:
    """Extrait une valeur depuis les params de l'annonce."""
    for param in params:
        label = (param.get("label") or "").lower()
        for keyword in label_keywords:
            if keyword in label:
                return param.get("valueLabel") or param.get("value")
    return None

def normalize_price(price_data: dict) -> int | None:
    """Convertit le prix en DZD."""
    if not price_data:
        return None
    price = price_data.get("price")
    unit = (price_data.get("priceUnit") or "").lower()
    currency = (price_data.get("currency") or "").upper()

    if not price:
        return None

    try:
        price = float(price)
    except:
        return None

    # Ouedkniss utilise parfois les centimes (10 centimes = 1 DZD)
    if "centime" in unit:
        price = price / 10
    # Parfois en millions de centimes
    elif "million" in unit:
        price = price * 100000

    price = int(price)

    # Validation : prix raisonnable pour une voiture en Algérie
    if 100000 <= price <= 25000000:
        return price
    return None

def scrape_model_graphql(brand: str, model: str, max_pages: int = 15) -> list:
    """Scrape les annonces pour un modèle via l'API GraphQL."""
    results = []
    query_string = f"{brand} {model}"

    for page in range(1, max_pages + 1):
        try:
            payload = {
                "query": SEARCH_QUERY,
                "variables": {"query": query_string, "page": page}
            }

            response = requests.post(
                GRAPHQL_URL,
                json=payload,
                headers=HEADERS,
                timeout=15
            )

            if response.status_code != 200:
                print(f"   [WARN] GraphQL error {response.status_code} pour {brand} {model} page {page}")
                break

            data = response.json()
            announcements = (
                data.get("data", {})
                    .get("searchAnnouncements", {})
                    .get("announcements", [])
            )

            if not announcements:
                break

            for ann in announcements:
                listing = parse_announcement(ann, brand, model)
                if listing:
                    results.append(listing)

            print(f"   Page {page} - {len(announcements)} annonces trouvees")
            time.sleep(1.5)

        except Exception as e:
            print(f"   [ERROR] Erreur GraphQL page {page}: {e}")
            break

    return results

def parse_announcement(ann: dict, brand: str, model: str) -> dict | None:
    """Parse une annonce GraphQL en dict propre."""
    try:
        price = normalize_price(ann.get("pricePreview"))
        if not price:
            return None

        params = ann.get("params") or []

        # Année
        year_str = extract_param(params, ["année", "year", "annee", "سنة"])
        year = None
        if year_str:
            import re
            match = re.search(r'(19|20)\d{2}', str(year_str))
            if match:
                year = int(match.group(0))

        # Kilométrage
        km_str = extract_param(params, ["kilométrage", "km", "كيلومتر", "kilometrage"])
        mileage = None
        if km_str:
            import re
            nums = re.sub(r'\D', '', str(km_str))
            if nums:
                mileage = int(nums)

        # Wilaya
        wilaya = "Alger"
        store = ann.get("store") or {}
        wilaya_data = store.get("wilaya") or {}
        if wilaya_data.get("name"):
            wilaya = wilaya_data["name"]

        # Titre pour extraire l'année si params ne l'a pas
        title = ann.get("title") or ""
        if not year:
            import re
            match = re.search(r'(19|20)\d{2}', title)
            if match:
                year = int(match.group(0))

        if not year:
            return None

        # Extraire finition et motorisation pour le sous-modèle (trim)
        finition = extract_param(params, ["finition", "finish", "النسخة"])
        motorisation = extract_param(params, ["motorisation", "moteur", "engine", "المحرك"])
        version = extract_param(params, ["version"])
        
        trim_parts = []
        if finition and str(finition).strip() and str(finition).lower() != "none":
            trim_parts.append(str(finition).strip())
        if motorisation and str(motorisation).strip() and str(motorisation).lower() != "none":
            trim_parts.append(str(motorisation).strip())
        if version and str(version).strip() and str(version).lower() != "none":
            trim_parts.append(str(version).strip())
            
        trim = " ".join(trim_parts) if trim_parts else None

        slug = ann.get("slug") or ann.get("id") or ""
        url = f"https://www.ouedkniss.com/{slug}"

        return {
            "source": "ouedkniss",
            "brand": brand,
            "model": model,
            "year": year,
            "mileage": mileage or 80000,
            "price_asked": price,
            "wilaya": wilaya,
            "condition": "bon",
            "url": url,
            "trim": trim,
        }

    except Exception as e:
        print(f"   [WARN] Parse error: {e}")
        return None


def scrape_all(max_pages_per_model: int = 15) -> list:
    """Scrape tous les modèles du catalogue Supabase (ou fallback statique)."""
    all_results = []
    models_to_scrape = get_models_to_scrape()

    for brand, model in models_to_scrape:
        print(f"\n[MODEL] Scraping {brand} {model}...")
        results = scrape_model_graphql(brand, model, max_pages_per_model)
        all_results.extend(results)
        print(f"   -> {len(results)} annonces valides")
        time.sleep(2)

    return all_results
