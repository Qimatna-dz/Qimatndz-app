import requests
from bs4 import BeautifulSoup
from parser import parse_listing_html


def scrape_category(category_url: str) -> list:
    """Scrapes a specific category page on Ouedkniss using real CSS selectors."""
    print(f"Scraping category: {category_url}")
    try:
        response = requests.get(
            category_url,
            timeout=15,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7"
            },
        )
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')
        
        # The selector identified by the browser subagent
        cards = soup.select('.o-announ-card')
        print(f"Found {len(cards)} listing cards.")
        
        results = []
        for card in cards:
            try:
                # Convert card back to string for the parser (or pass soup object directly)
                data = parse_listing_html(str(card))
                if data and data.get("url"):
                    results.append(data)
                elif data is None:
                    # Case where price was unrealistic
                    continue
            except Exception as parse_err:
                print(f"Error parsing card: {parse_err}")
                continue

        return results
    except Exception as e:
        print(f"Scraping error for {category_url}: {e}")
        return []
