#!/usr/bin/env python
"""
run_all.py — Orchestrateur global des scrapers QimatnaDz.
Exécute tous les collecteurs de données séquentiellement :
  0. Nettoyage annonces périmées (cleanup_old_listings.py)
  1. Taux du Square (rate_scraper.py)
  2. Annonces Sogauto (sogauto_scraper.py)
  3. Annonces Ouedkniss GraphQL (main_v2.py --scrape)
  4. Offres Concessionnaires Chine (china_scraper.py)
  5. Compilation médians + détection chocs (update_medians_optimized.py)
"""

import sys
import os
import time
import subprocess
from pathlib import Path
from datetime import datetime

def send_discord_alert(title: str, description: str, color: int = 16711680):
    """Envoie une alerte Discord (nécessite DISCORD_WEBHOOK_URL dans .env)."""
    webhook_url = os.getenv("DISCORD_WEBHOOK_URL")
    if not webhook_url:
        return
    try:
        import requests
        requests.post(webhook_url, json={"embeds": [{"title": title, "description": description, "color": color}]}, timeout=5)
    except Exception:
        pass

def run_script(script_name: str, args: list = []) -> tuple[bool, float]:
    """Exécute un script et retourne (succès, durée_secondes)."""
    script_path = Path(__file__).parent / script_name
    print("\n" + "=" * 60)
    print(f"🚀 LANCEMENT : {script_name} {' '.join(args)}")
    print("=" * 60)
    
    if not script_path.exists():
        print(f"❌ Erreur : Le fichier {script_name} n'existe pas dans le dossier scraper.")
        return False, 0.0
    
    start = time.time()
    cmd = [sys.executable, str(script_path)] + args
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        if process.stdout:
            for line in process.stdout:
                print(f"  [{script_name}] {line.strip()}")
                
        process.wait()
        elapsed = time.time() - start
        
        if process.returncode == 0:
            print(f"✅ Terminé ({elapsed:.1f}s) : {script_name}")
            return True, elapsed
        else:
            print(f"⚠️  Code retour non-nul ({process.returncode}) en {elapsed:.1f}s : {script_name}")
            return False, elapsed
            
    except Exception as e:
        elapsed = time.time() - start
        print(f"❌ Erreur critique ({elapsed:.1f}s) lors de {script_name} : {e}")
        return False, elapsed

def main():
    run_start = time.time()
    run_date = datetime.now().strftime('%Y-%m-%d %H:%M')
    
    print("=" * 70)
    print(f" 📡 QIMATNADZ — INGESTION DE DATA AUTOMATIQUE ({run_date})")
    print("=" * 70)
    print(f"Dossier de travail : {Path(__file__).parent.resolve()}")
    
    results = {}

    # 0. Nettoyage des annonces périmées (> 90 jours) — AVANT le scraping
    print("\n" + "=" * 60)
    print("🧹 ÉTAPE 0 : NETTOYAGE DES DONNÉES PÉRIMÉES (> 90 JOURS)")
    print("=" * 60)
    results['cleanup'] = run_script("cleanup_old_listings.py")
    
    # 1. Scrape Exchange Rates
    results['rates'] = run_script("rate_scraper.py")
    
    # 2. Scrape Sogauto
    results['sogauto'] = run_script("sogauto_scraper.py")
    
    # 3. Scrape Ouedkniss GraphQL
    results['ouedkniss'] = run_script("main_v2.py", ["--scrape"])
    
    # 4. Scrape China Imports (non-bloquant)
    try:
        results['china'] = run_script("china_scraper.py")
    except Exception:
        results['china'] = (False, 0.0)
        
    # 5. Compilation des prix médians + Détection Chocs + Baselines Dynamiques
    print("\n" + "=" * 60)
    print("🧠 ÉTAPE FINALE : COMPILATION DES STATISTIQUES")
    print("   → Médians, chocs de marché, baselines, auto-calibration")
    print("=" * 60)
    results['medians'] = run_script("update_medians_optimized.py")

    # 6. Analyse Macro & Signal de Tendance (EUR/DZD → impact marché auto)
    print("\n" + "=" * 60)
    print("📊 ÉTAPE MACRO : SIGNAL DE TENDANCE MARCHÉ")
    print("   → Variation EUR/DZD 7j → Signal hausse/stable/baisse")
    print("=" * 60)
    results['macro'] = run_script("update_macro_index.py")

    # ─── RAPPORT FINAL ───

    total_elapsed = time.time() - run_start
    successes = sum(1 for ok, _ in results.values() if ok)
    failures = len(results) - successes
    
    print("\n" + "=" * 70)
    print(f" 🎉 PIPELINE TERMINÉ en {total_elapsed:.0f}s")
    print(f" ✅ {successes} étapes réussies | ❌ {failures} échec(s)")
    print(" Détail :")
    for name, (ok, dur) in results.items():
        status = "✅" if ok else "❌"
        print(f"   {status} {name:<20} {dur:5.1f}s")
    print("=" * 70)
    
    if failures > 0:
        failed_names = [name for name, (ok, _) in results.items() if not ok]
        send_discord_alert(
            "⚠️ Pipeline QimatnaDz — Échec(s) détecté(s)",
            f"**Date :** {run_date}\n**Durée totale :** {total_elapsed:.0f}s\n**Étapes en échec :** {', '.join(failed_names)}\n**Résultat :** {successes}/{len(results)} étapes réussies",
            16753920
        )

if __name__ == "__main__":
    main()

