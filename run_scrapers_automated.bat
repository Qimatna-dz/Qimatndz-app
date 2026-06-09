@echo off
title QimatnaDz — Collecteur Automatique de Data
echo ==========================================================
echo   Lancement de la collecte globale de donnees QimatnaDz
echo ==========================================================
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
python scraper/run_all.py
pause
