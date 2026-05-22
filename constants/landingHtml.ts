const LANDING_PAGE_HTML_FR = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Qimatna Dz — Estimez le juste prix de votre voiture en Algérie</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Figtree:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; font-size: 16px; }

:root {
  --ink: #0d0e10;
  --ink-60: rgba(13,14,16,0.6);
  --ink-30: rgba(13,14,16,0.3);
  --ink-10: rgba(13,14,16,0.08);
  --ink-05: rgba(13,14,16,0.04);
  --paper: #f8f6f2;
  --paper-2: #f2efe9;
  --cyan: #00b89a;
  --cyan-soft: rgba(0,184,154,0.1);
  --cyan-border: rgba(0,184,154,0.25);
  --white: #ffffff;
  --border: rgba(13,14,16,0.1);
  --border-light: rgba(13,14,16,0.06);
}

body {
  background: var(--paper);
  color: var(--ink);
  font-family: 'Figtree', sans-serif;
  font-weight: 300;
  line-height: 1.6;
  overflow-x: hidden;
}

/* subtle paper grain */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 1000;
  opacity: 0.4;
}

/* ── NAV ── */
nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  padding: 1.2rem 3rem;
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(248,246,242,0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-light);
}

.nav-brand {
  display: flex; align-items: center; gap: 10px;
  text-decoration: none; color: var(--ink);
  font-family: 'Playfair Display', serif;
  font-weight: 700; font-size: 1.2rem;
  letter-spacing: -0.01em;
}

.nav-brand img { width: 28px; height: 28px; object-fit: contain; }

.nav-links {
  display: flex; align-items: center; gap: 2.5rem;
  list-style: none;
}

.nav-links a {
  text-decoration: none; color: var(--ink-60);
  font-size: 0.85rem; font-weight: 500;
  transition: color 0.2s;
}
.nav-links a:hover { color: var(--ink); }

.nav-cta {
  background: var(--ink);
  color: var(--white) !important;
  padding: 0.55rem 1.3rem;
  border-radius: 100px;
  font-size: 0.8rem !important;
  font-weight: 600 !important;
  transition: opacity 0.2s !important;
}
.nav-cta:hover { opacity: 0.82 !important; color: var(--white) !important; }

/* ── HERO ── */
.hero {
  min-height: 100vh;
  padding: 10rem 3rem 6rem;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 5rem;
  max-width: 1200px;
  margin: 0 auto;
  align-items: center;
}

.hero-left { position: relative; }

.hero-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--cyan-soft);
  border: 1px solid var(--cyan-border);
  border-radius: 100px;
  padding: 0.35rem 1rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--cyan);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 2rem;
  opacity: 0;
  animation: rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s forwards;
}

.pulse-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--cyan);
  animation: blink 2.5s ease infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

h1 {
  font-family: 'Playfair Display', serif;
  font-weight: 500;
  font-size: clamp(2.6rem, 4.5vw, 3.8rem);
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: var(--ink);
  margin-bottom: 1.5rem;
  opacity: 0;
  animation: rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s forwards;
}

h1 em {
  font-style: italic;
  color: var(--cyan);
}

.hero-sub {
  font-size: 1.05rem;
  color: var(--ink-60);
  max-width: 480px;
  line-height: 1.8;
  margin-bottom: 2.5rem;
  opacity: 0;
  animation: rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.3s forwards;
}

.hero-actions {
  display: flex; gap: 0.75rem; flex-wrap: wrap;
  margin-bottom: 2rem;
  opacity: 0;
  animation: rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.4s forwards;
}

.btn-dark {
  background: var(--ink); color: var(--white);
  border: none; padding: 0.85rem 1.8rem;
  border-radius: 100px;
  font-family: 'Figtree', sans-serif;
  font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: opacity 0.2s;
  text-decoration: none; display: inline-block;
}
.btn-dark:hover { opacity: 0.8; }

.btn-outline {
  background: transparent; color: var(--ink);
  border: 1px solid var(--border);
  padding: 0.85rem 1.8rem;
  border-radius: 100px;
  font-family: 'Figtree', sans-serif;
  font-size: 0.875rem; font-weight: 500;
  cursor: pointer; transition: all 0.2s;
  text-decoration: none; display: inline-block;
}
.btn-outline:hover { background: var(--ink-05); }

.hero-trust {
  display: flex; align-items: center; gap: 1.5rem;
  opacity: 0;
  animation: rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.5s forwards;
}

.trust-item {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.78rem; color: var(--ink-60);
  font-weight: 400;
}

.trust-sep { width: 4px; height: 4px; border-radius: 50%; background: var(--ink-30); }

/* ── HERO CARD ── */
.hero-right {
  opacity: 0;
  animation: rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.5s forwards;
}

.result-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 4px 40px rgba(13,14,16,0.06), 0 1px 0 rgba(255,255,255,0.8) inset;
}

.card-top {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-light);
  display: flex; justify-content: space-between; align-items: center;
}

.card-label {
  font-size: 0.72rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--ink-30);
}

.card-badge {
  font-size: 0.7rem; font-weight: 600;
  padding: 4px 10px; border-radius: 100px;
}
.badge-ok { background: var(--cyan-soft); color: var(--cyan); border: 1px solid var(--cyan-border); }
.badge-warn { background: rgba(255,165,0,0.1); color: #c97a00; border: 1px solid rgba(255,165,0,0.25); }

.card-body { padding: 1.5rem; }

.car-name {
  font-size: 0.8rem; color: var(--ink-60);
  margin-bottom: 0.4rem; font-weight: 500;
}

.price-main {
  font-family: 'Playfair Display', serif;
  font-size: 2.3rem; font-weight: 700;
  color: var(--ink); line-height: 1;
  margin-bottom: 0.4rem;
  letter-spacing: -0.02em;
}

.price-range {
  font-size: 0.78rem; color: var(--ink-60);
  margin-bottom: 1.5rem;
  font-weight: 400;
}

.score-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 0.75rem;
}

.score-label { font-size: 0.75rem; color: var(--ink-60); font-weight: 400; }

.score-val {
  font-size: 0.72rem; font-weight: 600; color: var(--cyan);
  background: var(--cyan-soft); padding: 2px 8px; border-radius: 100px;
}

.score-bar {
  height: 4px; background: var(--border);
  border-radius: 100px; margin-bottom: 1.5rem; overflow: hidden;
}

.score-fill {
  height: 100%; background: var(--cyan);
  border-radius: 100px; width: 0%;
  transition: width 1.5s cubic-bezier(0.16,1,0.3,1) 1s;
}

.factors { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }

.factor {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.6rem 0.8rem;
  background: var(--ink-05);
  border-radius: 8px;
  font-size: 0.78rem;
}

