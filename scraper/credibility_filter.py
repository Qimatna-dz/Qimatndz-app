import os
import re
import json
import requests
from dotenv import load_dotenv
from pathlib import Path

# Load environment
load_dotenv(dotenv_path=Path(__file__).parent / ".env")
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY")

SEGMENT_MEDIANS = {
    "micro-citadine": 1500000,
    "citadine": 2200000,
    "berline": 3500000,
    "suv": 4500000,
    "luxe": 8000000
}

def classify_segment(brand: str, model: str) -> str:
    b = brand.lower()
    m = model.lower()
    if any(x in m for x in ["alto", "qq", "spark", "maruti", "atos", "i10", "picanto"]) or b == "maruti":
        return "micro-citadine"
    if any(x in m for x in ["clio", "208", "ibiza", "polo", "yaris", "swift", "sandero", "logan", "accent"]):
        return "citadine"
    if any(x in m for x in ["golf", "leon", "megane", "octavia", "corolla", "308", "elantra", "civic"]):
        return "berline"
    if any(x in m for x in ["tucson", "sportage", "duster", "tiguan", "q3", "3008", "kuga", "stepway", "qashqai", "macan"]):
        return "suv"
    if any(x in b for x in ["mercedes", "bmw", "audi", "porsche", "land rover"]) or any(x in m for x in ["land cruiser", "touareg", "prado", "cayenne"]):
        return "luxe"
    return "citadine" # Default fallback

def log_ai_cost(input_tokens: int, output_tokens: int):
    try:
        from db import get_supabase_client
        supabase = get_supabase_client()
        cost_usd = (input_tokens / 1000000) * 0.25 + (output_tokens / 1000000) * 1.25
        supabase.table("ai_cost_logs").insert({
            "script_name": "credibility_filter",
            "tokens_in": input_tokens,
            "tokens_out": output_tokens,
            "cost_usd": cost_usd
        }).execute()
    except Exception as e:
        print(f"      [AI LOG WARN] Impossible de logger les coûts: {e}")

def run_algorithmic_prefilter(listing: dict) -> dict:
    """Run deterministic mathematical rules before calling AI."""
    brand = listing.get("brand", "")
    model = listing.get("model", "")
    year = int(listing.get("year", 0))
    mileage = int(listing.get("mileage", 80000))
    price = int(listing.get("price_asked", 0))
    source = listing.get("source", "unknown")
    
    has_correction = False
    correction_reason = ""
    
    # 1. FIX ZEROS
    if year >= 2015 and source != "ouedkniss_reference":
        is_budget_car = classify_segment(brand, model) == "micro-citadine"
        should_multiply_x10 = False
        
        if is_budget_car:
            if 100000 <= price <= 300000:
                should_multiply_x10 = True
        else:
            if 100000 <= price <= 400000:
                should_multiply_x10 = True

        if should_multiply_x10:
            old_price = price
            price = price * 10
            has_correction = True
            correction_reason = f"Correction de prix auto (Format centimes x10) : {old_price:,} DZD -> {price:,} DZD."
        elif 10000 <= price <= 99000:
            old_price = price
            price = price * 100
            has_correction = True
            correction_reason = f"Correction de prix auto (Format centimes x100) : {old_price:,} DZD -> {price:,} DZD."

    listing["price_asked"] = price

    # 2. ABSOLUTE ABSURDITY CHECK
    if price < 100000:
        return {"is_credible": False, "corrected_price": None, "reason": f"Prix suspect : {price:,} DZD est trop bas.", "score": 5}

    # 3. RELATIVE RULES BARRICADE
    segment = classify_segment(brand, model)
    segment_median = SEGMENT_MEDIANS.get(segment, 2200000)
    # Reject if price is below 40% of the segment median AND car is recent (>= 2018)
    if year >= 2018 and price < (segment_median * 0.40):
        # We don't reject immediately here anymore! We let Claude check the description!
        # Because a 2019 Tucson at 1.8M might have "chassis refrappé"
        pass
        
    # Mileage limits
    if year < 2018 and mileage < 1000:
        return {"is_credible": False, "corrected_price": None, "reason": f"Kilométrage suspect : {mileage:,} km pour une voiture de {year}.", "score": 10}
    if year >= 2022 and mileage > 600000:
        return {"is_credible": False, "corrected_price": None, "reason": f"Kilométrage absurde : {mileage:,} km pour {year}.", "score": 12}

    if has_correction:
        return {"is_credible": True, "corrected_price": price, "reason": correction_reason, "score": 90}

    # 4. PATTERN CHECK
    if price < 3000000:
        price_str = str(price)
        if re.sub(r'\D', '', price_str) and re.match(r'^(\d)\1+$', re.sub(r'\D', '', price_str)):
            return {"is_credible": False, "corrected_price": None, "reason": f"Séquence répétitive ({price:,} DZD).", "score": 5}

    return {"is_credible": "needs_ai", "corrected_price": price}

def evaluate_credibility(listing: dict) -> dict:
    """Backward compatible single listing wrapper."""
    return evaluate_credibility_batch([listing])[0]

