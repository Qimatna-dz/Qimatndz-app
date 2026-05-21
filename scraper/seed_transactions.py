"""
seed_transactions.py — Population de la base 'real_transactions' avec des ventes confirmées.
Ces données sont prioritaires (Poids x2) dans l'algorithme QimatnaDz.
"""

import os
from supabase import Client
from db import get_supabase_client

supabase: Client = get_supabase_client()

# Liste de ventes confirmées récentes (Référence 2024-2025)
REAL_SALES = [
    # Marque, Modèle, Année, Kilométrage, Prix Final (DZD), Wilaya
    ("Renault", "Symbol", 2020, 85000, 2450000, "Alger"),
    ("Renault", "Symbol", 2021, 62000, 2680000, "Oran"),
    ("Toyota", "Corolla", 2019, 120000, 3150000, "Blida"),
    ("Toyota", "Corolla", 2022, 45000, 5200000, "Alger"),
    ("Volkswagen", "Polo", 2018, 140000, 2850000, "Sétif"),
    ("Volkswagen", "Golf", 2015, 195000, 3100000, "Constantine"),
    ("Hyundai", "i10", 2016, 110000, 1550000, "Alger"),
    ("Hyundai", "Elantra", 2018, 95000, 3450000, "Annaba"),
    ("Kia", "Picanto", 2019, 78000, 2250000, "Alger"),
    ("Kia", "Sportage", 2022, 35000, 6800000, "Alger"),
    ("Dacia", "Logan", 2017, 160000, 1850000, "Tizi Ouzou"),
    ("Dacia", "Logan", 2021, 55000, 2750000, "Alger"),
    ("Peugeot", "208", 2015, 155000, 1950000, "Béjaïa"),
    ("Peugeot", "308", 2019, 92000, 3650000, "Alger"),
    ("Suzuki", "Swift", 2022, 28000, 3050000, "Oran"),
]

def seed_transactions():
    print("--- Debut du seeding des ventes confirmees (real_transactions)")
    
    total = 0
    for brand, model, year, mileage, price, wilaya in REAL_SALES:
        try:
            # On insère sans vérification d'existence car ce sont des transactions unitaires
            data = {
                "brand": brand,
                "model": model,
                "year": year,
                "mileage": mileage,
                "final_price": price,
                "wilaya": wilaya,
                "user_role": "expert_verified"
            }
            
            supabase.table("real_transactions").insert(data).execute()
            total += 1
            print(f"   [OK] {brand} {model} {year} vendu a {price} DZD")
            
        except Exception as e:
            print(f"   [ERROR] Erreur pour {brand} {model}: {e}")

    print(f"\n--- Seeding termine ! {total} transactions inserees.")

if __name__ == "__main__":
    seed_transactions()