.factor-name { color: var(--ink); display: flex; align-items: center; gap: 6px; font-weight: 400; }
.factor-dot { width: 6px; height: 6px; border-radius: 50%; }
.dot-pos { background: var(--cyan); }
.dot-neg { background: #ff6b47; }
.factor-tag {
  font-size: 0.68rem; font-weight: 600;
  padding: 2px 7px; border-radius: 100px;
}
.tag-pos { background: var(--cyan-soft); color: var(--cyan); }
.tag-neg { background: rgba(255,107,71,0.1); color: #d94f2a; }

.alert-box {
  background: rgba(0,184,154,0.04);
  border: 1px solid var(--cyan-border);
  border-radius: 8px;
  padding: 0.7rem 0.9rem;
  font-size: 0.75rem; color: var(--cyan);
  margin-bottom: 1.25rem;
  display: flex; gap: 8px; align-items: flex-start;
  font-weight: 400;
}

.card-action {
  width: 100%; padding: 0.8rem;
  background: var(--ink); color: var(--white);
  border: none; border-radius: 10px;
  font-family: 'Figtree', sans-serif;
  font-size: 0.85rem; font-weight: 600;
  cursor: pointer; transition: opacity 0.2s;
}
.card-action:hover { opacity: 0.75; }

/* ── SEPARATOR LINE ── */
.sep-line {
  max-width: 1200px; margin: 0 auto;
  border: none; border-top: 1px solid var(--border-light);
}

/* ── STATS ── */
.stats {
  max-width: 1200px; margin: 0 auto;
  padding: 3rem;
  display: grid; grid-template-columns: repeat(4,1fr);
  gap: 0;
}

.stat { padding: 1.5rem 0; border-right: 1px solid var(--border-light); padding-right: 2rem; padding-left: 2rem; }
.stat:first-child { padding-left: 0; }
.stat:last-child { border-right: none; }

.stat-n {
  font-family: 'Playfair Display', serif;
  font-size: 2.2rem; font-weight: 600;
  color: var(--ink); letter-spacing: -0.02em;
  margin-bottom: 0.3rem;
}

.stat-n span { color: var(--cyan); }

.stat-d {
  font-size: 0.8rem; color: var(--ink-60); line-height: 1.5;
  font-weight: 400;
}

/* ── SECTIONS ── */
.container { max-width: 1200px; margin: 0 auto; padding: 6rem 3rem; }

.section-tag {
  font-size: 0.72rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.12em;
  color: var(--ink-30); margin-bottom: 1rem;
  display: flex; align-items: center; gap: 8px;
}
.section-tag::before { content: ''; display:block; width:16px; height:1px; background: var(--ink-30); }

h2 {
  font-family: 'Playfair Display', serif;
  font-weight: 500;
  font-size: clamp(1.8rem, 3vw, 2.8rem);
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--ink);
}

h2 em { font-style: italic; color: var(--cyan); }

.section-sub {
  font-size: 1rem; color: var(--ink-60);
  line-height: 1.8; max-width: 500px;
}

/* ── FEATURES ── */
.features-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 1px; background: var(--border-light);
  border: 1px solid var(--border-light);
  border-radius: 16px; overflow: hidden;
  margin-top: 3.5rem;
}

.feat {
  background: var(--white);
  padding: 2.5rem 2rem;
  transition: background 0.3s;
}
.feat:hover { background: var(--paper-2); }

.feat-icon {
  width: 40px; height: 40px;
  border-radius: 10px;
  background: var(--cyan-soft);
  border: 1px solid var(--cyan-border);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem;
  margin-bottom: 1.4rem;
}

.feat-title {
  font-family: 'Playfair Display', serif;
  font-weight: 500; font-size: 1rem;
  margin-bottom: 0.7rem; color: var(--ink);
  letter-spacing: -0.01em;
}

.feat-quote {
  font-size: 0.78rem; color: var(--cyan);
  font-style: italic; margin-bottom: 0.7rem;
  font-family: 'Playfair Display', serif;
}

.feat-desc { font-size: 0.83rem; color: var(--ink-60); line-height: 1.7; }

/* ── PROCESS ── */
.process-section { background: var(--white); }

.process-inner { max-width: 1200px; margin: 0 auto; padding: 6rem 3rem; }

.steps {
  display: grid; grid-template-columns: repeat(3,1fr);
  gap: 4rem; margin-top: 3.5rem;
  position: relative;
}

.steps::before {
  content: '';
  position: absolute;
  top: 22px; left: 12%; right: 12%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border), var(--border), transparent);
}

.step { position: relative; z-index: 1; }

.step-n {
  width: 44px; height: 44px; border-radius: 50%;
  background: var(--paper-2);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Playfair Display', serif;
  font-size: 1rem; font-weight: 500; color: var(--ink);
  margin-bottom: 1.5rem;
}

.step-title {
  font-family: 'Playfair Display', serif;
  font-weight: 500; font-size: 1rem;
  color: var(--ink); margin-bottom: 0.6rem;
}

.step-desc { font-size: 0.82rem; color: var(--ink-60); line-height: 1.7; }

/* ── AUDIENCES ── */
.audiences-grid {
  display: grid; grid-template-columns: repeat(3,1fr);
  gap: 1rem; margin-top: 3.5rem;
}

.audience {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 2rem;
  transition: all 0.3s;
  background: var(--white);
  cursor: default;
}
.audience:hover {
  border-color: var(--cyan-border);
  box-shadow: 0 4px 20px rgba(0,184,154,0.08);
}

.audience-icon { font-size: 1.5rem; margin-bottom: 1rem; }

.audience-title {
  font-family: 'Playfair Display', serif;
  font-weight: 500; font-size: 0.95rem;
  color: var(--ink); margin-bottom: 0.5rem;
}

.audience-quote {
  font-size: 0.78rem; color: var(--cyan);
  font-style: italic;
  font-family: 'Playfair Display', serif;
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.audience-desc { font-size: 0.8rem; color: var(--ink-60); line-height: 1.7; }

/* ── FAQ ── */
.faq-section { background: var(--white); }
.faq-inner { max-width: 720px; margin: 0 auto; padding: 6rem 3rem; }

.faq-list { margin-top: 3rem; display: flex; flex-direction: column; gap: 0; }

.faq-item {
  border-bottom: 1px solid var(--border-light);
  overflow: hidden;
}

.faq-q {
  width: 100%; background: none; border: none;
  text-align: left; padding: 1.3rem 0;
  display: flex; justify-content: space-between; align-items: center;
  cursor: pointer;
  font-family: 'Figtree', sans-serif;
  font-size: 0.9rem; font-weight: 500; color: var(--ink);
  transition: color 0.2s;
}
.faq-q:hover { color: var(--cyan); }

.faq-icon {
  width: 22px; height: 22px; border-radius: 50%;
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; color: var(--ink-60);
  flex-shrink: 0;
  transition: all 0.3s; background: transparent;
}

.faq-a {
  max-height: 0; overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.16,1,0.3,1);
}

.faq-a-inner {
  padding-bottom: 1.3rem;
  font-size: 0.85rem; color: var(--ink-60); line-height: 1.8;
}

.faq-item.open .faq-a { max-height: 200px; }
.faq-item.open .faq-icon { background: var(--ink); border-color: var(--ink); color: var(--white); transform: rotate(45deg); }

/* ── CTA FINAL ── */
.cta-section {
  padding: 8rem 3rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.cta-section::before {
  content: '';
  position: absolute;
  width: 500px; height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0,184,154,0.06) 0%, transparent 70%);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.cta-inner { position: relative; z-index: 1; max-width: 620px; margin: 0 auto; }

.cta-h2 {
  font-family: 'Playfair Display', serif;
  font-weight: 500;
  font-size: clamp(2.2rem, 4vw, 3.2rem);
  letter-spacing: -0.025em; line-height: 1.15;
  margin-bottom: 1.2rem;
}

