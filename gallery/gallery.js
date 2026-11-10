// Guest photo gallery for seanandvaleria.com/gallery/.
// Photos live in the sv-gallery Worker (Cloudflare R2 + D1). This page makes the display and
// thumbnail sizes on the phone, reads each photo's time from EXIF, and places it on the
// wedding week's timeline. Anyone with the invitation password can upload and tag.
// Videos go in the same list: the file is sent in pieces, a still from it stands in as its
// display and thumb sizes, and its time comes from the video's own metadata.
(() => {
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  // Set after the Worker is deployed (npm run deploy in ../sv-gallery prints the address).
  const API_PROD = "https://sv-gallery.valeriaandseanharrigan.workers.dev";
  const API = local ? `http://${location.hostname}:8933` : API_PROD;
  const MAX_BYTES = 40 * 1024 * 1024;
  // the Worker's limits (VIDEO_MAX in sv-gallery); a video goes up in pieces of PART
  const VIDEO_MAX = 4 * 1024 ** 3, VIDEO_MAX_ADMIN = 20 * 1024 ** 3;
  const PART = 8 * 1024 * 1024;
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
      back: "← seanandvaleria.com", eyebrow: "Gallery", title: "Our wedding, through your eyes",
      lede: "Add your photos and videos from the trip and the wedding, and tag who’s in them.",
      add: "Add photos", closed: "Uploads are closed. Thank you for sharing!", you: "You", pickName: "Who are you?",
      all: "All", ofMe: "Photos of me", people: "People", uploadedBy: "Shared by", photographer: "Photographer", guests: "Guests",
      photos: (n) => `${n} ${n === 1 ? "photo" : "photos"}`, videos: (n) => `${n} ${n === 1 ? "video" : "videos"}`, video: "Video",
      soon: "The photo gallery opens soon.",
      empty: "No photos here yet.", emptyAll: "No photos yet. Be the first to share one from the trip!",
      clearFilters: "Show all photos",
      whoQ: "Who are you?", whoHint: "So your photos are credited to you, and you can find the ones you’re in.",
      search: "Search names", notListed: (s) => s ? `Add “${s}”` : "Not on the list? Type your name", skip: "Not now",
      peopleQ: "Show photos of…", peopleHint: "Pick more than one to find photos of them together.", done: "Done", clear: "Clear",
      byQ: "Shared by", tagQ: "Who’s in this photo?", tagHint: "Tap everyone in it.",
      inPhoto: "In this photo", inVideo: "In this video", tagSomeone: "+ Tag someone", nobody: "No one tagged yet.",
      sharedBy: (n) => `Shared by ${n}`, byPhotographer: "From the photographer", byVideographer: "From the videographer", byBooth: "From the photo booth", someone: "a guest",
      onlyPhotos: "Photos", onlyVideos: "Videos", uploads: "Uploads", pro: "Professional", booth: "Photo booth",
      showAs: "Shown under", countAs: "What you upload goes under", countAsHint: "Only you can choose this. Guests’ photos always go under Uploads.",
      uploadingAs: (s) => `as ${s}`,
      approx: "time approximate", unknownTime: "Date unknown", camera: "Camera",
      download: "Download original", downloadVideo: "Download video", fixTime: "Fix the time", del: "Delete",
      timeQ: "When was this taken?", timeHint: "Mexico City time.", save: "Save", cancel: "Cancel", enter: "Continue",
      preparing: "Getting ready…", uploading: (d, n) => `Sharing ${d} of ${n}`, uploaded: (n) => `${n} ${n === 1 ? "photo" : "photos"} shared`,
      failed: (n) => `${n} couldn’t be shared`, retry: "Try again",
      already: (n) => `${n} already here`, unreadable: "This phone can’t read that file", tooBig: "Too big (40 MB max)", offline: "Waiting for a connection…",
      tooBigVideo: (gb) => `Too big (${gb} GB max for a video)`,
      unreadableHere: "This browser can’t read that file", heicPhone: "This browser can’t open HEIC photos. Try sharing them as JPEG.", heicHere: "This browser can’t open HEIC photos. Try from your phone, or save them as JPEG.",
      notImage: "That file isn’t a photo or a video", tooMany: "That’s the limit for today. Please try again tomorrow.",
      remove: (n) => `Remove ${n}`, untagged: (n) => `${n} untagged`, undo: "Undo", withNames: (s) => `with ${s}`,
      viewer: "Photo viewer", prev: "Previous", nextPhoto: "Next", close: "Close",
      leaveWarn: "Photos are still uploading.", newPhotos: (n) => `${n} new ${n === 1 ? "photo" : "photos"} · Show`,
      saved: "Saved", deleted: "Deleted", error: "Something went wrong. Please try again.", closedNow: "Uploads are closed",
      adminTitle: "Admin", uploadsOpen: "Uploads open", uploadsClosed: "Uploads closed", openUploads: "Open uploads", closeUploads: "Close uploads",
      exportList: "Download list of originals", undated: "Date unknown",
      titleHtml: "Photos",
      opensKicker: "Coming soon", opensText: (d) => `Uploads open ${d}`, opensSub: "Until then, enjoy the photos already here.",
      closedKicker: "Thank you", closedText: "Uploads are closed", closedSub: "Thank you for sharing every moment with us.",
      firstSoon: "The first photos will appear here soon.",
      dropHere: "Drop your photos and videos here", whoIn: "Who’s in this photo?", whoInVideo: "Who’s in this video?", whoInStep: (i, n) => n > 1 ? `${i} of ${n} · tap everyone in it` : "Tap everyone in it",
      next: "Next", skipPhoto: "Skip", thanks: (n) => `${n === 1 ? "Your photo is" : `All ${n} photos are`} in. Thank you!`,
      thanksMix: (what) => `All in (${what}). Thank you!`, sharedMix: (what) => `${what} shared`,
      delTitle: "Delete this photo?", delTitleVideo: "Delete this video?", delHint: "It’s removed for everyone, and it can’t be undone.", keep: "Keep it",
      modeAuto: "Automatic", modeOpen: "Open now", modeClosed: "Closed",
      modeHint: { auto: (d) => `Guests can upload from ${d}. You can always upload.`, open: "Guests can upload now.", closed: "Guests can’t upload. You still can." },
      guestUploads: "Guest uploads",
    },
    es: {
      back: "← seanandvaleria.com", eyebrow: "Galería", title: "Nuestra boda, a través de sus ojos",
      lede: "Suban sus fotos y videos del viaje y de la boda, y etiqueten a quién sale en ellos.",
      add: "Subir fotos", closed: "Ya no se pueden subir fotos. ¡Gracias por compartir!", you: "Tú", pickName: "¿Quién eres?",
      all: "Todas", ofMe: "Fotos mías", people: "Personas", uploadedBy: "Compartidas por", photographer: "Fotógrafo", guests: "Invitados",
      photos: (n) => `${n} ${n === 1 ? "foto" : "fotos"}`, videos: (n) => `${n} ${n === 1 ? "video" : "videos"}`, video: "Video",
      soon: "La galería de fotos abrirá pronto.",
      empty: "Todavía no hay fotos aquí.", emptyAll: "Todavía no hay fotos. ¡Sé el primero en compartir una del viaje!",
      clearFilters: "Ver todas las fotos",
      whoQ: "¿Quién eres?", whoHint: "Así tus fotos llevan tu nombre y puedes encontrar las fotos en las que sales.",
      search: "Buscar nombres", notListed: (s) => s ? `Agregar “${s}”` : "¿No estás en la lista? Escribe tu nombre", skip: "Ahora no",
      peopleQ: "Ver fotos de…", peopleHint: "Elige a más de una persona para ver fotos donde salen juntas.", done: "Listo", clear: "Borrar",
      byQ: "Compartidas por", tagQ: "¿Quién sale en esta foto?", tagHint: "Toca a todos los que salen.",
      inPhoto: "En esta foto", inVideo: "En este video", tagSomeone: "+ Etiquetar", nobody: "Nadie etiquetado todavía.",
      sharedBy: (n) => `Compartida por ${n}`, byPhotographer: "Del fotógrafo", byVideographer: "Del videógrafo", byBooth: "De la cabina de fotos", someone: "un invitado",
      onlyPhotos: "Fotos", onlyVideos: "Videos", uploads: "De invitados", pro: "Profesional", booth: "Cabina de fotos",
      showAs: "Aparece en", countAs: "Lo que subas aparece en", countAsHint: "Solo ustedes pueden elegir esto. Las fotos de los invitados siempre van en De invitados.",
      uploadingAs: (s) => `como ${s}`,
      approx: "hora aproximada", unknownTime: "Fecha desconocida", camera: "Cámara",
      download: "Descargar original", downloadVideo: "Descargar video", fixTime: "Corregir la hora", del: "Borrar",
      timeQ: "¿Cuándo se tomó?", timeHint: "Hora de la Ciudad de México.", save: "Guardar", cancel: "Cancelar", enter: "Continuar",
      preparing: "Preparando…", uploading: (d, n) => `Compartiendo ${d} de ${n}`, uploaded: (n) => `${n} ${n === 1 ? "foto compartida" : "fotos compartidas"}`,
      failed: (n) => `${n} no se pudieron compartir`, retry: "Reintentar",
      already: (n) => n === 1 ? "1 ya estaba aquí" : `${n} ya estaban aquí`, unreadable: "Este teléfono no puede leer ese archivo", tooBig: "Muy grande (máx. 40 MB)", offline: "Esperando conexión…",
      tooBigVideo: (gb) => `Muy grande (máx. ${gb} GB por video)`,
      unreadableHere: "Este navegador no puede leer ese archivo", heicPhone: "Este navegador no abre fotos HEIC. Intenta compartirlas como JPEG.", heicHere: "Este navegador no abre fotos HEIC. Súbelas desde tu teléfono o guárdalas como JPEG.",
      notImage: "Ese archivo no es una foto ni un video", tooMany: "Llegaste al límite de hoy. Inténtalo de nuevo mañana.",
      remove: (n) => `Quitar a ${n}`, untagged: (n) => `Se quitó la etiqueta de ${n}`, undo: "Deshacer", withNames: (s) => `con ${s}`,
      viewer: "Visor de fotos", prev: "Anterior", nextPhoto: "Siguiente", close: "Cerrar",
      leaveWarn: "Todavía se están subiendo fotos.", newPhotos: (n) => `${n} ${n === 1 ? "foto nueva" : "fotos nuevas"} · Ver`,
      saved: "Guardado", deleted: "Borrada", error: "Algo salió mal. Inténtalo de nuevo.", closedNow: "Ya no se pueden subir fotos",
      adminTitle: "Admin", uploadsOpen: "Subidas abiertas", uploadsClosed: "Subidas cerradas", openUploads: "Abrir subidas", closeUploads: "Cerrar subidas",
      exportList: "Descargar lista de originales", undated: "Fecha desconocida",
      titleHtml: "Fotos",
      opensKicker: "Muy pronto", opensText: (d) => `Podrán subir fotos desde el ${d}`, opensSub: "Mientras tanto, disfruten las fotos que ya están aquí.",
      closedKicker: "Gracias", closedText: "Ya no se pueden subir fotos", closedSub: "Gracias por compartir cada momento con nosotros.",
      firstSoon: "Las primeras fotos aparecerán aquí muy pronto.",
      dropHere: "Suelta tus fotos y videos aquí", whoIn: "¿Quién sale en esta foto?", whoInVideo: "¿Quién sale en este video?", whoInStep: (i, n) => n > 1 ? `${i} de ${n} · toca a todos los que salen` : "Toca a todos los que salen",
      next: "Siguiente", skipPhoto: "Omitir", thanks: (n) => `¡Gracias! ${n === 1 ? "Tu foto ya está" : `Las ${n} fotos ya están`} aquí.`,
      thanksMix: (what) => `¡Gracias! Ya está todo aquí (${what}).`, sharedMix: (what) => `Compartido: ${what}`,
      delTitle: "¿Borrar esta foto?", delTitleVideo: "¿Borrar este video?", delHint: "Se borra para todos y no se puede deshacer.", keep: "Conservarla",
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
    { key: "reception", start: "2026-11-03T17:15", day: "wedding", title: L("Reception", "Recepción"), time: "5:15 PM", rail: L("Reception", "Recepción") },
    { key: "dinner", start: "2026-11-03T18:00", day: "wedding", title: L("Dinner", "Cena"), time: "6:00 PM", rail: L("Dinner", "Cena") },
    { key: "party", start: "2026-11-03T19:30", day: "wedding", title: L("Party", "Fiesta"), time: "7:30 PM", rail: L("Party", "Fiesta") },
    { key: "antojitos", start: "2026-11-04T00:00", day: "wedding", title: L("Antojitos mexicanos", "Antojitos mexicanos"), time: "12:00 AM", rail: "Antojitos" },
    { key: "nov4", start: "2026-11-04T05:00", day: "nov4", title: L("Pool day or hike", "Día de alberca o caminata"), date: L("Wednesday 4 November", "Miércoles 4 de noviembre"), rail: L("Wed 4", "Mié 4") },
    { key: "nov5", start: "2026-11-05T00:00", day: "nov5", title: L("Return to Mexico City", "Regreso a la Ciudad de México"), date: L("Thursday 5 November", "Jueves 5 de noviembre"), rail: L("Thu 5", "Jue 5") },
    { key: "after", start: "2026-11-06T00:00", day: "after", title: L("After the wedding", "Después de la boda"), rail: L("After", "Después") },
  ];
  // Photos from August and September 2025 are the engagement shoot, shown ahead of "Before the trip".
  const ENGAGEMENT = { key: "engagement", start: "2025-08-01T00:00", end: "2025-10-01T00:00", day: "before", title: L("Engagement", "Compromiso"), rail: L("Engagement", "Compromiso") };
  const UNDATED = { key: "undated", day: "undated", title: T.undated, rail: T.undated };
  const segmentOf = (t) => {
    if (!t) return UNDATED;
    if (t >= ENGAGEMENT.start && t < ENGAGEMENT.end) return ENGAGEMENT;
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
  // src: "g" guests' uploads, "p" the professionals, "b" the photo booth; kind: "p" photos, "v" videos
  function noFilter() { return { people: new Set(), by: null, src: null, kind: null, mine: false }; }
  const S = {
    guests: [], guestById: new Map(), photos: [], version: 0, uploadsOpen: false, admin: false,
    me: JSON.parse(store.get("wedding-gallery-me", "null") || "null"),
    filter: noFilter(),
    visible: [], lbIndex: -1, devicePrefix: "",
  };
  crypto.subtle?.digest("SHA-256", new TextEncoder().encode(DEVICE)).then((b) => {
    S.devicePrefix = [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 12);
  });
  const isMine = (p) => S.admin || (!!S.devicePrefix && p.d === S.devicePrefix);
  const nameOf = (id) => S.guestById.get(id)?.name;
  const isVid = (p) => p.k === "v";
  // "12 photos", or "10 photos · 2 videos" once there are videos among them
  const countText = (list) => {
    const v = list.filter(isVid).length;
    return [list.length - v || !v ? T.photos(list.length - v) : null, v ? T.videos(v) : null].filter(Boolean).join(" · ");
  };
  // 0:42, 12:05, 1:02:10
  const fmtDur = (sec) => {
    const s = Math.max(0, Math.round(sec || 0)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = String(s % 60).padStart(2, "0");
    return h ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
  };

  // ── API ───────────────────────────────────────────────────────────────────
  class ApiError extends Error { constructor(status, code) { super(code); this.status = status; this.code = code; } }
  // A request that hangs (Wi-Fi that stops passing data without dropping) is given up after a
  // while and counts as a network error, so it's tried again rather than stalling the upload.
  async function api(path, { method = "GET", json, body } = {}) {
    const headers = { "X-Device": DEVICE };
    headers["X-Guest-Code"] = SITE_KEY;
    if (ADMIN_CODE) headers["X-Admin-Code"] = ADMIN_CODE;
    if (json) { headers["Content-Type"] = "application/json"; body = JSON.stringify(json); }
    const stop = new AbortController();
    // a file gets a minute plus the time it takes at a very slow 20 KB/s, so only a real hang ends it
    const timer = setTimeout(() => stop.abort(), body instanceof Blob ? 60000 + body.size / 20 : 30000);
    let res, data;
    try {
      res = await fetch(API + path, { method, headers, body, signal: stop.signal });
      data = await res.json().catch(() => ({}));
    } catch { throw new ApiError(0, "network"); } finally { clearTimeout(timer); }
    if (!res.ok) {
      throw new ApiError(res.status, data.error || "error");
    }
    return data;
  }

  // Network trouble is retried with backoff, waiting for the phone to come back online.
  async function withRetry(fn, onWait, tries = 8) {
    for (let attempt = 0; ; attempt++) {
      try { return await fn(); } catch (err) {
        const transient = err.status === 0 || err.status >= 500 || err.status === 408;
        if (!transient || attempt >= tries - 1) throw err;
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
  // Photos already on the page keep their objects (the viewer and its buttons hold on to them);
  // only their details are brought up to date. Returns how many are new.
  async function loadPhotos(d) {
    d ??= await api("/api/photos");
    const had = new Map(S.photos.map((p) => [p.id, p]));
    S.photos = d.photos.map((p) => (had.has(p.id) ? Object.assign(had.get(p.id), p) : p));
    S.version = d.version;
    return d.photos.filter((p) => !had.has(p.id)).length;
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
    // a small person ahead of the name, so it reads as "this is you"
    put(meBtn, el("span", { class: "me-ico", html: PERSON }), S.me ? el("span", { class: "me-name", text: S.me.name }) : el("span", { text: T.pickName }));
    S.me ? meBtn.setAttribute("aria-label", `${T.you}: ${S.me.name}`) : meBtn.removeAttribute("aria-label");
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
      if (f.kind && (f.kind === "v") !== isVid(p)) return false;
      if (f.by != null && p.by !== f.by) return false;
      if (f.mine && !(S.me && p.tags.includes(S.me.id))) return false;
      for (const id of f.people) if (!p.tags.includes(id)) return false;
      return true;
    });
  }
  const filtered = () => S.filter.people.size || S.filter.by != null || S.filter.src || S.filter.kind || S.filter.mine;

  function renderFilters() {
    const f = S.filter;
    const peopleLabel = f.people.size === 1 ? nameOf([...f.people][0]) : f.people.size ? `${T.people} · ${f.people.size}` : T.people;
    const chip = (label, on, onclick, n) => el("button", { class: "chip" + (on ? " on" : ""), type: "button", onclick }, label, n != null ? el("span", { class: "n", text: n }) : null);
    const mineCount = S.me ? S.photos.filter((p) => p.tags.includes(S.me.id)).length : null;
    // Photos and Videos once there are both; Uploads, Professional and Photo booth once there's
    // more than one of them. A chip that's on always shows, so it can be turned off.
    const vids = S.photos.filter(isVid).length, stills = S.photos.length - vids;
    const bySrc = { g: 0, p: 0, b: 0 };
    for (const p of S.photos) bySrc[p.src] = (bySrc[p.src] || 0) + 1;
    const sources = Object.values(bySrc).filter(Boolean).length;
    const kindChip = (k, label, n) => (vids && stills) || f.kind === k ? chip(label, f.kind === k, () => { f.kind = f.kind === k ? null : k; render(); }, n) : null;
    const srcChip = (k, label) => (sources > 1 && bySrc[k]) || f.src === k ? chip(label, f.src === k, () => { f.src = f.src === k ? null : k; render(); }, bySrc[k]) : null;
    const kinds = [kindChip("p", T.onlyPhotos, stills), kindChip("v", T.onlyVideos, vids)].filter(Boolean);
    const srcs = [srcChip("g", T.uploads), srcChip("p", T.pro), srcChip("b", T.booth)].filter(Boolean);
    const sep = () => el("span", { class: "sep", "aria-hidden": "true" });
    const bar = $("#filters"), had = [...bar.children].indexOf(document.activeElement);
    put(bar,
      chip(T.all, !filtered(), () => { S.filter = noFilter(); render(); }),
      kinds, kinds.length ? sep() : null,
      srcs, srcs.length ? sep() : null,
      // "Photos of me" only once there are some (or while it's on, so it can be turned off)
      S.me && (mineCount || f.mine) ? chip(T.ofMe, f.mine, () => { f.mine = !f.mine; render(); }, mineCount) : null,
      chip(peopleLabel + " ▾", f.people.size > 0, () => pickPeople()),
      chip((f.by != null ? nameOf(f.by) : T.uploadedBy) + " ▾", f.by != null, () => pickUploader()),
    );
    if (had >= 0) bar.children[Math.min(had, bar.children.length - 1)]?.focus({ preventScroll: true });
  }

  // ── grid ──────────────────────────────────────────────────────────────────
  const grid = $("#grid");
  const imgUrl = (size, id) => `${API}/img/${size}/${id}`;
  const fadeIn = (e) => { e.target.classList.add("in"); e.target.parentNode.classList.add("loaded"); };
  // A photo that won't load stops shimmering and shows a quiet placeholder instead.
  const failed = (e) => e.target.parentNode.classList.add("loaded", "broken");
  const smooth = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
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
  // The grid is display:none while it's empty, so measure the card it sits in until it has width.
  const gridWidth = () => grid.clientWidth || grid.parentElement.clientWidth;
  const rowsWidth = () => Math.max(200, gridWidth() - (innerWidth > 720 ? 32 : 8));
  const PERSON = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6"/></svg>';

  // Photos in timeline order, grouped by segment; the flat list matches the tile indices.
  function arrange(photos) {
    const groups = new Map(); // segment → photos, in segment order
    for (const p of photos) {
      const seg = segmentOf(p.t);
      (groups.get(seg) ?? groups.set(seg, []).get(seg)).push(p);
    }
    const ordered = [ENGAGEMENT, ...SEGMENTS, UNDATED].filter((s) => groups.has(s));
    return { groups, ordered, list: ordered.flatMap((s) => groups.get(s)) };
  }
  // What a screen reader hears for a tile: the moment, the time, and who's in it.
  const tileLabel = (p) => {
    const names = p.tags.map(nameOf).filter(Boolean);
    return [isVid(p) && `${T.video} ${fmtDur(p.dur)}`, segmentOf(p.t).title, p.t && fmtTime(p.t), names.length && T.withNames(names.join(", "))].filter(Boolean).join(", ");
  };
  const tagBadge = (p) => p.tags.length ? el("span", { class: "tagn", html: `${PERSON}${p.tags.length}` }) : null;
  const PLAY = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>';
  const videoBadge = (p) => isVid(p) ? el("span", { class: "vid", html: PLAY }, p.dur ? fmtDur(p.dur) : null) : null;

  function render() {
    newPill.hidden = true;
    const { groups, ordered, list } = arrange(applyFilter());
    // Visible order must match the tile indices used by the lightbox.
    S.visible = list;
    renderFilters();
    const frag = document.createDocumentFragment();
    const width = rowsWidth();
    lastWidth = gridWidth();
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
        el("small", { text: [seg.date || seg.time, countText(photos)].filter(Boolean).join(" · ") }),
        el("h2", {}, seg.title));
      const rows = justify(photos, width).map((r) => el("div", { class: "jrow", style: `height:${Math.round(r.h)}px` }, r.items.map(({ p, w }) => {
        const i = index++;
        return el("button", { class: "tile", type: "button", "data-i": i, "data-id": p.id, "data-seg": seg.key, "aria-label": tileLabel(p), style: `width:${w}px;height:${Math.round(r.h)}px`, onclick: () => openLightbox(i) },
          el("img", { src: imgUrl("thumb", p.id), alt: "", loading: "lazy", decoding: "async", onload: fadeIn, onerror: failed }),
          p.src !== "g" ? el("span", { class: "badge", text: p.src === "b" ? T.booth : T.pro }) : null,
          videoBadge(p),
          tagBadge(p));
      })));
      frag.append(el("section", { class: "group" + (seg.day === "wedding" ? " moment" : ""), id: "seg-" + seg.key, "data-seg": seg.key }, head, el("div", { class: "rows" }, rows)));
    }
    put(grid, frag);
    renderRail(ordered, groups);
    renderEmpty();
  }

  // After tags or times change: when the same photos show in the same places, only the tag
  // badges and labels are brought up to date; otherwise the grid is drawn again (or, under the
  // viewer, once it closes).
  function refresh() {
    const { list } = arrange(applyFilter());
    const tiles = grid.querySelectorAll(".tile");
    const same = tiles.length === list.length && list.every((p, i) => tiles[i].dataset.id === p.id && tiles[i].dataset.seg === segmentOf(p.t).key);
    if (!same) { if (lb.hidden) render(); else pendingRender = true; return; }
    list.forEach((p, i) => (S.visible[i] = p)); // same array, so the viewer's strip stays as it is
    renderFilters();
    list.forEach((p, i) => {
      const tile = tiles[i];
      tile.setAttribute("aria-label", tileLabel(p));
      tile.querySelector(".tagn")?.remove();
      const b = tagBadge(p);
      if (b) tile.append(b);
    });
  }

  // Re-flow the rows when the width really changes (rotation, window resize), not on scroll.
  let lastWidth = 0, resizeTimer = 0;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (S.photos.length && Math.abs(gridWidth() - lastWidth) > 8) render(); }, 150);
  });

  const rail = $("#rail");
  function renderRail(ordered, groups) {
    const links = [];
    let lastDay = null;
    for (const seg of ordered) {
      if (lastDay && (seg.day === "wedding") !== (lastDay === "wedding")) links.push(el("span", { class: "sep" }));
      lastDay = seg.day;
      links.push(el("a", { href: "#seg-" + seg.key, class: seg.day === "wedding" ? "sub" : null, "data-seg": seg.key,
        onclick: (e) => {
          e.preventDefault();
          // light the tapped section straight away, and keep it lit while the page scrolls there
          railHold = Date.now() + 1200;
          lightRail(seg.key);
          document.getElementById("seg-" + seg.key)?.scrollIntoView({ behavior: smooth() });
        } },
        seg.rail, el("span", { class: "n", text: groups.get(seg).length })));
    }
    put(rail, ...links);
    rail.hidden = ordered.length < 2;
    litKey = null;
    syncRail();
  }

  // The rail lights the section whose heading has reached the bottom of the sticky bars.
  let litKey = null, railHold = 0, railFrame = 0;
  function lightRail(key) {
    if (key === litKey) return;
    litKey = key;
    for (const a of rail.querySelectorAll("a")) {
      const on = a.dataset.seg === key;
      a.classList.toggle("on", on);
      // on phones the rail scrolls sideways: keep the lit one in view
      if (on && rail.scrollWidth > rail.clientWidth) {
        const r = a.getBoundingClientRect(), box = rail.getBoundingClientRect();
        rail.scrollTo({ left: rail.scrollLeft + r.left - box.left - (box.width - r.width) / 2, behavior: smooth() });
      }
    }
  }
  function syncRail() {
    if (Date.now() < railHold || rail.hidden) return;
    const line = $("#bars").getBoundingClientRect().bottom + 40;
    let key = null;
    for (const g of grid.querySelectorAll(".group")) {
      if (key && g.getBoundingClientRect().top > line) break;
      key = g.dataset.seg;
    }
    lightRail(key);
  }
  addEventListener("scroll", () => { cancelAnimationFrame(railFrame); railFrame = requestAnimationFrame(syncRail); }, { passive: true });

  function renderEmpty() {
    const box = $("#empty");
    // No photos at all yet: nothing to filter, so no filter bar.
    $("#bars").hidden = S.photos.length === 0;
    box.hidden = S.visible.length > 0;
    if (box.hidden) return;
    if (filtered()) {
      put(box, el("p", { text: T.empty }),
        el("button", { class: "btn", type: "button", text: T.clearFilters, onclick: () => { S.filter = noFilter(); render(); } }));
    } else if (canUpload()) {
      // the header's Add photos is just above, so the note needs no button of its own
      put(box, el("p", { text: T.emptyAll }));
    } else {
      put(box, el("p", { text: T.firstSoon }));
    }
  }

  // ── sheets ────────────────────────────────────────────────────────────────
  const wrap = $("#sheet-wrap"), sheet = $("#sheet");
  let sheetClose = null, sheetReturn = null;
  // While the viewer or a sheet is open, the page behind can't be reached by Tab or a screen
  // reader; a sheet over the viewer shuts the viewer off too.
  function syncInert() {
    const open = !$("#lightbox").hidden || !wrap.hidden;
    for (const n of [$(".sp-card"), $("#site-header"), $("#tray"), $("#new-pill")]) n?.toggleAttribute("inert", open);
    $("#lightbox").toggleAttribute("inert", !wrap.hidden);
  }
  // Focus goes back where it came from, if that's still on the page.
  const canFocus = (n) => n && n.isConnected && n !== document.body && !n.closest("[hidden],[inert]");
  function openSheet(build, onClose) {
    const back = sheetClose ? sheetReturn : document.activeElement;
    sheetClose?.(undefined, true);
    sheetReturn = back;
    put(sheet, ...build());
    sheet.setAttribute("aria-label", sheet.querySelector(".q")?.textContent || "");
    wrap.hidden = false;
    document.body.classList.add("locked");
    syncInert();
    return new Promise((resolve) => {
      sheetClose = (value, silent) => {
        sheetClose = null;
        wrap.hidden = true;
        if ($("#lightbox").hidden) document.body.classList.remove("locked");
        syncInert();
        if (!silent) {
          const to = canFocus(sheetReturn) ? sheetReturn : !$("#lightbox").hidden ? $("#lb-close") : null;
          sheetReturn = null;
          to?.focus({ preventScroll: true });
          onClose?.(value);
        }
        resolve(value);
      };
      setTimeout(() => (sheet.querySelector("input") || sheet.querySelector("button"))?.focus({ preventScroll: true }), 60);
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
      el("button", { type: "button", "aria-label": T.remove(nameOf(id) || "—"), text: "×", onclick: () => { chosen.delete(id); draw(); } }))));
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
  const lb = $("#lightbox"), lbImg = $("#lb-img"), lbVideo = $("#lb-video"), lbInfo = $("#lb-info");
  // what's on show in the viewer: the photo, or the video player
  const lbMedia = () => (lbVideo.hidden ? lbImg : lbVideo);
  // Leaving a video stops it, and stops it downloading.
  function stopVideo() {
    if (!lbVideo.getAttribute("src")) return;
    lbVideo.pause();
    lbVideo.removeAttribute("src");
    lbVideo.removeAttribute("poster");
    lbVideo.load();
  }
  lb.setAttribute("aria-label", T.viewer);
  $("#lb-prev").setAttribute("aria-label", T.prev);
  $("#lb-next").setAttribute("aria-label", T.nextPhoto);
  $("#lb-close").setAttribute("aria-label", T.close);
  // One way of writing times everywhere, as the timeline does: "2:00 PM".
  const fmtTime = (t) => { const h = +t.slice(11, 13); return `${h % 12 || 12}:${t.slice(14, 16)} ${h < 12 ? "AM" : "PM"}`; };
  const fmtDate = (t) => {
    const d = new Date(t.slice(0, 10) + "T12:00:00Z");
    const part = (k) => d.toLocaleDateString(LANG === "es" ? "es-MX" : "en-GB", { timeZone: "UTC", [k]: k === "day" ? "numeric" : "long" });
    const s = LANG === "es" ? `${part("weekday")} ${part("day")} de ${part("month")}` : `${part("weekday")} ${part("day")} ${part("month")}`;
    return s[0].toUpperCase() + s.slice(1);
  };
  const fmtWhen = (t) => `${fmtDate(t)} · ${fmtTime(t)}`;

  let lbReturn = null;
  function openLightbox(i, push = true) {
    if (!S.visible[i]) return;
    S.lbIndex = i;
    const opening = lb.hidden;
    if (opening) lbReturn = document.activeElement;
    lb.hidden = false;
    document.body.classList.add("locked");
    syncInert();
    if (push) history.pushState({ lb: true }, "", "#" + S.visible[i].id);
    else history.replaceState({ lb: true }, "", "#" + S.visible[i].id);
    showPhoto();
    if (opening) $("#lb-close").focus({ preventScroll: true });
  }
  function closeLightbox(fromPop = false) {
    if (lb.hidden) return;
    const id = S.visible[S.lbIndex]?.id;
    stopVideo();
    lb.hidden = true;
    delete strip.dataset.ready;
    document.body.classList.remove("locked");
    syncInert();
    S.lbIndex = -1;
    if (!fromPop && history.state?.lb) history.back();
    if (pendingRender) { pendingRender = false; refresh(); }
    // Back to the photo last seen; focus returns to what opened the viewer, or to that photo.
    const tile = id && grid.querySelector(`.tile[data-id="${id}"]`);
    tile?.scrollIntoView({ block: "nearest" });
    const back = lbReturn;
    lbReturn = null;
    (canFocus(back) && !back.classList.contains("tile") ? back : tile)?.focus({ preventScroll: true });
  }
  addEventListener("popstate", () => closeLightbox(true));

  function goTo(i) {
    if (i < 0 || i >= S.visible.length || i === S.lbIndex) return;
    S.lbIndex = i;
    history.replaceState({ lb: true }, "", "#" + S.visible[i].id);
    showPhoto();
  }
  const step = (d) => goTo(S.lbIndex + d);

  // Every photo along the bottom, the current one lit and kept in the middle: tap one to jump.
  const strip = $("#lb-strip");
  let stripFor = null;
  function renderStrip() {
    if (stripFor !== S.visible) {
      stripFor = S.visible;
      put(strip, S.visible.map((p, i) => el("button", { type: "button", class: isVid(p) ? "v" : null, "aria-label": `${i + 1} / ${S.visible.length}`, onclick: () => goTo(i) },
        el("img", { src: imgUrl("thumb", p.id), alt: "", loading: "lazy", decoding: "async" }))));
    }
    lb.classList.toggle("has-strip", S.visible.length > 1);
    strip.querySelector(".on")?.classList.remove("on");
    const cur = strip.children[S.lbIndex];
    if (!cur) return;
    cur.classList.add("on");
    strip.scrollTo({ left: cur.offsetLeft - (strip.clientWidth - cur.offsetWidth) / 2, behavior: strip.dataset.ready ? smooth() : "auto" });
    strip.dataset.ready = "1";
  }

  function showPhoto() {
    const p = S.visible[S.lbIndex];
    if (!p) return closeLightbox();
    stopVideo();
    lbImg.hidden = isVid(p);
    lbVideo.hidden = !isVid(p);
    if (isVid(p)) {
      // the still shows until it plays; the file streams in only once play is pressed
      lbVideo.poster = imgUrl("display", p.id);
      lbVideo.src = imgUrl("orig", p.id);
      lbVideo.setAttribute("aria-label", `${T.video} · ${segmentOf(p.t).title}`);
    } else {
      lbImg.style.opacity = ".35";
      lbImg.onload = () => (lbImg.style.opacity = "1");
      lbImg.src = imgUrl("display", p.id);
      lbImg.alt = segmentOf(p.t).title;
    }
    for (const n of [S.visible[S.lbIndex + 1], S.visible[S.lbIndex - 1]]) if (n) new Image().src = imgUrl("display", n.id);
    $("#lb-count").textContent = `${S.lbIndex + 1} / ${S.visible.length}`;
    $("#lb-prev").hidden = S.lbIndex === 0;
    $("#lb-next").hidden = S.lbIndex === S.visible.length - 1;
    renderStrip();
    renderInfo(p);
  }

  function renderInfo(p) {
    const seg = segmentOf(p.t);
    const when = p.t ? fmtWhen(p.t) : T.unknownTime;
    const who = p.src === "b" ? T.byBooth : p.src === "p" ? (isVid(p) ? T.byVideographer : T.byPhotographer) : T.sharedBy(nameOf(p.by) || T.someone);
    const tags = p.tags.map((id) => el("span", { class: "tag" }, nameOf(id) || "—",
      el("button", { type: "button", "aria-label": T.remove(nameOf(id) || "—"), text: "×", onclick: () => untag(p, id) })));
    const hadFocus = lbInfo.contains(document.activeElement);
    put(lbInfo,
      el("div", {},
        el("p", { class: "lb-when" }, when, p.ts === "file" ? el("em", { text: ` · ${T.approx}` }) : null),
        el("p", { class: "lb-sub", text: [seg.title, who].join(" · ") })),
      el("div", {},
        el("span", { class: "meta-label", text: isVid(p) ? T.inVideo : T.inPhoto }),
        el("div", { class: "tags" }, ...tags, el("button", { class: "tag add", type: "button", text: T.tagSomeone, onclick: () => tagSomeone(p) }))),
      p.cam ? el("div", {}, el("span", { class: "meta-label", text: T.camera }), el("p", { class: "lb-sub", text: p.cam })) : null,
      S.admin ? el("div", {}, el("span", { class: "meta-label", text: T.showAs }), sourceTabs(p.src, (k) => setSource(p, k))) : null,
      el("div", { class: "lb-actions" },
        el("a", { class: "btn small", href: imgUrl("orig", p.id) + "?dl=1", download: "" }, isVid(p) ? T.downloadVideo : T.download),
        isMine(p) ? el("button", { class: "btn small", type: "button", text: T.fixTime, onclick: () => fixTime(p) }) : null,
        isMine(p) ? el("button", { class: "btn small danger", type: "button", text: T.del, onclick: () => remove(p) }) : null),
    );
    // the button that was focused has just been replaced: carry on from "+ Tag someone"
    if (hadFocus) lbInfo.querySelector(".tag.add")?.focus({ preventScroll: true });
  }

  // Uploads · Professional · Photo booth, as three tabs (admins only)
  const SOURCES = [["g", "guest"], ["p", "photographer"], ["b", "booth"]];
  const sourceTabs = (on, pick) => el("div", { class: "seg-tabs" }, SOURCES.map(([k]) =>
    el("button", { type: "button", "aria-pressed": String(on === k), text: { g: T.uploads, p: T.pro, b: T.booth }[k], onclick: () => pick(k) })));
  async function setSource(p, k) {
    const before = p.src;
    if (k === before) return;
    p.src = k;
    renderInfo(p);
    try {
      await api(`/api/photos/${p.id}`, { method: "PATCH", json: { source: Object.fromEntries(SOURCES)[k] } });
      pendingRender = true; // badges and chips, once the viewer closes
    } catch { p.src = before; renderInfo(p); toast(T.error); }
  }

  $("#lb-close").addEventListener("click", () => closeLightbox());
  $("#lb-prev").addEventListener("click", () => step(-1));
  $("#lb-next").addEventListener("click", () => step(1));
  addEventListener("keydown", (e) => {
    if (lb.hidden || !wrap.hidden) { if (e.key === "Escape" && !wrap.hidden) closeSheet(undefined); return; }
    // with the player focused, the arrows move through the video rather than to the next photo
    if (document.activeElement === lbVideo && e.key.startsWith("Arrow")) return;
    if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "Escape") closeLightbox();
  });
  // Swipe between photos; a downward swipe closes. The photo itself takes every touch
  // (touch-action:none), so the phone doesn't claim a downward drag as a page scroll.
  {
    const stage = $("#lb-stage");
    let x0 = null, y0 = 0;
    // the photo follows the finger, then springs back with its transition restored
    let moving = lbImg;
    const settle = () => { x0 = null; moving.style.transition = ""; moving.style.transform = ""; };
    stage.addEventListener("pointerdown", (e) => {
      if (e.button > 0 || e.target.closest("button, .lb-strip")) return;
      // On a video, only a finger swipes, and not along the bottom where the player's own
      // controls are; a mouse there is working the player, so the stage leaves it alone.
      if (e.target === lbVideo && (e.pointerType !== "touch" || e.clientY > lbVideo.getBoundingClientRect().bottom - 64)) return;
      x0 = e.clientX; y0 = e.clientY;
      moving = lbMedia();
      if (e.target !== lbVideo) stage.setPointerCapture?.(e.pointerId);
      moving.style.transition = "none";
    });
    stage.addEventListener("pointermove", (e) => {
      if (x0 == null) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      moving.style.transform = Math.abs(dx) >= Math.abs(dy) ? `translateX(${dx * 0.6}px)` : `translateY(${Math.max(0, dy) * 0.6}px)`;
    });
    stage.addEventListener("pointerup", (e) => {
      if (x0 == null) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      settle();
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) closeLightbox();
    });
    stage.addEventListener("pointercancel", settle);
  }

  // Everyone in the photo at once: tap names on and off, then Done.
  async function tagSomeone(p) {
    const chosen = await namePicker({ title: T.tagSomeone.replace("+ ", ""), q: isVid(p) ? T.whoInVideo : T.tagQ, hint: T.tagHint, multi: true, allowAdd: true,
      selected: new Set(p.tags), okLabel: T.done, cancelLabel: T.cancel, cancelValue: () => null });
    if (chosen) await setTags(p, chosen);
  }
  async function untag(p, id) {
    const name = nameOf(id) || "—";
    if (await setTags(p, new Set(p.tags.filter((x) => x !== id))))
      toast(T.untagged(name), { label: T.undo, run: () => setTags(p, new Set([...p.tags, id])) });
  }
  // Apply a new set of tags: add who's new, drop who's gone. Shown at once, put back if it fails.
  async function setTags(p, chosen) {
    const before = p.tags;
    const add = [...chosen].filter((id) => !before.includes(id));
    const drop = before.filter((id) => !chosen.has(id));
    if (!add.length && !drop.length) return true;
    const show = () => { if (!lb.hidden && S.visible[S.lbIndex] === p) renderInfo(p); refresh(); };
    p.tags = [...chosen];
    show();
    try {
      await Promise.all([
        ...add.map((id) => api(`/api/photos/${p.id}/tags`, { method: "POST", json: { guestId: id, by: S.me?.id ?? null } })),
        ...drop.map((id) => api(`/api/photos/${p.id}/tags/${id}`, { method: "DELETE" })),
      ]);
      return true;
    } catch { p.tags = before; show(); toast(T.error); return false; }
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
    const sure = await openSheet(() => [
      el("img", { class: "preview", src: imgUrl("display", p.id), alt: "" }),
      el("p", { class: "q", text: isVid(p) ? T.delTitleVideo : T.delTitle }),
      el("p", { class: "hint", text: T.delHint }),
      el("div", { class: "sheet-foot" },
        el("button", { class: "btn", type: "button", text: T.keep, onclick: () => closeSheet(false) }),
        el("button", { class: "btn solid danger", type: "button", text: T.del, onclick: () => closeSheet(true) })),
    ]);
    if (!sure) return;
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

  let finishing = false; // between the last upload ending and the thank-you (tagging runs here)
  const busyNow = () => queue.some((x) => x.state === "waiting" || x.state === "working");
  // Items leave the queue (and let go of their thumbnails' memory) unless keep() says not to.
  function clearQueue(keep = () => false) {
    for (let i = queue.length - 1; i >= 0; i--) {
      if (keep(queue[i])) continue;
      if (queue[i].thumbUrl) URL.revokeObjectURL(queue[i].thumbUrl);
      queue.splice(i, 1);
    }
  }
  // Failures that trying again can't fix.
  const FINAL = new Set(["tooBig", "tooBigVideo", "too_big", "unreadable", "not_an_image", "not_a_video", "too_many", "uploads_closed"]);
  const retryable = (it) => !FINAL.has(it.error?.code || it.error?.message);
  const sameFile = (a, b) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
  function addFiles(files) {
    // A new batch: what's already shared makes way, but anything that failed stays, to retry.
    if (!busyNow() && !finishing) { clearQueue((it) => it.state === "failed"); batchStart = Date.now(); }
    for (const file of files) {
      // the same file picked again (unsure it went) isn't sent twice; a failed one is retried
      const known = queue.find((it) => sameFile(it.file, file));
      if (known) { if (known.state === "failed" && retryable(known)) { known.state = "waiting"; known.error = null; } continue; }
      queue.push({ file, state: "waiting", thumbUrl: null, id: null, error: null });
    }
    holdScreen();
    renderTray();
    pump();
  }

  // Keep the screen on while sharing: a phone that locks pauses the upload. The browser lets go
  // of this whenever the page is hidden, so it's asked for again on the way back.
  async function holdScreen() {
    if (wakeLock && !wakeLock.released) return;
    try { wakeLock = (await navigator.wakeLock?.request("screen")) || null; } catch {}
  }
  function releaseScreen() { wakeLock?.release?.().catch(() => {}); wakeLock = null; }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && busyNow()) holdScreen(); });

  function pump() {
    while (active < CONCURRENCY) {
      const it = queue.find((x) => x.state === "waiting");
      if (!it) break;
      active++;
      it.state = "working";
      it.waiting = false;
      upload(it).catch((err) => { it.state = "failed"; it.error = err; })
        .finally(() => { it.waiting = false; active--; renderTray(); pump(); if (!active && !queue.some((x) => x.state === "waiting")) batchDone(); });
    }
  }

  const isVideoFile = (f) => /^video\//.test(f.type) || /\.(mov|mp4|m4v|webm|3gp|3g2)$/i.test(f.name);
  const isPhotoFile = (f) => /^image\//.test(f.type) || /\.(heic|heif)$/i.test(f.name);

  async function upload(it) {
    const video = (it.video = isVideoFile(it.file));
    if (video && it.file.size > (S.admin ? VIDEO_MAX_ADMIN : VIDEO_MAX)) throw new Error("tooBigVideo");
    if (!video && it.file.size > MAX_BYTES) throw new Error("tooBig");
    const prep = await prepareInTurn(it.file, video);
    it.thumbUrl = URL.createObjectURL(prep.thumb);
    renderTray();
    const onWait = () => { it.waiting = true; renderTray(); };
    const arrived = () => { if (it.waiting) { it.waiting = false; renderTray(); } };
    const created = await withRetry(() => api("/api/photos", { method: "POST", json: {
      sha256: prep.sha256, takenLocal: prep.takenLocal, timeSource: prep.timeSource, camera: prep.camera,
      width: prep.width, height: prep.height, bytes: it.file.size, origType: it.file.type || null, uploaderId: S.me?.id ?? null,
      kind: video ? "video" : "photo", duration: prep.duration ?? null, source: Object.fromEntries(SOURCES)[adminSource()],
    } }), onWait);
    arrived();
    it.id = created.id;
    it.existing = created.existing && !created.missing.length;
    // the same photo picked twice under different names: the other copy is already sending it
    if (queue.some((x) => x !== it && x.id === it.id && x.state === "working")) it.existing = true;
    const bodies = { orig: it.file, display: prep.display, thumb: prep.thumb };
    try {
      // a video's still goes first, then the long part: the file itself, piece by piece
      if (!it.existing) for (const size of [...created.missing].sort((a, b) => (a === "orig") - (b === "orig"))) {
        if (video && size === "orig") await sendVideo(it, created.id, onWait, arrived);
        else { await withRetry(() => api(`/api/photos/${created.id}/${size}`, { method: "PUT", body: bodies[size] }), onWait); arrived(); }
      }
    } catch (err) {
      // another phone has taken this file over and is sending it: it's in good hands
      if (err.code !== "not_yours") throw err;
      it.existing = true;
    }
    it.state = "done";
  }

  // The video in equal pieces, one after another: a dropped connection only costs a piece.
  // What's been sent is remembered on this phone, so "Try again" (or picking the video again
  // after the page was closed) carries on from the last piece rather than starting over.
  async function sendVideo(it, id, onWait, arrived) {
    const file = it.file, count = Math.max(1, Math.ceil(file.size / PART));
    const key = `wedding-gallery-upload-${id}`;
    const fresh = () => ({ size: file.size, part: PART, upload: null, parts: [] });
    let saved = null;
    try { saved = JSON.parse(store.get(key, "null")); } catch {}
    if (!saved || saved.size !== file.size || saved.part !== PART || !Array.isArray(saved.parts)) saved = fresh();
    const save = () => store.set(key, JSON.stringify(saved));
    for (let n = saved.parts.length + 1; n <= count; n++) {
      it.sent = Math.min(file.size, (n - 1) * PART);
      renderTray();
      const piece = file.slice((n - 1) * PART, Math.min(file.size, n * PART));
      const q = `n=${n}` + (saved.upload ? `&upload=${encodeURIComponent(saved.upload)}` : "");
      let r;
      try {
        // a long video gets more patience per piece than a photo does
        r = await withRetry(() => api(`/api/photos/${id}/orig/part?${q}`, { method: "PUT", body: piece }), onWait, 16);
      } catch (err) {
        // The upload it was adding to has gone (R2 drops unfinished ones after a week): start
        // over, once.
        if (err.code === "upload" && saved.upload && !it.restarted) { it.restarted = true; saved = fresh(); save(); n = 0; continue; }
        throw err;
      }
      arrived();
      saved.upload = r.upload;
      saved.parts.push(r.part);
      save();
    }
    it.sent = file.size;
    renderTray();
    await withRetry(() => api(`/api/photos/${id}/orig/complete`, { method: "POST", json: { upload: saved.upload, parts: saved.parts } }), onWait, 16);
    store.set(key, null);
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

  // Decoding and resizing a big photo takes a lot of memory on a phone, so photos are prepared
  // one at a time; uploads still run two at once.
  let prepTurn = Promise.resolve();
  function prepareInTurn(file, video) {
    const run = prepTurn.then(() => (video ? prepareVideo(file) : prepare(file)));
    prepTurn = run.catch(() => {});
    return run;
  }

  // A phone often stamps a picked file with the moment it was picked (or re-encoded), which
  // would file it under today. A time from the last few minutes is no time at all: the photo
  // goes under "Date unknown", where whoever shared it can set it.
  const RECENT_MS = 10 * 60 * 1000;
  const fileTimeUseful = (file) => !!file.lastModified && Date.now() - file.lastModified > RECENT_MS;

  async function prepare(file) {
    const [exif, buf] = await Promise.all([
      // The lite build can't use exifr's `pick`; naming the fields per block reads only those.
      window.exifr ? exifr.parse(file, { ifd0: ["Make", "Model"], exif: ["DateTimeOriginal", "CreateDate", "OffsetTimeOriginal", "OffsetTime"], reviveValues: false }).catch(() => null) : null,
      file.arrayBuffer(),
    ]);
    const e = exif || {};
    let takenLocal = exifTime(e.DateTimeOriginal || e.CreateDate, e.OffsetTimeOriginal || e.OffsetTime);
    let timeSource = "exif";
    if (!takenLocal && fileTimeUseful(file)) { takenLocal = isoLocal(new Date(file.lastModified + MX_OFFSET_MIN * 60000)); timeSource = "file"; }
    const make = (e.Make || "").trim(), model = (e.Model || "").trim();
    const camera = (model.toLowerCase().startsWith(make.toLowerCase()) ? model : [make, model].join(" ")).trim() || null;

    const sha = await crypto.subtle.digest("SHA-256", buf);
    const sha256 = [...new Uint8Array(sha)].map((b) => b.toString(16).padStart(2, "0")).join("");

    // An <img> applies the EXIF rotation in every current browser, and Safari decodes HEIC.
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    try { await img.decode(); } catch {
      // Safari's decode() can turn down a very large photo that still loads the ordinary way
      if (!img.naturalWidth) await new Promise((resolve) => { img.onload = img.onerror = resolve; setTimeout(resolve, 20000); if (img.complete) resolve(); });
      if (!img.naturalWidth) { URL.revokeObjectURL(url); throw new Error("unreadable"); }
    }
    const width = img.naturalWidth, height = img.naturalHeight;
    const display = await scaled(img, width, height, DISPLAY_EDGE, 0.85);
    URL.revokeObjectURL(url);
    const dispImg = await createImageBitmap(display).catch(() => null);
    const thumb = dispImg ? await scaled(dispImg, dispImg.width, dispImg.height, THUMB_EDGE, 0.78) : await scaled(img, width, height, THUMB_EDGE, 0.78);
    dispImg?.close?.();
    return { sha256, takenLocal, timeSource, camera, width, height, display, thumb };
  }

  // ── videos: a still, the time and the camera, without reading the whole file ──
  async function prepareVideo(file) {
    const meta = await videoMeta(file).catch(() => ({}));
    let takenLocal = meta.taken || null, timeSource = "exif";
    if (!takenLocal && fileTimeUseful(file)) { takenLocal = isoLocal(new Date(file.lastModified + MX_OFFSET_MIN * 60000)); timeSource = "file"; }
    const sha256 = await sampleHash(file);
    // A browser that can't play the file (a computer without the codec) still shares it,
    // with a plain still; anyone whose browser can play it still can.
    const still = (await videoStill(file).catch(() => null)) || (await blankStill());
    return { sha256, takenLocal, timeSource, camera: meta.camera || null, ...still, duration: still.duration ?? meta.duration ?? null };
  }

  // A video can be gigabytes, too much to read into a phone's memory just to recognise it
  // later. Its size and three 2 MB samples (start, middle, end) are enough.
  async function sampleHash(file) {
    const SAMPLE = 2 * 1024 * 1024;
    const pieces = file.size <= 3 * SAMPLE ? [file]
      : [file.slice(0, SAMPLE), file.slice(Math.floor(file.size / 2 - SAMPLE / 2), Math.floor(file.size / 2 + SAMPLE / 2)), file.slice(file.size - SAMPLE)];
    const buf = await new Blob([`video:${file.size}:`, ...pieces]).arrayBuffer();
    const d = await crypto.subtle.digest("SHA-256", buf);
    return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // A frame a moment in (past any fade from black), at the size photos get.
  async function videoStill(file) {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
    // in the page but out of sight: Safari only paints frames for a video that's in the page
    v.style.cssText = "position:fixed;left:-10px;top:0;width:2px;height:2px;opacity:0;pointer-events:none";
    const wait = (ev, ms) => new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("unreadable")), ms);
      v.addEventListener(ev, () => { clearTimeout(t); resolve(); }, { once: true });
      v.addEventListener("error", () => { clearTimeout(t); reject(new Error("unreadable")); }, { once: true });
    });
    // the next frame actually painted, where the browser can say so
    const painted = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); v.requestVideoFrameCallback?.(() => resolve()); });
    try {
      document.body.append(v);
      v.src = url;
      await wait("loadedmetadata", 20000);
      const duration = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : null;
      // Seeking makes even iPhone Safari, which won't load a video it isn't playing, fetch a frame.
      v.currentTime = duration ? Math.min(1, duration / 3) : 0.001;
      await wait("seeked", 20000);
      await painted(600);
      const width = v.videoWidth, height = v.videoHeight;
      if (!width || !height) throw new Error("unreadable");
      // Safari can hand over a black frame for a paused video; playing it a moment fixes that.
      if (isBlank(v, width, height)) {
        await v.play().catch(() => {});
        await painted(1500);
        v.pause();
        if (isBlank(v, width, height)) throw new Error("unreadable");
      }
      const display = await scaled(v, width, height, DISPLAY_EDGE, 0.85);
      const dispImg = await createImageBitmap(display).catch(() => null);
      const thumb = dispImg ? await scaled(dispImg, dispImg.width, dispImg.height, THUMB_EDGE, 0.78) : await scaled(v, width, height, THUMB_EDGE, 0.78);
      dispImg?.close?.();
      return { width, height, display, thumb, duration };
    } finally {
      v.removeAttribute("src");
      v.load();
      v.remove();
      URL.revokeObjectURL(url);
    }
  }
  // Pure black, as an undecoded frame is (even a dark dance floor has some light in it).
  function isBlank(source, w, h) {
    const c = document.createElement("canvas");
    c.width = c.height = 24;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(source, 0, 0, w, h, 0, 0, 24, 24);
    const px = ctx.getImageData(0, 0, 24, 24).data;
    for (let i = 0; i < px.length; i += 4) if (px[i] > 2 || px[i + 1] > 2 || px[i + 2] > 2) return false;
    return true;
  }

  // espresso with a cream play mark, 16:9
  async function blankStill() {
    const c = document.createElement("canvas");
    c.width = 1280; c.height = 720;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#3a2a22";
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = "rgba(250,245,238,.85)";
    ctx.beginPath(); ctx.moveTo(590, 300); ctx.lineTo(590, 420); ctx.lineTo(690, 360); ctx.closePath(); ctx.fill();
    const display = await scaled(c, 1280, 720, DISPLAY_EDGE, 0.85);
    const thumb = await scaled(c, 1280, 720, THUMB_EDGE, 0.78);
    return { width: 1280, height: 720, display, thumb, duration: null };
  }

  // When it was filmed, and on what, from the MP4/QuickTime boxes. Only the top-level box
  // headers and the 'moov' box (the index, at the start or the end of the file) are read.
  //  - an iPhone's com.apple.quicktime.creationdate has local time and its offset: exact;
  //  - otherwise mvhd's creation time, which cameras write in UTC (some write 0: ignored).
  async function videoMeta(file) {
    const view = async (from, to) => new DataView(await file.slice(from, to).arrayBuffer());
    const four = (dv, at) => String.fromCharCode(dv.getUint8(at), dv.getUint8(at + 1), dv.getUint8(at + 2), dv.getUint8(at + 3));
    let off = 0, moov = null;
    for (let i = 0; i < 100 && off + 8 <= file.size; i++) {
      const h = await view(off, off + 16);
      let size = h.getUint32(0), head = 8;
      const type = four(h, 4);
      if (size === 1) { size = Number(h.getBigUint64(8)); head = 16; } else if (size === 0) size = file.size - off;
      if (size < head) break;
      if (type === "moov") { if (size <= 64 * 1024 * 1024) moov = await view(off + head, off + size); break; }
      off += size;
    }
    if (!moov) return {};
    // the boxes inside dv from start to end, as { type, at (content start), end }
    const boxes = (dv, start, end) => {
      const out = [];
      for (let at = start; at + 8 <= end; ) {
        let size = dv.getUint32(at), head = 8;
        if (size === 1 && at + 16 <= end) { size = Number(dv.getBigUint64(at + 8)); head = 16; } else if (size === 0) size = end - at;
        if (size < head || at + size > end) break;
        out.push({ type: four(dv, at + 4), at: at + head, end: at + size });
        at += size;
      }
      return out;
    };
    const find = (dv, list, type) => list.find((b) => b.type === type);
    const top = boxes(moov, 0, moov.byteLength);
    const out = {};

    const mvhd = find(moov, top, "mvhd");
    if (mvhd) {
      const v1 = moov.getUint8(mvhd.at) === 1;
      const created = v1 ? Number(moov.getBigUint64(mvhd.at + 4)) : moov.getUint32(mvhd.at + 4);
      const scale = moov.getUint32(mvhd.at + (v1 ? 20 : 12));
      const dur = v1 ? Number(moov.getBigUint64(mvhd.at + 24)) : moov.getUint32(mvhd.at + 16);
      if (scale) out.duration = dur / scale;
      const ms = (created - 2082844800) * 1000; // seconds since 1904
      if (ms > Date.UTC(2000, 0, 1) && ms < Date.UTC(2100, 0, 1) && Math.abs(Date.now() - ms) > RECENT_MS) out.taken = isoLocal(new Date(ms + MX_OFFSET_MIN * 60000));
    }

    // QuickTime metadata: moov/meta holds 'keys' (names) and 'ilst' (values, by key number).
    // In a QuickTime file 'meta' is a plain box; in an MP4 it has 4 bytes of version first.
    const metaBox = find(moov, top, "meta");
    if (metaBox) {
      const start = four(moov, metaBox.at + 4) === "hdlr" ? metaBox.at : metaBox.at + 4;
      const inner = boxes(moov, start, metaBox.end);
      const keys = find(moov, inner, "keys"), ilst = find(moov, inner, "ilst");
      if (keys && ilst) {
        const names = [];
        for (let at = keys.at + 8, n = moov.getUint32(keys.at + 4); n-- > 0 && at + 8 <= keys.end; ) {
          const size = moov.getUint32(at);
          if (size < 8) break;
          names.push(new TextDecoder().decode(new Uint8Array(moov.buffer, moov.byteOffset + at + 8, size - 8)));
          at += size;
        }
        const values = {};
        for (const item of boxes(moov, ilst.at, ilst.end)) {
          const name = names[moov.getUint32(item.at - 4) - 1];
          const data = boxes(moov, item.at, item.end).find((b) => b.type === "data");
          if (!name || !data || data.end - data.at < 8) continue;
          values[name] = new TextDecoder().decode(new Uint8Array(moov.buffer, moov.byteOffset + data.at + 8, data.end - data.at - 8));
        }
        const m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(?:\.\d+)?(Z|[+-]\d\d:?\d\d)?/.exec(values["com.apple.quicktime.creationdate"] || "");
        if (m) out.taken = exifTime(`${m[1]}:${m[2]}:${m[3]} ${m[4]}:${m[5]}:${m[6]}`, m[7] === "Z" ? "+00:00" : m[7]) || out.taken;
        const make = (values["com.apple.quicktime.make"] || "").trim(), model = (values["com.apple.quicktime.model"] || "").trim();
        out.camera = (model.toLowerCase().startsWith(make.toLowerCase()) ? model : [make, model].join(" ")).trim() || null;
      }
    }
    return out;
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
    const waiting = queue.some((x) => x.state === "working" && x.waiting);
    // photos that were already in the gallery are counted on their own, not as shared
    const dup = queue.filter((x) => x.state === "done" && x.existing).length;
    // a video takes a while: its share of the bar fills as its pieces go, with a percentage
    const going = queue.filter((x) => x.state === "working" && x.video && x.sent);
    const partly = going.reduce((sum, x) => sum + x.sent / x.file.size, 0);
    const pct = going.length ? ` · ${Math.floor((going[0].sent / going[0].file.size) * 100)}%` : "";
    const as = adminSource() !== "g" ? ` · ${T.uploadingAs({ p: T.pro, b: T.booth }[adminSource()])}` : "";
    const head = busy ? (waiting ? T.offline : T.uploading(Math.min(done + 1, total), total) + pct + as)
      : [done - dup || !dup ? sharedText(queue.filter((x) => x.state === "done" && !x.existing)) : null, dup ? T.already(dup) : null].filter(Boolean).join(" · ");
    tray.hidden = false;
    put(tray, 
      el("div", { class: "tray-head" }, el("span", { text: head }), busy ? null : el("button", { type: "button", "aria-label": T.done, text: "×", onclick: () => { clearQueue(); renderTray(); } })),
      el("div", { class: "bar" }, el("i", { style: `width:${Math.round(((done + failed.length + partly) / total) * 100)}%` })),
      el("div", { class: "tray-thumbs" }, queue.map((it) => el("button", { type: "button", class: it.state + (it.video ? " v" : ""), onclick: () => it.state === "done" && openById(it.id) },
        it.thumbUrl ? el("img", { src: it.thumbUrl, alt: "" }) : null,
        el("span", { class: "state", text: it.state === "failed" ? "!" : "…" })))),
      // the reason that matters: one that trying again might fix, if there is one
      failed.length ? el("p", { class: "tray-note" }, `${T.failed(failed.length)}: ${reason(failed.find(retryable) || failed[0])} `,
        failed.some(retryable) ? el("button", { class: "btn small", type: "button", text: T.retry, onclick: () => {
          failed.filter(retryable).forEach((x) => { x.state = "waiting"; x.error = null; });
          holdScreen(); renderTray(); pump();
        } }) : null) : null,
    );
  }
  // Why a photo couldn't be shared, in words. A computer that can't open a HEIC says so, rather
  // than blaming "this phone".
  const PHONE = matchMedia("(pointer: coarse)").matches;
  const isHeic = (f) => /hei[cf]/i.test(f.type) || /\.(heic|heif)$/i.test(f.name);
  function reason(it) {
    const code = it.error?.code || it.error?.message;
    if (code === "unreadable") return isHeic(it.file) ? (PHONE ? T.heicPhone : T.heicHere) : PHONE ? T.unreadable : T.unreadableHere;
    const videoMax = T.tooBigVideo(Math.round((S.admin ? VIDEO_MAX_ADMIN : VIDEO_MAX) / 1024 ** 3));
    if (code === "tooBigVideo" || (code === "too_big" && it.video)) return videoMax;
    return { tooBig: T.tooBig, too_big: T.tooBig, not_an_image: T.notImage, not_a_video: T.notImage, too_many: T.tooMany, uploads_closed: T.closedNow }[code] || T.error;
  }

  async function batchDone() {
    if (finishing) return;
    finishing = true;
    try {
      releaseScreen();
      try { await loadPhotos(); if (lb.hidden) render(); else pendingRender = true; } catch {}
      // Straight after sharing, walk through the new photos once to tag who's in them.
      if (queue.some((x) => x.state === "done" && !x.existing && !x.tagged) && lb.hidden && wrap.hidden) await tagBatch();
    } finally { finishing = false; }
    finishBatch();
    // more were added while tagging, and have finished meanwhile
    if (!active && queue.some((x) => x.state === "done" && !x.existing && !x.tagged)) batchDone();
  }

  // All shared: the tray gives way to a thank-you (it stays only to offer a retry).
  function finishBatch() {
    if (queue.some((x) => x.state === "waiting" || x.state === "working")) return;
    const shared = queue.filter((x) => x.state === "done" && !x.existing).length;
    const dup = queue.filter((x) => x.state === "done" && x.existing).length;
    if (queue.some((x) => x.state === "failed")) return renderTray();
    const items = queue.filter((x) => x.state === "done" && !x.existing).map((x) => ({ k: x.video ? "v" : undefined }));
    const thanks = items.some(isVid) ? T.thanksMix(countText(items)) : T.thanks(shared);
    clearQueue();
    renderTray();
    if (shared || dup) toast([shared ? thanks : null, dup ? T.already(dup) : null].filter(Boolean).join(" · "));
  }
  // "3 photos shared", or with videos among them "2 photos · 1 video shared"
  function sharedText(items) {
    const list = items.map((x) => ({ k: x.video ? "v" : undefined }));
    return list.some(isVid) ? T.sharedMix(countText(list)) : T.uploaded(list.length);
  }

  // One photo at a time: tap who's in it, then Next (or Skip). Tapping outside stops for now;
  // the rest can be tagged from each photo.
  async function tagBatch() {
    // each photo is offered once: "Try again" later doesn't walk through these again
    const items = queue.filter((x) => x.state === "done" && !x.existing && !x.tagged);
    items.forEach((x) => (x.tagged = true));
    const ids = items.map((x) => x.id);
    const photos = ids.map((id) => S.photos.find((p) => p.id === id)).filter(Boolean);
    tray.hidden = true;
    for (const [n, p] of photos.entries()) {
      const chosen = await namePicker({
        title: isVid(p) ? T.whoInVideo : T.whoIn, q: p.t ? fmtWhen(p.t) : T.unknownTime, hint: T.whoInStep(n + 1, photos.length),
        preview: imgUrl("display", p.id), multi: true, allowAdd: true, selected: new Set(p.tags),
        okLabel: n + 1 < photos.length ? T.next : T.done, cancelLabel: T.skipPhoto, cancelValue: () => null,
      });
      if (chosen === undefined) break;
      if (chosen === null) continue;
      await setTags(p, chosen);
    }
    render();
  }
  function openById(id) {
    let i = S.visible.findIndex((p) => p.id === id);
    if (i < 0 && filtered()) { S.filter = noFilter(); render(); i = S.visible.findIndex((p) => p.id === id); }
    if (i >= 0) openLightbox(i);
  }
  // the speeches taking over the site (speech-watch.js) wait for uploads to finish
  window.svHoldTakeover = () => queue.some((x) => x.state === "waiting" || x.state === "working");
  addEventListener("beforeunload", (e) => { if (queue.some((x) => x.state === "waiting" || x.state === "working")) { e.preventDefault(); e.returnValue = T.leaveWarn; } });

  // ── new photos from everyone else ─────────────────────────────────────────
  let pendingRender = false;
  const newPill = $("#new-pill");
  async function poll() {
    if (document.hidden || !API) return;
    try {
      const d = await api("/api/photos");
      if (d.version === S.version) return;
      const added = await loadPhotos(d);
      if (added && !lb.hidden) { pendingRender = true; return; }
      if (added) {
        // Don't shuffle the grid under someone's thumb; offer it instead.
        newPill.textContent = T.newPhotos(added);
        newPill.hidden = false;
      } else refresh(); // tags or times changed: patched in place unless the photos shown change
    } catch {}
  }
  newPill.addEventListener("click", () => { newPill.hidden = true; render(); });
  setInterval(poll, POLL_MS);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) poll(); });

  // ── admin ─────────────────────────────────────────────────────────────────
  // Where an admin's own uploads go (the photo booth's pictures, the professionals'); guests'
  // always go under Uploads.
  const adminSource = () => (S.admin && ["p", "b"].includes(store.get("wedding-gallery-admin-source", "")) ? store.get("wedding-gallery-admin-source", "") : "g");
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
      el("p", { class: "q", text: T.countAs }),
      sourceTabs(adminSource(), (k) => { store.set("wedding-gallery-admin-source", k === "g" ? null : k); closeSheet(); toast(T.saved); }),
      el("p", { class: "hint", text: T.countAsHint }),
      el("p", { class: "hint", text: `${countText(S.photos)} · ${S.guests.length} ${LANG === "es" ? "nombres" : "names"}` }),
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
      const files = [...e.dataTransfer.files].filter((f) => isPhotoFile(f) || isVideoFile(f));
      if (!files.length) return;
      if (!S.me && !(await pickWho())) return;
      addFiles(files);
    });
  }

  // ── toast ─────────────────────────────────────────────────────────────────
  let toastTimer = 0;
  // action: { label, run } adds a button (Undo), and the notice stays a little longer.
  function toast(text, action) {
    const t = $("#toast");
    put(t, el("span", { text }), action ? el("button", { type: "button", text: action.label, onclick: () => { t.classList.remove("show"); action.run(); } }) : null);
    t.classList.toggle("act", !!action);
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), action ? 6000 : 2600);
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
    const shared = /^[0-9a-f]{32}$/.test(id);
    if (shared) {
      history.replaceState(null, "", location.pathname + location.search);
      openById(id);
    }
    // Someone arriving from a shared photo sees the photo first; "Who are you?" can wait.
    if (!shared && !S.me && !store.get("wedding-gallery-skipped-who", "")) {
      const picked = await pickWho();
      if (!picked) store.set("wedding-gallery-skipped-who", "1");
    }
  }
  $("#actions").hidden = true;
  boot();
})();
