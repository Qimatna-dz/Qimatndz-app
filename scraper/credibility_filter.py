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

def evaluate_credibility(listing: dict) -> dict:
    """
    Évalue une annonce automobile pour déterminer sa crédibilité et la justesse de son prix.
    Retourne un dictionnaire: {
        "is_credible": bool,
        "corrected_price": int/None,
        "reason": str,
        "score": int
    }
    """
    brand = listing.get("brand", "")
    model = listing.get("model", "")
    year = int(listing.get("year", 0))
    mileage = int(listing.get("mileage", 80000))
    price = int(listing.get("price_asked", 0))
    source = listing.get("source", "unknown")
    url = listing.get("url", "")
    
    has_correction = False
    correction_reason = ""
    
    # 1. ÉTAPE A : PRÉ-FILTRAGE RAPIDE & AUTO-CORRECTION EN DUR (0ms)
    
    # Détection et correction des erreurs de centimes typiques en Algérie (Années >= 2015)
    # Les voitures de 2015+ ne coûtent JAMAIS moins de 1 000 000 DZD sur le marché.
    # Si le prix est dans ces fourchettes, c'est obligatoirement une omission de zéro ou un format centimes.
    if year >= 2015 and source != "ouedkniss_reference":
        # Détecter si c'est un modèle à très petit budget (micro-citadine)
        is_budget_car = (
            any(m in model.lower() for m in ["alto", "qq", "spark", "maruti", "atos"]) or 
            brand.lower() == "maruti"
        )
        
        # Déterminer si le prix nécessite une correction x10
        should_multiply_x10 = False
        if is_budget_car:
            # Pour les micro-citadines, on ne multiplie que si c'est vraiment trop bas (ex: 150k -> 1.5M)
            # Si le prix est >= 450 000 DZD, c'est un prix d'occasion réaliste (ex: 75 millions centimes) -> pas de x10.
            if 100000 <= price <= 300000:
                should_multiply_x10 = True
        else:
            # Pour les voitures standards, un prix inférieur à 400 000 DZD est manifestement erroné (ex: 180k -> 1.8M)
            if 100000 <= price <= 400000:
                should_multiply_x10 = True

        # Cas 1 : Saisie en format centimes (ex: 240,000 DZD au lieu de 2,400,000 DZD)
        if should_multiply_x10:
            old_price = price
            price = price * 10
            has_correction = True
            correction_reason = f"Correction de prix auto (Format centimes x10) : {old_price:,} DZD -> {price:,} DZD."
        
        # Cas 2 : Saisie en millions de centimes (ex: 24,000 DZD au lieu de 2,400,000 DZD)
        elif 10000 <= price <= 99000:
            old_price = price
            price = price * 100
            has_correction = True
            correction_reason = f"Correction de prix auto (Format centimes x100) : {old_price:,} DZD -> {price:,} DZD."

    # 2. VALIDATION DES CRITÈRES DE CRÉDIBILITÉ PHYSIQUES ET PRIX PLANCHERS (Après correction éventuelle)
    
    # Prix absurde total (inférieur à 100 000 DZD) pour des voitures
    if price < 100000:
        return {
            "is_credible": False,
            "corrected_price": None,
            "reason": f"Prix suspect : {price:,} DZD est trop bas pour un véhicule sur le marché.",
            "score": 5
        }
        
    # Prix plancher pour véhicules récents (ex: Sandero 2024 à 120 000 DZD corrigé en 1 200 000 DZD)
    # Même corrigé, 1,2 Millions DZD reste impossible pour un modèle 2022+ ou 2024+. C'est un crédit/leasing ou une arnaque.
    if year >= 2022 and price < 1500000:
        return {
            "is_credible": False,
            "corrected_price": None,
            "reason": f"Prix suspect : Même après analyse, {price:,} DZD reste anormalement bas pour un véhicule récent ({year}). Probablement un apport de crédit/leasing ou arnaque.",
            "score": 8
        }
        
    if year >= 2024 and price < 2200000:
        return {
            "is_credible": False,
            "corrected_price": None,
            "reason": f"Prix suspect : Même après analyse, {price:,} DZD reste anormalement bas pour un véhicule neuf de {year}. Apport crédit/leasing ou arnaque.",
            "score": 8
        }
        
    # Véhicule ancien avec kilométrage de véhicule neuf (ex: Golf 2008 avec 50 km)
    if year < 2018 and mileage < 1000:
        return {
            "is_credible": False,
            "corrected_price": None,
            "reason": f"Kilométrage suspect : {mileage:,} km est anormalement bas pour un véhicule de {year}.",
            "score": 10
        }
        
    # Véhicule récent avec kilométrage absurde
    if year >= 2022 and mileage > 600000:
        return {
            "is_credible": False,
            "corrected_price": None,
            "reason": f"Kilométrage suspect : {mileage:,} km pour un véhicule très récent ({year}).",
            "score": 12
        }

    # 3. VERDICT DES CRITÈRES STANDARDS ET RETOUR DES RÉSULTATS
    if has_correction:
        return {
            "is_credible": True,
            "corrected_price": price,
            "reason": correction_reason,
            "score": 90
        }

    if 1000000 <= price <= 120000000 and 1000 <= mileage <= 400000:
        # For standard range prices, also run sequence/pattern check to catch fake prices
        if price < 3000000:
            price_str = str(price)
            sequences = ["123", "234", "345", "456", "567", "678", "789"]
            if re.sub(r'\D', '', price_str) and re.match(r'^(\d)\1+$', re.sub(r'\D', '', price_str)):
                return {
                    "is_credible": False,
                    "corrected_price": None,
                    "reason": f"Prix suspect : séquence répétitive détectée ({price:,} DZD).",
                    "score": 5
                }
        return {
            "is_credible": True,
            "corrected_price": price,
            "reason": "Passé par pré-filtrage automatique (paramètres de marché standards).",
            "score": 95
        }

    # 2. ÉTAPE B : FILTRAGE ASSISTÉ PAR L'IA CLAUDE (Pour les cas limites et anomalies de prix)
    if not ANTHROPIC_KEY or ANTHROPIC_KEY == "...":
        # Fallback de secours si aucune clé IA n'est définie
        return {
            "is_credible": True,
            "corrected_price": price,
            "reason": "Pas de clé Anthropic configurée. Validé par défaut.",
            "score": 80
        }
        
    print(f"   [AI FILTERING] Analyse par Claude de l'annonce atypique : {brand} {model} ({year}) - Prix initial : {price:,} DZD...")
    
    system_prompt = (
        "Vous êtes l'IA experte de QimatnaDz chargée de valider la crédibilité des annonces de voitures d'occasion en Algérie "
        "et de corriger les erreurs de prix fréquentes.\n"
        "Règles du marché Algérien :\n"
        "- Les gens omettent parfois des zéros (ex: '350000' DZD au lieu de '3500000' DZD pour 350 millions centimes).\n"
        "- Les gens écrivent parfois en millions de centimes au lieu de dinars (ex: '350' ou '350.5' au lieu de '3500000' DZD).\n"
        "- Les prix inférieurs à 200 000 DZD pour des voitures récentes (ex: Golf 2022) sont souvent des arnaques ou des apports de crédit (crédit leasing), pas le prix total du véhicule. Marquez-les comme non crédibles ('is_credible': false).\n"
        "- Les voitures de luxe (Porsche, récents Mercedes Classe G) peuvent valoir plus de 20 000 000 DZD.\n"
        "Répondez UNIQUEMENT avec un objet JSON structuré comme suit, sans aucun autre texte d'introduction :\n"
        "{\n"
        '  "is_credible": true/false,\n'
        '  "corrected_price": int (en DZD, corrigé si erreur évidente, ou égal au prix initial, ou null si non crédible),\n'
        '  "reason": "explication claire en français de votre décision",\n'
        '  "credibility_score": int (0 à 100)\n'
        "}"
    )
    
    user_message = (
        f"Marque: {brand}\n"
        f"Modèle: {model}\n"
        f"Année: {year}\n"
        f"Kilométrage: {mileage:,} km\n"
        f"Prix initial: {price:,} DZD\n"
        f"Source: {source}\n"
        f"Lien: {url}\n"
    )
    
    try:
        api_url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        payload = {
            "model": "claude-haiku-4-5",
            "max_tokens": 300,
            "system": system_prompt,
            "messages": [
                {"role": "user", "content": user_message}
            ],
            "temperature": 0.0
        }
        
        response = requests.post(api_url, json=payload, headers=headers, timeout=12)
        if response.status_code == 200:
            resp_data = response.json()
            content_text = resp_data["content"][0]["text"].strip()
            
            # Extraire l'objet JSON de la réponse brute
            json_match = re.search(r'\{.*\}', content_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group(0))
                return {
                    "is_credible": bool(result.get("is_credible", True)),
                    "corrected_price": result.get("corrected_price") or price,
                    "reason": result.get("reason", "Validé avec succès par l'IA."),
                    "score": int(result.get("credibility_score", 90))
                }
        else:
            print(f"      [AI WARN] Anthropic API HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print(f"      [AI WARN] Exception pendant le filtrage IA: {e}")
        
    # Par défaut si l'API échoue, on accepte l'annonce pour ne pas pénaliser le scraping
    return {
        "is_credible": True,
        "corrected_price": price,
        "reason": "Échec de validation IA (erreur API). Accepté par défaut.",
        "score": 75
    }