.cta-h2 em { font-style: italic; color: var(--cyan); }

.cta-sub {
  font-size: 0.95rem; color: var(--ink-60);
  line-height: 1.8; margin-bottom: 2.5rem;
}

.cta-micro { margin-top: 1rem; font-size: 0.75rem; color: var(--ink-30); }

/* ── FOOTER ── */
footer {
  border-top: 1px solid var(--border-light);
  padding: 2rem 3rem;
  display: flex; justify-content: space-between; align-items: center;
  max-width: 100%;
}

.footer-brand {
  display: flex; align-items: center; gap: 8px;
  font-family: 'Playfair Display', serif;
  font-size: 1rem; color: var(--ink);
  font-weight: 700;
}
.footer-brand img { width: 22px; height: 22px; object-fit: contain; }

.footer-copy { font-size: 0.75rem; color: var(--ink-30); font-weight: 400; }

/* ── REVEAL ── */
.reveal {
  opacity: 0; transform: translateY(24px);
  transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1);
}
.reveal.on { opacity: 1; transform: none; }

/* ── ANIMATIONS ── */
@keyframes rise {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── RESPONSIVE ── */
@media (max-width: 900px) {
  .hero { grid-template-columns: 1fr; gap: 3rem; padding: 8rem 1.5rem 4rem; }
  .stats { grid-template-columns: repeat(2,1fr); }
  .stat { border-right: none; border-bottom: 1px solid var(--border-light); padding-left: 0.5rem; padding-right: 0.5rem; }
  .features-grid, .steps, .audiences-grid { grid-template-columns: 1fr; }
  .steps::before { display: none; }
  nav { padding: 1rem 1.5rem; }
  .nav-links { display: none; }
  .container, .process-inner, .faq-inner { padding: 4rem 1.5rem; }
  footer { flex-direction: column; gap: 1rem; padding: 2rem 1.5rem; }
  .cta-section { padding: 5rem 1.5rem; }
}
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <a href="#" class="nav-brand">
    <img src="QimatnaDz_logo_1.png" alt="Q" onerror="this.style.display='none'">
    Qimatna Dz
  </a>
  <ul class="nav-links">
    <li><a href="#pourquoi">Pourquoi nous</a></li>
    <li><a href="#comment">Comment ça marche</a></li>
    <li><a href="#faq">FAQ</a></li>
    <li><button onclick="window.parent.postMessage({ type: 'CHANGE_LANGUAGE' }, '*')" style="background:none;border:none;color:var(--ink-60);font-size:0.85rem;font-weight:500;cursor:pointer;font-family:inherit;">🌐 FR / AR</button></li>
    <li><a href="/evaluate" target="_parent" class="nav-cta">Estimer ma voiture</a></li>
  </ul>
</nav>

<!-- HERO -->
<section style="background: var(--paper);">
  <div class="hero">
    <div class="hero-left">
      <div class="hero-eyebrow">
        <div class="pulse-dot"></div>
        Marché Automobile Algérien · Côte en Direct
      </div>
      <h1>Estimez le <em>juste prix</em> de votre voiture en Algérie.</h1>
      <p class="hero-sub">
        Grâce à notre intelligence artificielle avancée et l'analyse continue du marché algérien. Obtenez une estimation chirurgicale en 1 clic, gratuitement et sans compte.
      </p>
      <div class="hero-actions">
        <a href="/evaluate" target="_parent" class="btn-dark">🚀 Estimer mon véhicule</a>
        <a href="#" class="btn-outline" onclick="alert('Bientôt disponible !'); return false;">📱 Application mobile</a>
      </div>
      <div class="hero-trust">
        <div class="trust-item">⚡ Gratuit</div>
        <div class="trust-sep"></div>
        <div class="trust-item">Sans inscription</div>
        <div class="trust-sep"></div>
        <div class="trust-item">100% anonyme</div>
      </div>
    </div>

    <div class="hero-right">
      <div class="result-card">
        <div class="card-top">
          <div class="card-label">Résultat de l'estimation</div>
          <span class="card-badge badge-ok">✓ Prix Marché DZ</span>
        </div>
        <div class="card-body">
          <div class="car-name">Kia KX1 · 2026 · 00 Compteur</div>
          <div class="price-main">3 950 000 <span style="font-size:1.1rem;font-weight:400;color:var(--ink-60);">DZD</span></div>
          <div class="price-range">Fourchette Marché · 3 750 000 – 4 150 000 DZD</div>

          <div class="score-row">
            <span class="score-label">Indice de confiance Expert</span>
            <span class="score-val">94 / 100</span>
          </div>
          <div class="score-bar"><div class="score-fill" id="sfill"></div></div>

          <div class="factors">
            <div class="factor">
              <div class="factor-name"><div class="factor-dot dot-pos"></div>Véhicule neuf (00 km)</div>
              <span class="factor-tag tag-pos">NEUF +</span>
            </div>
            <div class="factor">
              <div class="factor-name"><div class="factor-dot dot-pos"></div>Peinture d'origine (00)</div>
              <span class="factor-tag tag-pos">FORT +</span>
            </div>
            <div class="factor">
              <div class="factor-name"><div class="factor-dot dot-pos"></div>Garantie constructeur active</div>
              <span class="factor-tag tag-pos">ATOUT +</span>
            </div>
          </div>

          <div class="alert-box">
            ✓ Estimation optimisée pour le marché parallèle (Square) et les transactions physiques réelles.
          </div>

          <button class="card-action" onclick="window.open('/evaluate', '_parent')">Vendre ce véhicule →</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- STATS -->
<hr class="sep-line">
<div class="stats reveal">
  <div class="stat">
    <div class="stat-n">450<span>k</span>+</div>
    <div class="stat-d">Annonces analysées chaque semaine en Algérie</div>
  </div>
  <div class="stat">
    <div class="stat-n">100<span>%</span></div>
    <div class="stat-d">Adapté aux spécificités DZ (GPL, Sbigha, 00km, Licences)</div>
  </div>
  <div class="stat">
    <div class="stat-n">0 <span style="font-size:1.4rem;">DA</span></div>
    <div class="stat-d">Totalement gratuit et accessible à tous les Algériens</div>
  </div>
  <div class="stat">
    <div class="stat-n">1<span>h</span></div>
    <div class="stat-d">Mise à jour horaire des cotes de référence du marché</div>
  </div>
</div>
<hr class="sep-line">

<!-- FEATURES -->
<section id="pourquoi">
  <div class="container">
    <div class="reveal">
      <div class="section-tag">Pourquoi Qimatna Dz</div>
      <h2>Nous ne devinons pas les prix.<br>Nous analysons la <em>réalité du terrain.</em></h2>
    </div>
    <div class="features-grid reveal">
      <div class="feat">
        <div class="feat-icon">📊</div>
        <div class="feat-title">Analyse multi-sources du marché</div>
        <div class="feat-quote">"Nous analysons la réalité du marché."</div>
        <div class="feat-desc">Notre moteur croise en temps réel les annonces actives de la journée, l'historique des transactions réelles conclues en Algérie et les grilles de référence de nos experts partenaires.</div>
      </div>
      <div class="feat">
        <div class="feat-icon">🚗</div>
        <div class="feat-title">Précision "00 Compteur" et importations</div>
        <div class="feat-quote">"Le seul outil adapté aux spécificités algériennes."</div>
        <div class="feat-desc">Finitions AMG Line, M Sport, licences moudjahid ou voitures "00 Compteur" : notre algorithme prend en compte la valeur exacte de toutes les finitions et les frais de douane.</div>
      </div>
      <div class="feat">
        <div class="feat-icon">🧠</div>
        <div class="feat-title">Ajustements intelligents sur-mesure</div>
        <div class="feat-quote">"Votre voiture est unique, son prix aussi."</div>
        <div class="feat-desc">Nous ajustons automatiquement la cote selon l'état réel du moteur, la présence de retouches de peinture (Sbigha), l'usure kilométrique et la présence d'un kit GPL.</div>
      </div>
    </div>
  </div>
</section>

<!-- PROCESS -->
<section class="process-section" id="comment">
  <div class="process-inner">
    <div class="reveal" style="text-align:center; margin-bottom:0;">
      <div class="section-tag" style="justify-content:center;">Comment ça marche</div>
      <h2>Simple. Rapide. <em>Précis.</em></h2>
      <p class="section-sub" style="margin: 1rem auto 0; text-align:center;">Moins de 60 secondes pour connaître la vraie valeur de votre voiture.</p>
    </div>
    <div class="steps reveal">
      <div class="step">
        <div class="step-n">1</div>
        <div class="step-title">Décrivez votre véhicule</div>
        <div class="step-desc">Sélectionnez la marque, le modèle précis, la finition, l'année et le kilométrage réel de votre voiture. Sans aucun compte à créer.</div>
      </div>
      <div class="step">
        <div class="step-n">2</div>
        <div class="step-title">L'I.A. analyse le marché</div>
        <div class="step-desc">Notre moteur croise instantanément votre véhicule avec des milliers de points de données actifs en Algérie et applique les coefficients de dépréciation locaux.</div>
      </div>
      <div class="step">
        <div class="step-n">3</div>
        <div class="step-title">Obtenez votre Verdict Expert</div>
        <div class="step-desc">Visualisez votre prix de vente conseillé, vos fourchettes basses et hautes, notre indice de confiance et des conseils personnalisés de négociation.</div>
      </div>
    </div>
  </div>
</section>

<!-- AUDIENCES -->
<section>
  <div class="container">
    <div class="reveal">
      <div class="section-tag">Pour qui</div>
      <h2>À qui s'adresse<br><em>Qimatna Dz ?</em></h2>
    </div>
    <div class="audiences-grid reveal">
      <div class="audience">
        <div class="audience-icon">🔑</div>
        <div class="audience-title">Vous vendez votre voiture ?</div>
        <div class="audience-quote">"Évitez de brader votre véhicule ou d'attendre des mois à cause d'un prix irréaliste."</div>
        <div class="audience-desc">Fixez un prix de départ juste et restez ferme face aux négociations grâce à notre rapport d'expert officiel comme référence.</div>
      </div>
      <div class="audience">
        <div class="audience-icon">💸</div>
        <div class="audience-title">Vous achetez un véhicule ?</div>
        <div class="audience-quote">"Ne vous faites plus jamais arnaquer sur les marchés d'occasion physiques ou en ligne."</div>
        <div class="audience-desc">Vérifiez instantanément si le prix demandé par le vendeur est cohérent avec la réalité actuelle du marché algérien.</div>
      </div>
      <div class="audience">
        <div class="audience-icon">💼</div>
        <div class="audience-title">Vous êtes professionnel ou showroom ?</div>
        <div class="audience-quote">"Optimisez votre rotation de stock et achetez au bon prix."</div>
        <div class="audience-desc">Suivez les tendances hebdomadaires de fluctuation des prix par wilaya et maximisez vos marges d'achat-revente.</div>
      </div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="faq-section" id="faq">
  <div class="faq-inner">
    <div class="reveal" style="text-align:center;">
      <div class="section-tag" style="justify-content:center;">Questions fréquentes</div>
      <h2>Ce que vous <em>voulez savoir.</em></h2>
    </div>
    <div class="faq-list reveal">
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">
          D'où proviennent vos données de prix ?
          <div class="faq-icon">+</div>
        </button>
        <div class="faq-a">
          <div class="faq-a-inner">Notre moteur collecte et nettoie quotidiennement les annonces publiques des plus grands sites algériens (comme Ouedkniss), intègre les prix réels de vente déclarés sur les marchés physiques d'Algérie, et collabore avec des experts automobiles pour valider les cotes des véhicules neufs et d'importation.</div>
        </div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">
          L'estimation prend-elle en compte la peinture (Sbigha) et l'état du moteur ?
          <div class="faq-icon">+</div>
        </button>
        <div class="faq-a">
          <div class="faq-a-inner">Oui, absolument. Qimatna Dz est le seul outil en Algérie qui ajuste le prix de vente conseillé en fonction de la présence de retouches de peinture, de l'état d'usure mécanique du moteur, et du niveau exact de finition du modèle.</div>
        </div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">
          Faut-il créer un compte pour utiliser le service ?
          <div class="faq-icon">+</div>
        </button>
        <div class="faq-a">
          <div class="faq-a-inner">Non. L'accès à l'estimation de base et à l'historique de vos recherches sur votre appareil est 100% libre, gratuit et sans compte. Vous pouvez estimer autant de voitures que vous le souhaitez, en toute discrétion.</div>
        </div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">
          Puis-je exporter mon estimation pour la montrer à un acheteur ?
          <div class="faq-icon">+</div>
        </button>
        <div class="faq-a">
          <div class="faq-a-inner">Oui. Vous pouvez générer et partager le rapport de cote directement depuis l'application pour l'envoyer par WhatsApp, Messenger ou le montrer en face-à-face au moment de la négociation.</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA FINAL -->
<section class="cta-section" id="estimer">
  <div class="cta-inner reveal">
    <h2 class="cta-h2">Prêt à connaître la <em>vraie valeur</em> de votre véhicule ?</h2>
    <p class="cta-sub">Ne laissez plus le hasard ou les spéculations décider du prix de votre voiture. Faites confiance à la précision chirurgicale de l'intelligence artificielle de Qimatna Dz.</p>
    <a href="/evaluate" target="_parent" class="btn-dark" style="font-size:1rem; padding:1rem 2.2rem;">
      👉 Lancer ma première estimation gratuite
    </a>
    <div class="cta-micro">Sans inscription · Gratuit · 100% anonyme</div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-brand">
    <img src="QimatnaDz_logo_1.png" alt="" onerror="this.style.display='none'">
    Qimatna Dz
  </div>
  <div class="footer-copy">© 2026 Qimatna Dz · La cote réelle du marché automobile algérien</div>
</footer>

<script>
// Scroll reveal
const obs = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('on'), i * 80);
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// Score bar animate
const sfill = document.getElementById('sfill');
const barObs = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) { sfill.style.width = '94%'; barObs.disconnect(); }
}, { threshold: 0.5 });
barObs.observe(sfill);

