"""
update_medians_optimized.py — Agrégation des prix médians pour QimatnaDz.

Améliorations vs version précédente :
  [Défi 2] Détection des chocs de marché : si un médian change >= 10%, une alerte
           est enregistrée dans market_alerts et remontée à l'utilisateur.
  [Défi 3] Alimentation de market_baselines : les modèles avec >= 5 annonces réelles
           mettent à jour la table de référence dynamique (remplace les valeurs hardcodées).
  [Défi 7] Normalisation des clés de groupement : évite les doublons dus aux variantes
           orthographiques (espaces, casse, accents).
"""

import os
import re
import statistics
import unicodedata
from datetime import datetime, timezone, timedelta
from supabase import Client
from db import get_supabase_client

# Seuil de détection d'un choc de marché (10% de variation = alerte)
MARKET_SHOCK_THRESHOLD_PCT = 10.0

# ─────────────────────────────────────────────────────────────────────────────
# AMÉLIORATION B — Seuils adaptatifs par segment pour market_baselines
# Remplace MIN_ANNONCES_FOR_BASELINE = 15 (trop élevé pour les véhicules rares)
# Les SUV premium ont rarement 15 annonces — résultat : baselines jamais mises à jour.
# ─────────────────────────────────────────────────────────────────────────────
BASELINE_THRESHOLDS_BY_SEGMENT = {
    'citadine_budget':   10,  # Alto, QQ — marché liquide, beaucoup d'annonces
    'citadine_standard': 10,  # Clio, Yaris — très disponibles
    'citadine_premium':   6,  # Mini, A1 — moins fréquents
    'berline_standard':  10,  # Symbol, Logan — très disponibles
    'berline_premium':    4,  # BMW Série 3, A4 — rares
    'crossover_compact':  8,  # Coolray, KX1 — moyen
    'suv_routier':        5,  # Tucson, GLC — peu d'annonces simultanées
    'suv_premium':        3,  # X5, Q7 — très rares
    'suv_prestige':       2,  # Cayenne, G-Class — 2 annonces = données fiables
    'utilitaire_pickup':  5,  # Hilux — marché spécialisé
}
MIN_ANNONCES_FOR_BASELINE = 10  # Valeur de fallback si segment inconnu

# ─────────────────────────────────────────────────────────────────────────────
# AMÉLIORATION C — Auto-calibration généralisée
# Au lieu d'un dict statique de 9 modèles, on vérifie TOUS les modèles en DB
# qui ont >= MIN_CALIBRATION_ANNONCES annonces. Le seuil d'alerte est ECART_ALERT_PCT.
# ─────────────────────────────────────────────────────────────────────────────
MIN_CALIBRATION_ANNONCES = 5     # Minimum d'annonces pour déclencher la vérification
ECART_ALERT_PCT = 12.0           # Seuil d'écart (12%) pour logguer un avertissement

# Dictionnaire de référence hérité (conservé pour compatibilité + priorité sur les clés connues)
AUTO_CALIBRATION_CHECK_DICT = {
    ('renault', 'symbol', 2010): ('Renault Symbol G1', 1300000),
    ('renault', 'symbol', 2015): ('Renault Symbol G2', 1800000),
    ('renault', 'symbol', 2020): ('Renault Symbol G3', 2400000),
    ('renault', 'clio', 2015):   ('Renault Clio 4',    2500000),
    ('renault', 'clio', 2021):   ('Renault Clio 5',    3500000),
    ('dacia', 'duster', 2013):   ('Dacia Duster G1',   2200000),
    ('dacia', 'duster', 2019):   ('Dacia Duster G2',   3200000),
    ('peugeot', '208', 2015):    ('Peugeot 208 G1',    2100000),
    ('peugeot', '208', 2022):    ('Peugeot 208 G2',    3400000),
    # Ajouts
    ('toyota', 'yaris', 2015):   ('Toyota Yaris G3',   2500000),
    ('toyota', 'yaris', 2022):   ('Toyota Yaris G4',   4200000),
    ('toyota', 'hilux', 2016):   ('Toyota Hilux G8',   8500000),
    ('hyundai', 'tucson', 2017): ('Hyundai Tucson G3',  4500000),
    ('hyundai', 'tucson', 2022): ('Hyundai Tucson G4',  6800000),
    ('kia', 'sportage', 2018):   ('Kia Sportage G4',   4800000),
    ('kia', 'sportage', 2023):   ('Kia Sportage G5',   7500000),
    ('volkswagen', 'golf', 2016):('Volkswagen Golf 7',  5200000),
    ('volkswagen', 'golf', 2021):('Volkswagen Golf 8',  6200000),
    ('geely', 'coolray', 2022):  ('Geely Coolray',      3800000),
    ('chery', 'tiggo 4 pro', 2022): ('Chery Tiggo 4 Pro', 3200000),
}


