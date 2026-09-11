"""
update_macro_index.py — Calcul de l'indice macro pour QimatnaDz.

Ce script analyse l'historique des taux de change EUR/DZD et USD/DZD
pour produire un signal de tendance de marché automobile algérien.

Logique :
  1. Lire les 30 derniers jours de taux EUR depuis exchange_rates
  2. Calculer la variation sur 7 jours vs 30 jours
  3. Produire un signal : 'hausse' / 'stable' / 'baisse' + magnitude
  4. Écrire dans macro_indices : 'market_trend', 'market_trend_pct'
  5. Si variation > 5% → alerte Discord + modifier_value dans global_market_modifier

Exécuté chaque jour via run_all.py ou le scheduler.
"""

import os
import sys
import statistics
from pathlib import Path
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).parent))
from db import get_supabase_client

load_dotenv(dotenv_path=Path(__file__).parent / ".env")
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

# ─── Seuils de déclenchement ───────────────────────────────────────────────
TREND_HAUSSE_THRESHOLD = 2.5   # +2.5% sur 7j → signal "hausse"
TREND_BAISSE_THRESHOLD = -2.5  # -2.5% sur 7j → signal "baisse"
MACRO_ALERT_THRESHOLD = 5.0    # +5% → alerte Discord + global_market_modifier
MODIFIER_HAUSSE_VALUE = 1.04   # Les voitures import montent de +4% si EUR +5%
MODIFIER_BAISSE_VALUE = 0.97   # Légère décote si EUR baisse fortement

def send_discord_alert(title: str, description: str, color: int = 16753920):
    webhook_url = os.getenv("DISCORD_WEBHOOK_URL")
    if not webhook_url:
        return
    try:
        import requests
        requests.post(
            webhook_url,
            json={"embeds": [{"title": title, "description": description, "color": color}]},
            timeout=5
        )
    except Exception as e:
        print(f"   [DISCORD WARN] {e}")