// FAQ accordion
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
</script>
</body>
</html>`;

const LANDING_PAGE_HTML_AR = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>قيمتنا ديزاد — قدّر السعر العادل لسيارتك في الجزائر</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Figtree:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; font-size: 16px; }

:root {
  --ink: #0d0e10;
  --ink-60: rgba(13,14,16,0.6);
  --ink-30: rgba(13,14,16,0.3);
  --ink-10: rgba(13,14,16,0.08);
  --ink-05: rgba(13,14,16,0.04);
  --paper: #f8f6f2;
  --paper-2: #f2efe9;
  --cyan: #00b89a;
  --cyan-soft: rgba(0,184,154,0.1);
  --cyan-border: rgba(0,184,154,0.25);
  --white: #ffffff;
  --border: rgba(13,14,16,0.1);
  --border-light: rgba(13,14,16,0.06);
}

body {
  background: var(--paper);
  color: var(--ink);
  font-family: 'Figtree', sans-serif;
  font-weight: 300;
  line-height: 1.6;
  overflow-x: hidden;
}

/* subtle paper grain */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 1000;
  opacity: 0.4;
}

/* ── NAV ── */
nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  padding: 1.2rem 3rem;
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(248,246,242,0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-light);
}

.nav-brand {
  display: flex; align-items: center; gap: 10px;
  text-decoration: none; color: var(--ink);
  font-family: 'Playfair Display', serif;
  font-weight: 700; font-size: 1.2rem;
  letter-spacing: -0.01em;
}

.nav-brand img { width: 28px; height: 28px; object-fit: contain; }

.nav-links {
  display: flex; align-items: center; gap: 2.5rem;
  list-style: none;
}

.nav-links a {
  text-decoration: none; color: var(--ink-60);
  font-size: 0.85rem; font-weight: 500;
  transition: color 0.2s;
}
.nav-links a:hover { color: var(--ink); }

.nav-cta {
  background: var(--ink);
  color: var(--white) !important;
  padding: 0.55rem 1.3rem;
  border-radius: 100px;
  font-size: 0.8rem !important;
  font-weight: 600 !important;
  transition: opacity 0.2s !important;
}
.nav-cta:hover { opacity: 0.82 !important; color: var(--white) !important; }

/* ── HERO ── */
.hero {
  min-height: 100vh;
  padding: 10rem 3rem 6rem;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 5rem;
  max-width: 1200px;
  margin: 0 auto;
  align-items: center;
}

.hero-left { position: relative; }

.hero-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--cyan-soft);
  border: 1px solid var(--cyan-border);
  border-radius: 100px;
  padding: 0.35rem 1rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--cyan);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 2rem;
  opacity: 0;
  animation: rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s forwards;
}

.pulse-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--cyan);
  animation: blink 2.5s ease infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

h1 {
  font-family: 'Playfair Display', serif;
  font-weight: 500;
  font-size: clamp(2.6rem, 4.5vw, 3.8rem);
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: var(--ink);
  margin-bottom: 1.5rem;
  opacity: 0;
  animation: rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s forwards;
}

h1 em {
  font-style: italic;
  color: var(--cyan);
}

.hero-sub {
  font-size: 1.05rem;
  color: var(--ink-60);
  max-width: 480px;
  line-height: 1.8;
  margin-bottom: 2.5rem;
  opacity: 0;
  animation: rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.3s forwards;
}

.hero-actions {
  display: flex; gap: 0.75rem; flex-wrap: wrap;
  margin-bottom: 2rem;
  opacity: 0;
  animation: rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.4s forwards;
}

.btn-dark {
  background: var(--ink); color: var(--white);
  border: none; padding: 0.85rem 1.8rem;
  border-radius: 100px;
  font-family: 'Figtree', sans-serif;
  font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: opacity 0.2s;
  text-decoration: none; display: inline-block;
}
.btn-dark:hover { opacity: 0.8; }

.btn-outline {
  background: transparent; color: var(--ink);
  border: 1px solid var(--border);
  padding: 0.85rem 1.8rem;
  border-radius: 100px;
  font-family: 'Figtree', sans-serif;
  font-size: 0.875rem; font-weight: 500;
  cursor: pointer; transition: all 0.2s;
  text-decoration: none; display: inline-block;
}
.btn-outline:hover { background: var(--ink-05); }

.hero-trust {
  display: flex; align-items: center; gap: 1.5rem;
  opacity: 0;
  animation: rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.5s forwards;
}

.trust-item {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.78rem; color: var(--ink-60);
  font-weight: 400;
}

.trust-sep { width: 4px; height: 4px; border-radius: 50%; background: var(--ink-30); }

/* ── HERO CARD ── */
.hero-right {
  opacity: 0;
  animation: rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.5s forwards;
}

.result-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 4px 40px rgba(13,14,16,0.06), 0 1px 0 rgba(255,255,255,0.8) inset;
}

.card-top {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-light);
  display: flex; justify-content: space-between; align-items: center;
}

.card-label {
  font-size: 0.72rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--ink-30);
}

.card-badge {
  font-size: 0.7rem; font-weight: 600;
  padding: 4px 10px; border-radius: 100px;
}
.badge-ok { background: var(--cyan-soft); color: var(--cyan); border: 1px solid var(--cyan-border); }
.badge-warn { background: rgba(255,165,0,0.1); color: #c97a00; border: 1px solid rgba(255,165,0,0.25); }

.card-body { padding: 1.5rem; }

.car-name {
  font-size: 0.8rem; color: var(--ink-60);
  margin-bottom: 0.4rem; font-weight: 500;
}

.price-main {
  font-family: 'Playfair Display', serif;
  font-size: 2.3rem; font-weight: 700;
  color: var(--ink); line-height: 1;
  margin-bottom: 0.4rem;
  letter-spacing: -0.02em;
}

.price-range {
  font-size: 0.78rem; color: var(--ink-60);
  margin-bottom: 1.5rem;
  font-weight: 400;
}

.score-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 0.75rem;
}

.score-label { font-size: 0.75rem; color: var(--ink-60); font-weight: 400; }

.score-val {
  font-size: 0.72rem; font-weight: 600; color: var(--cyan);
  background: var(--cyan-soft); padding: 2px 8px; border-radius: 100px;
}

.score-bar {
  height: 4px; background: var(--border);
  border-radius: 100px; margin-bottom: 1.5rem; overflow: hidden;
}

.score-fill {
  height: 100%; background: var(--cyan);
  border-radius: 100px; width: 0%;
  transition: width 1.5s cubic-bezier(0.16,1,0.3,1) 1s;
}

.factors { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }

.factor {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.6rem 0.8rem;
  background: var(--ink-05);
  border-radius: 8px;
  font-size: 0.78rem;
}

.factor-name { color: var(--ink); display: flex; align-items: center; gap: 6px; font-weight: 400; }
.factor-dot { width: 6px; height: 6px; border-radius: 50%; }
.dot-pos { background: var(--cyan); }
.dot-neg { background: #ff6b47; }
.factor-tag {
  font-size: 0.68rem; font-weight: 600;
  padding: 2px 7px; border-radius: 100px;
}
.tag-pos { background: var(--cyan-soft); color: var(--cyan); }
.tag-neg { background: rgba(255,107,71,0.1); color: #d94f2a; }

.alert-box {
  background: rgba(0,184,154,0.04);
  border: 1px solid var(--cyan-border);
  border-radius: 8px;
  padding: 0.7rem 0.9rem;
  font-size: 0.75rem; color: var(--cyan);
  margin-bottom: 1.25rem;
  display: flex; gap: 8px; align-items: flex-start;
  font-weight: 400;
}

.card-action {
  width: 100%; padding: 0.8rem;
  background: var(--ink); color: var(--white);
  border: none; border-radius: 10px;
  font-family: 'Figtree', sans-serif;
  font-size: 0.85rem; font-weight: 600;
  cursor: pointer; transition: opacity 0.2s;
}
.card-action:hover { opacity: 0.75; }

/* ── SEPARATOR LINE ── */
.sep-line {
  max-width: 1200px; margin: 0 auto;
  border: none; border-top: 1px solid var(--border-light);
}

/* ── STATS ── */
.stats {
  max-width: 1200px; margin: 0 auto;
  padding: 3rem;
  display: grid; grid-template-columns: repeat(4,1fr);
  gap: 0;
}

.stat { padding: 1.5rem 0; border-right: 1px solid var(--border-light); padding-right: 2rem; padding-left: 2rem; }
.stat:first-child { padding-left: 0; }
.stat:last-child { border-right: none; }

.stat-n {
  font-family: 'Playfair Display', serif;
  font-size: 2.2rem; font-weight: 600;
  color: var(--ink); letter-spacing: -0.02em;
  margin-bottom: 0.3rem;
}

.stat-n span { color: var(--cyan); }

.stat-d {
  font-size: 0.8rem; color: var(--ink-60); line-height: 1.5;
  font-weight: 400;
}

/* ── SECTIONS ── */
.container { max-width: 1200px; margin: 0 auto; padding: 6rem 3rem; }

.section-tag {
  font-size: 0.72rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.12em;
  color: var(--ink-30); margin-bottom: 1rem;
  display: flex; align-items: center; gap: 8px;
}
.section-tag::before { content: ''; display:block; width:16px; height:1px; background: var(--ink-30); }

h2 {
  font-family: 'Playfair Display', serif;
  font-weight: 500;
  font-size: clamp(1.8rem, 3vw, 2.8rem);
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--ink);
}

h2 em { font-style: italic; color: var(--cyan); }

.section-sub {
  font-size: 1rem; color: var(--ink-60);
  line-height: 1.8; max-width: 500px;
}

/* ── FEATURES ── */
.features-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 1px; background: var(--border-light);
  border: 1px solid var(--border-light);
  border-radius: 16px; overflow: hidden;
  margin-top: 3.5rem;
}

.feat {
  background: var(--white);
  padding: 2.5rem 2rem;
  transition: background 0.3s;
}
.feat:hover { background: var(--paper-2); }

.feat-icon {
  width: 40px; height: 40px;
  border-radius: 10px;
  background: var(--cyan-soft);
  border: 1px solid var(--cyan-border);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem;
  margin-bottom: 1.4rem;
}

.feat-title {
  font-family: 'Playfair Display', serif;
  font-weight: 500; font-size: 1rem;
  margin-bottom: 0.7rem; color: var(--ink);
  letter-spacing: -0.01em;
}

.feat-quote {
  font-size: 0.78rem; color: var(--cyan);
  font-style: italic; margin-bottom: 0.7rem;
  font-family: 'Playfair Display', serif;
}

.feat-desc { font-size: 0.83rem; color: var(--ink-60); line-height: 1.7; }

/* ── PROCESS ── */
.process-section { background: var(--white); }

.process-inner { max-width: 1200px; margin: 0 auto; padding: 6rem 3rem; }

.steps {
  display: grid; grid-template-columns: repeat(3,1fr);
  gap: 4rem; margin-top: 3.5rem;
  position: relative;
}

.steps::before {
  content: '';
  position: absolute;
  top: 22px; left: 12%; right: 12%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border), var(--border), transparent);
}

.step { position: relative; z-index: 1; }

.step-n {
  width: 44px; height: 44px; border-radius: 50%;
  background: var(--paper-2);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Playfair Display', serif;
  font-size: 1rem; font-weight: 500; color: var(--ink);
  margin-bottom: 1.5rem;
}

.step-title {
  font-family: 'Playfair Display', serif;
  font-weight: 500; font-size: 1rem;
  color: var(--ink); margin-bottom: 0.6rem;
}

.step-desc { font-size: 0.82rem; color: var(--ink-60); line-height: 1.7; }

/* ── AUDIENCES ── */
.audiences-grid {
  display: grid; grid-template-columns: repeat(3,1fr);
  gap: 1rem; margin-top: 3.5rem;
}

.audience {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 2rem;
  transition: all 0.3s;
  background: var(--white);
  cursor: default;
}
.audience:hover {
  border-color: var(--cyan-border);
  box-shadow: 0 4px 20px rgba(0,184,154,0.08);
}

.audience-icon { font-size: 1.5rem; margin-bottom: 1rem; }

.audience-title {
  font-family: 'Playfair Display', serif;
  font-weight: 500; font-size: 0.95rem;
  color: var(--ink); margin-bottom: 0.5rem;
}

.audience-quote {
  font-size: 0.78rem; color: var(--cyan);
  font-style: italic;
  font-family: 'Playfair Display', serif;
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.audience-desc { font-size: 0.8rem; color: var(--ink-60); line-height: 1.7; }

/* ── أسئلة شائعة ── */
.faq-section { background: var(--white); }
.faq-inner { max-width: 720px; margin: 0 auto; padding: 6rem 3rem; }

.faq-list { margin-top: 3rem; display: flex; flex-direction: column; gap: 0; }

.faq-item {
  border-bottom: 1px solid var(--border-light);
  overflow: hidden;
}

.faq-q {
  width: 100%; background: none; border: none;
  text-align: left; padding: 1.3rem 0;
  display: flex; justify-content: space-between; align-items: center;
  cursor: pointer;
  font-family: 'Figtree', sans-serif;
  font-size: 0.9rem; font-weight: 500; color: var(--ink);
  transition: color 0.2s;
}
.faq-q:hover { color: var(--cyan); }

.faq-icon {
  width: 22px; height: 22px; border-radius: 50%;
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; color: var(--ink-60);
  flex-shrink: 0;
  transition: all 0.3s; background: transparent;
}

.faq-a {
  max-height: 0; overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.16,1,0.3,1);
}

.faq-a-inner {
  padding-bottom: 1.3rem;
  font-size: 0.85rem; color: var(--ink-60); line-height: 1.8;
}

.faq-item.open .faq-a { max-height: 200px; }
.faq-item.open .faq-icon { background: var(--ink); border-color: var(--ink); color: var(--white); transform: rotate(45deg); }

/* ── CTA FINAL ── */
.cta-section {
  padding: 8rem 3rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.cta-section::before {
  content: '';
  position: absolute;
  width: 500px; height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0,184,154,0.06) 0%, transparent 70%);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.cta-inner { position: relative; z-index: 1; max-width: 620px; margin: 0 auto; }

.cta-h2 {
  font-family: 'Playfair Display', serif;
  font-weight: 500;
  font-size: clamp(2.2rem, 4vw, 3.2rem);
  letter-spacing: -0.025em; line-height: 1.15;
  margin-bottom: 1.2rem;
}

.cta-h2 em { font-style: italic; color: var(--cyan); }

.cta-sub {
  font-size: 0.95rem; color: var(--ink-60);
  line-height: 1.8; margin-bottom: 2.5rem;
}

.cta-micro { margin-top: 1rem; font-size: 0.75rem; color: var(--ink-30); }

/* ── FOOTER ── */
footer {
  border-top: 1px solid var(--border-light);
  padding: 2rem 3rem;
  display: flex; justify-content: space-between; align-items: center;
  max-width: 100%;
}

.footer-brand {
  display: flex; align-items: center; gap: 8px;
  font-family: 'Playfair Display', serif;
  font-size: 1rem; color: var(--ink);
  font-weight: 700;
}
.footer-brand img { width: 22px; height: 22px; object-fit: contain; }

.footer-copy { font-size: 0.75rem; color: var(--ink-30); font-weight: 400; }

/* ── REVEAL ── */
.reveal {
  opacity: 0; transform: translateY(24px);
  transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1);
}
.reveal.on { opacity: 1; transform: none; }

/* ── ANIMATIONS ── */
@keyframes rise {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── RESPONSIVE ── */
@media (max-width: 900px) {
  .hero { grid-template-columns: 1fr; gap: 3rem; padding: 8rem 1.5rem 4rem; }
  .stats { grid-template-columns: repeat(2,1fr); }
  .stat { border-right: none; border-bottom: 1px solid var(--border-light); padding-left: 0.5rem; padding-right: 0.5rem; }
  .features-grid, .steps, .audiences-grid { grid-template-columns: 1fr; }
  .steps::before { display: none; }
  nav { padding: 1rem 1.5rem; }
  .nav-links { display: none; }
  .container, .process-inner, .faq-inner { padding: 4rem 1.5rem; }
  footer { flex-direction: column; gap: 1rem; padding: 2rem 1.5rem; }
  .cta-section { padding: 5rem 1.5rem; }
}
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <a href="#" class="nav-brand">
    <img src="QimatnaDz_logo_1.png" alt="Q" onerror="this.style.display='none'">
    Qimatna Dz
  </a>
  <ul class="nav-links">
    <li><a href="#pourquoi">لماذا نحن</a></li>
    <li><a href="#comment">كيف تعمل</a></li>
    <li><a href="#faq">أسئلة شائعة</a></li>
    <li><button onclick="window.parent.postMessage({ type: 'CHANGE_LANGUAGE' }, '*')" style="background:none;border:none;color:var(--ink-60);font-size:0.85rem;font-weight:500;cursor:pointer;font-family:inherit;">🌐 AR / FR</button></li>
    <li><a href="/evaluate" target="_parent" class="nav-cta">تقييم سيارتي</a></li>
  </ul>
</nav>

<!-- HERO -->
<section style="background: var(--paper);">
  <div class="hero">
    <div class="hero-left">
      <div class="hero-eyebrow">
        <div class="pulse-dot"></div>
        سوق السيارات الجزائري · تقييم مباشر
      </div>
      <h1>Estimez le <em>juste prix</em> de votre voiture en Algérie.</h1>
      <p class="hero-sub">
        Grâce à notre intelligence artificielle avancée et l'analyse continue du marché algérien. Obtenez une estimation chirurgicale en 1 clic, gratuitement et sans compte.
      </p>
      <div class="hero-actions">
        <a href="/evaluate" target="_parent" class="btn-dark">🚀 تقييم سيارتي</a>
        <a href="#" class="btn-outline">📱 تطبيق الهاتف</a>
      </div>
      <div class="hero-trust">
        <div class="trust-item">⚡ مجاني</div>
        <div class="trust-sep"></div>
        <div class="trust-item">بدون تسجيل</div>
        <div class="trust-sep"></div>
        <div class="trust-item">مجهول 100%</div>
      </div>
    </div>

    <div class="hero-right">
      <div class="result-card">
        <div class="card-top">
          <div class="card-label">Résultat de l'estimation</div>
          <span class="card-badge badge-ok">✓ سعر السوق الجزائري</span>
        </div>
        <div class="card-body">
          <div class="car-name">Kia KX1 · 2026 · 00 Compteur</div>
          <div class="price-main">3 950 000 <span style="font-size:1.1rem;font-weight:400;color:var(--ink-60);">DZD</span></div>
          <div class="price-range">نطاق السوق · 3 750 000 – 4 150 000 DZD</div>

          <div class="score-row">
            <span class="score-label">مؤشر ثقة الخبير</span>
            <span class="score-val">94 / 100</span>
          </div>
          <div class="score-bar"><div class="score-fill" id="sfill"></div></div>

          <div class="factors">
            <div class="factor">
              <div class="factor-name"><div class="factor-dot dot-pos"></div>سيارة جديدة (00 كم)</div>
              <span class="factor-tag tag-pos">جديد +</span>
            </div>
            <div class="factor">
              <div class="factor-name"><div class="factor-dot dot-pos"></div>Peinture d'origine (00)</div>
              <span class="factor-tag tag-pos">قوي +</span>
            </div>
            <div class="factor">
              <div class="factor-name"><div class="factor-dot dot-pos"></div>ضمان المصنع ساري</div>
              <span class="factor-tag tag-pos">ميزة +</span>
            </div>
          </div>

          <div class="alert-box">
            ✓ تقييم مُحسّن للسوق الموازية والمعاملات الفعلية.
          </div>

          <button class="card-action" onclick="window.open('/evaluate', '_parent')">بيع هذه السيارة ←</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- STATS -->
<hr class="sep-line">
<div class="stats reveal">
  <div class="stat">
    <div class="stat-n">450<span>k</span>+</div>
    <div class="stat-d">إعلانات يتم تحليلها أسبوعياً في الجزائر</div>
  </div>
  <div class="stat">
    <div class="stat-n">100<span>%</span></div>
    <div class="stat-d">مُكيّف مع الخصائص الجزائرية (GPL, Sbigha, 00km, Licences)</div>
  </div>
  <div class="stat">
    <div class="stat-n">0 <span style="font-size:1.4rem;">DA</span></div>
    <div class="stat-d">مجاني تمامًا ومتاح لجميع الجزائريين</div>
  </div>
  <div class="stat">
    <div class="stat-n">1<span>h</span></div>
    <div class="stat-d">تحديث كل ساعة لأسعار السوق المرجعية</div>
  </div>
</div>
<hr class="sep-line">

<!-- FEATURES -->
<section id="pourquoi">
  <div class="container">
    <div class="reveal">
      <div class="section-tag">لماذا قيمتنا ديزاد</div>
      <h2>نحن لا نخمن الأسعار.<br>نحن نحلل <em>الواقع الميداني.</em></h2>
    </div>
    <div class="features-grid reveal">
      <div class="feat">
        <div class="feat-icon">📊</div>
        <div class="feat-title">تحليل متعدد المصادر للسوق</div>
        <div class="feat-quote">"نحن نحلل واقع السوق."</div>
        <div class="feat-desc">Notre moteur croise en temps réel les annonces actives de la journée, l'historique des transactions réelles conclues en Algérie et les grilles de référence de nos experts partenaires.</div>
      </div>
      <div class="feat">
        <div class="feat-icon">🚗</div>
        <div class="feat-title">دقة "00 عداد" والاستيراد</div>
        <div class="feat-quote">"الأداة الوحيدة المُكيّفة مع الخصائص الجزائرية."</div>
        <div class="feat-desc">تشطيبات AMG Line، M Sport، رخص المجاهدين أو سيارات "00 عداد": يأخذ خوارزميتنا في الاعتبار القيمة الدقيقة لجميع التشطيبات والرسوم الجمركية.</div>
      </div>
      <div class="feat">
        <div class="feat-icon">🧠</div>
        <div class="feat-title">تعديلات ذكية مخصصة</div>
        <div class="feat-quote">"سيارتك فريدة، وسعرها أيضًا."</div>
        <div class="feat-desc">Nous ajustons automatiquement la cote selon l'état réel du moteur, la présence de retouches de peinture (Sbigha), l'usure kilométrique et la présence d'un kit GPL.</div>
      </div>
    </div>
  </div>
</section>

<!-- PROCESS -->
<section class="process-section" id="comment">
  <div class="process-inner">
    <div class="reveal" style="text-align:center; margin-bottom:0;">
      <div class="section-tag" style="justify-content:center;">كيف تعمل</div>
      <h2>بسيط. سريع. <em>دقيق.</em></h2>
      <p class="section-sub" style="margin: 1rem auto 0; text-align:center;">أقل من 60 ثانية لمعرفة القيمة الحقيقية لسيارتك.</p>
    </div>
    <div class="steps reveal">
      <div class="step">
        <div class="step-n">1</div>
        <div class="step-title">صف سيارتك</div>
        <div class="step-desc">Sélectionnez la marque, le modèle précis, la finition, l'année et le kilométrage réel de votre voiture. Sans aucun compte à créer.</div>
      </div>
      <div class="step">
        <div class="step-n">2</div>
        <div class="step-title">L'I.A. analyse le marché</div>
        <div class="step-desc">يقاطع محركنا سيارتك على الفور بآلاف نقاط البيانات النشطة في الجزائر ويطبق معاملات الاستهلاك المحلية.</div>
      </div>
      <div class="step">
        <div class="step-n">3</div>
        <div class="step-title">احصل على قرار الخبير</div>
        <div class="step-desc">اعرض سعر البيع الموصى به، والنطاقات الدنيا والعليا، ومؤشر الثقة الخاص بنا، ونصائح التفاوض المخصصة.</div>
      </div>
    </div>
  </div>
</section>

<!-- AUDIENCES -->
<section>
  <div class="container">
    <div class="reveal">
      <div class="section-tag">لمن موجه</div>
      <h2>À qui s'adresse<br><em>Qimatna Dz ?</em></h2>
    </div>
    <div class="audiences-grid reveal">
      <div class="audience">
        <div class="audience-icon">🔑</div>
        <div class="audience-title">هل تبيع سيارتك ؟</div>
        <div class="audience-quote">"Évitez de brader votre véhicule ou d'attendre des mois à cause d'un prix irréaliste."</div>
        <div class="audience-desc">Fixez un prix de départ juste et restez ferme face aux négociations grâce à notre rapport d'expert officiel comme référence.</div>
      </div>
      <div class="audience">
        <div class="audience-icon">💸</div>
        <div class="audience-title">هل تشتري سيارة ؟</div>
        <div class="audience-quote">"Ne vous faites plus jamais arnaquer sur les marchés d'occasion physiques ou en ligne."</div>
        <div class="audience-desc">تحقق فورًا مما إذا كان السعر الذي يطلبه البائع يتوافق مع الواقع الحالي للسوق الجزائري.</div>
      </div>
      <div class="audience">
        <div class="audience-icon">💼</div>
        <div class="audience-title">هل أنت محترف أو صالة عرض ؟</div>
        <div class="audience-quote">"قم بتحسين دوران مخزونك واشتر بالسعر المناسب."</div>
        <div class="audience-desc">Suivez les tendances hebdomadaires de fluctuation des prix par wilaya et maximisez vos marges d'achat-revente.</div>
      </div>
    </div>
  </div>
</section>

<!-- أسئلة شائعة -->
<section class="faq-section" id="faq">
  <div class="faq-inner">
    <div class="reveal" style="text-align:center;">
      <div class="section-tag" style="justify-content:center;">أسئلة شائعة</div>
      <h2>ما <em>تريد معرفته.</em></h2>
    </div>
    <div class="faq-list reveal">
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">
          D'où proviennent vos données de prix ?
          <div class="faq-icon">+</div>
        </button>
        <div class="faq-a">
          <div class="faq-a-inner">Notre moteur collecte et nettoie quotidiennement les annonces publiques des plus grands sites algériens (comme Ouedkniss), intègre les prix réels de vente déclarés sur les marchés physiques d'Algérie, et collabore avec des experts automobiles pour valider les cotes des véhicules neufs et d'importation.</div>
        </div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">
          L'estimation prend-elle en compte la peinture (Sbigha) et l'état du moteur ?
          <div class="faq-icon">+</div>
        </button>
        <div class="faq-a">
          <div class="faq-a-inner">Oui, absolument. Qimatna Dz est le seul outil en Algérie qui ajuste le prix de vente conseillé en fonction de la présence de retouches de peinture, de l'état d'usure mécanique du moteur, et du niveau exact de finition du modèle.</div>
        </div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">
          هل أحتاج إلى إنشاء حساب لاستخدام الخدمة ؟
          <div class="faq-icon">+</div>
        </button>
        <div class="faq-a">
          <div class="faq-a-inner">Non. L'accès à l'estimation de base et à l'historique de vos recherches sur votre appareil est 100% libre, gratuit et sans compte. Vous pouvez estimer autant de voitures que vous le souhaitez, en toute discrétion.</div>
        </div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">
          هل يمكنني تصدير التقييم لإظهاره لمشتر ؟
          <div class="faq-icon">+</div>
        </button>
        <div class="faq-a">
          <div class="faq-a-inner">Oui. Vous pouvez générer et partager le rapport de cote directement depuis l'application pour l'envoyer par WhatsApp, Messenger ou le montrer en face-à-face au moment de la négociation.</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA FINAL -->
<section class="cta-section" id="estimer">
  <div class="cta-inner reveal">
    <h2 class="cta-h2">هل أنت مستعد لمعرفة <em>القيمة الحقيقية</em> لسيارتك ؟</h2>
    <p class="cta-sub">Ne laissez plus le hasard ou les spéculations décider du prix de votre voiture. Faites confiance à la précision chirurgicale de l'intelligence artificielle de Qimatna Dz.</p>
    <a href="/evaluate" target="_parent" class="btn-dark" style="font-size:1rem; padding:1rem 2.2rem;">
      👉 ابدأ أول تقييم مجاني لي
    </a>
    <div class="cta-micro">بدون تسجيل · مجاني · مجهول 100%</div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-brand">
    <img src="QimatnaDz_logo_1.png" alt="" onerror="this.style.display='none'">
    Qimatna Dz
  </div>
  <div class="footer-copy">© 2026 قيمتنا ديزاد · التقييم الفعلي لسوق السيارات الجزائري</div>
</footer>

<script>
// Scroll reveal
const obs = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('on'), i * 80);
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// Score bar animate
const sfill = document.getElementById('sfill');
const barObs = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) { sfill.style.width = '94%'; barObs.disconnect(); }
}, { threshold: 0.5 });
barObs.observe(sfill);

// أسئلة شائعة accordion
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
</script>
</body>
</html>`;

export const getLandingPageHtml = (lang: string) => {
  return lang === 'ar' ? LANDING_PAGE_HTML_AR : LANDING_PAGE_HTML_FR;
};
