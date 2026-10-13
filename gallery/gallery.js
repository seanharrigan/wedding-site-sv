// Guest photo gallery for seanandvaleria.com/gallery/.
// Photos live in the sv-gallery Worker (Cloudflare R2 + D1). This page makes the display and
// thumbnail sizes on the phone, reads each photo's time from EXIF, and places it on the
// wedding week's timeline. Anyone with the invitation password can upload and tag.
(() => {
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  // Set after the Worker is deployed (npm run deploy in ../sv-gallery prints the address).
  const API_PROD = "https://sv-gallery.valeriaandseanharrigan.workers.dev";
  const API = local ? `http://${location.hostname}:8933` : API_PROD;
  const MAX_BYTES = 40 * 1024 * 1024;
  const DISPLAY_EDGE = 2048, THUMB_EDGE = 640;
  const CONCURRENCY = 2;
  const POLL_MS = 45000;

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
  };
  const q = new URLSearchParams(location.search);
  const LANG = ["en", "es"].includes(q.get("lang")) ? q.get("lang") : store.get("wedding-language", "en") === "es" ? "es" : "en";
  const ADMIN_CODE = store.get("wedding-admin-v1", "");
  // Anyone already into the site can use the gallery; no second password. This is the same
  // fingerprint the site's own gate checks (accessHash in assets/gpt/site.js).
  const SITE_KEY = "ecaf6dd0ad0c57473723257f3733a39aa525d0e226da7dcdd46c710ccbece8dc";

  // A random id for this phone, so it can delete or fix what it uploaded.
  let DEVICE = store.get("wedding-gallery-device", "");
  if (!DEVICE) {
    DEVICE = crypto.randomUUID ? crypto.randomUUID() : [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, "0")).join("");
    store.set("wedding-gallery-device", DEVICE);
  }

  const T = {
    en: {
      back: "← seanandvaleria.com", eyebrow: "Photos", title: "Our wedding, through your eyes",
      lede: "Share your photos from the trip and the day. Tag who’s in them, and find every photo of you.",
      add: "Add photos", closed: "Uploads are closed. Thank you for sharing!", you: "You", pickName: "Who are you?",
      all: "All", ofMe: "Photos of me", people: "People", uploadedBy: "Shared by", photographer: "Photographer", guests: "Guests",
      photos: (n) => `${n} ${n === 1 ? "photo" : "photos"}`,
      soon: "The photo gallery opens soon.",
      empty: "No photos here yet.", emptyAll: "No photos yet. Be the first to share one from the trip!",
      clearFilters: "Show all photos",
      whoQ: "Who are you?", whoHint: "So your photos are credited to you, and you can find the ones you’re in.",
      search: "Search names", notListed: (s) => s ? `Add “${s}”` : "Not on the list? Type your name", skip: "Not now",
      peopleQ: "Show photos of…", peopleHint: "Pick more than one to find photos of them together.", done: "Done", clear: "Clear",
      byQ: "Shared by", tagQ: "Who’s in this photo?", tagHint: "Tap a name to tag them.",
      inPhoto: "In this photo", tagSomeone: "+ Tag someone", nobody: "No one tagged yet.",
      sharedBy: (n) => `Shared by ${n}`, byPhotographer: "From the photographer", someone: "a guest",
      approx: "time approximate", unknownTime: "Date unknown", camera: "Camera",
      download: "Download original", fixTime: "Fix the time", del: "Delete", delQ: "Delete this photo for everyone?",
      timeQ: "When was this taken?", timeHint: "Mexico City time.", save: "Save", cancel: "Cancel", enter: "Continue",
      preparing: "Getting ready…", uploading: (d, n) => `Sharing ${d} of ${n}`, uploaded: (n) => `${n} ${n === 1 ? "photo" : "photos"} shared`,
      tagThem: "Tap one to tag who’s in it.", failed: (n) => `${n} couldn’t be shared`, retry: "Try again",
      already: "already here", unreadable: "This phone can’t read that file", tooBig: "Too big (40 MB max)", offline: "Waiting for a connection…",
      leaveWarn: "Photos are still uploading.", newPhotos: (n) => `${n} new ${n === 1 ? "photo" : "photos"} · Show`,
      saved: "Saved", deleted: "Deleted", error: "Something went wrong. Please try again.", closedNow: "Uploads are closed",
      adminTitle: "Admin", uploadsOpen: "Uploads open", uploadsClosed: "Uploads closed", openUploads: "Open uploads", closeUploads: "Close uploads",
      exportList: "Download list of originals", undated: "Date unknown",
      titleHtml: "Our wedding, <em>through your eyes</em>",
      opensKicker: "Coming soon", opensText: (d) => `Uploads open ${d}`, opensSub: "Until then, enjoy the photos already here.",
      closedKicker: "Thank you", closedText: "Uploads are closed", closedSub: "Thank you for sharing every moment with us.",
      firstSoon: "The first photos will appear here soon.",
      dropHere: "Drop your photos here", whoIn: "Who’s in these?", whoInStep: (i, n) => `Photo ${i} of ${n} · tap everyone in it`,
      next: "Next", finish: "Finish", tagNow: "Tag who’s in them",
      modeAuto: "Automatic", modeOpen: "Open now", modeClosed: "Closed",
      modeHint: { auto: (d) => `Guests can upload from ${d}. You can always upload.`, open: "Guests can upload now.", closed: "Guests can’t upload. You still can." },
      guestUploads: "Guest uploads",
    },
    es: {
      back: "← seanandvaleria.com", eyebrow: "Fotos", title: "Nuestra boda, a través de sus ojos",
      lede: "Compartan sus fotos del viaje y del día. Etiqueten a quien aparece y encuentren todas sus fotos.",
      add: "Subir fotos", closed: "Ya no se pueden subir fotos. ¡Gracias por compartir!", you: "Tú", pickName: "¿Quién eres?",
      all: "Todas", ofMe: "Fotos mías", people: "Personas", uploadedBy: "Compartidas por", photographer: "Fotógrafo", guests: "Invitados",
      photos: (n) => `${n} ${n === 1 ? "foto" : "fotos"}`,
      soon: "La galería de fotos abrirá pronto.",
      empty: "Todavía no hay fotos aquí.", emptyAll: "Todavía no hay fotos. ¡Sé el primero en compartir una del viaje!",
      clearFilters: "Ver todas las fotos",
      whoQ: "¿Quién eres?", whoHint: "Así tus fotos llevan tu nombre y puedes encontrar las fotos en las que sales.",
      search: "Buscar nombres", notListed: (s) => s ? `Agregar “${s}”` : "¿No estás en la lista? Escribe tu nombre", skip: "Ahora no",
      peopleQ: "Ver fotos de…", peopleHint: "Elige a más de una persona para ver fotos donde salen juntas.", done: "Listo", clear: "Borrar",
      byQ: "Compartidas por", tagQ: "¿Quién sale en esta foto?", tagHint: "Toca un nombre para etiquetar.",
      inPhoto: "En esta foto", tagSomeone: "+ Etiquetar", nobody: "Nadie etiquetado todavía.",
      sharedBy: (n) => `Compartida por ${n}`, byPhotographer: "Del fotógrafo", someone: "un invitado",
      approx: "hora aproximada", unknownTime: "Fecha desconocida", camera: "Cámara",
      download: "Descargar original", fixTime: "Corregir la hora", del: "Borrar", delQ: "¿Borrar esta foto para todos?",
      timeQ: "¿Cuándo se tomó?", timeHint: "Hora de la Ciudad de México.", save: "Guardar", cancel: "Cancelar", enter: "Continuar",
      preparing: "Preparando…", uploading: (d, n) => `Compartiendo ${d} de ${n}`, uploaded: (n) => `${n} ${n === 1 ? "foto compartida" : "fotos compartidas"}`,
      tagThem: "Toca una para etiquetar a quien sale.", failed: (n) => `${n} no se pudieron compartir`, retry: "Reintentar",
      already: "ya estaba", unreadable: "Este teléfono no puede leer ese archivo", tooBig: "Muy grande (máx. 40 MB)", offline: "Esperando conexión…",
      leaveWarn: "Todavía se están subiendo fotos.", newPhotos: (n) => `${n} ${n === 1 ? "foto nueva" : "fotos nuevas"} · Ver`,
      saved: "Guardado", deleted: "Borrada", error: "Algo salió mal. Inténtalo de nuevo.", closedNow: "Ya no se pueden subir fotos",
      adminTitle: "Admin", uploadsOpen: "Subidas abiertas", uploadsClosed: "Subidas cerradas", openUploads: "Abrir subidas", closeUploads: "Cerrar subidas",
      exportList: "Descargar lista de originales", undated: "Fecha desconocida",
      titleHtml: "Nuestra boda, <em>a través de sus ojos</em>",
      opensKicker: "Muy pronto", opensText: (d) => `Podrán subir fotos desde el ${d}`, opensSub: "Mientras tanto, disfruten las fotos que ya están aquí.",
      closedKicker: "Gracias", closedText: "Ya no se pueden subir fotos", closedSub: "Gracias por compartir cada momento con nosotros.",
      firstSoon: "Las primeras fotos aparecerán aquí muy pronto.",
      dropHere: "Suelta tus fotos aquí", whoIn: "¿Quién sale en estas?", whoInStep: (i, n) => `Foto ${i} de ${n} · toca a todos los que salen`,
      next: "Siguiente", finish: "Terminar", tagNow: "Etiquetar quién sale",
      modeAuto: "Automático", modeOpen: "Abiertas", modeClosed: "Cerradas",
      modeHint: { auto: (d) => `Los invitados podrán subir fotos desde el ${d}. Ustedes siempre pueden.`, open: "Los invitados ya pueden subir fotos.", closed: "Los invitados no pueden subir fotos. Ustedes sí." },
      guestUploads: "Fotos de invitados",
    },
  }[LANG];

  // The wedding week, in Mexico City time. Each segment runs from its start to the next one's.
  // Days follow the site's week itinerary; the wedding day follows its timeline.
  const L = (en, es) => (LANG === "es" ? es : en);
  const WEDDING_DAY = { en: "Tuesday 3 November", es: "Martes 3 de noviembre" };
  const SEGMENTS = [
    { key: "before", start: "0000", day: "before", title: L("Before the trip", "Antes del viaje"), rail: L("Before", "Antes") },
    { key: "oct31", start: "2026-10-31T00:00", day: "oct31", title: L("Arrive in Mexico City", "Llegada a la Ciudad de México"), date: L("Saturday 31 October", "Sábado 31 de octubre"), rail: L("Sat 31", "Sáb 31") },
    { key: "nov1", start: "2026-11-01T00:00", day: "nov1", title: L("Day of the Dead", "Día de Muertos"), date: L("Sunday 1 November", "Domingo 1 de noviembre"), rail: L("Sun 1", "Dom 1") },
    { key: "nov2", start: "2026-11-02T00:00", day: "nov2", title: L("Travel to Tepoztlán", "Viaje a Tepoztlán"), date: L("Monday 2 November", "Lunes 2 de noviembre"), rail: L("Mon 2", "Lun 2") },
    { key: "ready", start: "2026-11-03T00:00", day: "wedding", title: L("Getting ready", "Preparativos"), rail: L("Getting ready", "Preparativos") },
    { key: "arrival", start: "2026-11-03T14:00", day: "wedding", title: L("Guest arrival", "Llegada de invitados"), time: "2:00 PM", rail: L("Arrival", "Llegada") },
    { key: "ceremony", start: "2026-11-03T14:40", day: "wedding", title: L("Ceremony", "Ceremonia"), time: "2:45 PM", rail: L("Ceremony", "Ceremonia") },
    { key: "cocktail", start: "2026-11-03T15:35", day: "wedding", title: L("Cocktail hour", "Hora del cóctel"), time: "4:00 PM", rail: L("Cocktail", "Cóctel") },
    { key: "reception", start: "2026-11-03T17:15", day: "wedding", title: L("Reception", "Recepción"), time: "5:30 PM", rail: L("Reception", "Recepción") },
    { key: "dinner", start: "2026-11-03T18:00", day: "wedding", title: L("Dinner", "Cena"), time: "6:00 PM", rail: L("Dinner", "Cena") },
    { key: "party", start: "2026-11-03T19:30", day: "wedding", title: L("Party", "Fiesta"), time: "7:30 PM", rail: L("Party", "Fiesta") },
    { key: "antojitos", start: "2026-11-04T00:00", day: "wedding", title: L("Antojitos mexicanos", "Antojitos mexicanos"), time: "12:00 AM", rail: "Antojitos" },
    { key: "nov4", start: "2026-11-04T05:00", day: "nov4", title: L("Pool day or hike", "Día de alberca o caminata"), date: L("Wednesday 4 November", "Miércoles 4 de noviembre"), rail: L("Wed 4", "Mié 4") },
    { key: "nov5", start: "2026-11-05T00:00", day: "nov5", title: L("Return to Mexico City", "Regreso a la Ciudad de México"), date: L("Thursday 5 November", "Jueves 5 de noviembre"), rail: L("Thu 5", "Jue 5") },
    { key: "after", start: "2026-11-06T00:00", day: "after", title: L("After the wedding", "Después de la boda"), rail: L("After", "Después") },
  ];
  const UNDATED = { key: "undated", day: "undated", title: T.undated, rail: T.undated };
  const segmentOf = (t) => {
    if (!t) return UNDATED;
    let seg = SEGMENTS[0];
    for (const s of SEGMENTS) if (t >= s.start) seg = s;
    return seg;
  };

  const $ = (s, root = document) => root.querySelector(s);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k === "html") n.innerHTML = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) n.append(kid);
    return n;
  };
  // replaceChildren() would print "null" for a skipped optional child; this drops them.
  const put = (node, ...kids) => node.replaceChildren(...kids.flat().filter((k) => k != null && k !== false));
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-t]").forEach((n) => { if (typeof T[n.dataset.t] === "string") n.textContent = T[n.dataset.t]; });
  $("#title").innerHTML = T.titleHtml;

  // ── state ─────────────────────────────────────────────────────────────────
  const S = {
    guests: [], guestById: new Map(), photos: [], version: 0, uploadsOpen: false, admin: false,
    me: JSON.parse(store.get("wedding-gallery-me", "null") || "null"),
    filter: { people: new Set(), by: null, src: null, mine: false },
    visible: [], lbIndex: -1, devicePrefix: "",
  };
  crypto.subtle?.digest("SHA-256", new TextEncoder().encode(DEVICE)).then((b) => {
    S.devicePrefix = [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 12);
  });
  const isMine = (p) => S.admin || (!!S.devicePrefix && p.d === S.devicePrefix);
  const nameOf = (id) => S.guestById.get(id)?.name;

  // ── API ───────────────────────────────────────────────────────────────────
  class ApiError extends Error { constructor(status, code) { super(code); this.status = status; this.code = code; } }
  async function api(path, { method = "GET", json, body } = {}) {
    const headers = { "X-Device": DEVICE };
    headers["X-Guest-Code"] = SITE_KEY;
    if (ADMIN_CODE) headers["X-Admin-Code"] = ADMIN_CODE;
    if (json) { headers["Content-Type"] = "application/json"; body = JSON.stringify(json); }
    let res;
    try { res = await fetch(API + path, { method, headers, body }); } catch { throw new ApiError(0, "network"); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ApiError(res.status, data.error || "error");
    }
    return data;
  }

  // Network trouble is retried with backoff, waiting for the phone to come back online.
  async function withRetry(fn, onWait) {
    for (let attempt = 0; ; attempt++) {
      try { return await fn(); } catch (err) {
        const transient = err.status === 0 || err.status >= 500 || err.status === 408;
        if (!transient || attempt >= 7) throw err;
        if (!navigator.onLine) { onWait?.(); await new Promise((r) => addEventListener("online", r, { once: true })); }
        else await new Promise((r) => setTimeout(r, Math.min(30000, 1000 * 2 ** attempt)));
      }
    }
  }

  async function loadState() {
    const s = await api("/api/state");
    S.guests = s.guests;
    S.guestById = new Map(s.guests.map((g) => [g.id, g]));
    S.uploadsOpen = s.uploadsOpen;
    S.uploadsMode = s.uploadsMode || "auto";
    S.opensOn = s.opensOn || null;
    S.admin = s.admin;
    if (S.me && !S.guestById.has(S.me.id)) setMe(null);
  }
  async function loadPhotos() {
    const d = await api("/api/photos");
    S.photos = d.photos;
    S.version = d.version;
  }

  // ── header ────────────────────────────────────────────────────────────────
  const uploadBtn = $("#upload-btn"), meBtn = $("#me-btn"), fileInput = $("#file");
  const canUpload = () => S.uploadsOpen || S.admin;
  const fmtDay = (d) => new Date(d + "T12:00:00Z").toLocaleDateString(LANG === "es" ? "es-MX" : "en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
  const mexicoToday = () => new Date(Date.now() - 6 * 3600 * 1000).toISOString().slice(0, 10);
  // Before uploads open: when they will. After they close: thank you.
  function closedMessage() {
    if (S.uploadsMode === "auto" && S.opensOn && mexicoToday() < S.opensOn) return { kicker: T.opensKicker, text: T.opensText(fmtDay(S.opensOn)), sub: T.opensSub };
    if (S.uploadsMode === "closed" && S.opensOn && mexicoToday() < S.opensOn) return { kicker: T.opensKicker, text: T.opensText(fmtDay(S.opensOn)), sub: T.opensSub };
    return { kicker: T.closedKicker, text: T.closedText, sub: T.closedSub };
  }
  function renderHeader() {
    $("#actions").hidden = false;
    uploadBtn.hidden = !canUpload();
    const card = $("#closed-card");
    card.hidden = canUpload();
    if (!card.hidden) {
      const m = closedMessage();
      $("#closed-kicker").textContent = m.kicker;
      $("#closed-text").textContent = m.text;
      $("#closed-sub").textContent = m.sub;
    }
    put(meBtn, S.me ? el("span", { class: "me-name", text: S.me.name }) : el("span", { text: T.pickName }));
    $("#admin-pill").hidden = !S.admin;
  }
  function setMe(g) {
    S.me = g ? { id: g.id, name: g.name } : null;
    store.set("wedding-gallery-me", g ? JSON.stringify(S.me) : null);
    if (!g) S.filter.mine = false;
    renderHeader();
  }
  meBtn.addEventListener("click", () => pickWho());
  uploadBtn.addEventListener("click", async () => {
    if (!S.me && !(await pickWho())) return;
    fileInput.click();
  });
  fileInput.addEventListener("change", () => {
    const files = [...fileInput.files];
    fileInput.value = "";
    if (files.length) addFiles(files);
  });

  // ── filters and rail ──────────────────────────────────────────────────────
  function applyFilter() {
    const f = S.filter;
    return S.photos.filter((p) => {
      if (f.src && p.src !== f.src) return false;
      if (f.by != null && p.by !== f.by) return false;
      if (f.mine && !(S.me && p.tags.includes(S.me.id))) return false;
      for (const id of f.people) if (!p.tags.includes(id)) return false;
      return true;
    });
  }
  const filtered = () => S.filter.people.size || S.filter.by != null || S.filter.src || S.filter.mine;

  function renderFilters() {
    const f = S.filter;
    const peopleLabel = f.people.size === 1 ? nameOf([...f.people][0]) : f.people.size ? `${T.people} · ${f.people.size}` : T.people;
    const chip = (label, on, onclick, n) => el("button", { class: "chip" + (on ? " on" : ""), type: "button", onclick }, label, n != null ? el("span", { class: "n", text: n }) : null);
    const mineCount = S.me ? S.photos.filter((p) => p.tags.includes(S.me.id)).length : null;
    const hasPhotographer = S.photos.some((p) => p.src === "p");
    put($("#filters"), 
      chip(T.all, !filtered(), () => { S.filter = { people: new Set(), by: null, src: null, mine: false }; render(); }),
      S.me ? chip(T.ofMe, f.mine, () => { f.mine = !f.mine; render(); }, mineCount) : null,
      chip(peopleLabel + " ▾", f.people.size > 0, () => pickPeople()),
      chip((f.by != null ? nameOf(f.by) : T.uploadedBy) + " ▾", f.by != null, () => pickUploader()),
      hasPhotographer ? chip(T.photographer, f.src === "p", () => { f.src = f.src === "p" ? null : "p"; render(); }) : null,
      hasPhotographer ? chip(T.guests, f.src === "g", () => { f.src = f.src === "g" ? null : "g"; render(); }) : null,
    );
  }

  // ── grid ──────────────────────────────────────────────────────────────────
  const grid = $("#grid");
  const imgUrl = (size, id) => `${API}/img/${size}/${id}`;
  const fadeIn = (e) => { e.target.classList.add("in"); e.target.parentNode.classList.add("loaded"); };
  const SEAL = "../assets/gpt/wax-seal-sv-exact-transparent-v3.webp";

  // Justified rows: every photo keeps its shape, and each full row fills the width exactly.
  function justify(photos, width) {
    const wide = innerWidth > 720;
    const target = wide ? 240 : 150, gap = wide ? 6 : 4;
    const rows = [];
    let row = [], sum = 0;
    const ratio = (p) => Math.min(3, Math.max(0.4, p.w && p.h ? p.w / p.h : 1.5));
    for (const p of photos) {
      row.push(p);
      sum += ratio(p);
      if (sum * target + gap * (row.length - 1) >= width) {
        const h = (width - gap * (row.length - 1)) / sum;
        rows.push({ items: row, h });
        row = []; sum = 0;
      }
    }
    if (row.length) rows.push({ items: row, h: Math.min(target, (width - gap * (row.length - 1)) / sum) });
    return rows.map((r) => ({ h: r.h, items: r.items.map((p) => ({ p, w: Math.floor(ratio(p) * r.h) })) }));
  }
  const rowsWidth = () => Math.max(200, grid.clientWidth - (innerWidth > 720 ? 32 : 8));
  const PERSON = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6"/></svg>';

  function render() {
    S.visible = applyFilter();
    renderFilters();
    const groups = new Map(); // segment key → photos, in segment order
    for (const p of S.visible) {
      const seg = segmentOf(p.t);
      (groups.get(seg) ?? groups.set(seg, []).get(seg)).push(p);
    }
    const ordered = [...SEGMENTS, UNDATED].filter((s) => groups.has(s));
    const frag = document.createDocumentFragment();
    const width = rowsWidth();
    lastWidth = grid.clientWidth;
    let index = 0;
    let weddingIntro = false;
    for (const seg of ordered) {
      const photos = groups.get(seg);
      if (seg.day === "wedding" && !weddingIntro) {
        weddingIntro = true;
        frag.append(el("div", { class: "day-intro", id: "day-wedding" },
          el("img", { src: SEAL, alt: "", width: 64, height: 64, loading: "lazy" }),
          el("small", { text: L("The wedding", "La boda") }), el("h2", { text: WEDDING_DAY[LANG] })));
      }
      const head = el("div", { class: "group-head" },
        el("h2", {}, seg.title),
        el("small", { text: [seg.date || seg.time, T.photos(photos.length)].filter(Boolean).join(" · ") }));
      const rows = justify(photos, width).map((r) => el("div", { class: "jrow", style: `height:${Math.round(r.h)}px` }, r.items.map(({ p, w }) => {
        const i = index++;
        return el("button", { class: "tile", type: "button", "data-i": i, "aria-label": seg.title, style: `width:${w}px;height:${Math.round(r.h)}px`, onclick: () => openLightbox(i) },
          el("img", { src: imgUrl("thumb", p.id), alt: "", loading: "lazy", decoding: "async", onload: fadeIn }),
          p.src === "p" ? el("span", { class: "badge", text: T.photographer }) : null,
          p.tags.length ? el("span", { class: "tagn", html: `${PERSON}${p.tags.length}` }) : null);
      })));
      frag.append(el("section", { class: "group" + (seg.day === "wedding" ? " moment" : ""), id: "seg-" + seg.key, "data-seg": seg.key }, head, el("div", { class: "rows" }, rows)));
    }
    // Visible order must match the tile indices used by the lightbox.
    S.visible = ordered.flatMap((s) => groups.get(s));
    put(grid, frag);
    renderRail(ordered, groups);
    renderEmpty();
  }

  // Re-flow the rows when the width really changes (rotation, window resize), not on scroll.
  let lastWidth = 0, resizeTimer = 0;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (S.photos.length && Math.abs(grid.clientWidth - lastWidth) > 8) render(); }, 150);
  });

  function renderRail(ordered, groups) {
    const rail = $("#rail");
    const links = [];
    let lastDay = null;
    for (const seg of ordered) {
      if (lastDay && (seg.day === "wedding") !== (lastDay === "wedding")) links.push(el("span", { class: "sep" }));
      lastDay = seg.day;
      links.push(el("a", { href: "#seg-" + seg.key, class: seg.day === "wedding" ? "sub" : null, "data-seg": seg.key,
        onclick: (e) => { e.preventDefault(); document.getElementById("seg-" + seg.key)?.scrollIntoView({ behavior: "smooth" }); } },
        seg.rail, el("span", { class: "n", text: groups.get(seg).length })));
    }
    put(rail, ...links);
    rail.hidden = ordered.length < 2;
    watchSections();
  }

  let sectionObserver;
  function watchSections() {
    sectionObserver?.disconnect();
    sectionObserver = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) {
        const key = e.target.dataset.seg;
        for (const a of $("#rail").querySelectorAll("a")) {
          const on = a.dataset.seg === key;
          a.classList.toggle("on", on);
          if (on) a.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
        }
      }
    }, { rootMargin: "-40% 0px -55% 0px" });
    grid.querySelectorAll(".group").forEach((g) => sectionObserver.observe(g));
  }

  function renderEmpty() {
    const box = $("#empty");
    // No photos at all yet: nothing to filter, so no filter bar.
    $("#bars").hidden = S.photos.length === 0;
    box.hidden = S.visible.length > 0;
    if (box.hidden) return;
    if (filtered()) {
      put(box, el("p", { text: T.empty }),
        el("button", { class: "btn", type: "button", text: T.clearFilters, onclick: () => { S.filter = { people: new Set(), by: null, src: null, mine: false }; render(); } }));
    } else if (canUpload()) {
      put(box, el("p", { text: T.emptyAll }),
        el("button", { class: "btn solid", type: "button", html: uploadBtn.innerHTML, onclick: () => uploadBtn.click() }));
    } else {
      put(box, el("p", { text: T.firstSoon }));
    }
  }

  // ── sheets ────────────────────────────────────────────────────────────────
  const wrap = $("#sheet-wrap"), sheet = $("#sheet");
  let sheetClose = null;
  function openSheet(build, onClose) {
    sheetClose?.(undefined, true);
    put(sheet, ...build());
    wrap.hidden = false;
    document.body.classList.add("locked");
    return new Promise((resolve) => {
      sheetClose = (value, silent) => {
        sheetClose = null;
        wrap.hidden = true;
        if ($("#lightbox").hidden) document.body.classList.remove("locked");
        if (!silent) onClose?.(value);
        resolve(value);
      };
      setTimeout(() => sheet.querySelector("input")?.focus({ preventScroll: true }), 60);
    });
  }
  const closeSheet = (v) => sheetClose?.(v);
  wrap.addEventListener("click", (e) => { if (e.target === wrap) closeSheet(undefined); });

  // A searchable list of names. single: resolves with a guest; multi: resolves with a Set.
  function namePicker({ title, q, hint, multi = false, selected = new Set(), counts = null, allowAdd = false, only = null, exclude = new Set(), footer, preview,
    okLabel = T.done, cancelLabel = T.clear, cancelValue = () => new Set() }) {
    let query = "";
    const list = el("div", { class: "list" });
    const chips = el("div", { class: "chosen" });
    const chosen = new Set(selected);
    const drawChips = () => put(chips, [...chosen].map((id) => el("span", { class: "tag" }, nameOf(id) || "—",
      el("button", { type: "button", text: "×", onclick: () => { chosen.delete(id); draw(); } }))));
    const draw = () => {
      if (multi) drawChips();
      const s = query.trim().toLowerCase();
      const norm = (x) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      const pool = S.guests.filter((g) => (!only || only.has(g.id)) && !exclude.has(g.id) && (!s || norm(g.name).includes(norm(s))));
      if (counts) pool.sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0) || a.name.localeCompare(b.name));
      const rows = pool.slice(0, 200).map((g) => el("button", {
        class: "row" + (chosen.has(g.id) ? " on" : ""), type: "button",
        onclick: () => {
          if (!multi) return closeSheet(g);
          chosen.has(g.id) ? chosen.delete(g.id) : chosen.add(g.id);
          draw();
        },
      }, el("span", {}, g.name), el("span", { style: "display:flex;align-items:center;gap:10px" },
        counts ? el("small", { text: T.photos(counts.get(g.id) || 0) }) : g.party ? el("small", { text: g.party }) : null,
        multi ? el("span", { class: "check", text: chosen.has(g.id) ? "✓" : "" }) : null)));
      const exact = S.guests.some((g) => norm(g.name) === norm(s));
      if (allowAdd && !exact) rows.push(el("button", { class: "row add", type: "button", onclick: async () => {
        if (s.length < 2) return input.focus();
        try {
          const { guest } = await api("/api/guests", { method: "POST", json: { name: query.trim() } });
          if (!S.guestById.has(guest.id)) { S.guests.push(guest); S.guestById.set(guest.id, guest); }
          if (!multi) return closeSheet(guest);
          chosen.add(guest.id);
          query = ""; input.value = "";
          draw();
        } catch { toast(T.error); }
      } }, T.notListed(query.trim())));
      put(list, ...rows);
    };
    const input = el("input", { class: "field", type: "search", placeholder: T.search, autocomplete: "off", enterkeyhint: "search", oninput: (e) => { query = e.target.value; draw(); } });
    draw();
    return openSheet(() => [
      title ? el("h2", { text: title }) : null,
      preview ? el("img", { class: "preview", src: preview, alt: "" }) : null,
      el("p", { class: "q", text: q }),
      hint ? el("p", { class: "hint", text: hint }) : null,
      multi ? chips : null,
      input, list,
      multi ? el("div", { class: "sheet-foot" },
        el("button", { class: "btn", type: "button", text: cancelLabel, onclick: () => closeSheet(cancelValue()) }),
        el("button", { class: "btn solid", type: "button", text: okLabel, onclick: () => closeSheet(chosen) })) : footer?.() ?? null,
    ].filter(Boolean));
  }

  async function pickWho() {
    const g = await namePicker({
      title: T.you, q: T.whoQ, hint: T.whoHint, allowAdd: true,
      footer: () => el("div", { class: "sheet-foot" }, el("button", { class: "btn", type: "button", text: T.skip, onclick: () => closeSheet(null) })),
    });
    if (g) { setMe(g); render(); }
    return !!g;
  }

  function tagCounts() {
    const m = new Map();
    for (const p of S.photos) for (const id of p.tags) m.set(id, (m.get(id) || 0) + 1);
    return m;
  }

  async function pickPeople() {
    const counts = tagCounts();
    const chosen = await namePicker({ q: T.peopleQ, hint: T.peopleHint, multi: true, selected: S.filter.people, counts, only: new Set(counts.keys()) });
    if (chosen) { S.filter.people = chosen; render(); }
  }

  async function pickUploader() {
    const counts = new Map();
    for (const p of S.photos) if (p.by != null) counts.set(p.by, (counts.get(p.by) || 0) + 1);
    const g = await namePicker({ q: T.byQ, counts, only: new Set(counts.keys()),
      footer: () => S.filter.by != null ? el("div", { class: "sheet-foot" }, el("button", { class: "btn", type: "button", text: T.clear, onclick: () => closeSheet(null) })) : null });
    if (g !== undefined) { S.filter.by = g ? g.id : null; render(); }
  }

  // ── lightbox ──────────────────────────────────────────────────────────────
  const lb = $("#lightbox"), lbImg = $("#lb-img"), lbInfo = $("#lb-info");
  const fmtWhen = (t) => new Date(t + "Z").toLocaleString(LANG === "es" ? "es-MX" : "en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true });

  function openLightbox(i, push = true) {
    if (!S.visible[i]) return;
    S.lbIndex = i;
    lb.hidden = false;
    document.body.classList.add("locked");
    if (push) history.pushState({ lb: true }, "", "#" + S.visible[i].id);
    else history.replaceState({ lb: true }, "", "#" + S.visible[i].id);
    showPhoto();
  }
  function closeLightbox(fromPop = false) {
    if (lb.hidden) return;
    lb.hidden = true;
    document.body.classList.remove("locked");
    const tile = grid.querySelector(`[data-i="${S.lbIndex}"]`);
    tile?.scrollIntoView({ block: "nearest" });
    S.lbIndex = -1;
    if (!fromPop && history.state?.lb) history.back();
    if (pendingRender) { pendingRender = false; render(); }
  }
  addEventListener("popstate", () => closeLightbox(true));

  function step(d) {
    const i = S.lbIndex + d;
    if (i < 0 || i >= S.visible.length) return;
    S.lbIndex = i;
    history.replaceState({ lb: true }, "", "#" + S.visible[i].id);
    showPhoto();
  }

  function showPhoto() {
    const p = S.visible[S.lbIndex];
    if (!p) return closeLightbox();
    lbImg.style.opacity = ".35";
    lbImg.onload = () => (lbImg.style.opacity = "1");
    lbImg.src = imgUrl("display", p.id);
    lbImg.alt = segmentOf(p.t).title;
    for (const n of [S.visible[S.lbIndex + 1], S.visible[S.lbIndex - 1]]) if (n) new Image().src = imgUrl("display", n.id);
    $("#lb-count").textContent = `${S.lbIndex + 1} / ${S.visible.length}`;
    $("#lb-prev").hidden = S.lbIndex === 0;
    $("#lb-next").hidden = S.lbIndex === S.visible.length - 1;
    renderInfo(p);
  }

  function renderInfo(p) {
    const seg = segmentOf(p.t);
    const when = p.t ? fmtWhen(p.t) : T.unknownTime;
    const who = p.src === "p" ? T.byPhotographer : T.sharedBy(nameOf(p.by) || T.someone);
    const tags = p.tags.map((id) => el("span", { class: "tag" }, nameOf(id) || "—",
      el("button", { type: "button", "aria-label": T.del, text: "×", onclick: () => untag(p, id) })));
    put(lbInfo, 
      el("div", {},
        el("p", { class: "lb-when" }, when, p.ts === "file" ? el("em", { text: ` · ${T.approx}` }) : null),
        el("p", { class: "lb-sub", text: [seg.title, who].join(" · ") })),
      el("div", {},
        el("span", { class: "meta-label", text: T.inPhoto }),
        el("div", { class: "tags" }, ...tags, el("button", { class: "tag add", type: "button", text: T.tagSomeone, onclick: () => tagSomeone(p) }))),
      p.cam ? el("div", {}, el("span", { class: "meta-label", text: T.camera }), el("p", { class: "lb-sub", text: p.cam })) : null,
      el("div", { class: "lb-actions" },
        el("a", { class: "btn small", href: imgUrl("orig", p.id) + "?dl=1", download: "" }, T.download),
        isMine(p) ? el("button", { class: "btn small", type: "button", text: T.fixTime, onclick: () => fixTime(p) }) : null,
        isMine(p) ? el("button", { class: "btn small danger", type: "button", text: T.del, onclick: () => remove(p) }) : null),
    );
  }

  $("#lb-close").addEventListener("click", () => closeLightbox());
  $("#lb-prev").addEventListener("click", () => step(-1));
  $("#lb-next").addEventListener("click", () => step(1));
  addEventListener("keydown", (e) => {
    if (lb.hidden || !wrap.hidden) { if (e.key === "Escape" && !wrap.hidden) closeSheet(undefined); return; }
    if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "Escape") closeLightbox();
  });
  // Swipe between photos; a downward swipe closes.
  {
    const stage = $("#lb-stage");
    let x0 = null, y0 = 0;
    stage.addEventListener("pointerdown", (e) => { if (e.target.closest("button")) return; x0 = e.clientX; y0 = e.clientY; });
    stage.addEventListener("pointermove", (e) => { if (x0 == null) return; lbImg.style.transform = `translateX(${(e.clientX - x0) * 0.6}px)`; });
    const end = (e) => {
      if (x0 == null) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      x0 = null;
      lbImg.style.transform = "";
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) closeLightbox();
    };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", () => { x0 = null; lbImg.style.transform = ""; });
  }

  async function tagSomeone(p) {
    const g = await namePicker({ title: T.tagSomeone.replace("+ ", ""), q: T.tagQ, hint: T.tagHint, allowAdd: true, exclude: new Set(p.tags) });
    if (!g) return;
    p.tags = [...p.tags, g.id];
    renderInfo(p);
    try { await api(`/api/photos/${p.id}/tags`, { method: "POST", json: { guestId: g.id, by: S.me?.id ?? null } }); }
    catch { p.tags = p.tags.filter((x) => x !== g.id); renderInfo(p); toast(T.error); }
    pendingRender = true;
  }
  async function untag(p, id) {
    const before = p.tags;
    p.tags = p.tags.filter((x) => x !== id);
    renderInfo(p);
    try { await api(`/api/photos/${p.id}/tags/${id}`, { method: "DELETE" }); }
    catch { p.tags = before; renderInfo(p); toast(T.error); }
    pendingRender = true;
  }
  async function fixTime(p) {
    const input = el("input", { class: "field", type: "datetime-local", step: 60, value: (p.t || "2026-11-03T12:00:00").slice(0, 16) });
    const ok = await openSheet(() => [el("p", { class: "q", text: T.timeQ }), el("p", { class: "hint", text: T.timeHint }), input,
      el("div", { class: "sheet-foot" },
        el("button", { class: "btn", type: "button", text: T.cancel, onclick: () => closeSheet(false) }),
        el("button", { class: "btn solid", type: "button", text: T.save, onclick: () => closeSheet(true) }))]);
    if (!ok || !input.value) return;
    const t = input.value.slice(0, 16) + ":00";
    try {
      await api(`/api/photos/${p.id}`, { method: "PATCH", json: { takenLocal: t } });
      p.t = t; p.ts = "manual";
      S.photos.sort(byTime);
      toast(T.saved);
      const id = p.id;
      render();
      openLightbox(S.visible.findIndex((x) => x.id === id), false);
    } catch { toast(T.error); }
  }
  async function remove(p) {
    if (!confirm(T.delQ)) return;
    try {
      await api(`/api/photos/${p.id}`, { method: "DELETE" });
      S.photos = S.photos.filter((x) => x !== p);
      toast(T.deleted);
      const i = S.lbIndex;
      render();
      if (S.visible.length) openLightbox(Math.min(i, S.visible.length - 1), false);
      else closeLightbox();
    } catch { toast(T.error); }
  }
  const byTime = (a, b) => (a.t == null) - (b.t == null) || (a.t || "").localeCompare(b.t || "");

  // ── uploads ───────────────────────────────────────────────────────────────
  const queue = [];
  let active = 0, batchStart = 0, wakeLock = null;
  const tray = $("#tray");

  function addFiles(files) {
    if (!queue.some((it) => it.state === "waiting" || it.state === "working")) { queue.length = 0; batchStart = Date.now(); }
    for (const file of files) queue.push({ file, state: "waiting", thumbUrl: null, id: null, error: null });
    navigator.wakeLock?.request("screen").then((l) => (wakeLock = l)).catch(() => {});
    renderTray();
    pump();
  }

  function pump() {
    while (active < CONCURRENCY) {
      const it = queue.find((x) => x.state === "waiting");
      if (!it) break;
      active++;
      it.state = "working";
      upload(it).catch((err) => { it.state = "failed"; it.error = err; })
        .finally(() => { active--; renderTray(); pump(); if (!active && !queue.some((x) => x.state === "waiting")) batchDone(); });
    }
  }

  async function upload(it) {
    if (it.file.size > MAX_BYTES) throw new Error("tooBig");
    const prep = await prepare(it.file);
    it.thumbUrl = URL.createObjectURL(prep.thumb);
    renderTray();
    const onWait = () => { it.waiting = true; renderTray(); };
    const created = await withRetry(() => api("/api/photos", { method: "POST", json: {
      sha256: prep.sha256, takenLocal: prep.takenLocal, timeSource: prep.timeSource, camera: prep.camera,
      width: prep.width, height: prep.height, bytes: it.file.size, origType: it.file.type || null, uploaderId: S.me?.id ?? null,
    } }), onWait);
    it.id = created.id;
    it.existing = created.existing && !created.missing.length;
    const bodies = { orig: it.file, display: prep.display, thumb: prep.thumb };
    for (const size of created.missing) await withRetry(() => api(`/api/photos/${created.id}/${size}`, { method: "PUT", body: bodies[size] }), onWait);
    it.waiting = false;
    it.state = "done";
  }

  // EXIF time → Mexico City wall time. With an offset (most phones) the instant is exact;
  // without one, the camera's own clock is taken as local time.
  const MX_OFFSET_MIN = -6 * 60; // Mexico City has kept UTC−6 all year since 2022
  const pad = (n) => String(n).padStart(2, "0");
  const isoLocal = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  function exifTime(raw, offset) {
    const m = /^(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d):(\d\d)/.exec(raw || "");
    if (!m || m[1] === "0000") return null;
    let ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
    const o = /^([+-])(\d\d):?(\d\d)$/.exec(offset || "");
    if (o) ms = ms - (o[1] === "-" ? -1 : 1) * (+o[2] * 60 + +o[3]) * 60000 + MX_OFFSET_MIN * 60000;
    return isoLocal(new Date(ms));
  }

  async function prepare(file) {
    const [exif, buf] = await Promise.all([
      // The lite build can't use exifr's `pick`; naming the fields per block reads only those.
      window.exifr ? exifr.parse(file, { ifd0: ["Make", "Model"], exif: ["DateTimeOriginal", "CreateDate", "OffsetTimeOriginal", "OffsetTime"], reviveValues: false }).catch(() => null) : null,
      file.arrayBuffer(),
    ]);
    const e = exif || {};
    let takenLocal = exifTime(e.DateTimeOriginal || e.CreateDate, e.OffsetTimeOriginal || e.OffsetTime);
    let timeSource = "exif";
    if (!takenLocal && file.lastModified) { takenLocal = isoLocal(new Date(file.lastModified + MX_OFFSET_MIN * 60000)); timeSource = "file"; }
    const make = (e.Make || "").trim(), model = (e.Model || "").trim();
    const camera = (model.toLowerCase().startsWith(make.toLowerCase()) ? model : [make, model].join(" ")).trim() || null;

    const sha = await crypto.subtle.digest("SHA-256", buf);
    const sha256 = [...new Uint8Array(sha)].map((b) => b.toString(16).padStart(2, "0")).join("");

    // An <img> applies the EXIF rotation in every current browser, and Safari decodes HEIC.
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    try { await img.decode(); } catch { URL.revokeObjectURL(url); throw new Error("unreadable"); }
    const width = img.naturalWidth, height = img.naturalHeight;
    const display = await scaled(img, width, height, DISPLAY_EDGE, 0.85);
    URL.revokeObjectURL(url);
    const dispImg = await createImageBitmap(display).catch(() => null);
    const thumb = dispImg ? await scaled(dispImg, dispImg.width, dispImg.height, THUMB_EDGE, 0.78) : await scaled(img, width, height, THUMB_EDGE, 0.78);
    dispImg?.close?.();
    return { sha256, takenLocal, timeSource, camera, width, height, display, thumb };
  }

  function scaled(source, w, h, edge, quality) {
    const k = Math.min(1, edge / Math.max(w, h));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * k));
    c.height = Math.max(1, Math.round(h * k));
    const ctx = c.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, c.width, c.height);
    return new Promise((resolve, reject) => c.toBlob((b) => { c.width = c.height = 0; b ? resolve(b) : reject(new Error("unreadable")); }, "image/jpeg", quality));
  }

  function renderTray() {
    if (!queue.length) { tray.hidden = true; return; }
    const total = queue.length;
    const done = queue.filter((x) => x.state === "done").length;
    const failed = queue.filter((x) => x.state === "failed");
    const busy = queue.some((x) => x.state === "waiting" || x.state === "working");
    const waiting = queue.some((x) => x.waiting);
    const head = busy ? (waiting ? T.offline : T.uploading(Math.min(done + 1, total), total)) : T.uploaded(done);
    tray.hidden = false;
    put(tray, 
      el("div", { class: "tray-head" }, el("span", { text: head }), busy ? null : el("button", { type: "button", "aria-label": T.done, text: "×", onclick: () => { queue.length = 0; renderTray(); } })),
      el("div", { class: "bar" }, el("i", { style: `width:${Math.round(((done + failed.length) / total) * 100)}%` })),
      el("div", { class: "tray-thumbs" }, queue.map((it) => el("button", { type: "button", class: it.state, onclick: () => it.state === "done" && openById(it.id) },
        it.thumbUrl ? el("img", { src: it.thumbUrl, alt: "" }) : null,
        el("span", { class: "state", text: it.state === "failed" ? "!" : "…" })))),
      !busy && done ? el("div", { class: "tray-note" }, el("span", { text: T.tagThem }),
        el("button", { class: "btn small solid", type: "button", text: T.tagNow, onclick: () => tagBatch() })) : null,
      failed.length ? el("p", { class: "tray-note" }, `${T.failed(failed.length)}: ${reason(failed[0].error)} `,
        el("button", { class: "btn small", type: "button", text: T.retry, onclick: () => { failed.forEach((x) => { x.state = "waiting"; x.error = null; }); renderTray(); pump(); } })) : null,
    );
  }
  const reason = (err) => ({ tooBig: T.tooBig, unreadable: T.unreadable, uploads_closed: T.closedNow })[err?.code || err?.message] || T.error;

  async function batchDone() {
    wakeLock?.release?.().catch(() => {});
    wakeLock = null;
    try { await loadPhotos(); render(); } catch {}
    // Straight after sharing, walk through the new photos once to tag who's in them.
    if (queue.some((x) => x.state === "done" && !x.existing) && lb.hidden && wrap.hidden) tagBatch();
  }

  async function tagBatch() {
    const ids = queue.filter((x) => x.state === "done").map((x) => x.id);
    const photos = ids.map((id) => S.photos.find((p) => p.id === id)).filter(Boolean);
    for (const [n, p] of photos.entries()) {
      const chosen = await namePicker({
        title: T.whoIn, q: fmtWhen(p.t || "2026-11-03T12:00:00").replace(/^\w/, (c) => c.toUpperCase()), hint: T.whoInStep(n + 1, photos.length),
        preview: imgUrl("display", p.id), multi: true, allowAdd: true, selected: new Set(p.tags),
        okLabel: n + 1 < photos.length ? T.next : T.done, cancelLabel: T.finish, cancelValue: () => null,
      });
      if (!chosen) break;
      const add = [...chosen].filter((id) => !p.tags.includes(id));
      const drop = p.tags.filter((id) => !chosen.has(id));
      try {
        await Promise.all([
          ...add.map((id) => api(`/api/photos/${p.id}/tags`, { method: "POST", json: { guestId: id, by: S.me?.id ?? null } })),
          ...drop.map((id) => api(`/api/photos/${p.id}/tags/${id}`, { method: "DELETE" })),
        ]);
        p.tags = [...chosen];
      } catch { toast(T.error); }
    }
    render();
  }
  function openById(id) {
    let i = S.visible.findIndex((p) => p.id === id);
    if (i < 0 && filtered()) { S.filter = { people: new Set(), by: null, src: null, mine: false }; render(); i = S.visible.findIndex((p) => p.id === id); }
    if (i >= 0) openLightbox(i);
  }
  addEventListener("beforeunload", (e) => { if (queue.some((x) => x.state === "waiting" || x.state === "working")) { e.preventDefault(); e.returnValue = T.leaveWarn; } });

  // ── new photos from everyone else ─────────────────────────────────────────
  let pendingRender = false;
  const newPill = $("#new-pill");
  async function poll() {
    if (document.hidden || !API) return;
    try {
      const d = await api("/api/photos");
      if (d.version === S.version) return;
      const known = new Set(S.photos.map((p) => p.id));
      const added = d.photos.filter((p) => !known.has(p.id)).length;
      S.photos = d.photos;
      S.version = d.version;
      if (added && !lb.hidden) { pendingRender = true; return; }
      if (added) {
        // Don't shuffle the grid under someone's thumb; offer it instead.
        newPill.textContent = T.newPhotos(added);
        newPill.hidden = false;
      } else if (lb.hidden) render();
      else pendingRender = true;
    } catch {}
  }
  newPill.addEventListener("click", () => { newPill.hidden = true; render(); });
  setInterval(poll, POLL_MS);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) poll(); });

  // ── admin ─────────────────────────────────────────────────────────────────
  $("#admin-pill").addEventListener("click", () => {
    const setMode = async (mode) => {
      try { await api("/api/settings", { method: "PATCH", json: { uploads: mode } }); await loadState(); renderHeader(); renderEmpty(); closeSheet(); toast(T.saved); }
      catch { toast(T.error); }
    };
    const modeHint = S.uploadsMode === "auto" ? T.modeHint.auto(S.opensOn ? fmtDay(S.opensOn) : "—") : T.modeHint[S.uploadsMode];
    openSheet(() => [
      el("h2", { text: T.adminTitle }),
      el("p", { class: "q", text: T.guestUploads }),
      el("div", { class: "seg-tabs" }, [["auto", T.modeAuto], ["open", T.modeOpen], ["closed", T.modeClosed]].map(([m, label]) =>
        el("button", { type: "button", "aria-pressed": String(S.uploadsMode === m), text: label, onclick: () => setMode(m) }))),
      el("p", { class: "hint", text: modeHint }),
      el("p", { class: "hint", text: `${T.photos(S.photos.length)} · ${S.guests.length} ${LANG === "es" ? "nombres" : "names"}` }),
      el("div", { class: "sheet-foot" },
        el("button", { class: "btn", type: "button", text: T.exportList, onclick: () => {
          const lines = S.photos.map((p) => `${imgUrl("orig", p.id)}?dl=1`).join("\n");
          const a = el("a", { href: URL.createObjectURL(new Blob([lines], { type: "text/plain" })), download: "sean-valeria-originals.txt" });
          a.click();
        } })),
    ]);
  });

  // ── drop photos onto the page (computers) ─────────────────────────────────
  {
    const drop = $("#drop");
    let depth = 0;
    const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes("Files");
    addEventListener("dragenter", (e) => { if (!hasFiles(e) || !canUpload()) return; depth++; drop.hidden = false; });
    addEventListener("dragleave", (e) => { if (!hasFiles(e)) return; depth = Math.max(0, depth - 1); if (!depth) drop.hidden = true; });
    addEventListener("dragover", (e) => { if (hasFiles(e)) e.preventDefault(); });
    addEventListener("drop", async (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      drop.hidden = true;
      if (!canUpload()) return;
      const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
      if (!files.length) return;
      if (!S.me && !(await pickWho())) return;
      addFiles(files);
    });
  }

  // ── toast ─────────────────────────────────────────────────────────────────
  let toastTimer = 0;
  function toast(text) {
    const t = $("#toast");
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  // ── start ─────────────────────────────────────────────────────────────────
  async function boot() {
    if (!API) {
      $("#actions").hidden = true;
      $("#bars").hidden = true;
      const box = $("#empty");
      box.hidden = false;
      put(box, el("p", { text: T.soon }));
      return;
    }
    try {
      await Promise.all([loadState(), loadPhotos()]);
    } catch (err) {
      toast(T.error);
      return;
    }
    renderHeader();
    render();
    // A shared link (#<photo id>) opens that photo.
    const id = location.hash.slice(1);
    if (/^[0-9a-f]{32}$/.test(id)) {
      history.replaceState(null, "", location.pathname + location.search);
      openById(id);
    }
    if (!S.me && !store.get("wedding-gallery-skipped-who", "")) {
      const picked = await pickWho();
      if (!picked) store.set("wedding-gallery-skipped-who", "1");
    }
  }
  $("#actions").hidden = true;
  boot();
})();