def run_macro_analysis():
    print("=" * 60)
    print("  📊 QimatnaDz — Analyse Macro & Signal de Tendance")
    print("=" * 60)

    try:
        supabase = get_supabase_client()
    except Exception as e:
        print(f"❌ Erreur connexion Supabase: {e}")
        return

    # 1. Récupérer l'historique des 45 derniers jours de taux EUR
    print("1. Lecture de l'historique EUR/DZD (45 jours)...")
    cutoff_45d = (datetime.now(timezone.utc) - timedelta(days=45)).isoformat()
    cutoff_7d = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

    try:
        res = supabase.table("exchange_rates") \
            .select("currency_code, buy_rate, created_at") \
            .eq("currency_code", "EUR") \
            .gte("created_at", cutoff_45d) \
            .order("created_at", desc=False) \
            .execute()
        rates_data = res.data or []
        print(f"   → {len(rates_data)} relevés EUR récupérés.")
    except Exception as e:
        print(f"   ❌ Impossible de lire exchange_rates: {e}")
        return

    if len(rates_data) < 3:
        print("   ⚠️  Pas assez de données pour calculer la tendance (< 3 relevés). Signal: stable.")
        _write_trend(supabase, "stable", 0.0, 0.0, 0.0)
        return

    # 2. Séparer données 7j vs 30j
    all_rates = [float(r["buy_rate"]) for r in rates_data]
    recent_rates = [
        float(r["buy_rate"]) for r in rates_data
        if r["created_at"] >= cutoff_7d
    ]
    older_rates = [
        float(r["buy_rate"]) for r in rates_data
        if r["created_at"] < cutoff_7d
    ]

    rate_current = statistics.median(recent_rates) if recent_rates else all_rates[-1]
    rate_baseline = statistics.median(older_rates) if older_rates else all_rates[0]
    rate_30d_avg = statistics.mean(all_rates)
    rate_30d_min = min(all_rates)
    rate_30d_max = max(all_rates)

    # 3. Calcul de la variation
    if rate_baseline > 0:
        variation_7d_pct = ((rate_current - rate_baseline) / rate_baseline) * 100
    else:
        variation_7d_pct = 0.0

    print(f"   EUR actuel (médiane 7j)  : {rate_current:.1f} DZD")
    print(f"   EUR baseline (médiane 30j) : {rate_baseline:.1f} DZD")
    print(f"   Variation 7j            : {variation_7d_pct:+.2f}%")
    print(f"   Min/Max 30j             : {rate_30d_min:.1f} / {rate_30d_max:.1f}")

    # 4. Déterminer le signal
    if variation_7d_pct >= TREND_HAUSSE_THRESHOLD:
        trend_signal = "hausse"
        trend_emoji = "📈"
        print(f"   → Signal : 📈 HAUSSE ({variation_7d_pct:+.1f}%)")
    elif variation_7d_pct <= TREND_BAISSE_THRESHOLD:
        trend_signal = "baisse"
        trend_emoji = "📉"
        print(f"   → Signal : 📉 BAISSE ({variation_7d_pct:+.1f}%)")
    else:
        trend_signal = "stable"
        trend_emoji = "📊"
        print(f"   → Signal : 📊 STABLE ({variation_7d_pct:+.1f}%)")

    # 5. Écrire dans macro_indices
    _write_trend(supabase, trend_signal, variation_7d_pct, rate_current, rate_30d_avg)

    # 6. Si variation forte → alerte Discord + global_market_modifier
    if abs(variation_7d_pct) >= MACRO_ALERT_THRESHOLD:
        modifier = MODIFIER_HAUSSE_VALUE if variation_7d_pct > 0 else MODIFIER_BAISSE_VALUE
        direction_fr = "hausse" if variation_7d_pct > 0 else "baisse"
        impact_fr = "Les prix des véhicules d'importation vont probablement suivre dans les 2-4 semaines." if variation_7d_pct > 0 \
                    else "Légère pression à la baisse possible sur les prix de revente."

        print(f"\n   ⚠️  ALERTE MACRO : Variation EUR > {MACRO_ALERT_THRESHOLD}% — modifier = ×{modifier}")

        # Mettre à jour global_market_modifier
        try:
            supabase.table("global_market_modifier").upsert({
                "modifier_value": modifier,
                "is_active": True,
                "reason": f"EUR/DZD en {direction_fr} de {variation_7d_pct:+.1f}% sur 7j. Impact auto prévu.",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }, on_conflict="is_active").execute()
            print(f"   [global_market_modifier] ×{modifier} activé.")
        except Exception as e:
            print(f"   [WARN] global_market_modifier inaccessible: {e}")

        send_discord_alert(
            f"{trend_emoji} ALERTE MACRO — EUR/DZD en {direction_fr.upper()}",
            f"**Variation 7j :** {variation_7d_pct:+.1f}%\n"
            f"**EUR actuel :** {rate_current:.1f} DZD (was {rate_baseline:.1f} DZD)\n"
            f"**Modificateur auto :** ×{modifier}\n"
            f"**Impact prévu :** {impact_fr}",
            16711680 if variation_7d_pct > 0 else 255
        )
    else:
        # Désactiver le global_market_modifier si la situation est revenue à la normale
        try:
            supabase.table("global_market_modifier").upsert({
                "modifier_value": 1.0,
                "is_active": True,
                "reason": f"EUR/DZD stable ({variation_7d_pct:+.1f}% sur 7j). Aucun ajustement macro nécessaire.",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }, on_conflict="is_active").execute()
        except Exception as e:
            print(f"   [WARN] Réinitialisation global_market_modifier: {e}")

    print("\n✅ Analyse macro terminée.")


def _write_trend(supabase, signal: str, variation_pct: float, rate_current: float, rate_avg: float):
    """Écrit le signal de tendance dans macro_indices (3 clés)."""
    now_iso = datetime.now(timezone.utc).isoformat()
    entries = [
        {
            "key": "market_trend",
            "value": signal,          # 'hausse' | 'stable' | 'baisse'
            "updated_at": now_iso
        },
        {
            "key": "market_trend_pct",
            "value": round(variation_pct, 2),   # Ex: +3.5 ou -1.2
            "updated_at": now_iso
        },
        {
            "key": "eur_rate_current",
            "value": round(rate_current, 1),
            "updated_at": now_iso
        },
        {
            "key": "eur_rate_30d_avg",
            "value": round(rate_avg, 1),
            "updated_at": now_iso
        },
    ]
    for entry in entries:
        try:
            supabase.table("macro_indices").upsert(entry, on_conflict="key").execute()
            print(f"   [macro_indices] {entry['key']} = {entry['value']}")
        except Exception as e:
            print(f"   [WARN] macro_indices.{entry['key']}: {e}")


if __name__ == "__main__":
    run_macro_analysis()
