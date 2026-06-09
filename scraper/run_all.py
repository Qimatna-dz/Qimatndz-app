#!/usr/bin/env python
"""
run_all.py — Orchestrateur global des scrapers QimatnaDz.
Exécute tous les collecteurs de données séquentiellement :
  1. Taux du Square (rate_scraper.py)
  2. Annonces Sogauto (sogauto_scraper.py)
  3. Annonces Ouedkniss GraphQL (main_v2.py --scrape)
  4. Offres Concessionnaires Chine (china_scraper.py)
"""

import sys
import os
import subprocess
from pathlib import Path

def run_script(script_name: str, args: list = []) -> bool:
    script_path = Path(__file__).parent / script_name
    print("\n" + "=" * 60)
    print(f"🚀 LANCEMENT DU SCRAPER : {script_name} {' '.join(args)}")
    print("=" * 60)
    
    if not script_path.exists():
        print(f"❌ Erreur : Le fichier {script_name} n'existe pas dans le dossier scraper.")
        return False
        
    cmd = [sys.executable, str(script_path)] + args
    try:
        # Run subprocess and stream output to terminal
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Read output in real-time
        if process.stdout:
            for line in process.stdout:
                print(f"  [{script_name}] {line.strip()}")
                
        process.wait()
        
        if process.returncode == 0:
            print(f"✅ Terminé avec succès : {script_name}")
            return True
        else:
            print(f"⚠️ Terminé avec code de retour non-nul ({process.returncode}) : {script_name}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur critique lors de l'exécution de {script_name} : {e}")
        return False

def main():
    print("=" * 70)
    print(" 📡 QIMATNADZ — ACCÉLÉRATEUR DE COLLECTE DE DATA AUTOMATIQUE")
    print("=" * 70)
    print(f"Dossier de travail : {Path(__file__).parent.resolve()}")
    
    # 0. [DÉFI 1] Nettoyage des annonces périmées (> 90 jours)
    # CRITIQUE : doit tourner AVANT le scraping pour que les médians
    # reflètent UNIQUEMENT le marché actuel, pas le passé.
    print("\n" + "=" * 60)
    print("🧹 ÉTAPE 0 : NETTOYAGE DES DONNÉES PÉRIMÉES (> 90 JOURS)")
    print("=" * 60)
    run_script("cleanup_old_listings.py")
    
    # 1. Scrape Exchange Rates (multi-source avec fallback)
    run_script("rate_scraper.py")
    
    # 2. Scrape Sogauto (Now configured for 100 pages!)
    run_script("sogauto_scraper.py")
    
    # 3. Scrape Ouedkniss GraphQL (Now configured for 15 pages per model!)
    run_script("main_v2.py", ["--scrape"])
    
    # 4. Scrape China Imports
    try:
        run_script("china_scraper.py")
    except Exception:
        pass
        
    # 5. Calcul des Prix Médians + Détection Chocs + Baselines Dynamiques
    print("\n" + "=" * 60)
    print("🧠 ÉTAPE FINALE : COMPILATION DES STATISTIQUES")
    print("   → Calcul médians, détection chocs de marché, baselines dynamiques")
    print("=" * 60)
    run_script("update_medians_optimized.py")
        
    print("\n" + "=" * 70)
    print(" 🎉 SYSTÈME D'INGESTION TERMINÉ AVEC SUCCÈS !")
    print(" Votre base de données Supabase a été enrichie et les Cotes Officielles sont à jour.")
    print("=" * 70)

if __name__ == "__main__":
    main()