def get_percentile(data, percentile):
    if not data:
        return 0
    size = len(data)
    return sorted(data)[int(round(percentile * size + 0.5)) - 1]


def calculate_sliding_mode(prices, bucket_size=100000):
    """
    Calcule le mode glissant : regroupe les prix par tranches (bucket_size) 
    et retourne la moyenne de la tranche contenant le plus grand nombre d'annonces.
    Ceci purge les annonces spéculatives en isolant la zone de densité maximale.
    """
    if not prices:
        return 0
    if len(prices) < 3:
        return int(statistics.median(prices))
        
    buckets = {}
    for p in prices:
        b_idx = int(p / bucket_size)
        buckets[b_idx] = buckets.get(b_idx, 0) + 1
        
    max_count = 0
    best_bucket = 0
    for b_idx, count in buckets.items():
        if count > max_count:
            max_count = count
            best_bucket = b_idx
            
    winning_prices = [p for p in prices if int(p / bucket_size) == best_bucket]
    if not winning_prices:
        return int(statistics.median(prices))
    return int(statistics.mean(winning_prices))


def normalize_name(name: str) -> str:
    """
    [Défi 7] Normalise un nom de marque/modèle pour éviter les doublons dus aux variantes.
    Ex: 'Renault Clio 4' et 'renault  clio4' -> 'renault clio 4'
    """
    if not name:
        return ""
    # Normaliser les accents unicode (é -> e, etc.)
    name = unicodedata.normalize("NFKD", name)
    name = "".join(c for c in name if not unicodedata.combining(c))
    # Lowercase + strip + espaces multiples
    name = re.sub(r'\s+', ' ', name.strip().lower())
    return name


def time_decay_weight(scraped_at_str: str | None) -> int:
    """
    Retourne un poids multiplicateur basé sur la fraîcheur de l'annonce.
    - < 30 jours : poids 3 (marché actuel, fiabilité maximale)
    - < 90 jours : poids 2 (relativement frais)
    - >= 90 jours : poids 1 (périmé — ne devrait plus exister après cleanup)
    """
    if not scraped_at_str:
        return 1
    try:
        scraped_at = datetime.fromisoformat(scraped_at_str.replace("Z", "+00:00"))
        age = datetime.now(timezone.utc) - scraped_at
        if age < timedelta(days=30):
            return 3
        elif age < timedelta(days=90):
            return 2
        else:
            return 1
    except Exception:
        return 1


def get_age_days(scraped_at_str: str | None) -> int:
    if not scraped_at_str:
        return 0
    try:
        scraped_at = datetime.fromisoformat(scraped_at_str.replace("Z", "+00:00"))
        age = datetime.now(timezone.utc) - scraped_at
        return max(0, age.days)
    except Exception:
        return 0


