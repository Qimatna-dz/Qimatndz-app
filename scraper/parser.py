from bs4 import BeautifulSoup
import re

def parse_price(price_str):
    """Extracts numeric price from string like '571 مليون' or '1.850.000 DA'"""
    if not price_str: return 0
    price_str = price_str.lower()
    nums = re.sub(r'[^\d.,]', '', price_str).replace(',', '.')
    try:
        val = float(nums)
        if 'مليون' in price_str or 'million' in price_str:
            return int(val * 10000)
        return int(val)
    except:
        return 0

def is_realistic_price(price):
    """Filters out common placeholders like 1, 123, 111111, etc."""
    s = str(price)
    if price < 150000 or price > 25000000:
        return False
    if len(s) >= 3 and len(set(s)) == 1:
        return False
    if s in "123456789" or s in "987654321":
        return False
    return True

def parse_mileage(mileage_str):
    """Extracts mileage from string like '85000 كم'"""
    if not mileage_str: return 0
    nums = re.sub(r'\D', '', mileage_str)
    return int(nums) if nums else 0

def parse_listing_html(html_card):
    """Parses individual listing card using BeautifulSoup."""
    soup = BeautifulSoup(html_card, 'html.parser')
    
    title_el = soup.select_one('.o-announ-card-title')
    title = title_el.get_text(strip=True) if title_el else ""
    
    price_el = soup.select_one('.price')
    price = parse_price(price_el.get_text(strip=True)) if price_el else 0
    
    if not is_realistic_price(price):
        return None
    
    link_el = soup.select_one('.o-announ-card-content')
    url = "https://www.ouedkniss.com" + link_el['href'] if link_el else ""
    
    # Extract attributes from chips
    chips = [c.get_text(strip=True) for c in soup.select('.v-chip')]
    
    mileage = 0
    wilaya = "16 - Alger" # Default
    year = 0
    
    for chip in chips:
        if 'كم' in chip:
            mileage = parse_mileage(chip)
        # Wilaya often looks like "Alger, 16" or "Oran, 31"
        if re.search(r',\s*\d{2}$', chip):
            wilaya = chip
            
    # Try to extract year from title (e.g. "Polo 2018")
    year_match = re.search(r'(19|20)\d{2}', title)
    if year_match:
        year = int(year_match.group(0))

    # --- DETECTION INTELLIGENTE DE LA FINITION (SUB-MODEL) ---
    trim = "Standard"
    title_lower = title.lower()
    
    # Liste de mots-clés par importance
    trims_keywords = {
        "Adventure": ["adventure", "adv"],
        "Revolution": ["revolution", "revo"],
        "GR Sport": ["gr sport", "gr-sport", "gr"],
        "GT Line": ["gt line", "gtline", "gt-line"],
        "FR": ["fr", "leon fr"],
        "R-Line": ["r line", "r-line", "rline"],
        "Highline": ["highline"],
        "Carat": ["carat"],
        "Legend": ["legend"],
        "Extreme": ["extreme"],
        "Black Edition": ["black edition", "black"],
    }

    for name, keywords in trims_keywords.items():
        if any(kw in title_lower for kw in keywords):
            trim = name
            break
            
    return {
        "brand": "Renault", # Will be refined in main loop
        "model": "Symbol",  # Will be refined
        "year": year,
        "mileage": mileage,
        "price_asked": price,
        "wilaya": wilaya,
        "condition": "bon",
        "trim": trim,       # Nouvelle colonne detectee
        "url": url,
        "scraped_at": "now()"
    }
