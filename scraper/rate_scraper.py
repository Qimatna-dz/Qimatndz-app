"""
rate_scraper.py — Scraping du taux de change parallèle (EUR/DZD) pour QimatnaDz.

[Défi 4] Améliorations :
  - Source principale : devisesquare.com
  - Source secondaire de fallback : dzair-market.com (si principale échoue)
  - Timestamp de fraîcheur : updated_at sauvegardé dans macro_indices
  - Avertissement si taux > 48h non mis à jour
"""

import requests
from bs4 import BeautifulSoup
import os
import sys
from pathlib import Path
from datetime import datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).parent))
from db import get_supabase_client, update_scraper_status

load_dotenv()


def scrape_source_devisesquare() -> dict:
    """Source principale : devisesquare.com — Taux du marché parallèle algérien."""
    url = "https://devisesquare.com/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    rates = {}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        articles = soup.find_all('article')
        for article in articles:
            h1_header = article.find('h1')
            if not h1_header:
                continue
            
            currency_text = h1_header.text.strip().upper()
            
            buy_div = article.find(class_='buy')
            buy_rate = None
            if buy_div:
                buy_h1 = buy_div.find('h1')
                if buy_h1:
                    try:
                        buy_rate = float(buy_h1.get_text().strip().replace(',', '.'))
                    except ValueError:
                        pass
            
            sell_div = article.find(class_='sell')
            sell_rate = None
            if sell_div:
                sell_h1 = sell_div.find('h1')
                if sell_h1:
                    try:
                        sell_rate = float(sell_h1.get_text().strip().replace(',', '.'))
                    except ValueError:
                        pass
            
            if buy_rate and sell_rate:
                if 'EURO' in currency_text:
                    rates['EUR'] = {'buy': buy_rate, 'sell': sell_rate, 'source': 'devisesquare.com'}
                elif 'US DOLLAR' in currency_text:
                    rates['USD'] = {'buy': buy_rate, 'sell': sell_rate, 'source': 'devisesquare.com'}
                elif 'POUND' in currency_text:
                    rates['GBP'] = {'buy': buy_rate, 'sell': sell_rate, 'source': 'devisesquare.com'}
                elif 'CA DOLLAR' in currency_text:
                    rates['CAD'] = {'buy': buy_rate, 'sell': sell_rate, 'source': 'devisesquare.com'}
        
        if rates:
            print(f"   ✅ Source principale (devisesquare.com) : {len(rates)} devises récupérées.")
        else:
            print(f"   ⚠️  Source principale : aucune devise parsée depuis devisesquare.com")

    except Exception as e:
        print(f"   ⚠️  Source principale inaccessible : {e}")
    
    return rates


def scrape_source_dzairmarket() -> dict:
    """
    [Défi 4] Source secondaire de fallback : dzair-market.com
    Utilisée seulement si la source principale échoue.
    """
    url = "https://www.dzair-market.com/taux-de-change"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    rates = {}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Chercher les balises contenant EUR/USD avec des taux numériques
        # Structure variable selon le site — on cherche des patterns de prix
        tables = soup.find_all('table')
        for table in tables:
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 3:
                    currency_cell = cells[0].get_text(strip=True).upper()
                    try:
                        buy_text = cells[1].get_text(strip=True).replace(',', '.').replace(' ', '')
                        sell_text = cells[2].get_text(strip=True).replace(',', '.').replace(' ', '')
                        buy_val = float(buy_text)
                        sell_val = float(sell_text)
                        
                        # Validation : taux EUR/DZD parallèle doit être entre 200 et 500
                        if not (200 <= buy_val <= 500):
                            continue
                        
                        if 'EUR' in currency_cell or 'EURO' in currency_cell:
                            rates['EUR'] = {'buy': buy_val, 'sell': sell_val, 'source': 'dzair-market.com'}
                        elif 'USD' in currency_cell or 'DOLLAR' in currency_cell:
                            rates['USD'] = {'buy': buy_val, 'sell': sell_val, 'source': 'dzair-market.com'}
                    except (ValueError, IndexError):
                        continue
        
        if rates:
            print(f"   ✅ Source secondaire (dzair-market.com) : {len(rates)} devises récupérées.")
        else:
            print(f"   ⚠️  Source secondaire : aucune devise parsée depuis dzair-market.com")

    except Exception as e:
        print(f"   ⚠️  Source secondaire inaccessible : {e}")
    
    return rates


