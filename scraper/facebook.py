import random
import time

def scrape_facebook_listings(brand: str, model: str) -> list:
    """
    Placeholder for Facebook Marketplace scraping logic.
    In a real scenario, this would use Playwright or a similar tool.
    """
    print(f"Scraping Facebook Marketplace for {brand} {model}...")
    
    # Simulating data for now to show multi-source capability
    # In production, this would be a real crawler
    mock_data = [
        {
            "brand": brand,
            "model": model,
            "price_asked": random.randint(1800000, 3500000),
            "year": random.randint(2015, 2024),
            "mileage": random.randint(20000, 150000),
            "wilaya": random.choice(["Alger", "Oran", "Blida", "Constantine"]),
            "source": "facebook",
            "url": f"https://www.facebook.com/marketplace/item/{random.randint(1000000, 9999999)}",
        } for _ in range(3)
    ]
    
    time.sleep(2)
    return mock_data
