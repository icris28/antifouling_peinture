(function () {
  "use strict";

  const app = document.querySelector("#app");
  const toast = document.querySelector("#toast");
  const catalogue = Array.isArray(window.MARINE_CATALOGUE) ? window.MARINE_CATALOGUE : [];
  const STORAGE_KEY = "marine-corail-assistant-v1";
  let toastTimer;

  const defaults = {
    view: "home",
    step: 1,
    family: null,
    selectedProduct: null,
    error: "",
    answers: {
      material: "polyester",
      hullType: "sail-fin",
      speed: 8,
      zone: "topsides",
      system: "one-pack",
      finish: "gloss",
      resinApp: "lamination",
      areaMode: "dimensions",
      area: 0,
      lwl: 10,
      loa: 10,
      beam: 3.3,
      draft: 1.7,
      freeboard: 1.2,
      margin: 10,
      plies: 3,
      glassWeight: 450,
      resinRatio: 1.5,
      resinCoats: 2,
      consumption: 300,
      lengthCm: 100,
      widthCm: 50,
      thicknessMm: 10
    }
  };

  const labels = {
    antifouling: "Antifouling",
    paint: "Peinture & primaire",
    resin: "Résine & composite",
    polyester: "Polyester / gelcoat",
    bois: "Bois",
    acier: "Acier",
    aluminium: "Aluminium",
    plomb: "Plomb",
    "sail-fin": "Voilier — quille moyenne",
    "sail-race": "Voilier — quille fine",
    "sail-long": "Voilier — quille longue",
    motor: "Bateau à moteur",
    catamaran: "Catamaran",
    topsides: "Franc-bord",
    deck: "Pont",
    bilge: "Cale & coffres",
    interior: "Intérieur",
    primer: "Primaire / protection",
    "one-pack": "Monocomposant",
    "two-pack": "Bi-composant",
    gloss: "Brillant",
    satin: "Satiné",
    "non-slip": "Antidérapant",
    lamination: "Stratification",
    repair: "Réparation",
    coating: "Revêtement époxy",
    casting: "Coulée / inclusion",
    gelcoat: "Réparation gelcoat",
    erodable: "Érodable",
    "semi-hard": "Semi-érodable",
    hard: "Matrice dure"
  };

  let state = loadState();

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || !saved.answers) return clone(defaults);
      return {
        ...clone(defaults),
        ...saved,
        error: "",
        answers: { ...clone(defaults.answers), ...saved.answers }
      };
    } catch (_) {
      return clone(defaults);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        view: state.view,
        step: state.step,
        family: state.family,
        selectedProduct: state.selectedProduct,
        answers: state.answers
      }));
    } catch (_) {
      // L'application reste utilisable si le stockage privé est bloqué.
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatNumber(value, digits = 1) {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(Number(value) || 0);
  }

  function formatPrice(value) {
    return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} F CFP`;
  }

  function optionButton(field, value, title, hint = "") {
    const selected = String(state.answers[field]) === String(value);
    return `
      <button class="choice-button" type="button" data-action="choose" data-field="${escapeHtml(field)}" data-value="${escapeHtml(value)}" aria-pressed="${selected}">
        <strong>${escapeHtml(title)}</strong>
        ${hint ? `<small>${escapeHtml(hint)}</small>` : ""}
      </button>`;
  }

  function numberField(field, title, unit, options = {}) {
    const { min = 0, max = 9999, step = 0.1, hint = "" } = options;
    return `
      <label class="field">
        <span>${escapeHtml(title)}${hint ? ` — ${escapeHtml(hint)}` : ""}</span>
        <span class="field-wrap">
          <input type="number" inputmode="decimal" min="${min}" max="${max}" step="${step}" value="${escapeHtml(state.answers[field])}" data-input="${escapeHtml(field)}">
          <span class="field-unit">${escapeHtml(unit)}</span>
        </span>
      </label>`;
  }

  function categoryIcon(type) {
    if (type === "antifouling") {
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M9 35h46l-7 13H19L9 35Z"/><path d="M18 35 24 16h18l5 19M32 16V8m0 0 8 5m-8-5-7 5"/><path d="M12 54c6-3 11-3 17 0s11 3 17 0 8-2 11-1"/></svg>`;
    }
    if (type === "paint") {
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M13 14h27v15H13zM18 29v8h26c4 0 7 3 7 7v4M51 48v8"/><path d="M10 10h33v5H10z"/><path d="M46 48h10v10H46z"/></svg>`;
    }
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M24 8h16M27 8v17L13 49a5 5 0 0 0 4 7h30a5 5 0 0 0 4-7L37 25V8"/><path d="M20 40h24M26 47h1m9 3h1m2-18h1"/></svg>`;
  }

  function arrowIcon(direction = "right") {
    const transform = direction === "left" ? "transform:rotate(180deg)" : "";
    return `<svg viewBox="0 0 24 24" aria-hidden="true" style="${transform}"><path d="m9 18 6-6-6-6"/></svg>`;
  }

  function renderHome() {
    app.innerHTML = `
      <section class="home-view">
        <div class="home-copy">
          <div>
            <p class="eyebrow">Conseiller de projet nautique</p>
            <h1>Choisir juste.<br><em>Prévoir juste.</em></h1>
            <p class="home-intro">Quelques informations sur le bateau et le chantier suffisent pour obtenir une recommandation claire, la quantité nécessaire et le nombre de pots.</p>
            <ul class="benefit-row" aria-label="Avantages">
              <li>Parcours guidé</li>
              <li>Calcul en m²</li>
              <li>Résultat imprimable</li>
            </ul>
          </div>
          <div class="boat-scene" aria-hidden="true">
            <svg viewBox="0 0 620 330">
              <path d="M64 203c119 21 304 20 472-2-31 68-95 91-217 92-132 1-215-29-255-90Z" fill="#fff"/>
              <path d="M79 235c126 17 300 14 433-2-38 42-99 58-197 59-108 0-188-17-236-57Z" fill="#e6493f"/>
              <path d="M285 70v135M290 77l147 119H291Z" fill="#fff" stroke="#073a53" stroke-width="7" stroke-linejoin="round"/>
              <path d="M280 87 151 198h129Z" fill="#dff4f3" stroke="#073a53" stroke-width="7" stroke-linejoin="round"/>
              <path d="M192 203h250" fill="none" stroke="#073a53" stroke-width="8" stroke-linecap="round"/>
              <circle cx="494" cy="78" r="25" fill="#f3bf43"/>
              <path d="M42 305c75-15 99 17 166 2s101 13 159 0 102 8 203-5" fill="none" stroke="rgba(255,255,255,.72)" stroke-width="5" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <section class="category-panel" aria-labelledby="project-title">
          <h2 id="project-title">Quel est votre projet ?</h2>
          <p>Choisissez une famille pour démarrer.</p>
          <div class="category-grid">
            <button class="category-card" type="button" data-action="start" data-family="antifouling">
              <span class="category-icon">${categoryIcon("antifouling")}</span>
              <span><strong>Antifouling</strong><small>Carène, vitesse, salissures et compatibilité du support.</small></span>
              <span class="category-arrow">${arrowIcon()}</span>
            </button>
            <button class="category-card" type="button" data-action="start" data-family="paint">
              <span class="category-icon">${categoryIcon("paint")}</span>
              <span><strong>Peinture & primaire</strong><small>Franc-bord, pont, cale, finition ou protection.</small></span>
              <span class="category-arrow">${arrowIcon()}</span>
            </button>
            <button class="category-card" type="button" data-action="start" data-family="resin">
              <span class="category-icon">${categoryIcon("resin")}</span>
              <span><strong>Résine & composite</strong><small>Réparation, stratification, revêtement ou coulée.</small></span>
              <span class="category-arrow">${arrowIcon()}</span>
            </button>
          </div>
        </section>
      </section>`;
  }

  function renderProgress() {
    const steps = [
      ["1", "Votre besoin", "Usage et support"],
      ["2", "Vos mesures", "Surface à traiter"],
      ["3", "Votre solution", "Produit et quantité"]
    ];
    return `
      <aside class="progress-panel" aria-label="Progression">
        <p class="eyebrow">${escapeHtml(labels[state.family])}</p>
        <h2>Votre projet<br>en 3 étapes</h2>
        <ol class="progress-list">
          ${steps.map(([number, title, detail], index) => {
            const step = index + 1;
            const status = state.step === step ? "is-active" : state.step > step ? "is-done" : "";
            return `<li class="progress-item ${status}" ${state.step === step ? 'aria-current="step"' : ""}>
              <span class="progress-number">${state.step > step ? "✓" : number}</span>
              <div><strong>${title}</strong><small>${detail}</small></div>
            </li>`;
          }).join("")}
        </ol>
      </aside>`;
  }

  function renderWizard() {
    const content = state.step === 1 ? renderQuestions() : state.step === 2 ? renderMeasurements() : renderResults();
    app.innerHTML = `<div class="wizard-shell">${renderProgress()}<section class="wizard-main">${content}</section></div>`;
  }

  function renderQuestions() {
    let body = "";
    if (state.family === "antifouling") body = antifoulingQuestions();
    if (state.family === "paint") body = paintQuestions();
    if (state.family === "resin") body = resinQuestions();

    return `
      <header class="step-heading">
        <p class="eyebrow">Étape 1 sur 3</p>
        <h1>Parlez-nous du projet</h1>
        <p>Ces critères éliminent les produits incompatibles et classent les solutions les plus adaptées.</p>
      </header>
      ${body}
      ${state.error ? `<div class="validation" role="alert">${escapeHtml(state.error)}</div>` : ""}
      ${renderFooter(1)}`;
  }

  function antifoulingQuestions() {
    return `
      <div class="question-block">
        <span class="question-label">Type de bateau</span>
        <div class="option-grid">
          ${optionButton("hullType", "sail-fin", "Voilier — quille moyenne", "Croisière classique")}
          ${optionButton("hullType", "sail-race", "Voilier — quille fine", "Carène légère ou régate")}
          ${optionButton("hullType", "sail-long", "Voilier — quille longue", "Carène plus immergée")}
          ${optionButton("hullType", "motor", "Bateau à moteur", "Vedette ou coque planante")}
          ${optionButton("hullType", "catamaran", "Catamaran", "Surface constructeur conseillée")}
        </div>
      </div>
      <div class="question-block">
        <span class="question-label">Matériau de la carène</span>
        <span class="question-hint">Le choix « aluminium » exclut automatiquement les produits incompatibles.</span>
        <div class="option-grid">
          ${optionButton("material", "polyester", "Polyester / gelcoat")}
          ${optionButton("material", "bois", "Bois")}
          ${optionButton("material", "acier", "Acier")}
          ${optionButton("material", "aluminium", "Aluminium")}
        </div>
      </div>
      <div class="question-block fields-grid two">
        ${numberField("speed", "Vitesse maximale", "nœuds", { min: 0, max: 80, step: 1 })}
        <div class="formula-card" style="margin-top:0">
          <span class="formula-icon" aria-hidden="true">☀</span>
          <div><strong>Contexte Nouvelle-Calédonie</strong><p>La sélection considère automatiquement des eaux tropicales et une immersion toute l’année.</p></div>
        </div>
      </div>`;
  }

  function paintQuestions() {
    return `
      <div class="question-block">
        <span class="question-label">Zone à peindre</span>
        <div class="option-grid">
          ${optionButton("zone", "topsides", "Franc-bord", "Parties extérieures au-dessus de l’eau")}
          ${optionButton("zone", "deck", "Pont", "Passage et zones exposées")}
          ${optionButton("zone", "bilge", "Cale & coffres", "Résistance à l’huile et à l’abrasion")}
          ${optionButton("zone", "interior", "Intérieur", "Cloisons et aménagements")}
          ${optionButton("zone", "primer", "Primaire / protection", "Accrochage et anticorrosion")}
        </div>
      </div>
      <div class="question-block">
        <span class="question-label">Matériau du support</span>
        <div class="option-grid">
          ${optionButton("material", "polyester", "Polyester / gelcoat")}
          ${optionButton("material", "bois", "Bois")}
          ${optionButton("material", "acier", "Acier")}
          ${optionButton("material", "aluminium", "Aluminium")}
        </div>
      </div>
      <div class="question-block">
        <span class="question-label">Système souhaité</span>
        <span class="question-hint">Un bi-composant offre généralement plus de résistance mais demande davantage de préparation.</span>
        <div class="option-grid two">
          ${optionButton("system", "one-pack", "Monocomposant", "Simple à appliquer et entretenir")}
          ${optionButton("system", "two-pack", "Bi-composant", "Résistance et finition supérieures")}
        </div>
      </div>
      <div class="question-block">
        <span class="question-label">Finition recherchée</span>
        <div class="option-grid">
          ${optionButton("finish", "gloss", "Brillante")}
          ${optionButton("finish", "satin", "Satinée")}
          ${optionButton("finish", "non-slip", "Antidérapante")}
          ${optionButton("finish", "primer", "Protection / primaire")}
        </div>
      </div>`;
  }

  function resinQuestions() {
    return `
      <div class="question-block">
        <span class="question-label">Type de travail</span>
        <div class="option-grid">
          ${optionButton("resinApp", "lamination", "Stratification", "Imprégner un renfort de verre ou carbone")}
          ${optionButton("resinApp", "repair", "Réparation", "Reconstituer une zone endommagée")}
          ${optionButton("resinApp", "coating", "Revêtement époxy", "Protéger ou étanchéifier un support")}
          ${optionButton("resinApp", "casting", "Coulée / inclusion", "Remplir un volume ou encapsuler")}
          ${optionButton("resinApp", "gelcoat", "Réparation gelcoat", "Finition d’un stratifié polyester")}
        </div>
      </div>
      <div class="question-block">
        <span class="question-label">Support principal</span>
        <div class="option-grid">
          ${optionButton("material", "polyester", "Polyester / gelcoat")}
          ${optionButton("material", "bois", "Bois")}
          ${optionButton("material", "acier", "Acier")}
          ${optionButton("material", "aluminium", "Aluminium")}
        </div>
      </div>
      <div class="formula-card">
        <span class="formula-icon" aria-hidden="true">i</span>
        <div><strong>Le dosage exact reste prioritaire</strong><p>Le calculateur estime la matière. Le ratio base/durcisseur, le temps de travail et l’épaisseur maximale devront provenir de la fiche technique du produit retenu.</p></div>
      </div>`;
  }

  function renderMeasurements() {
    let body = "";
    if (state.family === "antifouling") body = antifoulingMeasurements();
    if (state.family === "paint") body = paintMeasurements();
    if (state.family === "resin") body = resinMeasurements();

    return `
      <header class="step-heading">
        <p class="eyebrow">Étape 2 sur 3</p>
        <h1>Estimons la quantité</h1>
        <p>Entrez la surface connue ou laissez l’assistant l’estimer à partir des dimensions du bateau.</p>
      </header>
      ${body}
      ${state.error ? `<div class="validation" role="alert">${escapeHtml(state.error)}</div>` : ""}
      ${renderFooter(2)}`;
  }

  function areaModeChooser(dimensionsAllowed = true) {
    return `
      <div class="question-block">
        <span class="question-label">Comment souhaitez-vous calculer ?</span>
        <div class="option-grid two">
          ${dimensionsAllowed ? optionButton("areaMode", "dimensions", "À partir des dimensions", "Estimation selon le type de coque ou de zone") : ""}
          ${optionButton("areaMode", "direct", "Je connais la surface", "Valeur mesurée ou donnée constructeur")}
        </div>
      </div>`;
  }

  function antifoulingMeasurements() {
    const catamaran = state.answers.hullType === "catamaran";
    const effectiveMode = catamaran ? "direct" : state.answers.areaMode;
    const preview = calculateSurface();
    return `
      ${areaModeChooser(!catamaran)}
      ${catamaran ? `<div class="warning-strip"><span class="warning-icon">ⓘ</span><div><strong>Catamaran</strong>Les formes de carène varient fortement. Utilisez la surface immergée fournie par le constructeur ou une mesure du chantier.</div></div>` : ""}
      <div class="question-block">
        ${effectiveMode === "direct" ? `
          <div class="fields-grid two">
            ${numberField("area", "Surface immergée", "m²", { min: 0.1, max: 1000 })}
            ${numberField("margin", "Marge chantier", "%", { min: 0, max: 40, step: 1, hint: "pertes et retouches" })}
          </div>` : `
          <div class="fields-grid">
            ${numberField("lwl", "Longueur à la flottaison", "m", { min: 0.5, max: 100 })}
            ${numberField("beam", "Largeur maximale", "m", { min: 0.5, max: 30 })}
            ${numberField("draft", "Tirant d’eau", "m", { min: 0.1, max: 15 })}
          </div>
          <div class="fields-grid two" style="margin-top:16px">
            ${numberField("margin", "Marge chantier", "%", { min: 0, max: 40, step: 1, hint: "pertes et retouches" })}
          </div>
          <div class="formula-card">
            <span class="formula-icon" aria-hidden="true">≈</span>
            <div><strong>Surface estimée : ${formatNumber(preview, 1)} m²</strong><p>${escapeHtml(surfaceFormulaText())}. La surface mesurée reste toujours préférable.</p></div>
          </div>`}
      </div>`;
  }

  function paintMeasurements() {
    const dimensionZones = ["topsides", "deck"];
    const dimensionsAllowed = dimensionZones.includes(state.answers.zone);
    const effectiveMode = dimensionsAllowed ? state.answers.areaMode : "direct";
    const preview = calculateSurface();
    return `
      ${areaModeChooser(dimensionsAllowed)}
      <div class="question-block">
        ${effectiveMode === "direct" ? `
          <div class="fields-grid two">
            ${numberField("area", "Surface à peindre", "m²", { min: 0.1, max: 2000 })}
            ${numberField("margin", "Marge chantier", "%", { min: 0, max: 40, step: 1 })}
          </div>` : `
          <div class="fields-grid">
            ${numberField("loa", "Longueur hors tout", "m", { min: 0.5, max: 100 })}
            ${numberField("beam", "Largeur maximale", "m", { min: 0.5, max: 30 })}
            ${state.answers.zone === "topsides" ? numberField("freeboard", "Hauteur moyenne du franc-bord", "m", { min: 0.1, max: 10 }) : numberField("margin", "Marge chantier", "%", { min: 0, max: 40, step: 1 })}
          </div>
          ${state.answers.zone === "topsides" ? `<div class="fields-grid two" style="margin-top:16px">${numberField("margin", "Marge chantier", "%", { min: 0, max: 40, step: 1 })}</div>` : ""}
          <div class="formula-card">
            <span class="formula-icon" aria-hidden="true">≈</span>
            <div><strong>Surface estimée : ${formatNumber(preview, 1)} m²</strong><p>${escapeHtml(surfaceFormulaText())}. Déduisez les grandes ouvertures si nécessaire.</p></div>
          </div>`}
      </div>`;
  }

  function resinMeasurements() {
    const type = state.answers.resinApp;
    let fields = "";
    let help = "";

    if (["lamination", "repair"].includes(type)) {
      fields = `
        <div class="fields-grid">
          ${numberField("area", "Surface de renfort", "m²", { min: 0.01, max: 1000 })}
          ${numberField("plies", "Nombre de plis", "plis", { min: 1, max: 30, step: 1 })}
          ${numberField("glassWeight", "Grammage du renfort", "g/m²", { min: 25, max: 3000, step: 5 })}
        </div>
        <div class="fields-grid two" style="margin-top:16px">
          ${numberField("resinRatio", "Ratio résine / renfort", "kg/kg", { min: 0.5, max: 5, step: 0.1 })}
          ${numberField("margin", "Marge chantier", "%", { min: 0, max: 50, step: 1 })}
        </div>`;
      help = "Poids renfort × ratio d’imprégnation × marge. Le ratio varie selon le tissu et la méthode.";
    } else if (type === "coating") {
      fields = `
        <div class="fields-grid">
          ${numberField("area", "Surface à revêtir", "m²", { min: 0.01, max: 2000 })}
          ${numberField("resinCoats", "Nombre de couches", "couches", { min: 1, max: 12, step: 1 })}
          ${numberField("consumption", "Consommation par couche", "g/m²", { min: 20, max: 2000, step: 10 })}
        </div>
        <div class="fields-grid two" style="margin-top:16px">${numberField("margin", "Marge chantier", "%", { min: 0, max: 50, step: 1 })}</div>`;
      help = "Surface × couches × consommation × marge. Remplacez la consommation par celle de la fiche technique.";
    } else if (type === "casting") {
      fields = `
        <div class="fields-grid">
          ${numberField("lengthCm", "Longueur de coulée", "cm", { min: 0.1, max: 1000 })}
          ${numberField("widthCm", "Largeur de coulée", "cm", { min: 0.1, max: 1000 })}
          ${numberField("thicknessMm", "Épaisseur moyenne", "mm", { min: 0.1, max: 300 })}
        </div>
        <div class="fields-grid two" style="margin-top:16px">${numberField("margin", "Marge chantier", "%", { min: 0, max: 50, step: 1 })}</div>`;
      help = "Volume géométrique × densité du produit × marge. Respectez l’épaisseur maximale de coulée de la fiche technique.";
    } else {
      fields = `
        <div class="fields-grid">
          ${numberField("area", "Surface à reprendre", "m²", { min: 0.01, max: 1000 })}
          ${numberField("thicknessMm", "Épaisseur moyenne", "mm", { min: 0.1, max: 20 })}
          ${numberField("margin", "Marge chantier", "%", { min: 0, max: 50, step: 1 })}
        </div>`;
      help = "Surface × épaisseur × densité × marge. Une réparation localisée doit être mesurée au plus juste.";
    }

    const estimate = calculateResinNeed(null);
    return `
      <div class="question-block">
        ${fields}
        <div class="formula-card">
          <span class="formula-icon" aria-hidden="true">≈</span>
          <div><strong>Besoin matière estimé : ${formatNumber(estimate, 2)} kg</strong><p>${escapeHtml(help)}</p></div>
        </div>
      </div>`;
  }

  function renderFooter(step) {
    return `
      <footer class="wizard-footer">
        <button class="nav-button secondary" type="button" data-action="back">${arrowIcon("left")} Retour</button>
        <div class="footer-right">
          ${step === 1 ? `<button class="nav-button coral" type="button" data-action="next">Continuer ${arrowIcon()}</button>` : ""}
          ${step === 2 ? `<button class="nav-button coral" type="button" data-action="results">Voir ma recommandation ${arrowIcon()}</button>` : ""}
        </div>
      </footer>`;
  }

  function calculateSurface() {
    const a = state.answers;
    const useDirect = a.areaMode === "direct" || a.hullType === "catamaran" || (state.family === "paint" && !["topsides", "deck"].includes(a.zone));
    if (useDirect) return positive(a.area);
    if (state.family === "antifouling") {
      const factors = { "sail-race": 0.5, "sail-fin": 0.75, "sail-long": 1, motor: 0.85 };
      return positive(a.lwl) * (positive(a.beam) + positive(a.draft)) * (factors[a.hullType] || 0.75);
    }
    if (state.family === "paint" && a.zone === "deck") return positive(a.loa) * positive(a.beam) * 0.75;
    if (state.family === "paint" && a.zone === "topsides") return (positive(a.loa) + positive(a.beam)) * positive(a.freeboard) * 2;
    return positive(a.area);
  }

  function surfaceFormulaText() {
    const a = state.answers;
    if (state.family === "paint" && a.zone === "deck") return "Formule : longueur × largeur × 0,75";
    if (state.family === "paint" && a.zone === "topsides") return "Formule : (longueur + largeur) × franc-bord × 2";
    const factors = { "sail-race": "0,50", "sail-fin": "0,75", "sail-long": "1,00", motor: "0,85" };
    return `Formule : longueur à la flottaison × (largeur + tirant d’eau) × ${factors[a.hullType] || "0,75"}`;
  }

  function positive(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : 0;
  }

  function calculateResinNeed(product) {
    const a = state.answers;
    const margin = 1 + Math.max(0, Number(a.margin) || 0) / 100;
    if (["lamination", "repair"].includes(a.resinApp)) {
      return positive(a.area) * positive(a.plies) * positive(a.glassWeight) / 1000 * positive(a.resinRatio) * margin;
    }
    if (a.resinApp === "coating") {
      return positive(a.area) * positive(a.resinCoats) * positive(a.consumption) / 1000 * margin;
    }
    const density = positive(product?.density) || 1.1;
    if (a.resinApp === "casting") {
      const litres = positive(a.lengthCm) * positive(a.widthCm) * (positive(a.thicknessMm) / 10) / 1000;
      return litres * density * margin;
    }
    return positive(a.area) * positive(a.thicknessMm) * density * margin;
  }

  function validateStep(step) {
    const a = state.answers;
    if (step === 1) {
      if (!a.material) return "Sélectionnez le matériau du support.";
      if (state.family === "antifouling" && (!a.hullType || positive(a.speed) > 100)) return "Vérifiez le type de bateau et sa vitesse.";
      if (state.family === "paint" && !a.zone) return "Sélectionnez la zone à peindre.";
      if (state.family === "resin" && !a.resinApp) return "Sélectionnez le type de travail.";
      return "";
    }

    if (state.family === "resin") {
      if (["lamination", "repair"].includes(a.resinApp) && (!positive(a.area) || !positive(a.plies) || !positive(a.glassWeight) || !positive(a.resinRatio))) return "Renseignez la surface, les plis, le grammage et le ratio de résine.";
      if (a.resinApp === "coating" && (!positive(a.area) || !positive(a.resinCoats) || !positive(a.consumption))) return "Renseignez la surface, le nombre de couches et la consommation.";
      if (a.resinApp === "casting" && (!positive(a.lengthCm) || !positive(a.widthCm) || !positive(a.thicknessMm))) return "Renseignez les trois dimensions de la coulée.";
      if (a.resinApp === "gelcoat" && (!positive(a.area) || !positive(a.thicknessMm))) return "Renseignez la surface et l’épaisseur de la réparation.";
      return "";
    }

    if (calculateSurface() <= 0) return "La surface calculée est nulle. Vérifiez les dimensions saisies.";
    return "";
  }

  function rankedProducts() {
    const a = state.answers;
    return catalogue
      .filter((product) => product.family === state.family)
      .map((product) => {
        let score = 0;
        if (!product.supports?.includes(a.material)) return null;
        score += 5;
        if (state.family === "antifouling") {
          if (positive(a.speed) > positive(product.maxSpeed)) return null;
          if (positive(a.speed) > 25 && product.matrix === "hard") score += 5;
          if (positive(a.speed) <= 25 && product.matrix === "erodable") score += 3;
          if (positive(a.speed) <= 25 && product.matrix === "semi-hard") score += 2;
          if (a.material === "aluminium" && product.supports.includes("aluminium")) score += 10;
        }
        if (state.family === "paint") {
          if (!product.zones?.includes(a.zone)) return null;
          score += 7;
          if (product.systems?.includes(a.system)) score += 4;
          if (product.finishes?.includes(a.finish)) score += 3;
          if (a.zone === "deck" && product.finishes?.includes("non-slip")) score += 4;
        }
        if (state.family === "resin") {
          if (!product.applications?.includes(a.resinApp)) return null;
          score += 7;
          if (a.resinApp === "casting" && product.name.toLowerCase().includes("inclusion")) score += 4;
          if (a.resinApp === "gelcoat" && product.name.toLowerCase().includes("gelcoat")) score += 6;
        }
        return { product, score };
      })
      .filter(Boolean)
      .sort((first, second) => second.score - first.score || first.product.name.localeCompare(second.product.name, "fr"))
      .map((item) => item.product);
  }

  function quantityFor(product) {
    if (state.family === "resin") return calculateResinNeed(product);
    const surface = calculateSurface();
    const coverage = positive(product.coverage);
    const coats = positive(product.coats);
    const margin = 1 + Math.max(0, Number(state.answers.margin) || 0) / 100;
    return coverage ? surface * coats / coverage * margin : 0;
  }

  function optimizePacks(required, packs, prices = null) {
    const sizes = [...new Set((packs || []).map(Number).filter((size) => size > 0))].sort((a, b) => b - a);
    if (!sizes.length || required <= 0) return { items: [], total: 0, excess: 0 };
    let best = null;
    const priceKnown = prices && sizes.every((size) => Number.isFinite(Number(prices[String(size)] ?? prices[size])));

    function consider(counts, total, count) {
      const excess = total - required;
      const price = priceKnown
        ? sizes.reduce((sum, size, index) => sum + Number(prices[String(size)] ?? prices[size]) * counts[index], 0)
        : null;
      // Sans tarif, une pénalité par pot évite de proposer dix petits pots
      // pour économiser seulement quelques décilitres.
      const metric = priceKnown ? price : excess + count * required * 0.1;
      const candidate = { counts: [...counts], total, count, excess, price, metric };
      if (!best || candidate.metric < best.metric - 1e-9 ||
        (Math.abs(candidate.metric - best.metric) < 1e-9 && candidate.excess < best.excess - 1e-9) ||
        (Math.abs(candidate.metric - best.metric) < 1e-9 && Math.abs(candidate.excess - best.excess) < 1e-9 && candidate.count < best.count)) {
        best = candidate;
      }
    }

    function walk(index, counts, total, count) {
      if (total + 1e-9 >= required) {
        consider(counts, total, count);
        return;
      }
      const size = sizes[index];
      if (index === sizes.length - 1) {
        const n = Math.ceil((required - total) / size - 1e-9);
        counts[index] = n;
        consider(counts, total + n * size, count + n);
        counts[index] = 0;
        return;
      }
      const usefulMax = Math.ceil((required - total) / size);
      for (let n = 0; n <= usefulMax; n += 1) {
        counts[index] = n;
        walk(index + 1, counts, total + n * size, count + n);
      }
      counts[index] = 0;
    }

    walk(0, new Array(sizes.length).fill(0), 0, 0);
    if (!best) {
      const smallest = sizes[sizes.length - 1];
      const count = Math.ceil(required / smallest);
      best = { counts: sizes.map((size) => size === smallest ? count : 0), total: count * smallest, count, excess: count * smallest - required };
    }
    return {
      items: sizes.map((size, index) => ({ size, count: best.counts[index] })).filter((item) => item.count > 0),
      total: best.total,
      excess: Math.max(0, best.excess)
    };
  }

  function calculatePrice(product, packPlan) {
    if (!product.price || typeof product.price !== "object") return null;
    let total = 0;
    for (const item of packPlan.items) {
      const price = product.price[String(item.size)] ?? product.price[item.size];
      if (!Number.isFinite(Number(price))) return null;
      total += Number(price) * item.count;
    }
    return total;
  }

  function recommendationReasons(product) {
    const a = state.answers;
    if (state.family === "antifouling") {
      const reasons = [
        `Compatible avec un support ${labels[a.material].toLowerCase()}`,
        `${labels[product.matrix] || "Formulation adaptée"} pour ce profil de navigation`,
        `${formatNumber(product.coverage, 1)} m²/L de rendement pratique indicatif`
      ];
      if (a.material === "aluminium") reasons.unshift("Formule sélectionnée pour sa compatibilité aluminium déclarée");
      if (positive(a.speed) > 25) reasons.push(`Compatible avec une vitesse annoncée de ${formatNumber(a.speed, 0)} nœuds`);
      return reasons;
    }
    if (state.family === "paint") {
      return [
        `Conçu pour la zone « ${labels[a.zone]} »`,
        `Compatible avec un support ${labels[a.material].toLowerCase()}`,
        product.systems?.includes(a.system) ? `Système ${labels[a.system].toLowerCase()}` : "Système alternatif selon la fiche technique"
      ];
    }
    return [
      `Adapté au travail de ${labels[a.resinApp].toLowerCase()}`,
      `Compatible avec le support ${labels[a.material].toLowerCase()}`,
      "Quantité calculée avec la marge chantier choisie"
    ];
  }

  function productSpecs(product) {
    if (state.family === "antifouling") {
      return [
        ["Matrice", labels[product.matrix] || "—"],
        ["Rendement", `${formatNumber(product.coverage, 1)} m²/L`],
        ["Couches", product.coats],
        ["Diluant", product.thinner || "—"]
      ];
    }
    if (state.family === "paint") {
      return [
        ["Système", labels[product.systems?.[0]] || "—"],
        ["Rendement", `${formatNumber(product.coverage, 1)} m²/L`],
        ["Couches", product.coats],
        ["Diluant", product.thinner || "—"]
      ];
    }
    return [
      ["Type", labels[product.applications?.[0]] || "Résine"],
      ["Densité", product.density ? `${formatNumber(product.density, 2)} kg/L` : "À confirmer"],
      ["Référence", product.reference || "—"],
      ["Diluant", product.thinner || "—"]
    ];
  }

  function summaryChips() {
    const a = state.answers;
    const chips = [labels[state.family], labels[a.material]];
    if (state.family === "antifouling") chips.push(labels[a.hullType], `${formatNumber(a.speed, 0)} nœuds`, "Eaux tropicales");
    if (state.family === "paint") chips.push(labels[a.zone], labels[a.system], labels[a.finish]);
    if (state.family === "resin") chips.push(labels[a.resinApp]);
    return chips.filter(Boolean).map((chip) => `<span class="summary-chip">${escapeHtml(chip)}</span>`).join("");
  }

  function renderResults() {
    const products = rankedProducts();
    let product = products.find((item) => item.id === state.selectedProduct) || products[0];
    if (product && state.selectedProduct !== product.id) {
      state.selectedProduct = product.id;
      saveState();
    }

    if (!product) return renderNoResult();
    const required = quantityFor(product);
    const packPlan = optimizePacks(required, product.packs, product.price);
    const totalPrice = calculatePrice(product, packPlan);
    const surface = state.family === "resin" ? positive(state.answers.area) : calculateSurface();
    const specs = productSpecs(product);
    const alternatives = products.slice(0, 6);

    return `
      <div class="results-head">
        <header class="step-heading">
          <p class="eyebrow">Étape 3 sur 3</p>
          <h1>Votre solution</h1>
          <p>Estimation de vente à confirmer avec la fiche technique, la compatibilité de l’ancien système et le stock magasin.</p>
        </header>
        ${surface > 0 ? `<div class="surface-pill"><strong>${formatNumber(surface, 1)} m²</strong><span>surface ${state.family === "antifouling" ? "immergée" : "traitée"}</span></div>` : ""}
      </div>

      <div class="summary-line" aria-label="Résumé du besoin">${summaryChips()}</div>

      <div class="result-layout">
        <article class="recommendation-card">
          <div class="recommendation-top">
            <div class="can-visual" style="--product-color:${escapeHtml(product.color)}"><span>${escapeHtml(product.name)}</span></div>
            <div>
              <p class="product-kicker">Recommandation principale · <span class="brand-name">${escapeHtml(product.brand)}</span></p>
              <h2>${escapeHtml(product.name)}</h2>
              <p>${escapeHtml(product.description)}</p>
            </div>
          </div>
          <div class="spec-grid">
            ${specs.map(([title, value]) => `<div class="spec"><span>${escapeHtml(title)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}
          </div>
          <ul class="reason-list">
            ${recommendationReasons(product).map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}
          </ul>
        </article>

        <aside class="quantity-card">
          <h2>Quantité à prévoir</h2>
          <p>Besoin calculé avec ${formatNumber(state.answers.margin, 0)} % de marge chantier.</p>
          <div class="quantity-total"><strong>${formatNumber(required, required < 10 ? 2 : 1)}</strong><span>${escapeHtml(product.unit)}</span></div>
          <ul class="pot-list">
            ${packPlan.items.map((item) => `<li><strong>${item.count} × ${formatNumber(item.size, item.size % 1 ? 2 : 0)} ${escapeHtml(product.unit)}</strong><span>${formatNumber(item.count * item.size, 2)} ${escapeHtml(product.unit)}</span></li>`).join("") || `<li><span>Conditionnements à renseigner</span></li>`}
          </ul>
          <div class="waste-row"><span>Total acheté</span><strong>${formatNumber(packPlan.total, 2)} ${escapeHtml(product.unit)}</strong></div>
          <div class="waste-row"><span>Reste estimé</span><strong>${formatNumber(packPlan.excess, 2)} ${escapeHtml(product.unit)}</strong></div>
          <div class="price-box"><span>Budget produit</span><strong>${totalPrice === null ? "Prix à renseigner" : formatPrice(totalPrice)}</strong></div>
        </aside>

        <div class="warning-strip" style="grid-column:1/-1">
          <span class="warning-icon">⚠</span>
          <div><strong>Données de démonstration</strong>Cette recommandation utilise des références indicatives. Avant la vente, vérifier la fiche technique, le support existant, les conditionnements, le prix et la disponibilité. Toujours lire l’étiquette et la fiche de données de sécurité.</div>
        </div>

        <section class="alternative-section">
          <h2>Équivalents compatibles</h2>
          <p>Touchez une carte pour comparer la quantité et les conditionnements.</p>
          <div class="alternatives-grid">
            ${alternatives.length > 1 ? alternatives.map((item) => `
              <button class="alternative-card ${item.id === product.id ? "is-current" : ""}" type="button" data-action="select-product" data-product="${escapeHtml(item.id)}">
                <span class="alt-brand">${escapeHtml(item.brand)}</span>
                <strong>${escapeHtml(item.name)}</strong>
                <small>${escapeHtml(item.description)}</small>
              </button>`).join("") : `<div class="empty-card">Les équivalents d’autres marques apparaîtront ici après intégration du catalogue Marine Corail.</div>`}
          </div>
        </section>
      </div>

      <footer class="wizard-footer">
        <button class="nav-button secondary" type="button" data-action="back">${arrowIcon("left")} Modifier les mesures</button>
        <div class="footer-right">
          <button class="nav-button ghost" type="button" data-action="home">Nouveau projet</button>
          <button class="nav-button coral" type="button" data-action="print">Imprimer le conseil</button>
        </div>
      </footer>`;
  }

  function renderNoResult() {
    return `
      <header class="step-heading">
        <p class="eyebrow">Étape 3 sur 3</p>
        <h1>Aucun produit compatible</h1>
        <p>Le catalogue de démonstration ne contient pas encore de référence répondant à tous les critères. Un conseiller doit vérifier le chantier.</p>
      </header>
      <div class="empty-card"><strong>Ne proposez pas un produit par défaut.</strong><br>Ajoutez les fiches techniques Marine Corail ou modifiez les critères du projet.</div>
      <footer class="wizard-footer">
        <button class="nav-button secondary" type="button" data-action="back">${arrowIcon("left")} Modifier les mesures</button>
        <button class="nav-button coral" type="button" data-action="home">Nouveau projet</button>
      </footer>`;
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  function render() {
    if (state.view === "home" || !state.family) renderHome();
    else renderWizard();
  }

  function resetState(goHome = true) {
    const next = clone(defaults);
    if (!goHome && state.family) {
      next.view = "wizard";
      next.family = state.family;
    }
    state = next;
    saveState();
    render();
  }

  app.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;

    if (action === "start") {
      state.view = "wizard";
      state.family = button.dataset.family;
      state.step = 1;
      state.selectedProduct = null;
      state.error = "";
      state.answers = clone(defaults.answers);
      if (state.family === "resin") state.answers.areaMode = "direct";
      saveState();
      render();
      app.focus({ preventScroll: true });
      return;
    }

    if (action === "choose") {
      const field = button.dataset.field;
      state.answers[field] = button.dataset.value;
      state.error = "";
      state.selectedProduct = null;
      if (field === "zone") {
        if (button.dataset.value === "deck") state.answers.finish = "non-slip";
        if (button.dataset.value === "primer") state.answers.finish = "primer";
      }
      if (field === "hullType" && button.dataset.value === "catamaran") state.answers.areaMode = "direct";
      saveState();
      render();
      return;
    }

    if (action === "next") {
      state.error = validateStep(1);
      if (!state.error) state.step = 2;
      saveState();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (action === "results") {
      state.error = validateStep(2);
      if (!state.error) state.step = 3;
      saveState();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (action === "back") {
      if (state.step > 1) state.step -= 1;
      else state.view = "home";
      state.error = "";
      saveState();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (action === "home") {
      state.view = "home";
      state.step = 1;
      state.error = "";
      saveState();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (action === "select-product") {
      state.selectedProduct = button.dataset.product;
      saveState();
      render();
      showToast("Recommandation et quantité mises à jour.");
      return;
    }

    if (action === "print") {
      window.print();
      return;
    }

    if (action === "fullscreen") {
      try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
      } catch (_) {
        showToast("Le plein écran n’est pas disponible dans ce navigateur.");
      }
      return;
    }

    if (action === "reset") {
      if (state.view === "home" || window.confirm("Effacer les réponses et recommencer ?")) {
        resetState(true);
        showToast("Le projet a été réinitialisé.");
      }
    }
  });

  app.addEventListener("input", (event) => {
    const input = event.target.closest("[data-input]");
    if (!input) return;
    state.answers[input.dataset.input] = input.value;
    state.error = "";
    state.selectedProduct = null;
    saveState();
    const preview = app.querySelector(".formula-card strong");
    if (preview && state.step === 2) {
      preview.textContent = state.family === "resin"
        ? `Besoin matière estimé : ${formatNumber(calculateResinNeed(null), 2)} kg`
        : `Surface estimée : ${formatNumber(calculateSurface(), 1)} m²`;
    }
  });

  document.querySelector(".topbar").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "home") {
      state.view = "home";
      state.step = 1;
      state.error = "";
      saveState();
      render();
    }
    if (action === "fullscreen") {
      try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
      } catch (_) {
        showToast("Le plein écran n’est pas disponible dans ce navigateur.");
      }
    }
    if (action === "reset") {
      if (state.view === "home" || window.confirm("Effacer les réponses et recommencer ?")) {
        resetState(true);
        showToast("Le projet a été réinitialisé.");
      }
    }
  });

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }

  render();
})();
