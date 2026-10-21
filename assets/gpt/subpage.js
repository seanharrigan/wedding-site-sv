// Shared chrome for the site's own pages (Gallery, Translate, RSVP): the home page's own menu bar
// (styles generated into site-header.css), with Home in place of the section links (they're in
// the phone menu), and a quiet transition between pages. Each page marks itself with <body data-page="photos|translate|rsvp">.
(() => {
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };
  const html = document.documentElement;
  const body = document.body;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Browsers with cross-document view transitions keep the bar still and cross-fade the page
  // (see subpage.css); others get the soft paper fade.
  const nativeFade = "CSSViewTransitionRule" in window;
  const q = new URLSearchParams(location.search);
  const LANG = ["en", "es"].includes(q.get("lang")) ? q.get("lang") : store.get("wedding-language", "en") === "es" ? "es" : "en";
  const here = body.dataset.page;
  const T = {
    en: {
      home: "Home", welcome: "Welcome", details: "Details", travel: "Travel", faq: "FAQ", checkIn: "Check-In",
      translate: "Translate", photos: "Gallery", rsvp: "RSVP", nav: "Primary navigation", lang: "Choose website language",
      brand: "Sean and Valeria, back to the website", open: "Open navigation", close: "Close navigation",
    },
    es: {
      home: "Inicio", welcome: "Bienvenidos", details: "Detalles", travel: "Viaje", faq: "FAQ", checkIn: "Registro",
      translate: "Traducir", photos: "Galería", rsvp: "RSVP", nav: "Navegación principal", lang: "Elige el idioma del sitio",
      brand: "Sean y Valeria, volver al sitio", open: "Abrir menú", close: "Cerrar menú",
    },
  }[LANG];

  // ── the home page's header, with Home in place of the section links ──
  const LOGO = "../assets/gpt/sv-logo-variants/solid/";
  const section = (id, label, extra = "") => `<a class="nav-link nav-section${extra}" href="../#${id}" data-sp-go>${label}</a>`;
  const ICON_TRANSLATE = '<svg class="nav-translate-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5.6c0-1 .8-1.8 1.8-1.8h7.4c1 0 1.8.8 1.8 1.8v4.6c0 1-.8 1.8-1.8 1.8H8.4l-3 2.4V12h-.1c-1 0-1.8-.8-1.8-1.8z"/><path d="M14.5 8.4h4.2c1 0 1.8.8 1.8 1.8v4.6c0 1-.8 1.8-1.8 1.8h-.1v2.4l-3-2.4h-4.3c-1 0-1.8-.8-1.8-1.8V14"/><path d="M6.6 7.9h4.8M13.4 12.6h4.2" opacity=".55"/></svg>';
  const ICON_CAMERA = '<svg class="nav-translate-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.8 8.6c0-1 .8-1.8 1.8-1.8h2.2l1.5-2.2h5.4l1.5 2.2h2.2c1 0 1.8.8 1.8 1.8v8.6c0 1-.8 1.8-1.8 1.8H5.6c-1 0-1.8-.8-1.8-1.8z"/><circle cx="12" cy="12.6" r="3.4"/></svg>';
  const ICON_RSVP = '<svg class="nav-translate-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.8 7.8c0-1 .8-1.8 1.8-1.8h12.8c1 0 1.8.8 1.8 1.8v8.8c0 1-.8 1.8-1.8 1.8H5.6c-1 0-1.8-.8-1.8-1.8z"/><path d="M4.3 7l6.4 5M19.7 7l-6.4 5"/><circle cx="12" cy="12.9" r="1.9"/></svg>';
  const ICON_LEAF = '<svg class="nav-language-icon nav-language-icon--leaf" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.35l1.28 3.02 1.87-1.08-.42 2.96 2.9-.78-1.08 2.82 3.62.88-3.12 2.3 1.03 2.66-4.98-.93.35 6.45h-2.9l.35-6.45-4.98.93 1.03-2.66-3.12-2.3 3.62-.88-1.08-2.82 2.9.78-.42-2.96 1.87 1.08z"/></svg>';
  const ICON_CACTUS = '<svg class="nav-language-icon nav-language-icon--cactus" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.6 21V6.2a2.4 2.4 0 0 1 4.8 0V21"/><path d="M9.6 13.5H7.9a2 2 0 0 1-2-2V8.8"/><path d="M14.4 15.5h1.7a2 2 0 0 0 2-2V9.6"/><path d="M6.5 21h11"/></svg>';
  const pageButton = (page, id, icon, label) =>
    `<button class="invitation-replay nav-translate nav-${page}" id="${id}" type="button" data-sp-page="${page}"${page === here ? ' aria-current="page"' : ""}>` +
    `<span class="nav-pill">${icon}<span class="nav-translate-label">${label}</span></span></button>`;
  const langButton = (code, icon, short, long) =>
    `<button class="nav-language-option nav-language-option--${code}${code === LANG ? " is-current" : ""}" type="button" data-nav-language="${code}" aria-label="${long}"${code === LANG ? ' aria-current="true"' : ""}>` +
    `${icon}<span class="nav-language-label nav-language-label--short">${short}</span><span class="nav-language-label nav-language-label--long">${long}</span></button>`;

  const header = document.createElement("header");
  header.className = "site-header";
  header.id = "site-header";
  header.dataset.tone = "light";
  header.innerHTML =
    `<a class="brand" href="../" data-sp-go data-sp-home aria-label="${T.brand}">` +
    `<img class="brand-logo brand-logo--dark" src="${LOGO}sv-logo-mocha-true-solid.png" alt="" width="1536" height="1024" decoding="sync" draggable="false">` +
    `<img class="brand-logo brand-logo--light" src="${LOGO}sv-logo-cream-solid.png" alt="" width="1536" height="1024" decoding="sync" draggable="false"></a>` +
    `<div class="mobile-nav-controls"><span class="mobile-current" id="mobile-current" aria-live="polite">${T[here]}</span>` +
    `<button class="menu-toggle" id="menu-toggle" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="${T.open}"><span></span><span></span></button></div>` +
    `<nav class="nav-links" id="nav-links" aria-label="${T.nav}">` +
    `<a class="nav-link nav-home" href="../" data-sp-go data-sp-home>${T.home}</a>` +
    section("welcome", T.welcome) + section("details", T.details) + section("travel", T.travel) + section("faq", T.faq) + section("check-in", T.checkIn, " nav-cta") +
    pageButton("translate", "nav-translate", ICON_TRANSLATE, T.translate) +
    pageButton("photos", "nav-photos", ICON_CAMERA, T.photos) +
    pageButton("rsvp", "nav-rsvp", ICON_RSVP, T.rsvp) +
    `<div class="nav-language" id="nav-language" role="group" aria-label="${T.lang}">` +
    langButton("en", ICON_LEAF, "EN", "English") + `<span class="nav-language-divider" aria-hidden="true"></span>` + langButton("es", ICON_CACTUS, "ES", "Español") +
    `</div></nav>`;
  body.prepend(header);
  const nav = header.querySelector("#nav-links");
  const menuToggle = header.querySelector("#menu-toggle");
  const cover = document.createElement("div");
  cover.className = "sp-cover";
  cover.setAttribute("aria-hidden", "true");
  body.append(cover);
  html.classList.add("sp-on");

  // ── behaviour, as on the home page (site.js) ──
  const setMenuOpen = (open) => {
    body.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? T.close : T.open);
  };
  menuToggle.addEventListener("click", () => setMenuOpen(!body.classList.contains("menu-open")));
  document.addEventListener("click", (e) => { if (body.classList.contains("menu-open") && !header.contains(e.target)) setMenuOpen(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && body.classList.contains("menu-open")) { setMenuOpen(false); menuToggle.focus(); } });

  let lastScrolled = null, holdUntil = 0;
  const syncScrolled = () => {
    if (performance.now() < holdUntil) return;
    const s = scrollY > 35;
    if (s !== lastScrolled) { lastScrolled = s; header.classList.toggle("scrolled", s); }
  };
  addEventListener("scroll", syncScrolled, { passive: true });
  // Arriving with the bar in its scrolled spot on the last page: start there, settle after the fade.
  try {
    if (sessionStorage.getItem("sv-bar-scrolled") === "1") {
      header.classList.add("scrolled");
      lastScrolled = true;
      holdUntil = performance.now() + 600;
      setTimeout(() => { holdUntil = 0; syncScrolled(); }, 620);
    }
    sessionStorage.removeItem("sv-bar-scrolled");
  } catch {}
  syncScrolled();

  // The underline sits under the current page's button, the way it sits under the home page's
  // current section.
  const syncIndicator = () => {
    const current = nav.querySelector('[aria-current="page"]');
    if (!current || innerWidth <= 720) return;
    nav.style.setProperty("--nav-indicator-left", `${current.offsetLeft}px`);
    nav.style.setProperty("--nav-indicator-width", `${current.offsetWidth}px`);
  };
  let frame = 0;
  const resync = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { syncIndicator(); syncHeaderBottom(); }); };
  // Gallery's sticky filters sit just under the fixed bar.
  const syncHeaderBottom = () => html.style.setProperty("--sp-header-bottom", `${Math.round(header.getBoundingClientRect().bottom + 8)}px`);
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(resync);
    nav.querySelectorAll(":scope > *").forEach((item) => ro.observe(item, { box: "border-box" }));
    ro.observe(header);
  }
  header.addEventListener("transitionend", resync);
  addEventListener("resize", resync);
  resync();

  // A broadcast on Translate turns the page dark; the bar follows, as over the home page's photos.
  const syncTone = () => {
    const dark = body.classList.contains("broadcasting");
    header.classList.toggle("header-on-dark", dark);
    header.dataset.tone = dark ? "dark" : "light";
  };
  new MutationObserver(syncTone).observe(body, { attributes: true, attributeFilter: ["class"] });
  syncTone();

  // ── moving between pages ──
  // The site keeps its place when you come back, so Home steps back if that's where we came from.
  const fromSite = (() => {
    try { const r = new URL(document.referrer); return r.origin === location.origin && /^\/(index\.html)?$/.test(r.pathname); } catch { return false; }
  })();
  function go(href, { back = false } = {}) {
    setMenuOpen(false);
    try { sessionStorage.setItem("sv-bar-scrolled", header.classList.contains("scrolled") ? "1" : "0"); } catch {}
    if (nativeFade) return back ? history.back() : (location.href = href);
    html.classList.add("sp-leaving");
    try { sessionStorage.setItem("sv-sp", "1"); } catch {}
    setTimeout(() => (back ? history.back() : (location.href = href)), reduced ? 0 : 280);
  }
  window.svGo = go;

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-sp-go], a.back");
    if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    const home = link.hasAttribute("data-sp-home") || link.classList.contains("back");
    if (home && fromSite && history.length > 1) go(null, { back: true });
    else go(home ? "../" : link.getAttribute("href"));
  });
  header.querySelectorAll("[data-sp-page]").forEach((b) => b.addEventListener("click", () => {
    const page = b.dataset.spPage;
    if (page === here) return setMenuOpen(false);
    go(`../${{ photos: "gallery", translate: "translate", rsvp: "rsvp" }[page]}/?lang=${LANG}`);
  }));
  header.querySelectorAll("[data-nav-language]").forEach((b) => b.addEventListener("click", () => {
    const lang = b.dataset.navLanguage;
    if (lang === LANG) return;
    store.set("wedding-language", lang);
    const next = new URLSearchParams(location.search);
    next.set("lang", lang);
    go(location.pathname + "?" + next.toString());
  }));

  // A skipped cross-fade (say, a click while the page is still loading) just means no fade; don't
  // let it surface as an error.
  for (const type of ['pageswap', 'pagereveal']) addEventListener(type, (event) => {
    const transition = event.viewTransition;
    if (transition) for (const step of ['ready', 'finished', 'updateCallbackDone']) transition[step]?.catch(() => {});
  });
  // Arriving: with the native cross-fade there's nothing more to do; otherwise rise out of the paper.
  try { sessionStorage.removeItem("sv-sp"); } catch {}
  if (!nativeFade) {
    html.classList.add("sp-arrive");
    setTimeout(() => html.classList.remove("sp-arrive"), 900);
  }
  addEventListener("pageshow", (e) => { if (e.persisted) html.classList.remove("sp-leaving"); });
})();