def evaluate_credibility_batch(listings: list) -> list:
    """
    Évalue un lot d'annonces automobiles.
    Exécute le pré-filtrage algorithmique puis regroupe les annonces suspectes par lots de 20
    pour l'API Claude Haiku.
    """
    results = [None] * len(listings)
    ai_queue = []
    
    # 1. Pre-filter
    for i, lst in enumerate(listings):
        pre_res = run_algorithmic_prefilter(lst)
        if pre_res.get("is_credible") != "needs_ai":
            results[i] = pre_res
        else:
            ai_queue.append((i, lst, pre_res.get("corrected_price")))

    if not ai_queue:
        return results

    if not ANTHROPIC_KEY or ANTHROPIC_KEY == "...":
        for i, lst, price in ai_queue:
            results[i] = {"is_credible": True, "corrected_price": price, "reason": "Pas de clé Anthropic configurée. Validé par défaut.", "score": 80}
        return results

    # 2. AI Batch Processing (Chunk by 20)
    chunk_size = 20
    for chunk_start in range(0, len(ai_queue), chunk_size):
        chunk = ai_queue[chunk_start:chunk_start + chunk_size]
        
        system_prompt = (
            "Vous êtes l'IA experte de QimatnaDz chargée de valider la crédibilité des annonces de voitures d'occasion en Algérie.\n\n"
            "RÈGLES DU MARCHÉ ALGÉRIEN :\n"
            "1. Zéros manquants : '350 000' pour une voiture de 2020 signifie 3 500 000 DZD (350 millions de centimes).\n"
            "2. Format Millions : '350' ou '350.5' signifie 3 500 000 DZD.\n"
            "3. Descriptions : Si la description indique 'moteur coulé', 'accidenté', 'sbigha', 'choc', 'chassis refrappé', 'carte grise', 'mawra9a', un prix anormalement bas devient LOGIQUE et crédible.\n"
            "4. Leasings : Un prix faible (ex: 1.5M pour une voiture de 2024) sans mention de dommage grave est un apport de crédit/leasing ou une arnaque (is_credible = false).\n\n"
            "EXEMPLES À SUIVRE STRICTEMENT :\n"
            "- Exemple 1 : Prix 350, Modèle Ibiza 2021, Desc: 'Trés propre' -> Action : Erreur format. Correction = 3500000. is_credible = true.\n"
            "- Exemple 2 : Prix 1500, Modèle Golf 2024, Desc: 'Neuve' -> Action : C'est un apport. is_credible = false.\n"
            "- Exemple 3 : Prix 800000, Modèle Leon 2019, Desc: 'Moteur hs' -> Action : Justifié par la panne. is_credible = true, pas de correction.\n"
            "- Exemple 4 : Prix 1800000, Modèle Hyundai Tucson 2019, Desc: 'Très propre mais numéro de châssis refrappé / carte grise en cours' -> Action : Justifié par problème de conformité/papiers. is_credible = true, pas de correction.\n\n"
            "RÉPONDEZ UNIQUEMENT EN JSON STRICT, UN TABLEAU DE RÉSULTATS DANS LE MÊME ORDRE :\n"
            "[\n"
            "  {\n"
            "    \"id\": \"identifiant fourni\",\n"
            "    \"is_credible\": true/false,\n"
            "    \"corrected_price\": int ou null,\n"
            "    \"reason\": \"explication claire\",\n"
            "    \"credibility_score\": int (0 à 100)\n"
            "  }\n"
            "]"
        )
        
        user_message_parts = []
        for j, (_, lst, price) in enumerate(chunk):
            desc = str(lst.get("description", ""))[:200].replace("\n", " ") # Keep it compact
            msg = (
                f"Item ID: {j}\n"
                f"Marque: {lst.get('brand')}\n"
                f"Modèle: {lst.get('model')}\n"
                f"Année: {lst.get('year')}\n"
                f"Kilométrage: {lst.get('mileage')} km\n"
                f"Prix initial: {price} DZD\n"
                f"Description: {desc}\n"
                "---"
            )
            user_message_parts.append(msg)
            
        user_message = "\n".join(user_message_parts)
        
        print(f"   [AI FILTERING] Traitement d'un lot de {len(chunk)} annonces...")
        
        try:
            api_url = "https://api.anthropic.com/v1/messages"
            headers = {
                "x-api-key": ANTHROPIC_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            payload = {
                "model": "claude-haiku-4-5",
                "max_tokens": 1500,
                "system": system_prompt,
                "messages": [{"role": "user", "content": user_message}],
                "temperature": 0.0
            }
            
            response = requests.post(api_url, json=payload, headers=headers, timeout=20)
            if response.status_code == 200:
                resp_data = response.json()
                content_text = resp_data["content"][0]["text"].strip()
                
                # Log cost
                usage = resp_data.get("usage", {})
                in_tokens = usage.get("input_tokens", 0)
                out_tokens = usage.get("output_tokens", 0)
                if in_tokens > 0 or out_tokens > 0:
                    log_ai_cost(in_tokens, out_tokens)
                
                json_match = re.search(r'\[.*\]', content_text, re.DOTALL)
                if json_match:
                    ai_results = json.loads(json_match.group(0))
                    for k, ai_res in enumerate(ai_results):
                        original_index = chunk[k][0]
                        results[original_index] = {
                            "is_credible": bool(ai_res.get("is_credible", True)),
                            "corrected_price": ai_res.get("corrected_price") or chunk[k][2],
                            "reason": ai_res.get("reason", "Validé par IA."),
                            "score": int(ai_res.get("credibility_score", 90))
                        }
                else:
                    raise Exception("Format JSON tableau non trouvé.")
            else:
                raise Exception(f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            print(f"      [AI WARN] Erreur Batch: {e}")
            for k, (_, lst, price) in enumerate(chunk):
                results[chunk[k][0]] = {
                    "is_credible": True,
                    "corrected_price": price,
                    "reason": "Échec validation IA. Accepté par défaut.",
                    "score": 75
                }
                
    return results
