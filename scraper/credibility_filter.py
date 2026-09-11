import re

SEGMENT_MEDIANS = {
    "micro-citadine": 1500000,
    "citadine": 2200000,
    "berline": 3500000,
    "suv": 4500000,
    "luxe": 8000000
}

def classify_segment(brand: str, model: str) -> str:
    b = brand.lower()
    m = model.lower()
    if any(x in m for x in ["alto", "qq", "spark", "maruti", "atos", "i10", "picanto"]) or b == "maruti":
        return "micro-citadine"
    if any(x in m for x in ["clio", "208", "ibiza", "polo", "yaris", "swift", "sandero", "logan", "accent"]):
        return "citadine"
    if any(x in m for x in ["golf", "leon", "megane", "octavia", "corolla", "308", "elantra", "civic"]):
        return "berline"
    if any(x in m for x in ["tucson", "sportage", "duster", "tiguan", "q3", "3008", "kuga", "stepway", "qashqai", "macan"]):
        return "suv"
    if any(x in b for x in ["mercedes", "bmw", "audi", "porsche", "land rover"]) or any(x in m for x in ["land cruiser", "touareg", "prado", "cayenne"]):
        return "luxe"
    return "citadine" # Default fallback

def evaluate_credibility(listing: dict) -> dict:
    """
    Filtre mathématique déterministe qui évalue la crédibilité d'une annonce
    sans utiliser d'Intelligence Artificielle.
    """
    brand = listing.get("brand", "")
    model = listing.get("model", "")
    year = int(listing.get("year", 0))
    mileage = int(listing.get("mileage", 80000))
    price = int(listing.get("price_asked", 0))
    source = listing.get("source", "unknown")
    
    status = "VALID"
    correction_reasons = []
    
    # 1. FIX ZEROS (Format Centimes/Millions)
    if year >= 2015 and source != "ouedkniss_reference":
        is_budget_car = classify_segment(brand, model) == "micro-citadine"
        should_multiply_x10 = False
        
        if is_budget_car:
            if 100000 <= price <= 300000:
                should_multiply_x10 = True
        else:
            if 100000 <= price <= 400000:
                should_multiply_x10 = True

        if should_multiply_x10:
            price = price * 10
            correction_reasons.append("Prix x10 (Centimes)")
        elif 10000 <= price <= 99000:
            price = price * 100
            correction_reasons.append("Prix x100 (Centimes)")

    # 1.5 FIX MILEAGE
    if 0 < mileage < 1000 and year < 2023:
        mileage = mileage * 1000
        correction_reasons.append("Kilométrage x1000")

    # 2. INVALID CONDITIONS (Impossible to use)
    if price < 100000:
        return {"status": "INVALID", "corrected_price": price, "corrected_mileage": mileage, "reason": "Prix < 100k DZD"}
    if year < 1980 or year > 2030:
        return {"status": "INVALID", "corrected_price": price, "corrected_mileage": mileage, "reason": "Année impossible"}

    # 3. OUTLIERS & SUSPECTS
    segment = classify_segment(brand, model)
    segment_median = SEGMENT_MEDIANS.get(segment, 2200000)
    
    # Reject if price is below 40% of the segment median AND car is recent (>= 2018)
    if year >= 2018 and price < (segment_median * 0.40):
        status = "SUSPECT"
        correction_reasons.append("Prix anormalement bas")
        
    # Mileage limits
    if year < 2018 and mileage < 1000:
        status = "SUSPECT"
        correction_reasons.append("Faible kilométrage suspect pour l'année")
    if year >= 2022 and mileage > 600000:
        status = "OUTLIER"
        correction_reasons.append("Kilométrage extrême pour l'année")

    # 4. PATTERN CHECK (Repetitive numbers like 111111)
    if price < 3000000:
        price_str = str(price)
        if re.sub(r'\D', '', price_str) and re.match(r'^(\d)\1+$', re.sub(r'\D', '', price_str)):
            status = "SUSPECT"
            correction_reasons.append("Prix répétitif (Fake probable)")

    return {
        "status": status,
        "corrected_price": price,
        "corrected_mileage": mileage,
        "reason": " | ".join(correction_reasons) if correction_reasons else None
    }

def evaluate_credibility_batch(listings: list) -> list:
    """Wrapper pour traiter une liste d'annonces."""
    return [evaluate_credibility(lst) for lst in listings]