def wilaya_weight(wilaya: str) -> int:
    """
    Pondère le poids de l'annonce selon la liquidité du marché régional.
    """
    if not wilaya:
        return 2
    w = str(wilaya).lower()
    if any(x in w for x in ['alger', 'oran', 'constantine', 'blida', 'setif']):
        return 3
    if any(x in w for x in ['adrar', 'tamanrasset', 'illizi', 'ouargla', 'tindouf']):
        return 1
    return 2


def detect_trim_level(title: str, description: str) -> str:
    """
    Détecte le niveau de finition d'une annonce à partir de son titre et de sa description.
    """
    desc = f"{title or ''} {description or ''}".lower()
    
    # Mots-clés haut de gamme (Full Options)
    high_keywords = ['fr', 'highline', 'gt line', 'allure', 'pack m', 's line', 'tout option', 'toute option', 'full', 'toit']
    # Mots-clés entrée de gamme
    low_keywords = ['sol', 'start', 'access', 'essentiel', 'de base']
    
    if any(k in desc for k in high_keywords):
        return 'high_spec'
    if any(k in desc for k in low_keywords):
        return 'low_spec'
    return 'standard'


def detect_market_shock(
    brand: str, model: str, trim: str, year: int,
    prix_ancien: int, prix_nouveau: int
) -> dict | None:
    """
    [Défi 2] Détecte si un prix médian a bougé de >= MARKET_SHOCK_THRESHOLD_PCT%.
    Retourne un dict d'alerte si choc détecté, None sinon.
    """
    if not prix_ancien or prix_ancien <= 0:
        return None
    
    delta_pct = ((prix_nouveau - prix_ancien) / prix_ancien) * 100
    
    if abs(delta_pct) >= MARKET_SHOCK_THRESHOLD_PCT:
        direction = "hausse" if delta_pct > 0 else "baisse"
        return {
            "brand": brand,
            "model": model,
            "trim": trim,
            "year": year,
            "prix_ancien": prix_ancien,
            "prix_nouveau": prix_nouveau,
            "delta_pct": round(delta_pct, 2),
            "direction": direction,
        }
    return None


def classify_segment(brand: str, model: str) -> str:
    """Classification simple par segment pour market_baselines."""
    b = brand.lower()
    m = model.lower()
    
    prestige = ['porsche', 'bentley', 'ferrari', 'lamborghini', 'maserati', 'rolls-royce']
    premium = ['mercedes', 'bmw', 'audi', 'land rover', 'range rover', 'lexus', 'jaguar']
    budget = ['dacia', 'suzuki', 'chery', 'geely', 'changan', 'dfsk', 'byd', 'mg', 'jac']
    
    suv_kw = ['tucson', 'sportage', 'tiguan', 'duster', 'tiggo', 'coolray', 'dashing', 'monjaro', 'prado', 'land cruiser', 'cayenne', 'macan', 'gle', 'glc']
    pickup_kw = ['hilux', 'partner', 'kangoo', 'caddy', 'berlingo', 'express']
    citadine_kw = ['clio', 'polo', 'yaris', 'picanto', 'alto', 'i10', 'swift', '208', 'ibiza', 'fabia']
    
    if any(k in m for k in pickup_kw):
        return 'utilitaire_pickup'
    if any(k in m for k in suv_kw):
        if any(p in b for p in prestige) or any(p in b for p in premium):
            return 'suv_prestige'
        return 'suv_routier'
    if any(k in m for k in citadine_kw):
        if any(p in b for p in prestige) or any(p in b for p in premium):
            return 'citadine_premium'
        if any(bg in b for bg in budget):
            return 'citadine_budget'
        return 'citadine_standard'
    if any(p in b for p in prestige) or any(p in b for p in premium):
        return 'berline_premium'
    if any(bg in b for bg in budget):
        return 'citadine_standard'
    return 'berline_standard'


