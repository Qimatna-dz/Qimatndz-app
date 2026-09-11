Ran command: `python app.py`
Ran command: `python/run_all.py`
Listed directory Qimatna%20Dz
Listed directory scraper
Viewed run_scrapers_automated.bat:1-10
Viewed run_all.py:1-145

Based on a quick check of your `Qimatna Dz` repository, the scrapers are located inside the `scraper` folder, not the root directory. This is why your commands `python app.py` and `python/run_all.py` failed earlier.

To run the scrapers from the root directory (`d:\Qimatna Dz`), you can use the following commands:

### Run all scrapers at once (The Orchestrator)
You have a global script that cleans the database, runs all scrapers in sequence, and updates market statistics:
```powershell
python scraper/run_all.py
```
Alternatively, you can just run the batch file you already have set up for this:
```powershell
.\run_scrapers_automated.bat
```

---

### Run individual scrapers
If you only want to scrape a specific source, you can run them individually using these commands:

- **Ouedkniss**:
  ```powershell
  python scraper/main_v2.py --scrape
  ```
- **Sogauto**:
  ```powershell
  python scraper/sogauto_scraper.py
  ```
- **Exchange Rates (Square)**:
  ```powershell
  python scraper/rate_scraper.py
  ```
- **China Import Offers**:
  ```powershell
  python scraper/china_scraper.py
  ```

### Utility Commands
The `run_all.py` script also automatically runs these useful maintenance scripts at the end, but you can run them manually if needed:
- **Clean up old listings (> 90 days)**: `python scraper/cleanup_old_listings.py`
- **Update Medians & Detect Market Shocks**: `python scraper/update_medians_optimized.py`
- **Update Market Trend Signals (EUR/DZD impact)**: `python scraper/update_macro_index.py`