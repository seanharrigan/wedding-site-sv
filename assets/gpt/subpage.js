// Shared chrome for the site's own pages (Photos, Translate), so they feel like part of
// seanandvaleria.com: a small floating bar (monogram home, Home · Photos · Translate, EN/ES)
// and a soft paper fade between pages. Each page marks itself with <body data-page="…">.
(() => {
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };
  const html = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const q = new URLSearchParams(location.search);
  const LANG = ["en", "es"].includes(q.get("lang")) ? q.get("lang") : store.get("wedding-language", "en") === "es" ? "es" : "en";
  const here = document.body.dataset.page;
  const T = {
    en: { home: "Home", photos: "Photos", translate: "Translate", nav: "Site navigation", lang: "Language", homeAria: "Sean and Valeria, back to the website" },
    es: { home: "Inicio", photos: "Fotos", translate: "Traducir", nav: "Navegación del sitio", lang: "Idioma", homeAria: "Sean y Valeria, volver al sitio" },
  }[LANG];

  // The site keeps its place when you come back, so "home" steps back if that's where we came from.
  const fromSite = (() => {
    try { const r = new URL(document.referrer); return r.origin === location.origin && /^\/(index\.html)?$/.test(r.pathname); } catch { return false; }
  })();

  const a = (href, text, page, extra = "") =>
    `<a href="${href}" data-sp-go${page === here ? ' aria-current="page"' : ""}${extra}>${text}</a>`;
  const bar = document.createElement("nav");
  bar.className = "sp-bar";
  bar.setAttribute("aria-label", T.nav);
  bar.innerHTML =
    `<a class="sp-home" href="../" data-sp-go data-sp-home aria-label="${T.homeAria}">` +
    `<img data-logo src="../assets/gpt/sv-logo-variants/solid/sv-logo-mocha-true-solid.png" alt="" width="1536" height="1024"></a>` +
    `<div class="sp-links">` +
    a("../", T.home, "home", ' class="sp-to-home" data-sp-home') +
    a(`../gallery/?lang=${LANG}`, T.photos, "photos") +
    a(`../translate/?lang=${LANG}`, T.translate, "translate") +
    `</div>` +
    `<div class="sp-lang" role="group" aria-label="${T.lang}">` +
    `<button type="button" data-sp-lang="en" aria-pressed="${LANG === "en"}" lang="en">EN</button><span class="sep" aria-hidden="true"></span>` +
    `<button type="button" data-sp-lang="es" aria-pressed="${LANG === "es"}" lang="es">ES</button></div>`;
  document.body.prepend(bar);
  const cover = document.createElement("div");
  cover.className = "sp-cover";
  cover.setAttribute("aria-hidden", "true");
  document.body.append(cover);
  html.classList.add("sp-on");

  // Leaving: dissolve into paper, then go. The next page (or the site) rises out of it.
  function go(href, { back = false } = {}) {
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
  bar.querySelectorAll("[data-sp-lang]").forEach((b) => b.addEventListener("click", () => {
    const lang = b.dataset.spLang;
    if (lang === LANG) return;
    store.set("wedding-language", lang);
    const next = new URLSearchParams(location.search);
    next.set("lang", lang);
    go(location.pathname + "?" + next.toString());
  }));

  // Arriving: fade up. Coming back through the browser's history: clear the paper.
  try { sessionStorage.removeItem("sv-sp"); } catch {}
  html.classList.add("sp-arrive");
  setTimeout(() => html.classList.remove("sp-arrive"), 900);
  addEventListener("pageshow", (e) => { if (e.persisted) html.classList.remove("sp-leaving"); });
})();