def get_rates_with_fallback() -> dict:
    """
    [Défi 4] Stratégie multi-sources avec fallback automatique.
    1. Essaie devisesquare.com (principale)
    2. Si EUR manque, essaie dzair-market.com (secondaire)  
    3. Si les deux échouent, utilise les dernières valeurs connues en DB
    4. En dernier recours, utilise les valeurs historiques hardcodées
    """
    # Tentative source principale
    rates = scrape_source_devisesquare()
    
    # Si EUR manque, tenter source secondaire
    if 'EUR' not in rates:
        print("   🔄 EUR manquant depuis source principale, tentative source secondaire...")
        secondary = scrape_source_dzairmarket()
        rates.update(secondary)  # Fusionner les résultats
    
    # Si toujours pas d'EUR, essayer de lire le dernier taux depuis la DB
    if 'EUR' not in rates:
        print("   🔄 Sources web indisponibles, lecture du dernier taux en DB...")
        try:
            supabase = get_supabase_client()
            last_rate = (
                supabase.table("exchange_rates")
                .select("currency_code, buy_rate, sell_rate, created_at")
                .eq("currency_code", "EUR")
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            if last_rate.data:
                row = last_rate.data[0]
                rate_age_h = (datetime.now(timezone.utc) - datetime.fromisoformat(row['created_at'].replace('Z', '+00:00'))).total_seconds() / 3600
                rates['EUR'] = {'buy': row['buy_rate'], 'sell': row['sell_rate'], 'source': f'db_cache_{rate_age_h:.0f}h'}
                print(f"   📦 Taux EUR récupéré depuis DB (âge: {rate_age_h:.0f}h) : {row['buy_rate']} / {row['sell_rate']}")
                
                if rate_age_h > 48:
                    print(f"   ⚠️  ATTENTION : Le taux EUR en DB a {rate_age_h:.0f}h. Peut être périmé !")
        except Exception as e:
            print(f"   ⚠️  Impossible de lire le dernier taux DB : {e}")
    
    # Dernier recours : valeurs historiques conservatrices
    if 'EUR' not in rates:
        print("   🆘 Utilisation des valeurs de secours hardcodées (toutes sources épuisées).")
        rates['EUR'] = {'buy': 282.0, 'sell': 280.0, 'source': 'hardcoded_fallback'}
    if 'USD' not in rates:
        rates['USD'] = {'buy': 240.0, 'sell': 238.0, 'source': 'hardcoded_fallback'}
    
    # Calculer AED à partir du USD parallèle (1 USD = 3.67 AED)
    if 'AED' not in rates:
        rates['AED'] = {
            'buy': round(rates['USD']['buy'] / 3.67, 1),
            'sell': round(rates['USD']['sell'] / 3.67, 1),
            'source': 'calculated_from_usd'
        }
    
    return rates


def update_supabase(rates: dict):
    try:
        supabase = get_supabase_client()
    except Exception as e:
        print(f"Skipping Supabase update (Invalid or missing key): {e}")
        return
    
    now_iso = datetime.now(timezone.utc).isoformat()
    
    for code, values in rates.items():
        source = values.get('source', 'unknown')
        
        # 1. Historique des taux de change
        data = {
            "currency_code": code,
            "buy_rate": values['buy'],
            "sell_rate": values['sell'],
            "source_url": source,
            "created_at": now_iso
        }
        try:
            supabase.table("exchange_rates").insert(data).execute()
            print(f"   [exchange_rates] {code}: Achat {values['buy']} / Vente {values['sell']} (source: {source})")
        except Exception as e:
            print(f"   [ERROR exchange_rates] {code}: {e}")
            
        # 2. macro_indices avec timestamp pour validation de fraîcheur
        if code == 'EUR':
            try:
                supabase.table("macro_indices").upsert({
                    "key": "euro_square_rate",
                    "value": values['buy'],
                    "updated_at": now_iso
                }, on_conflict="key").execute()
                supabase.table("macro_indices").upsert({
                    "key": "euro_square_rate_source",
                    "value": source,
                    "updated_at": now_iso
                }, on_conflict="key").execute()
                print(f"   [macro_indices] euro_square_rate={values['buy']} (source: {source})")
            except Exception as e:
                print(f"   [ERROR macro_indices] EUR: {e}")
        
        if code == 'USD':
            try:
                supabase.table("macro_indices").upsert({
                    "key": "usd_square_rate",
                    "value": values['buy'],
                    "updated_at": now_iso
                }, on_conflict="key").execute()
            except Exception as e:
                print(f"   [ERROR macro_indices] USD: {e}")


if __name__ == "__main__":
    try:
        print("=" * 60)
        print("  💱 QimatnaDz — Scraper Taux de Change Parallèle")
        print("=" * 60)
        rates = get_rates_with_fallback()
        print("\nTaux finaux utilisés:")
        for code, vals in rates.items():
            print(f"  {code}: {vals['buy']} / {vals['sell']} DZD (source: {vals.get('source', 'unknown')})")
        update_supabase(rates)
        update_scraper_status("Square Parallel EUR Rate Scraper", "OK", records_added=len(rates))
    except Exception as e:
        print(f"Global error in rate scraper: {e}")
        update_scraper_status("Square Parallel EUR Rate Scraper", "ERROR", error_message=str(e))
