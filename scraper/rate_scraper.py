import requests
from bs4 import BeautifulSoup
import os
import sys
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Add current directory to sys.path to allow imports from db.py
sys.path.insert(0, str(Path(__file__).parent))

from db import get_supabase_client, update_scraper_status

load_dotenv()

def scrape_square_rates():
    url = "https://devisesquare.com/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    rates = {}
    
    try:
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        articles = soup.find_all('article')
        for article in articles:
            h1_header = article.find('h1')
            if not h1_header:
                continue
            
            currency_text = h1_header.text.strip().upper()
            
            # Extract Buy Rate
            buy_div = article.find(class_='buy')
            buy_rate = None
            if buy_div:
                buy_h1 = buy_div.find('h1')
                if buy_h1:
                    buy_text = buy_h1.get_text().strip()
                    buy_rate = float(buy_text)
            
            # Extract Sell Rate
            sell_div = article.find(class_='sell')
            sell_rate = None
            if sell_div:
                sell_h1 = sell_div.find('h1')
                if sell_h1:
                    sell_text = sell_h1.get_text().strip()
                    sell_rate = float(sell_text)
            
            if buy_rate and sell_rate:
                if 'EURO' in currency_text:
                    rates['EUR'] = {'buy': buy_rate, 'sell': sell_rate}
                elif 'US DOLLAR' in currency_text:
                    rates['USD'] = {'buy': buy_rate, 'sell': sell_rate}
                elif 'POUND' in currency_text:
                    rates['GBP'] = {'buy': buy_rate, 'sell': sell_rate}
                elif 'CA DOLLAR' in currency_text:
                    rates['CAD'] = {'buy': buy_rate, 'sell': sell_rate}
                    
    except Exception as e:
        print(f"Erreur scraping devisesquare: {e}")
    
    # Fallback to baseline rates if scraping fails to fetch
    if 'EUR' not in rates:
        rates['EUR'] = {'buy': 282.0, 'sell': 280.0}
    if 'USD' not in rates:
        rates['USD'] = {'buy': 240.0, 'sell': 238.0}
    
    # Calculate AED based on parallel USD rate
    if 'AED' not in rates:
        rates['AED'] = {'buy': round(rates['USD']['buy'] / 3.67, 1), 'sell': round(rates['USD']['sell'] / 3.67, 1)}
        
    return rates

def update_supabase(rates):
    try:
        supabase = get_supabase_client()
    except Exception as e:
        print(f"Skipping Supabase update (Invalid or missing key): {e}")
        return
    
    for code, values in rates.items():
        # 1. Update exchange_rates history
        data = {
            "currency_code": code,
            "buy_rate": values['buy'],
            "sell_rate": values['sell'],
            "created_at": "now()"
        }
        try:
            supabase.table("exchange_rates").insert(data).execute()
            print(f"Updated exchange_rates {code}: Buy {values['buy']} / Sell {values['sell']}")
        except Exception as e:
            print(f"Error inserting exchange_rates for {code}: {e}")
            
        # 2. Update macro_indices key for EUR (euro_square_rate) for direct motor access
        if code == 'EUR':
            try:
                supabase.table("macro_indices").upsert({
                    "key": "euro_square_rate",
                    "value": values['buy']
                }, on_conflict="key").execute()
                print(f"Synchronized macro_indices key 'euro_square_rate' to {values['buy']}")
            except Exception as e:
                print(f"Error updating macro_indices for euro_square_rate: {e}")

if __name__ == "__main__":
    try:
        rates = scrape_square_rates()
        print("Scraped rates from devisesquare.com:", rates)
        update_supabase(rates)
        update_scraper_status("Square Parallel EUR Rate Scraper", "OK", records_added=len(rates))
    except Exception as e:
        print(f"Global error in rate scraper: {e}")
        update_scraper_status("Square Parallel EUR Rate Scraper", "ERROR", error_message=str(e))
