import sys
import os
import time

# Allow running as `python main.py` from the scraper/ directory
sys.path.insert(0, os.path.dirname(__file__))

from ouedkniss import scrape_category
from facebook import scrape_facebook_listings
from db import get_supabase_client, insert_listing, get_vehicle_catalog


def main():
    print("--- QimatnaDz Multi-Source Scraper Started ---")

    try:
        client = get_supabase_client()
    except Exception as e:
        print(f"Failed to connect to Supabase: {e}")
        return

    # Fetch dynamic list of models from database
    catalog = get_vehicle_catalog(client)
    if not catalog:
        print("Catalog is empty. Check your database.")
        return

    print(f"Found {len(catalog)} models to scrape.")

    for entry in catalog:
        brand = entry["brand"]
        model = entry["model"]
        
        # 1. Scrape Ouedkniss
        brand_slug = brand.lower().replace(" ", "-")
        model_slug = model.lower().replace(" ", "-")
        url = f"https://www.ouedkniss.com/automobiles/{brand_slug}/{model_slug}"
        
        listings_ok = scrape_category(url)
        
        # 2. Scrape Facebook (or other sources)
        listings_fb = scrape_facebook_listings(brand, model)
        
        all_listings = listings_ok + listings_fb
        new_count = 0
        
        for data in all_listings:
            data["brand"] = brand
            data["model"] = model
            
            if insert_listing(client, data):
                new_count += 1

        print(f"Finished {brand} {model}: {new_count} new listings added from multiple sources.")
        time.sleep(5)


if __name__ == "__main__":
    main()
