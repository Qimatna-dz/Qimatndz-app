import os
import re
import requests
import json

# 1. Read environment variables from .env
env_vars = {}
try:
    with open(".env", "r") as f:
        for line in f:
            if line.strip() and not line.strip().startswith("#") and "=" in line:
                key, val = line.strip().split("=", 1)
                env_vars[key] = val
except Exception as e:
    print(f"[ERROR] Error reading .env file: {e}")
    exit(1)

SUPABASE_URL = env_vars.get("EXPO_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = env_vars.get("EXPO_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] Could not extract Supabase URL or Key from .env file.")
    exit(1)

print(f"[INFO] Supabase URL: {SUPABASE_URL}")

# 2. Parse migrations file to extract SQL inserts
migration_path = "supabase/migrations/20260517140000_add_luxury_brands_catalog.sql"
payload = []

try:
    with open(migration_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Match all row tuples like: ('Mercedes-Benz', 'Classe A', 'A180', 2012, 2026, 'citadine', 'essence')
    pattern = re.compile(r"\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\)")
    matches = pattern.findall(content)
    
    for m in matches:
        payload.append({
            "brand": m[0],
            "model": m[1],
            "trim": m[2],
            "year_from": int(m[3]),
            "year_to": int(m[4]),
            "body_type": m[5],
            "fuel_type": m[6]
        })
except Exception as e:
    print(f"[ERROR] Error parsing SQL migration file: {e}")
    exit(1)

print(f"[INFO] Parsed {len(payload)} luxury brand models from migration file.")

# 3. Seed Supabase REST API
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates" # Upsert behavior!
}

chunk_size = 30
success_count = 0

print("[INFO] Starting direct seeding of premium vehicle catalog on Supabase...")

for i in range(0, len(payload), chunk_size):
    chunk = payload[i:i + chunk_size]
    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/vehicle_catalog",
            headers=headers,
            data=json.dumps(chunk)
        )
        if response.status_code in [200, 201]:
            print(f"[OK] Seeded chunk {i//chunk_size + 1} ({len(chunk)} items) successfully!")
            success_count += len(chunk)
        else:
            # Fallback without resolution=merge-duplicates if server doesn't support it
            headers_fallback = {**headers}
            headers_fallback.pop("Prefer", None)
            response_fallback = requests.post(
                f"{SUPABASE_URL}/rest/v1/vehicle_catalog",
                headers=headers_fallback,
                data=json.dumps(chunk)
            )
            if response_fallback.status_code in [200, 201]:
                print(f"[OK] Seeded chunk {i//chunk_size + 1} ({len(chunk)} items) via standard insert!")
                success_count += len(chunk)
            else:
                print(f"[FAIL] Failed to seed chunk {i//chunk_size + 1}: {response_fallback.status_code} - {response_fallback.text}")
    except Exception as e:
        print(f"[EXCEPTION] Network exception on chunk {i//chunk_size + 1}: {e}")

print(f"[SUCCESS] Seeding complete! {success_count} / {len(payload)} luxury vehicle models successfully seeded into the database catalog.")
