import requests
import time
from datetime import datetime
import os
from pathlib import Path
from dotenv import load_dotenv

try:
    from bs4 import BeautifulSoup
except ImportError:
    # Si bs4 n'est pas installé, on fera une extraction regex simple ou on installe
    import re

load_dotenv(dotenv_path=Path(__file__).parent / ".env")
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

import supabase as sb
url = os.getenv("SUPABASE_URL") or os.getenv("EXPO_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("EXPO_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    raise ValueError("Missing SUPABASE credentials")

supabase = sb.create_client(url, key)

def check_market_news_signals():
    print(f"[{datetime.now()}] Démarrage du News Scraper (Conjoncture Auto Algérie)...")
    
    # Mots clés impactant les prix à la hausse (Crise, gel, suspension, retard)
    bullish_keywords = ["تجميد", "suspension", "gel", "retard", "ندرة", "أزمة", "arrêt", "interdiction", "منع"]
    
    # Mots clés impactant les prix à la baisse (Ouverture, importation, quota, facilité)
    bearish_keywords = ["استيراد", "importation", "كوطة", "quota", "تسهيلات", "facilité", "دخول", "arrivée", "disponible", "تخفيض"]
    
    alert_signal = 1.000
    headlines_found = []
    
    # On utilise quelques flux RSS ou pages connues pour l'automobile en Algérie
    # Pour l'exemple, on va scraper les titres de la page d'accueil de Autobip et Algerie-eco
    sources = [
        "https://www.autobip.com/",
        "https://www.algerie-eco.com/category/auto/"
    ]
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
    
    try:
        from bs4 import BeautifulSoup
        for source in sources:
            try:
                res = requests.get(source, headers=headers, timeout=10)
                if res.status_code == 200:
                    soup = BeautifulSoup(res.text, "html.parser")
                    # Chercher tous les titres h1, h2, h3, a
                    for tag in soup.find_all(['h1', 'h2', 'h3', 'a']):
                        text = tag.get_text(strip=True).lower()
                        if len(text) > 20: # Uniquement les phrases
                            if any(k in text for k in bullish_keywords) and ("auto" in text or "سيار" in text):
                                alert_signal = 1.050 # +5%
                                headlines_found.append(text)
                            elif any(k in text for k in bearish_keywords) and ("auto" in text or "سيار" in text):
                                alert_signal = 0.950 # -5%
                                headlines_found.append(text)
            except Exception as e:
                print(f"[WARN] Erreur avec la source {source}: {e}")
                
    except ImportError:
        print("[WARN] BeautifulSoup non installé. Exécution regex fallback.")
        import re
        for source in sources:
            try:
                res = requests.get(source, headers=headers, timeout=10)
                if res.status_code == 200:
                    texts = re.findall(r'<a[^>]*>(.*?)</a>', res.text)
                    for text in texts:
                        text = text.lower().strip()
                        if "<" not in text and len(text) > 20:
                            if any(k in text for k in bullish_keywords) and ("auto" in text or "سيار" in text):
                                alert_signal = 1.050
                                headlines_found.append(text)
                            elif any(k in text for k in bearish_keywords) and ("auto" in text or "سيار" in text):
                                alert_signal = 0.950
                                headlines_found.append(text)
            except Exception as e:
                pass

    if headlines_found:
        print(f"[{datetime.now()}] {len(headlines_found)} titres macro-économiques détectés. Nouveau coef: {alert_signal}")
    else:
        print(f"[{datetime.now()}] Aucun titre macro-économique majeur détecté. Coef stable: {alert_signal}")

    try:
        headline_summary = " | ".join(headlines_found[:3]) if headlines_found else "Marché stable"
        
        supabase.table("market_news_signals").insert({
            "current_coef": alert_signal,
            "headline": headline_summary,
            "captured_at": datetime.now().isoformat()
        }).execute()
        
        print(f"[{datetime.now()}] ✅ Signal de conjoncture inséré en base.")
    except Exception as db_err:
        print(f"[{datetime.now()}] [ERREUR DB] Impossible d'insérer dans market_news_signals. {db_err}")
        print("Note: Si la table n'existe pas, exécutez la migration event_driven_schema.sql dans Supabase.")

if __name__ == "__main__":
    check_market_news_signals()
