import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

url: str = os.environ.get("SUPABASE_URL") or os.environ.get("EXPO_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("EXPO_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    raise ValueError("Supabase URL or Key not set")

supabase: Client = create_client(url, key)

def seed_complete_catalog():
    print("--- Etape 1 : Nettoyage de l'ancienne table vehicle_catalog ---")
    try:
        # Clear existing rows to prevent duplicates and bad data
        supabase.table("vehicle_catalog").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print("Table nettoyee avec succes.")
    except Exception as e:
        print(f"Erreur lors du nettoyage: {e}")

    print("--- Etape 2 : Preparation du catalogue exhaustif ---")
    
    vehicles = []
    
    # ─── RENAULT ───
    renault_models = {
        "Clio 2": ["Campus", "Exception", "Authentique", "Privilège"],
        "Clio 3": ["Campus", "Authentique", "Dynamique", "Exception"],
        "Clio 4": ["Trend", "Intens", "GT-Line", "Limited", "Authentique"],
        "Clio 5": ["Zen", "Intens", "RS-Line", "Techno"],
        "Clio Campus": ["Standard", "Génération", "Bye Bye"],
        "Symbol": ["Essentiel", "Sensation", "Extrême", "Authentique", "Exception"],
        "Megane 2": ["Authentique", "Dynamique", "Privilège"],
        "Megane 3": ["Authentique", "Expression", "Dynamique", "Bose", "GT-Line"],
        "Megane 4": ["Zen", "Intens", "GT-Line", "R.S."],
        "Megane Classic": ["Standard"],
        "Kangoo": ["Standard", "Authentique", "Privilège", "Confort", "Extrême"],
        "Express": ["Standard", "Confort", "Prestige"],
        "Captur": ["Zen", "Intens"],
        "Kadjar": ["Zen", "Intens", "Bose"],
        "Fluence": ["Authentique", "Dynamique"],
        "Trafic": ["Commercial", "L1H1", "L2H1", "Passenger"],
        "Master": ["Commercial", "L2H2", "L3H2", "Bus"]
    }
    for m, trims in renault_models.items():
        for t in trims:
            vehicles.append({"brand": "Renault", "model": m, "trim": t, "body_type": "utilitaire" if m in ["Kangoo", "Express", "Trafic", "Master"] else "citadine", "fuel_type": "essence"})

    # ─── DACIA ───
    dacia_models = {
        "Logan": ["Essentiel", "Sensation", "Extrême", "Ambiance", "Lauréate", "Black Line"],
        "Sandero": ["Ambiance", "Lauréate"],
        "Sandero Stepway": ["Ambiance", "Lauréate", "Stepway Extrême", "Extrême"],
        "Duster": ["Ambiance", "Lauréate", "Prestige", "Extrême"],
        "Lodgy": ["Lauréate", "Extrême"],
        "Dokker": ["Standard", "Van", "Lauréate"],
        "Solenza": ["Scala", "Confort"]
    }
    for m, trims in dacia_models.items():
        for t in trims:
            vehicles.append({"brand": "Dacia", "model": m, "trim": t, "body_type": "SUV" if m=="Duster" else "berline", "fuel_type": "diesel" if m=="Duster" else "essence"})

    # ─── PEUGEOT ───
    peugeot_models = {
        "206": ["Standard", "XS", "XR", "Trendy"],
        "207": ["Active", "Trendy", "Premium", "GT", "207+", "Sensation"],
        "208": ["Access", "Active", "Allure", "GT Line", "GT", "Signature"],
        "301": ["Access", "Active", "Allure"],
        "306": ["Standard", "XR", "XT"],
        "307": ["XR", "XT", "XS", "Griffe", "X-Line"],
        "308": ["Active", "Allure", "GT Line", "GT", "Feline"],
        "406": ["Standard", "SV", "SR"],
        "407": ["Confort", "Executive", "Sport", "Griffe"],
        "508": ["Active", "Allure", "GT Line", "GT"],
        "2008": ["Active", "Allure", "GT Line"],
        "3008": ["Active", "Allure", "GT Line"],
        "5008": ["Allure", "GT Line"],
        "Partner": ["Origin", "Tepee", "Commercial"],
        "Partner Origin": ["Standard"],
        "Expert": ["Commercial", "Traveller"],
        "Boxer": ["Commercial", "L2H2", "L3H2"]
    }
    for m, trims in peugeot_models.items():
        for t in trims:
            vehicles.append({"brand": "Peugeot", "model": m, "trim": t, "body_type": "utilitaire" if m in ["Partner", "Expert", "Boxer"] else "citadine", "fuel_type": "diesel" if m in ["Partner", "Expert", "Boxer", "508", "3008"] else "essence"})

    # ─── VOLKSWAGEN ───
    vw_models = {
        "Polo": ["Trendline", "Comfortline", "Highline", "R-Line", "Carat", "Beats", "Match"],
        "Golf 6": ["Trendline", "Comfortline", "Highline", "Carat", "GTD", "GTI", "R-Line"],
        "Golf 7": ["Trendline", "Comfortline", "Highline", "Carat", "Join", "Sound", "GTD", "GTI", "R", "R-Line"],
        "Golf 8": ["Life", "Style", "R-Line", "GTI", "GTD", "R"],
        "Tiguan": ["Trend & Fun", "Sport & Style", "Carat", "R-Line", "Elegance"],
        "Caddy": ["Trendline", "Comfortline", "Highline", "Startline", "Edition 30", "Alltrack", "Life"],
        "Passat": ["Trendline", "Comfortline", "Highline", "Carat", "R-Line"],
        "T-Roc": ["Life", "Style", "R-Line"],
        "T-Cross": ["Style", "R-Line"],
        "Amarok": ["Trendline", "Highline", "Aventura"],
        "Touareg": ["Carat", "R-Line"],
        "Transporter": ["Commercial"],
        "Crafter": ["Commercial"]
    }
    for m, trims in vw_models.items():
        for t in trims:
            vehicles.append({"brand": "Volkswagen", "model": m, "trim": t, "body_type": "SUV" if m in ["Tiguan", "T-Roc", "Touareg"] else "citadine", "fuel_type": "diesel" if m in ["Caddy", "Tiguan", "Amarok", "Touareg", "Transporter", "Crafter"] else "essence"})

    # ─── TOYOTA ───
    toyota_models = {
        "Corolla": ["Active", "Dynamic", "Elegant"],
        "Yaris": ["Active", "Dynamic", "Style", "Lounge"],
        "Hilux": ["Single Cabin", "Double Cabin", "SR5", "Adventure", "GR Sport"],
        "Prado": ["TXL", "VX", "Lounge", "Adventure"],
        "Land Cruiser": ["LC200 GXR", "LC200 VXR", "LC300 VXR", "LC300 GR Sport"],
        "RAV4": ["Active", "Dynamic", "Lounge"],
        "Fortuner": ["Standard", "TRD"]
    }
    for m, trims in toyota_models.items():
        for t in trims:
            vehicles.append({"brand": "Toyota", "model": m, "trim": t, "body_type": "pickup" if m=="Hilux" else "SUV" if m in ["Prado", "Land Cruiser", "RAV4", "Fortuner"] else "berline", "fuel_type": "diesel" if m in ["Hilux", "Prado", "Land Cruiser"] else "essence"})

    # ─── HYUNDAI ───
    hyundai_models = {
        "Atos": ["Standard", "GLS", "Prime"],
        "Eon": ["GL"],
        "i10": ["GL", "GLS"],
        "Grand i10": ["GL", "GLS", "Active", "Fluid"],
        "i20": ["GL", "GLS", "Active"],
        "i30": ["GL", "GLS", "Dynamic"],
        "Accent": ["GL", "GLS", "Extreme", "Sensation"],
        "Elantra": ["GL", "GLS", "Executive"],
        "Tucson": ["GL", "GLS", "N-Line", "Extreme", "Executive", "Ultimate"],
        "Creta": ["GL", "GLS", "Executive", "Highline"],
        "Santa Fe": ["GL", "GLS", "Extreme"],
        "Kona": ["GL", "GLS", "Executive"],
        "H1": ["GLS", "Van", "9 seats"],
        "H100": ["Plateau", "Commercial"],
        "Mighty": ["HD65", "HD72"]
    }
    for m, trims in hyundai_models.items():
        for t in trims:
            vehicles.append({"brand": "Hyundai", "model": m, "trim": t, "body_type": "SUV" if m in ["Tucson", "Creta", "Santa Fe", "Kona"] else "utilitaire" if m in ["H1", "H100", "Mighty"] else "citadine", "fuel_type": "diesel" if m in ["Tucson", "Santa Fe", "H1", "H100", "Mighty"] else "essence"})

    # ─── KIA ───
    kia_models = {
        "Picanto": ["LX", "EX", "Pop", "Morning", "GT-Line"],
        "Rio": ["LX", "EX", "Premium"],
        "Sportage": ["LX", "EX", "GT-Line", "Premium"],
        "Sorento": ["EX", "GT-Line", "Premium"],
        "Cerato": ["LX", "EX", "SX"],
        "Pegas": ["Standard", "EX"],
        "K3": ["Standard", "EX"],
        "K5": ["Standard", "EX", "GT-Line"],
        "KX1": ["Standard", "EX"],
        "KX3": ["Standard", "EX"],
        "Sonet": ["Standard", "EX"],
        "Seltos": ["Standard", "EX"],
        "Soul": ["Standard", "EX"],
        "Carens": ["LX", "EX"],
        "K2700": ["Plateau", "Commercial"],
        "K2500": ["Plateau", "Commercial"]
    }
    for m, trims in kia_models.items():
        for t in trims:
            vehicles.append({"brand": "Kia", "model": m, "trim": t, "body_type": "SUV" if m in ["Sportage", "Sorento"] else "utilitaire" if m in ["K2700", "K2500"] else "citadine", "fuel_type": "diesel" if m in ["Sportage", "Sorento", "K2700", "K2500"] else "essence"})

    # ─── SUZUKI ───
    suzuki_models = {
        "Alto": ["Standard", "GL"],
        "Alto K10": ["Standard", "LXi", "VXi"],
        "Maruti 800": ["Standard"],
        "Swift": ["GL", "GLX", "Pack Sport"],
        "Celerio": ["GL", "GLX"],
        "Jimny": ["GL", "GLX"],
        "Vitara": ["GLX", "Pack Sport"],
        "Baleno": ["GL", "GLX"],
        "Super Carry": ["Commercial"]
    }
    for m, trims in suzuki_models.items():
        for t in trims:
            vehicles.append({"brand": "Suzuki", "model": m, "trim": t, "body_type": "utilitaire" if m=="Super Carry" else "citadine", "fuel_type": "essence"})

    # ─── SEAT & SKODA ───
    seat_skoda_models = {
        "Seat Ibiza": ["Reference", "Style", "Sol", "Highline", "FR"],
        "Seat Leon": ["Style", "FR", "Cupra"],
        "Seat Arona": ["Style", "FR"],
        "Seat Ateca": ["Style", "FR"],
        "Skoda Fabia": ["Ambition", "Style", "Monte Carlo"],
        "Skoda Octavia": ["Active", "Ambition", "Style", "L&K"],
        "Skoda Superb": ["Style", "L&K"],
        "Skoda Kamiq": ["Style", "Ambition"],
        "Skoda Rapid": ["Style", "Active"]
    }
    for brand_m, trims in seat_skoda_models.items():
        brand, m = brand_m.split(' ', 1)
        for t in trims:
            vehicles.append({"brand": brand, "model": m, "trim": t, "body_type": "SUV" if m in ["Arona", "Ateca", "Kamiq"] else "citadine", "fuel_type": "diesel" if m in ["Leon", "Octavia", "Superb"] else "essence"})

    # ─── CITROËN & FIAT & OPEL ───
    citroen_fiat_opel = {
        "Citroën C3": ["Live", "Feel", "Shine"],
        "Citroën C-Élysée": ["Feel", "Shine"],
        "Citroën C4": ["Feel", "Shine"],
        "Citroën Berlingo": ["Commercial", "Multispace", "Feel", "Shine"],
        "Fiat 500": ["Cult", "Club", "Dolcevita"],
        "Fiat Tipo": ["Standard", "City", "Life"],
        "Fiat Doblo": ["Commercial", "Life"],
        "Fiat Fiorino": ["Commercial"],
        "Fiat Scudo": ["Commercial"],
        "Fiat Ducato": ["Commercial"],
        "Opel Astra": ["Edition", "GS Line"],
        "Opel Corsa": ["Edition", "GS Line"],
        "Opel Mokka": ["Edition", "GS Line"],
        "Opel Combo": ["Commercial"]
    }
    for brand_m, trims in citroen_fiat_opel.items():
        brand, m = brand_m.split(' ', 1)
        for t in trims:
            vehicles.append({"brand": brand, "model": m, "trim": t, "body_type": "utilitaire" if m in ["Berlingo", "Doblo", "Fiorino", "Scudo", "Ducato", "Combo"] else "citadine", "fuel_type": "diesel" if m in ["Berlingo", "Doblo", "Fiorino", "Scudo", "Ducato", "Combo"] else "essence"})

    # ─── CHEVROLET & NISSAN & FORD ───
    chev_niss_ford = {
        "Chevrolet Spark": ["Standard", "LS", "LT"],
        "Chevrolet Aveo": ["LS", "LT"],
        "Chevrolet Optra": ["LS", "LT"],
        "Chevrolet Sail": ["LS", "LT"],
        "Chevrolet Cruze": ["LS", "LT"],
        "Nissan Sunny": ["Classic", "S", "SV"],
        "Nissan Patrol": ["SE", "LE", "Nismo"],
        "Nissan Qashqai": ["Visia", "Acenta", "Tekna"],
        "Nissan Navara": ["LE", "SE"],
        "Ford Fiesta": ["Trend", "Titanium"],
        "Ford Focus": ["Trend", "Titanium", "ST-Line"],
        "Ford Ranger": ["XL", "XLT", "Wildtrak"]
    }
    for brand_m, trims in chev_niss_ford.items():
        brand, m = brand_m.split(' ', 1)
        for t in trims:
            vehicles.append({"brand": brand, "model": m, "trim": t, "body_type": "pickup" if m in ["Navara", "Ranger"] else "SUV" if m=="Patrol" else "citadine", "fuel_type": "diesel" if m in ["Navara", "Ranger", "Patrol"] else "essence"})

    # ─── CHINESE BRANDS (JETOUR, CHERY, GEELY, BYD, DFSK, MG, CHANGAN, JAC) ───
    chinese_models = {
        "Jetour Traveller T2": ["Luxury", "4WD"],
        "Jetour Dashing": ["Comfort", "Luxury"],
        "Jetour X70": ["Comfort", "Luxury"],
        "Jetour X70 Plus": ["Comfort", "Luxury"],
        "Jetour X90 Plus": ["Luxury"],
        "Chery QQ": ["Standard", "Comfort"],
        "Chery Tiggo 2 Pro": ["Comfort", "Luxury"],
        "Chery Tiggo 4 Pro": ["Comfort", "Luxury"],
        "Chery Tiggo 7 Pro": ["Comfort", "Luxury"],
        "Chery Tiggo 8 Pro": ["Comfort", "Luxury"],
        "Chery Arrizo 5": ["Comfort", "Luxury"],
        "Chery Arrizo 8": ["Comfort", "Luxury"],
        "Geely GX3 Pro": ["Start", "GF"],
        "Geely Coolray": ["GL", "GK", "GF"],
        "Geely Emgrand": ["GL", "GF"],
        "Geely Monjaro": ["GF"],
        "Geely Starray": ["GL", "GF"],
        "BYD Dolphin": ["Standard", "Premium"],
        "BYD Seagull": ["Standard", "Premium"],
        "BYD Song Plus": ["DM-i"],
        "BYD Han": ["Premium"],
        "DFSK Glory 500": ["Comfort", "Luxury"],
        "DFSK Glory 580": ["Comfort", "Luxury"],
        "DFSK K01S": ["Standard"],
        "DFSK K02S": ["Standard"],
        "MG 3": ["Standard", "Luxury"],
        "MG ZS": ["Comfort", "Luxury"],
        "MG HS": ["Luxury"],
        "MG 5": ["Standard", "Luxury"],
        "Changan Alsvin": ["Comfort", "Luxury"],
        "Changan Hunter": ["Standard", "Luxury"],
        "Changan UNI-T": ["Luxury"],
        "Changan UNI-K": ["Luxury"],
        "JAC T8": ["Standard", "Luxury"],
        "JAC Sunray": ["Commercial"],
        "JAC Bosseur": ["Standard"],
        "JAC 1040": ["Standard"]
    }
    for brand_m, trims in chinese_models.items():
        brand, m = brand_m.split(' ', 1)
        for t in trims:
            vehicles.append({"brand": brand, "model": m, "trim": t, "body_type": "SUV" if "Tiggo" in m or "Glory" in m or "X70" in m or m in ["Traveller T2", "Dashing", "Coolray", "GX3 Pro", "Monjaro", "Starray", "ZS", "HS", "UNI-T", "UNI-K"] else "utilitaire" if m in ["K01S", "K02S", "Sunray", "Bosseur", "1040", "Hunter", "T8"] else "citadine", "fuel_type": "essence"})

    # ─── PREMIUM BRANDS (MERCEDES, BMW, AUDI, PORSCHE, RANGE ROVER) ───
    premium_models = {
        "Mercedes-Benz Classe A": ["Standard", "Progressive", "AMG Line"],
        "Mercedes-Benz CLA": ["Standard", "AMG Line"],
        "Mercedes-Benz Classe C": ["C180", "C200", "C220d", "AMG Line"],
        "Mercedes-Benz Classe E": ["E200", "E220d", "E250", "E350", "AMG Line"],
        "Mercedes-Benz Classe S": ["S350d", "S400d", "S500", "AMG Line"],
        "Mercedes-Benz GLC": ["Progressive", "AMG Line"],
        "Mercedes-Benz GLE": ["Progressive", "AMG Line"],
        "Mercedes-Benz Classe G": ["G350d", "G400d", "G63 AMG"],
        "BMW Série 1": ["Lounge", "M Sport"],
        "BMW Série 2 Gran Coupé": ["M Sport"],
        "BMW Série 3": ["Lounge", "M Sport"],
        "BMW Série 5": ["M Sport", "Luxury"],
        "BMW X1": ["Lounge", "M Sport"],
        "BMW X3": ["M Sport"],
        "BMW X5": ["M Sport"],
        "Audi A1 Sportback": ["S-Line"],
        "Audi A3 Sportback": ["Standard", "S-Line"],
        "Audi A4": ["S-Line"],
        "Audi A5 Sportback": ["S-Line"],
        "Audi Q2": ["Standard", "S-Line"],
        "Audi Q3": ["S-Line"],
        "Audi Q5": ["S-Line"],
        "Audi Q7": ["S-Line"],
        "Audi Q8": ["S-Line"],
        "Porsche 911": ["Carrera", "Turbo S"],
        "Porsche Cayenne": ["Standard", "E-Hybrid", "GTS"],
        "Porsche Macan": ["Standard", "S", "GTS"],
        "Land Rover Range Rover Evoque": ["SE", "HSE", "R-Dynamic"],
        "Land Rover Range Rover Velar": ["SE", "HSE", "R-Dynamic"],
        "Land Rover Range Rover Sport": ["SE", "HSE", "Autobiography"],
        "Land Rover Range Rover": ["Vogue", "Autobiography", "Defender"]
    }
    for brand_m, trims in premium_models.items():
        brand, m = brand_m.split(' ', 1)
        for t in trims:
            vehicles.append({"brand": brand, "model": m, "trim": t, "body_type": "SUV" if m[0] in ["Q", "X"] or "Range" in m or m in ["GLC", "GLE", "Classe G", "Cayenne", "Macan"] else "berline", "fuel_type": "diesel" if m in ["GLC", "GLE", "X5", "Q7", "Q5"] else "essence"})

    # Give all fallback fields
    for v in vehicles:
        v["year_from"] = 2000
        v["year_to"] = 2026
        v["popular"] = True

    print(f"Etape 3 : Ingestion par lot de {len(vehicles)} vehicules...")
    
    # Supabase allows bulk inserts up to thousands of rows safely.
    # We will insert in chunks of 100 to avoid any size limits or timeouts.
    chunk_size = 100
    success_count = 0
    
    for i in range(0, len(vehicles), chunk_size):
        chunk = vehicles[i:i + chunk_size]
        try:
            supabase.table("vehicle_catalog").insert(chunk).execute()
            success_count += len(chunk)
            print(f"   [Chunk Ingested] {success_count}/{len(vehicles)} inseres.")
        except Exception as e:
            print(f"   Erreur d'ingestion sur le chunk {i}: {e}")
            
    print(f"\nBASE DE DONNEES ENRICHIE ET COMPLETE ! Total insere: {success_count} vehicules.")

if __name__ == "__main__":
    seed_complete_catalog()
