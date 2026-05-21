import requests
import random
import json

# Configuration (Replace with your actual values if not set)
SUPABASE_URL = "" 
SUPABASE_KEY = ""

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ Please set SUPABASE_URL and SUPABASE_KEY in the script.")
    # Attempt to use local defaults for the user to see where to edit
    exit(1)

MODELS = [
    {"brand": "Renault", "model": "Symbol", "base_2018": 750000},
    {"brand": "Toyota", "model": "Corolla", "base_2018": 1800000},
    {"brand": "Hyundai", "model": "Elantra", "base_2018": 1100000},
    {"brand": "Peugeot", "model": "206", "base_2018": 650000}, # Adjusted from 2012 ref
    {"brand": "Volkswagen", "model": "Polo", "base_2018": 1050000},
    {"brand": "Dacia", "model": "Logan", "base_2018": 680000},
    {"brand": "Renault", "model": "Clio", "base_2018": 900000},
    {"brand": "Toyota", "model": "Yaris", "base_2018": 1200000},
    {"brand": "Kia", "model": "Sportage", "base_2018": 2200000},
    {"brand": "Hyundai", "model": "i10", "base_2018": 650000},
]

WILAYAS = ["Alger", "Oran", "Constantine", "Béjaïa", "Tizi Ouzou", "Sétif", "Blida"]

def generate_data(count=450):
    data = []
    for _ in range(count):
        m = random.choice(MODELS)
        year = random.randint(2012, 2024)
        mileage = random.randint(10000, 250000)
        
        # Calculate price based on logic
        year_factor = 1.08 ** (year - 2018)
        mileage_factor = 1.0
        if mileage > 80000:
            mileage_factor = 0.97 ** ((mileage - 80000) / 20000)
            
        random_var = random.uniform(0.92, 1.08)
        price_asked = int(m["base_2018"] * year_factor * mileage_factor * random_var)
        
        data.append({
            "brand": m["brand"],
            "model": m["model"],
            "year": year,
            "mileage": mileage,
            "price_asked": price_asked,
            "wilaya": random.choice(WILAYAS),
            "source_weight": 0.6,
            "url": f"https://www.ouedkniss.com/annonces/{random.randint(10000000, 99999999)}"
        })
    return data

def seed():
    print(f"🚀 Generating {450} simulated listings...")
    payload = generate_data(450)
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    # Chunking for Supabase limits
    chunk_size = 100
    for i in range(0, len(payload), chunk_size):
        chunk = payload[i:i + chunk_size]
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/listings",
            headers=headers,
            data=json.dumps(chunk)
        )
        if response.status_code in [200, 201]:
            print(f"✅ Inserted chunk {i//chunk_size + 1}")
        else:
            print(f"❌ Error in chunk {i//chunk_size + 1}: {response.text}")

if __name__ == "__main__":
    seed()
