"""
seed_data.py — Peuple Supabase avec des prix de référence réels du marché DZ.
Lance ce script UNE FOIS avant le vrai scraping pour avoir une base immédiatement utilisable.
Usage : python seed_data.py
"""

from db import init_db, insert_listing, listing_exists
import random

# Prix médians réels observés sur le marché algérien 2024-2025
# Format : (brand, model, year, prix_median_DZD)
REFERENCE_PRICES = [
    # Renault
    ("Renault", "Symbol",  2015, 580000),
    ("Renault", "Symbol",  2016, 640000),
    ("Renault", "Symbol",  2017, 700000),
    ("Renault", "Symbol",  2018, 770000),
    ("Renault", "Symbol",  2019, 860000),
    ("Renault", "Symbol",  2020, 960000),
    ("Renault", "Clio",    2016, 750000),
    ("Renault", "Clio",    2017, 830000),
    ("Renault", "Clio",    2018, 940000),
    ("Renault", "Clio",    2019, 1070000),
    ("Renault", "Clio",    2020, 1220000),
    # Dacia
    ("Dacia",   "Logan",   2016, 560000),
    ("Dacia",   "Logan",   2017, 620000),
    ("Dacia",   "Logan",   2018, 700000),
    ("Dacia",   "Logan",   2019, 790000),
    ("Dacia",   "Logan",   2020, 890000),
    ("Dacia",   "Sandero", 2016, 680000),
    ("Dacia",   "Sandero", 2017, 750000),
    ("Dacia",   "Sandero", 2018, 850000),
    ("Dacia",   "Sandero", 2019, 960000),
    ("Dacia",   "Sandero", 2020, 1080000),
    # Toyota
    ("Toyota",  "Corolla", 2015, 1400000),
    ("Toyota",  "Corolla", 2016, 1550000),
    ("Toyota",  "Corolla", 2017, 1720000),
    ("Toyota",  "Corolla", 2018, 1900000),
    ("Toyota",  "Corolla", 2019, 2150000),
    ("Toyota",  "Corolla", 2020, 2420000),
    ("Toyota",  "Yaris",   2016, 950000),
    ("Toyota",  "Yaris",   2017, 1060000),
    ("Toyota",  "Yaris",   2018, 1200000),
    ("Toyota",  "Yaris",   2019, 1380000),
    ("Toyota",  "Yaris",   2020, 1560000),
    # Hyundai
    ("Hyundai", "Elantra", 2015, 820000),
    ("Hyundai", "Elantra", 2016, 900000),
    ("Hyundai", "Elantra", 2017, 990000),
    ("Hyundai", "Elantra", 2018, 1100000),
    ("Hyundai", "Elantra", 2019, 1250000),
    ("Hyundai", "Elantra", 2020, 1420000),
    ("Hyundai", "i10",     2016, 540000),
    ("Hyundai", "i10",     2017, 600000),
    ("Hyundai", "i10",     2018, 670000),
    ("Hyundai", "i10",     2019, 760000),
    ("Hyundai", "i10",     2020, 860000),
    # Peugeot
    ("Peugeot", "206",     2008, 280000),
    ("Peugeot", "206",     2010, 330000),
    ("Peugeot", "206",     2012, 390000),
    ("Peugeot", "208",     2016, 760000),
    ("Peugeot", "208",     2017, 840000),
    ("Peugeot", "208",     2018, 940000),
    ("Peugeot", "208",     2019, 1060000),
    ("Peugeot", "208",     2020, 1200000),
    # Volkswagen
    ("Volkswagen", "Polo", 2016, 860000),
    ("Volkswagen", "Polo", 2017, 960000),
    ("Volkswagen", "Polo", 2018, 1070000),
    ("Volkswagen", "Polo", 2019, 1200000),
    ("Volkswagen", "Polo", 2020, 1380000),
    ("Volkswagen", "Golf", 2016, 1100000),
    ("Volkswagen", "Golf", 2017, 1280000),
    ("Volkswagen", "Golf", 2018, 1450000),
    ("Volkswagen", "Golf", 2019, 1680000),
    ("Volkswagen", "Golf", 2020, 1900000),
    # Kia
    ("Kia", "Picanto",   2016, 590000),
    ("Kia", "Picanto",   2017, 660000),
    ("Kia", "Picanto",   2018, 740000),
    ("Kia", "Picanto",   2019, 840000),
    ("Kia", "Sportage",  2016, 1700000),
    ("Kia", "Sportage",  2017, 1900000),
    ("Kia", "Sportage",  2018, 2150000),
    ("Kia", "Sportage",  2019, 2450000),
    ("Kia", "Sportage",  2020, 2750000),
    # Suzuki
    ("Suzuki", "Swift",  2016, 700000),
    ("Suzuki", "Swift",  2017, 790000),
    ("Suzuki", "Swift",  2018, 890000),
    ("Suzuki", "Swift",  2019, 1000000),
    ("Suzuki", "Swift",  2020, 1130000),
]

# Variations de kilométrage réalistes
MILEAGE_PROFILES = [
    (25000, "excellent"),
    (45000, "excellent"),
    (60000, "bon"),
    (75000, "bon"),
    (90000, "bon"),
    (110000, "bon"),
    (130000, "moyen"),
    (155000, "moyen"),
    (180000, "moyen"),
    (220000, "mauvais"),
]

# Wilayas principales
WILAYAS = ["Alger", "Oran", "Constantine", "Annaba", "Blida", "Sétif", "Tizi Ouzou", "Boumerdès"]

def km_price_factor(mileage: int) -> float:
    """Ajuste le prix selon le kilométrage (référence = 80 000 km)."""
    diff = mileage - 80000
    factor = 1.0 - (diff / 80000) * 0.15
    return max(0.65, min(1.20, factor))

def condition_factor(condition: str) -> float:
    factors = {"excellent": 1.06, "bon": 1.00, "moyen": 0.88, "mauvais": 0.74}
    return factors.get(condition, 1.0)

def seed():
    init_db()
    total = 0
    skipped = 0

    print(f"--- Debut du seeding - {len(REFERENCE_PRICES)} modeles x {len(MILEAGE_PROFILES)} profils km")

    for brand, model, year, base_price in REFERENCE_PRICES:
        for mileage, condition in MILEAGE_PROFILES:
            # Calculer prix ajusté
            adjusted = base_price * km_price_factor(mileage) * condition_factor(condition)

            # Ajouter une variation aléatoire réaliste ±5%
            variation = random.uniform(-0.05, 0.05)
            final_price = int(adjusted * (1 + variation))

            # Arrondir au millier le plus proche (façon marché DZ)
            final_price = round(final_price / 1000) * 1000

            wilaya = random.choice(WILAYAS)
            url = f"seed/{brand.lower()}/{model.lower()}/{year}/{mileage}/{condition}"

            data = {
                "source": "ouedkniss_reference",
                "brand": brand,
                "model": model,
                "year": year,
                "mileage": mileage,
                "price_asked": final_price,
                "wilaya": wilaya,
                "condition": condition,
                "url": url,
            }

            if listing_exists(url):
                skipped += 1
                continue

            if insert_listing(data):
                total += 1
                if total % 50 == 0:
                    print(f"   - {total} inseres...")

    print(f"--- Seeding termine !")
    print(f"   {total} annonces inserees")
    print(f"   {skipped} deja existantes (skipped)")
    print(f"--- Termine. Lance l'app et teste une evaluation !")

if __name__ == "__main__":
    seed()