def send_discord_alert(title: str, description: str, color: int = 16711680):
    webhook_url = os.getenv("DISCORD_WEBHOOK_URL")
    if not webhook_url:
        return
    import requests
    data = {
        "embeds": [{
            "title": title,
            "description": description,
            "color": color
        }]
    }
    try:
        requests.post(webhook_url, json=data, timeout=5)
    except Exception as e:
        print(f"   [DISCORD ERR] {e}")


def run_optimized_aggregation():
    print(f"--- Démarrage de l'agrégation optimisée des prix médians ({datetime.now().strftime('%Y-%m-%d %H:%M')}) ---")
    
    try:
        supabase: Client = get_supabase_client()
    except Exception as e:
        print(f"Error initializing Supabase client: {e}")
        return

    # 1. Fetch catalog in bulk
    print("1. Téléchargement du catalogue de véhicules...")
    try:
        catalog_res = supabase.table("vehicle_catalog").select("brand, model, trim").execute()
        catalog_items = catalog_res.data or []
        print(f"   -> {len(catalog_items)} véhicules dans le catalogue.")
    except Exception as e:
        print(f"Error fetching vehicle catalog: {e}")
        catalog_items = []

    # [Défi 7] Map brand/model normalisés -> trim standard
    catalog_trims = {}
    for item in catalog_items:
        b = normalize_name(item['brand'])
        m = normalize_name(item['model'])
        t = item.get('trim') or 'Standard'
        catalog_trims[(b, m)] = t

    # 2. Fetch all listings in bulk
    print("2. Téléchargement de toutes les annonces de la table 'listings'...")
    try:
        listings_res = supabase.table("listings").select("brand, model, year, price_asked, scraped_at, source, wilaya, title, description").execute()
        raw_listings = listings_res.data or []
        all_listings = [l for l in raw_listings if l.get('source') != 'ouedkniss_reference']
        print(f"   -> {len(all_listings)} annonces réelles récupérées (après filtrage de {len(raw_listings) - len(all_listings)} annonces de simulation).")
    except Exception as e:
        print(f"Error fetching listings: {e}")
        all_listings = []

    if len(all_listings) == 0:
        print("   -> ALERTE ROUGE : 0 annonces récupérées !")
        send_discord_alert("🚨 ALERTE ROUGE : Pipeline Stoppé", "Le volume d'annonces ingérées est de 0. Le scraper a potentiellement crashé ou Ouedkniss a changé son API.", 16711680)

    # 3. Fetch all transactions in bulk
    print("3. Téléchargement de toutes les transactions de la table 'real_transactions'...")
    try:
        trans_res = supabase.table("real_transactions").select("brand, model, year, final_price").execute()
        all_trans = trans_res.data or []
        print(f"   -> {len(all_trans)} transactions récupérées.")
    except Exception as e:
        print(f"Error fetching transactions (RLS may apply): {e}")
        all_trans = []

    # 4. Fetch all expert prices in bulk
    print("4. Téléchargement de tous les prix experts de la table 'expert_prices'...")
    try:
        expert_res = supabase.table("expert_prices").select("brand, model, year, price").execute()
        all_experts = expert_res.data or []
        print(f"   -> {len(all_experts)} prix experts récupérés.")
    except Exception as e:
        print(f"Error fetching expert prices (RLS may apply): {e}")
        all_experts = []

    # 4b. [Défi 2] Fetch existing medians to detect shocks
    print("4b. Chargement des médians existants pour détection de chocs...")
    existing_medians = {}
    try:
        existing_res = supabase.table("prix_medians").select("brand, model, trim, year, prix_median").execute()
        for row in (existing_res.data or []):
            key = (normalize_name(row['brand']), normalize_name(row['model']), row.get('trim', 'Standard'), int(row['year']))
            existing_medians[key] = row['prix_median']
        print(f"   -> {len(existing_medians)} médians existants chargés.")
    except Exception as e:
        print(f"   [WARN] Impossible de charger les médians existants : {e}")

    # 5. Group prices in-memory
    print("5. Regroupement et calcul statistique des prix médians...")
    prices_by_group = {}   # Key: (brand_exact, model_exact, trim, year) -> list of prices
    listings_count_by_group = {}  # Pour compter les annonces brutes (sans pondération)
    total_age_by_group = {} # Pour calculer le Velocity Score (Indice de liquidité)

    # [Défi 7] Normalisation des clés de groupement avec Feature-Matching de la finition
    def build_group_key(brand_raw: str, model_raw: str, year: int, title: str = None, description: str = None):
        b_key = brand_raw.strip()
        m_key = model_raw.strip()
        b_norm = normalize_name(b_key)
        m_norm = normalize_name(m_key)
        
        # 1. Tenter la détection depuis l'annonce (Feature-Matching)
        if title or description:
            trim = detect_trim_level(title, description)
        else:
            # 2. Fallback au catalogue
            trim = catalog_trims.get((b_norm, m_norm), 'standard')
            
        return (b_key, m_key, trim, int(year))

    # Process listings with time-decay weighting
    for l in all_listings:
        brand = l.get('brand')
        model = l.get('model')
        year = l.get('year')
        price = l.get('price_asked')
        title = l.get('title', '')
        description = l.get('description', '')
        
        if not brand or not model or not year or not price or price <= 150000:
            continue
            
        g_key = build_group_key(brand, model, year, title, description)
        if g_key not in prices_by_group:
            prices_by_group[g_key] = []
            listings_count_by_group[g_key] = 0
            total_age_by_group[g_key] = 0
        
        # Apply time-decay and wilaya weight
        w_time = time_decay_weight(l.get('scraped_at'))
        w_geo = wilaya_weight(l.get('wilaya'))
        final_weight = w_time * w_geo
        
        prices_by_group[g_key].extend([price] * final_weight)
        listings_count_by_group[g_key] += 1  # compter sans pondération
        total_age_by_group[g_key] += get_age_days(l.get('scraped_at'))

    # Process transactions (Weight x3 — données réelles de vente)
    for t in all_trans:
        brand = t.get('brand')
        model = t.get('model')
        year = t.get('year')
        price = t.get('final_price')
        
        if not brand or not model or not year or not price or price <= 150000:
            continue
            
        g_key = build_group_key(brand, model, year)
        if g_key not in prices_by_group:
            prices_by_group[g_key] = []
            listings_count_by_group[g_key] = 0
        prices_by_group[g_key].extend([price] * 3)

    # Process expert prices (Weight x2 — données vérifiées)
    for e in all_experts:
        brand = e.get('brand')
        model = e.get('model')
        year = e.get('year')
        price = e.get('price')
        
        if not brand or not model or not year or not price or price <= 150000:
            continue
            
        g_key = build_group_key(brand, model, year)
        if g_key not in prices_by_group:
            prices_by_group[g_key] = []
            listings_count_by_group[g_key] = 0
        prices_by_group[g_key].extend([price] * 2)

    # 6. Batch Upsert to Supabase + Détection de chocs + Baselines
    print(f"6. Upsert de {len(prices_by_group)} groupes calculés vers 'prix_medians'...")
    total_upserted = 0
    total_errors = 0
    market_alerts_to_insert = []
    baselines_to_upsert = []
    calibration_logs_to_insert = []

    for g_key, prices in prices_by_group.items():
        brand, model, trim, year = g_key
        
        median_val = calculate_sliding_mode(prices) # Remplacement de statistics.median par le Mode Glissant
        min_val = int(get_percentile(prices, 0.1))
        max_val = int(get_percentile(prices, 0.9))
        
        nb_annonces = listings_count_by_group.get(g_key, 0)
        avg_age = total_age_by_group.get(g_key, 0) / nb_annonces if nb_annonces > 0 else 0
        
        # Indice de liquidité : Si les annonces de ce groupe ont en moyenne plus de 45 jours d'âge
        # cela signifie que le marché stagne (véhicule lourd). On applique un malus de -10%.
        if avg_age > 45:
            median_val = int(median_val * 0.90)
        
        # Round to thousands
        median_val = round(median_val / 1000) * 1000
        min_val = round(min_val / 1000) * 1000
        max_val = round(max_val / 1000) * 1000
        
        nb_annonces = listings_count_by_group.get(g_key, 0)
        
        # [Défi 2] Détection de choc de marché
        norm_key = (normalize_name(brand), normalize_name(model), trim, year)
        prix_ancien = existing_medians.get(norm_key)
        delta_pct = 0.0
        
        if prix_ancien:
            shock = detect_market_shock(brand, model, trim, year, prix_ancien, median_val)
            if shock:
                shock["nb_annonces"] = nb_annonces
                market_alerts_to_insert.append(shock)
                delta_pct = shock["delta_pct"]
                print(f"   ⚠️  [CHOC MARCHÉ] {brand} {model} {year}: {prix_ancien:,} → {median_val:,} DZD ({delta_pct:+.1f}%)")
            else:
                delta_pct = round(((median_val - prix_ancien) / prix_ancien) * 100, 2) if prix_ancien > 0 else 0.0

        data = {
            "brand": brand,
            "model": model,
            "trim": trim,
            "year": year,
            "prix_median": median_val,
            "prix_min": min_val,
            "prix_max": max_val,
            "prix_median_precedent": prix_ancien,
            "delta_pct_semaine": delta_pct,
            "nb_annonces": nb_annonces,
            "derniere_maj": datetime.now().isoformat()
        }
        
        try:
            supabase.table("prix_medians").upsert(data, on_conflict="brand,model,trim,year").execute()
            total_upserted += 1
            print(f"   [UPSERT OK] {brand} {model} ({year}) -> Median: {median_val:,} DZD | Δ: {delta_pct:+.1f}%")
        except Exception as err:
            total_errors += 1
            print(f"   [UPSERT ERR] {brand} {model} ({year}): {err}")

        # ── AMÉLIORATION B : Seuils adaptatifs par segment pour market_baselines ──
        segment = classify_segment(brand, model)
        threshold = BASELINE_THRESHOLDS_BY_SEGMENT.get(segment, MIN_ANNONCES_FOR_BASELINE)
        if nb_annonces >= threshold:
            confiance = 'haute' if nb_annonces >= 15 else ('moyenne' if nb_annonces >= 5 else 'faible')
            baselines_to_upsert.append({
                "brand": brand,
                "model": model,
                "segment": segment,
                "baseline_price": median_val,
                "nb_annonces": nb_annonces,
                "confiance": confiance,
                "updated_at": datetime.now().isoformat()
            })

        # ── AMÉLIORATION C : Auto-calibration généralisée ──
        # Priorité 1 : Vérifier dans le dict statique hérité (clés connues)
        calib_key = (normalize_name(brand), normalize_name(model), year)
        if calib_key in AUTO_CALIBRATION_CHECK_DICT and nb_annonces >= MIN_CALIBRATION_ANNONCES:
            gen_name, fallback_price = AUTO_CALIBRATION_CHECK_DICT[calib_key]
            ecart_pct = ((median_val - fallback_price) / fallback_price) * 100
            if abs(ecart_pct) > ECART_ALERT_PCT:
                action = 'AUGMENTER' if ecart_pct > 0 else 'BAISSER'
                calibration_logs_to_insert.append({
                    "brand": brand,
                    "model": model,
                    "generation_key": gen_name,
                    "prix_fallback_median": fallback_price,
                    "prix_marche_reel": median_val,
                    "ecart_pct": round(ecart_pct, 2),
                    "action_recommandee": action,
                    "nb_annonces": nb_annonces
                })
        elif nb_annonces >= MIN_CALIBRATION_ANNONCES:
            # Priorité 2 : Auto-calibration généralisée pour tout modèle avec données suffisantes
            # On compare le médian DB calculé vs le médian précédent (si disponible)
            # Cela génère un historique de dérive qui aide à mettre à jour les FALLBACK_MEDIANS
            norm_key_prev = (normalize_name(brand), normalize_name(model), 'standard', year)
            prix_ref = existing_medians.get(norm_key_prev)
            if prix_ref and prix_ref > 0:
                derive_pct = ((median_val - prix_ref) / prix_ref) * 100
                # Seulement alerter les dérives importantes sur 1 seul cycle
                if abs(derive_pct) > ECART_ALERT_PCT * 1.5:  # 18% seuil pour éviter le bruit
                    action = 'RÉVISER À LA HAUSSE' if derive_pct > 0 else 'RÉVISER À LA BAISSE'
                    calibration_logs_to_insert.append({
                        "brand": brand,
                        "model": model,
                        "generation_key": f"{brand} {model} {year}",
                        "prix_fallback_median": prix_ref,
                        "prix_marche_reel": median_val,
                        "ecart_pct": round(derive_pct, 2),
                        "action_recommandee": action,
                        "nb_annonces": nb_annonces
                    })

    # 7. [Défi 2] Insérer les alertes de choc de marché
    if market_alerts_to_insert:
        print(f"\n7. Insertion de {len(market_alerts_to_insert)} alertes de choc de marché...")
        for alert in market_alerts_to_insert:
            try:
                supabase.table("market_alerts").insert(alert).execute()
                print(f"   [ALERT OK] {alert['brand']} {alert['model']} {alert['year']}: {alert['direction']} de {alert['delta_pct']:+.1f}%")
                send_discord_alert(
                    "⚠️ ALERTE ORANGE : Choc de Marché",
                    f"Variation soudaine détectée :\n**Véhicule :** {alert['brand']} {alert['model']} ({alert['year']})\n**Variation :** {alert['direction']} de {alert['delta_pct']:+.1f}%\n**Ancien prix :** {alert['prix_ancien']:,} DZD\n**Nouveau prix :** {alert['prix_nouveau']:,} DZD",
                    16753920
                )
            except Exception as err:
                print(f"   [ALERT ERR] {err}")
    else:
        print("\n7. Aucun choc de marché détecté (variations < 10%). Marché stable.")

    # 8. [Défi 3] Upsert des baselines dynamiques
    if baselines_to_upsert:
        print(f"\n8. Mise à jour de {len(baselines_to_upsert)} baselines dynamiques...")
        for baseline in baselines_to_upsert:
            try:
                supabase.table("market_baselines").upsert(baseline, on_conflict="brand,model").execute()
            except Exception as err:
                print(f"   [BASELINE ERR] {baseline['brand']} {baseline['model']}: {err}")
        print(f"   -> {len(baselines_to_upsert)} baselines mises à jour (remplacement des valeurs hardcodées).")
        
    # 9. FIX 2 : Insertion logs auto-calibration
    if calibration_logs_to_insert:
        print(f"\n9. Enregistrement de {len(calibration_logs_to_insert)} logs d'auto-calibration...")
        for log in calibration_logs_to_insert:
            try:
                supabase.table("calibration_log").insert(log).execute()
                print(f"   [CALIBRATION OK] {log['generation_key']} | Réel: {log['prix_marche_reel']} vs Hardcodé: {log['prix_fallback_median']} ({log['ecart_pct']:+.1f}% -> {log['action_recommandee']})")
            except Exception as err:
                print(f"   [CALIBRATION ERR] {err}")
    
    print(f"\n--- Fin de l'agrégation ! {total_upserted} médians upsertés ({total_errors} échecs). "
          f"{len(market_alerts_to_insert)} alertes choc. {len(baselines_to_upsert)} baselines mises à jour. {len(calibration_logs_to_insert)} calibrations alertées.")


if __name__ == "__main__":
    run_optimized_aggregation()
