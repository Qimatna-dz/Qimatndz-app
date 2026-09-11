"""
cleanup_old_listings.py — Purge des annonces périmées de QimatnaDz.

Le marché automobile algérien est extrêmement volatile : une annonce de 3 mois
peut refléter des prix complètement dépassés (variation +/-20% possible).
Ce script supprime les annonces de plus de 90 jours pour garder les médians
représentatifs du marché ACTUEL, pas du passé.

Appelé automatiquement par run_all.py avant chaque cycle de scraping.
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timezone, timedelta

sys.path.insert(0, str(Path(__file__).parent))
from db import get_supabase_client, update_scraper_status


def cleanup_old_listings(max_age_days: int = 90) -> dict:
    """
    Supprime les annonces de la table 'listings' plus vieilles que max_age_days.
    
    Conserve toujours :
    - real_transactions (données rares et vérifiées)
    - expert_prices (données vérifiées manuellement)
    - Annonces 'ouedkniss_reference' (données de référence)
    
    Returns: dict avec stats {deleted, kept, errors}
    """
    print(f"\n🧹 Nettoyage des annonces de plus de {max_age_days} jours...")
    
    try:
        client = get_supabase_client()
    except Exception as e:
        print(f"   [ERROR] Connexion Supabase échouée : {e}")
        return {"deleted": 0, "kept": 0, "errors": 1}

    cutoff_date = (datetime.now(timezone.utc) - timedelta(days=max_age_days)).isoformat()
    
    # 1. Compter avant suppression
    try:
        count_res = client.table("listings").select("id", count="exact").lt("scraped_at", cutoff_date).neq("source", "ouedkniss_reference").execute()
        count_old = count_res.count or 0
        print(f"   📊 {count_old} annonces de plus de {max_age_days} jours trouvées (cutoff: {cutoff_date[:10]})")
    except Exception as e:
        print(f"   [WARN] Impossible de compter les vieilles annonces : {e}")
        count_old = 0

    if count_old == 0:
        print("   ✅ Aucune annonce à purger. Base de données à jour.")
        return {"deleted": 0, "kept": 0, "errors": 0}

    # 2. Archiver et supprimer par batch
    deleted_total = 0
    errors = 0
    
    archive_dir = Path(__file__).parent / "archives"
    archive_dir.mkdir(exist_ok=True)
    archive_file = archive_dir / "listings_archive.csv"
    
    import csv
    
    while True:
        try:
            # Récupérer jusqu'à 500 anciennes annonces
            fetch_res = (
                client.table("listings")
                .select("*")
                .lt("scraped_at", cutoff_date)
                .neq("source", "ouedkniss_reference")
                .limit(500)
                .execute()
            )
            old_records = fetch_res.data or []
            
            if not old_records:
                break # Plus aucune annonce à traiter
                
            # 2a. Sauvegarder dans le CSV local
            file_exists = archive_file.exists()
            keys = old_records[0].keys()
            with open(archive_file, mode="a", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=keys, extrasaction='ignore')
                if not file_exists:
                    writer.writeheader()
                writer.writerows(old_records)
                
            # 2b. Supprimer ces annonces spécifiques de la base de données
            ids_to_delete = [r["id"] for r in old_records]
            del_res = client.table("listings").delete().in_("id", ids_to_delete).execute()
            deleted_total += len(del_res.data) if del_res.data else len(ids_to_delete)
            
            print(f"   ⏳ Batch traité : {len(old_records)} annonces archivées et supprimées...")
            
        except Exception as e:
            print(f"   [ERROR] Échec lors de l'archivage/suppression : {e}")
            errors += 1
            break

    if deleted_total > 0:
        print(f"   ✅ {deleted_total} annonces périmées archivées (CSV) et supprimées de la DB avec succès.")

    # 3. Compter ce qui reste
    kept = 0
    try:
        remaining_res = client.table("listings").select("id", count="exact").execute()
        kept = remaining_res.count or 0
        print(f"   📦 {kept} annonces récentes conservées en base.")
    except Exception as e:
        print(f"   [WARN] Impossible de compter les annonces restantes : {e}")

    return {"deleted": deleted_total, "kept": kept, "errors": errors}


def run_cleanup():
    print("=" * 60)
    print("  🧹 QimatnaDz — Nettoyage des Données Périmées")
    print("=" * 60)
    
    stats = cleanup_old_listings(max_age_days=90)
    
    status = "ERROR" if stats["errors"] > 0 else "OK"
    update_scraper_status(
        "Listings Cleanup (90j)",
        status,
        records_added=0,
        error_message=f"Deleted: {stats['deleted']}, Kept: {stats['kept']}" if status == "OK" else "Cleanup failed"
    )
    
    print(f"\n📊 Résumé: {stats['deleted']} supprimées | {stats['kept']} conservées | {stats['errors']} erreurs")
    return stats


if __name__ == "__main__":
    run_cleanup()
