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
query SearchQuery($q: String, $filter: SearchFilterInput) {
    search(q: $q, filter: $filter) {
        announcements {
            data {
                id
                title
                slug
                description
                price
                createdAt: refreshedAt
                cities { name region { name } }
            }
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
    ("Mercedes", "GLC"), ("Mercedes", "GLE"), ("Mercedes", "GLA"), ("Mercedes", "GLB"),
    ("BMW", "Série 3"), ("BMW", "Série 5"), ("BMW", "X3"), ("BMW", "X5"), ("BMW", "X6"),
    ("Audi", "A4"), ("Audi", "A6"), ("Audi", "Q3"), ("Audi", "Q5"), ("Audi", "Q7"),
    ("Porsche", "Cayenne"), ("Porsche", "Macan"),
    ("Volvo", "XC60"), ("Volvo", "XC40"),
    ("Land Rover", "Defender"), ("Land Rover", "Discovery"), ("Range Rover", "Sport"),
    ("Mitsubishi", "L200"), ("Mitsubishi", "Pajero"), ("Mitsubishi", "ASX"),
    ("Nissan", "Qashqai"), ("Nissan", "X-Trail"), ("Nissan", "Juke"), ("Nissan", "Patrol"),
    ("Ford", "Kuga"), ("Ford", "Explorer"), ("Ford", "Ranger"),
    ("Honda", "CR-V"), ("Honda", "HR-V"), ("Honda", "Civic"),
    ("Mazda", "CX-5"), ("Mazda", "3"), ("Mazda", "6"),
    ("Subaru", "Outback"), ("Subaru", "Forester"),
    ("Haval", "H6"), ("Haval", "Jolion"),
    ("JAC", "S4"), ("JAC", "J7"),
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

    # Max = 250M DZD pour couvrir G-Class, Porsche, véhicules de grand luxe importés
    if 100_000 <= price <= 250_000_000:
        return price
    return None

def scrape_model_graphql(brand: str, model: str, max_pages: int = 15) -> list:
    """Scrape les annonces pour un modèle via l'API GraphQL."""
    results = []
    query_string = f"{brand} {model}"

    for page in range(1, max_pages + 1):
        try:
            payload = {
                "operationName": "SearchQuery",
                "query": SEARCH_QUERY,
                "variables": {
                    "q": query_string,
                    "filter": {
                        "categorySlug": "automobiles",
                        "page": page,
                        "count": 48
                    }
                }
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
                    .get("search", {})
                    .get("announcements", {})
                    .get("data", [])
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
        raw_price = ann.get("price")
        if not raw_price:
            return None
        
        try:
            price = int(raw_price)
        except:
            return None
            
        if price < 100_000:
            price = price * 100 # On part du principe que c'est en Da "raccourci" (10000 -> 1 000 000 DA)
            
        if not (100_000 <= price <= 250_000_000):
            return None

        # Titre pour extraire l'année
        title = ann.get("title") or ""
        year = None
        import re
        match = re.search(r'(19|20)\d{2}', title)
        if match:
            year = int(match.group(0))

        if not year:
            return None

        # Wilaya
        wilaya = "Alger"
        cities = ann.get("cities") or []
        if cities and len(cities) > 0:
            region = cities[0].get("region") or {}
            if region.get("name"):
                wilaya = region.get("name")

        slug = ann.get("slug") or ann.get("id") or ""
        url = f"https://www.ouedkniss.com/{slug}"


        # Date de publication de l'annonce SUR Ouedkniss (≠ scraped_at qui est notre date de collecte)
        annonce_created_at = ann.get("createdAt")

        mileage = None
        trim = None

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
            # Horodatage de l'annonce d'origine (quand le vendeur a posté sur Ouedkniss)
            "annonce_posted_at": annonce_created_at,
        }

    except Exception as e:
        print(f"   [WARN] Parse error: {e}")
        return None


def scrape_all(max_pages_per_model: int = 50) -> list:
    """Scrape tous les modèles du catalogue Supabase (ou fallback statique).
    
    max_pages_per_model=50 : couvre ~2 400 annonces par modèle populaire (50 pages × 48 ann).
    Sur un catalogue de 80 modèles → potentiellement ~192 000 annonces brutes / cycle.
    """
    all_results = []
    models_to_scrape = get_models_to_scrape()

    for brand, model in models_to_scrape:
        print(f"\n[MODEL] Scraping {brand} {model}...")
        results = scrape_model_graphql(brand, model, max_pages_per_model)
        all_results.extend(results)
        print(f"   -> {len(results)} annonces valides")
        time.sleep(2)

    return all_results
