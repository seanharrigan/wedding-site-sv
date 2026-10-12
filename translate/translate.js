// Live English ⇄ Spanish subtitles for seanandvaleria.com/translate/.
// Ported from the subtitulos prototype. Speech goes to Soniox from this phone; the relay
// Worker hands out short-lived Soniox keys and fans a broadcast out to every phone.
(() => {
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  // Set after the Worker is deployed (npm run deploy in ../subtitulos prints the address).
  const RELAY_PROD = "";
  const RELAY = local ? `http://${location.hostname}:8932` : RELAY_PROD;
  const RELAY_WS = RELAY.replace(/^http/, "ws") + "/ws";
  const SONIOX_URL = "wss://stt-rt.soniox.com/transcribe-websocket";

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
  };
  const ADMIN_CODE = store.get("wedding-admin-v1", "");
  const ADMIN = !!ADMIN_CODE;
  const PREF_STORE = "wedding-translate-prefs";
  const SIZES = ["clamp(1.3rem,3.6vw,2.4rem)", "clamp(1.55rem,4.6vw,3rem)", "clamp(1.9rem,5.8vw,3.8rem)", "clamp(2.3rem,7vw,4.8rem)"];
  const VIEWS = ["en", "es", "both", "facing"];
  const SHOW_ROWS = 14, SEND_ROWS = 10, SEND_EVERY_MS = 120, LOCAL_IDLE_MS = 3 * 60 * 1000;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const q = new URLSearchParams(location.search);
  const LANG = ["en", "es"].includes(q.get("lang")) ? q.get("lang") : store.get("wedding-language", "en") === "es" ? "es" : "en";
  const T = {
    en: {
      back: "← seanandvaleria.com", broadcast: "Broadcast", view: "View", facing: "Face to face", facingSub: "Two people, one table", facingShort: "Across a table",
      enSub: "Subtitles", esSub: "Subtítulos", both: "Both", bothSub: "Side by side", onlyEn: "Only English", onlyEs: "Only Spanish",
      swap: "Swap sides", swapSub: "Change which language is on top", tidy: "Tidy speech", tidySub: "Leave out um, uh, eh and words said twice",
      clear: "Clear text", demo: "Play demo", signOut: "Sign out of admin", fullscreen: "Full screen", done: "Done",
      legend: "<b>Upright</b> lines are what was said; <i>italic</i> lines are the translation.",
      askLocal: "How would you like to talk?", askBroadcast: "Read the speeches in", options: "Options",
      bcOff: "Off · face to face for everyone", bcOn: "On · everyone sees your subtitles", bcOffline: "Can't reach the translation server",
      listening: "Listening", connecting: "Connecting…", reconnecting: "Reconnecting…", tapStart: "Tap to start", live: "Live", waiting: "Waiting",
      speaking: "Speaking to everyone", phones: (n) => n + (n === 1 ? " phone" : " phones"), live_pill: "Live",
      broadcastStarted: "The speeches are being subtitled live · Los discursos se subtitulan en vivo",
      broadcastEnded: "The live subtitles have ended · Terminaron los subtítulos en vivo",
      takenOver: "Another phone took over the speeches", micBlocked: "Microphone blocked: allow it in settings", noMic: "No microphone found",
      noRecord: "This browser can't record audio here", noServer: "Translation server not set up yet", lostConn: "Lost the connection · Tap to retry",
      keyRefused: "Admin password not accepted", noCredit: "Soniox account out of credit", sonioxKey: "Soniox key not accepted", sonioxDown: "Translation service unavailable",
      waitHere: "Subtitles will appear here when the speeches begin.", speak: "Speak in English or Spanish.",
      speakBoth: "Speak in English or Spanish · Habla en inglés o en español", stopped: "Paused after a quiet spell · Tap to continue",
    },
    es: {
      back: "← seanandvaleria.com", broadcast: "Transmitir", view: "Vista", facing: "Frente a frente", facingSub: "Dos personas, una mesa", facingShort: "En la mesa",
      enSub: "Subtitles", esSub: "Subtítulos", both: "Ambos", bothSub: "Lado a lado", onlyEn: "Solo inglés", onlyEs: "Solo español",
      swap: "Cambiar lados", swapSub: "Elige qué idioma va arriba", tidy: "Limpiar el habla", tidySub: "Quita eh, em y palabras repetidas",
      clear: "Borrar texto", demo: "Ver demo", signOut: "Cerrar sesión de admin", fullscreen: "Pantalla completa", done: "Listo",
      legend: "Las líneas <b>rectas</b> son lo que se dijo; las <i>cursivas</i> son la traducción.",
      askLocal: "¿Cómo quieres conversar?", askBroadcast: "Lee los discursos en", options: "Opciones",
      bcOff: "Apagado · frente a frente para todos", bcOn: "Encendido · todos ven tus subtítulos", bcOffline: "No hay conexión con el servidor",
      listening: "Escuchando", connecting: "Conectando…", reconnecting: "Reconectando…", tapStart: "Toca para empezar", live: "En vivo", waiting: "En espera",
      speaking: "Hablando a todos", phones: (n) => n + (n === 1 ? " teléfono" : " teléfonos"), live_pill: "En vivo",
      broadcastStarted: "Los discursos se subtitulan en vivo · The speeches are being subtitled live",
      broadcastEnded: "Terminaron los subtítulos en vivo · The live subtitles have ended",
      takenOver: "Otro teléfono tomó los discursos", micBlocked: "Micrófono bloqueado: permítelo en ajustes", noMic: "No se encontró micrófono",
      noRecord: "Este navegador no puede grabar aquí", noServer: "Falta configurar el servidor", lostConn: "Se perdió la conexión · Toca para reintentar",
      keyRefused: "Contraseña de admin no aceptada", noCredit: "La cuenta de Soniox no tiene saldo", sonioxKey: "Soniox no aceptó la clave", sonioxDown: "Servicio de traducción no disponible",
      waitHere: "Los subtítulos aparecerán aquí cuando empiecen los discursos.", speak: "Habla en inglés o en español.",
      speakBoth: "Habla en inglés o en español · Speak in English or Spanish", stopped: "En pausa por silencio · Toca para seguir",
    },
  }[LANG];
  const WAIT = { en: "Subtitles will appear here when the speeches begin.", es: "Los subtítulos aparecerán aquí cuando empiecen los discursos." };
  const SPEAK = { en: "Speak in English or Spanish.", es: "Habla en inglés o en español." };

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const body = document.body;
  document.documentElement.lang = LANG;
  body.classList.toggle("admin", ADMIN);
  $$("[data-t]").forEach((el) => { const v = T[el.dataset.t]; if (typeof v === "string") el.innerHTML = v; });
  $("#to-options").setAttribute("aria-label", T.options);

  let prefs = { size: 1, swapped: LANG === "en", tidy: true };
  try { prefs = { ...prefs, ...JSON.parse(store.get(PREF_STORE, "{}")) }; } catch {}
  const savePrefs = () => { const { view, ...keep } = prefs; store.set(PREF_STORE, JSON.stringify(keep)); };

  /* ── state ─────────────────────────────────────────────────────────
     broadcast: the relay says speeches are being subtitled for everyone.
     speaker: this phone's mic is the one everyone reads (admins only).
     Otherwise the mic runs a private face-to-face session on this phone. */
  let broadcast = false, speakerElsewhere = false, relayUp = false, listeners = null, speaker = false;
  let screen = "choose";
  const canUseMic = () => (broadcast ? ADMIN : true);

  /* ── screens and views ─────────────────────────────────────────── */
  function showChoose() {
    screen = "choose";
    closeMenu();
    $("#choose").hidden = false;
    $("#app").hidden = true;
    applyMode();
  }
  function setView(v) {
    if (!VIEWS.includes(v)) return;
    if (broadcast && v === "facing") v = LANG;
    prefs.view = v;
    screen = "app";
    $("#choose").hidden = true;
    $("#app").hidden = false;
    applyPrefs();
    keepAwake();
  }
  function applyPrefs() {
    const v = prefs.view;
    for (const x of VIEWS) body.classList.toggle("view-" + x, v === x);
    body.classList.toggle("swapped", !!prefs.swapped);
    document.documentElement.style.setProperty("--size", SIZES[prefs.size] || SIZES[1]);
    $$(".view").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === v)));
    $$(".switch[data-opt]").forEach((s) => s.setAttribute("aria-checked", String(!!prefs[s.dataset.opt])));
    if (v === "en" || v === "es") {
      $("#single-name").textContent = v === "en" ? "English" : "Español";
      $("#single-mark").setAttribute("href", v === "en" ? "#i-leaf" : "#i-cactus");
      $("#single-mark").parentElement.setAttribute("class", "mark " + (v === "en" ? "leaf" : "cactus"));
      $("#single-label").lang = v;
    }
    const mic = canUseMic() && !(broadcast && !ADMIN);
    for (const l of ["en", "es"]) document.querySelector(`.pane[data-lang=${l}] .empty`).textContent = broadcast && !speaker ? WAIT[l] : SPEAK[l];
    $("#wide-empty").textContent = broadcast && !speaker ? WAIT.en + " · " + WAIT.es : mic ? T.speakBoth : WAIT.en;
    if (v === "en" || v === "es") $("#single-empty").textContent = broadcast && !speaker ? WAIT[v] : SPEAK[v];
    // A different layout starts its lines afresh; anything else keeps them where they are.
    const layout = [v, prefs.swapped, prefs.size].join();
    if (layout !== lastLayout) { lastLayout = layout; resetStreams(); }
    renderNow();
    showStatus();
  }
  let lastLayout = "";

  // Everything that depends on whether a broadcast is on.
  function applyMode() {
    body.classList.toggle("broadcasting", broadcast);
    body.classList.toggle("no-mic", !canUseMic());
    $("#choose").classList.toggle("broadcasting", broadcast);
    $("#ask").textContent = broadcast ? T.askBroadcast : T.askLocal;
    const sub = !relayUp ? T.bcOffline : broadcast ? T.bcOn + (listeners != null ? " · " + T.phones(listeners) : "") : T.bcOff;
    $("#broadcast-sub").textContent = sub;
    $("#sheet-broadcast-sub").textContent = sub;
    $("#broadcast-card").classList.toggle("on", broadcast);
    $$("[data-broadcast]").forEach((s) => { s.setAttribute("aria-checked", String(broadcast)); s.disabled = !relayUp; });
    const pill = $("#bar-pill");
    pill.hidden = !broadcast;
    pill.textContent = speaker ? T.speaking : T.live_pill;
    if (screen === "app") applyPrefs();
  }

  /* ── rendering ─────────────────────────────────────────────────────
     rows are {k: key, s: spoken language, en: {f, l}, es: {f, l}}; f is final text, l still provisional.
     Each stream keeps its lines keyed, updates only what changed, and slides the earlier
     lines up (FLIP) when a new one arrives or the newest one wraps, so nothing jumps. */
  let rows = [];
  const streams = new Map(); // element → Map(key → line element)

  function resetStreams() { for (const [el] of streams) el.textContent = ""; streams.clear(); }

  function fill(el, piece) {
    let f = el.firstChild, l = f && f.nextSibling;
    if (!f) { f = document.createElement("span"); l = document.createElement("span"); l.className = "l"; el.append(f, l); }
    const ft = piece ? piece.f : "", lt = piece ? piece.l : "";
    if (f.textContent !== ft) f.textContent = ft;
    if (l.textContent !== lt) l.textContent = lt;
  }

  const EASE = "cubic-bezier(.2,.8,.2,1)";
  const offsetY = (el) => {
    const t = getComputedStyle(el).transform;
    return el.offsetTop + (t && t !== "none" ? new DOMMatrixReadOnly(t).m42 : 0);
  };

  // items: [{key, cls, build(el)}] in display order.
  function sync(container, items) {
    let map = streams.get(container);
    const fresh = !map;
    if (!map) { map = new Map(); streams.set(container, map); }
    const animate = !fresh && !reducedMotion && container.offsetParent !== null;

    // First: where every current line sits now, mid-animation included.
    const before = new Map();
    if (animate) for (const [k, el] of map) before.set(k, offsetY(el));

    const keep = new Set(items.map((i) => i.key));
    for (const [k, el] of map) if (!keep.has(k)) { el.remove(); map.delete(k); }
    const entering = [];
    let prev = null;
    for (const it of items) {
      let el = map.get(it.key);
      if (!el) { el = document.createElement("div"); map.set(it.key, el); entering.push(el); }
      if (el.className !== it.cls) el.className = it.cls;
      it.build(el);
      const want = prev ? prev.nextSibling : container.firstChild;
      if (want !== el) container.insertBefore(el, want);
      prev = el;
    }
    if (!animate) return;

    // Last + Invert + Play.
    for (const [k, el] of map) {
      if (!before.has(k)) continue;
      // Only the movement restarts; a line still fading in keeps fading.
      el.getAnimations().forEach((a) => a.id === "move" && a.cancel());
      const dy = before.get(k) - el.offsetTop;
      if (Math.abs(dy) > 0.5) el.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { id: "move", duration: 240, easing: EASE });
    }
    for (const el of entering) {
      el.animate([{ opacity: 0 }, { opacity: 1 }], { id: "fade", duration: 280, easing: "ease-out" });
      el.animate([{ transform: "translateY(.4em)" }, { transform: "none" }], { id: "move", duration: 260, easing: EASE });
    }
  }

  const age = (i, n) => (i < n - 4 ? " older" : i < n - 2 ? " old" : "");

  function renderNow() {
    const v = prefs.view;
    if (screen !== "app" || !v) return;
    const wideShown = v === "both" && $(".v-wide").offsetParent !== null;
    if (wideShown) {
      const shown = rows.slice(-SHOW_ROWS);
      sync($("#wide"), shown.map((r, i) => ({
        key: r.k, cls: "row" + age(i, shown.length),
        build(row) {
          if (!row.children.length) for (const l of ["en", "es"]) { const c = document.createElement("div"); c.dataset.lang = l; if (l === "es") c.lang = "es"; row.append(c); }
          for (const c of row.children) { const l = c.dataset.lang, cls = "cell " + (r.s === l ? "said" : "translated"); if (c.className !== cls) c.className = cls; fill(c, r[l]); }
        },
      })));
      $("#wide-empty").hidden = rows.length > 0;
    }
    if ((v === "both" && !wideShown) || v === "facing") {
      for (const l of ["en", "es"]) {
        const pane = document.querySelector(`.pane[data-lang=${l}]`);
        const mine = rows.filter((r) => r[l]).slice(-SHOW_ROWS);
        sync(pane.querySelector(".stream"), mine.map((r, i) => ({ key: r.k, cls: "line " + (r.s === l ? "said" : "translated") + age(i, mine.length), build: (el) => fill(el, r[l]) })));
        pane.querySelector(".empty").hidden = mine.length > 0;
      }
    }
    if (v === "en" || v === "es") {
      const mine = rows.filter((r) => r[v]).slice(-SHOW_ROWS);
      sync($("#single"), mine.map((r, i) => ({ key: r.k, cls: "line" + age(i, mine.length), build: (el) => fill(el, r[v]) })));
      $("#single-empty").hidden = mine.length > 0;
    }
  }
  let raf = 0;
  function render() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; renderNow(); }); }
  addEventListener("resize", () => { lastLayout = ""; resetStreams(); render(); });

  /* ── status line and notices ───────────────────────────────────── */
  let status = { text: "", kind: "" };
  function showStatus() {
    const el = $("#status");
    el.className = "status" + (status.kind === "err" ? " err" : "");
    el.textContent = "";
    let text = status.text, dot = status.kind === "live";
    if (broadcast && !speaker && !listening && status.kind !== "err") {
      text = !relayUp ? T.reconnecting : speakerElsewhere ? T.live : T.waiting;
      dot = relayUp && speakerElsewhere;
    }
    if (speaker && listening && listeners != null && status.kind !== "err") text = T.speaking + " · " + T.phones(listeners);
    if (dot) { const d = document.createElement("span"); d.className = "dot"; el.append(d); }
    el.append(text || "");
  }
  function setStatus(text, kind) { status = { text, kind: kind || "" }; showStatus(); }

  let toastTimer = 0;
  function notice(text) {
    const el = $("#toast");
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 5200);
    const line = $("#choose-notice");
    line.textContent = text;
    line.hidden = false;
  }

  let wakeLock = null;
  async function keepAwake() {
    if (screen !== "app" || wakeLock || !("wakeLock" in navigator)) return;
    try { wakeLock = await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release", () => (wakeLock = null)); } catch {}
  }

  /* ── relay: broadcast state, and the speeches when they're on ───── */
  let sock = null, sockRetry = 0, sockTimer = 0, refused = false, sendTimer = 0, lastSent = 0;
  const piece = (p) => (Array.isArray(p) ? { f: String(p[0] || ""), l: String(p[1] || "") } : null);

  function connectRelay() {
    clearTimeout(sockTimer);
    if (!RELAY || refused || (sock && sock.readyState <= 1)) return;
    let s;
    try { s = new WebSocket(RELAY_WS + (ADMIN ? "?role=host&code=" + encodeURIComponent(ADMIN_CODE) : "?role=viewer")); } catch { return; }
    sock = s;
    s.onopen = () => { sockRetry = 0; relayUp = true; applyMode(); if (speaker) sendSpeaking(true); };
    s.onmessage = (e) => {
      let m; try { m = JSON.parse(e.data); } catch { return; }
      if (m.t === "state") onState(!!m.broadcast, !!m.speaking);
      else if (m.t === "rows" && Array.isArray(m.rows) && !speaker) {
        if (listening) return; // a private session keeps its own lines
        rows = m.rows.map((r, i) => ({ k: "b" + (r.k ?? i), s: r.s === "es" ? "es" : "en", en: piece(r.en), es: piece(r.es) }));
        render(); showStatus();
      } else if (m.t === "count") { listeners = m.n; applyMode(); showStatus(); }
      else if (m.t === "speaker" && m.you === false && speaker) { speaker = false; if (listening) stop(); notice(T.takenOver); applyMode(); }
      else if (m.t === "refused") { refused = true; setStatus(T.keyRefused, "err"); }
    };
    s.onclose = () => {
      if (sock !== s) return;
      sock = null; relayUp = false; listeners = null; applyMode(); showStatus();
      if (!refused) sockTimer = setTimeout(connectRelay, Math.min(6000, 600 * ++sockRetry));
    };
  }

  function onState(on, someoneSpeaking) {
    const was = broadcast;
    broadcast = on;
    if (on !== was && !listening) status = { text: T.tapStart, kind: "" }; // an old error shouldn't linger over the new mode
    speakerElsewhere = someoneSpeaking && !speaker;
    if (on && !was) {
      // Speeches take over: a private session stops and the phone reads along instead.
      if (listening && !speaker) stop(true);
      rows = [];
      if (prefs.view === "facing") prefs.view = LANG;
      if (!ADMIN || !speaker) notice(T.broadcastStarted);
    } else if (!on && was) {
      if (speaker) { speaker = false; if (listening) stop(); }
      notice(T.broadcastEnded);
    }
    applyMode();
    showStatus();
  }

  function sendRelay(msg) { if (sock && sock.readyState === 1) sock.send(JSON.stringify(msg)); }
  function sendSpeaking(on) { sendRelay({ t: "speaking", on }); }
  function sendRows() {
    clearTimeout(sendTimer);
    if (!speaker || !broadcast) return;
    const wire = rows.slice(-SEND_ROWS).map((r) => ({ k: r.k, s: r.s, en: r.en && [r.en.f, r.en.l], es: r.es && [r.es.f, r.es.l] }));
    sendRelay({ t: "rows", rows: wire, live: listening || demoTimers.length > 0 });
    lastSent = Date.now();
  }
  // At most about eight sends a second; the latest change always goes out.
  function queueSend() {
    if (!speaker) return;
    clearTimeout(sendTimer);
    const wait = SEND_EVERY_MS - (Date.now() - lastSent);
    if (wait <= 0) sendRows(); else sendTimer = setTimeout(sendRows, wait);
  }

  function setBroadcast(on) {
    if (!ADMIN || !relayUp) return;
    sendRelay({ t: "broadcast", on });
  }

  /* ── speech → turns → rows (unchanged from the prototype) ──────────
     A turn is a run of speech in one language, with its translation.
     Soniox sends final tokens once and resends the non-final tail every
     message, so each turn keeps final text (f) and live text (l) apart.
     Translations follow their source in order but are not matched word
     for word, so each translation token goes to the earliest turn spoken
     in the other language that the translation hasn't already passed. */
  let turns = [], turnIds = 0;
  const ptr = { en: 0, es: 0 };      // turn currently taking translation into this language
  const lastTr = { en: -1, es: -1 }; // last turn that received translation into this language
  const other = (l) => (l === "en" ? "es" : "en");

  function clearLive() {
    for (const t of turns) { t.said.l = ""; t.tr.l = ""; }
    while (turns.length && !turns.at(-1).said.f && !turns.at(-1).tr.f) turns.pop();
    for (const l of ["en", "es"]) { ptr[l] = Math.min(ptr[l], turns.length); lastTr[l] = Math.min(lastTr[l], turns.length - 1); }
  }

  function addToken(t) {
    if (t.text === "<end>" || t.text === "<fin>") return;
    const key = t.is_final ? "f" : "l";
    if (t.translation_status === "translation") {
      const into = t.language === "en" || t.language === "es" ? t.language : other(turns.at(-1)?.lang || "en");
      const from = other(into);
      let i = Math.max(ptr[into], lastTr[from] + 1);
      while (i < turns.length && turns[i].lang !== from) i++;
      if (i >= turns.length) return; // nothing said yet that this could translate
      ptr[into] = i; lastTr[into] = i;
      turns[i].tr[key] += t.text;
    } else {
      const lang = t.language === "en" || t.language === "es" ? t.language : turns.at(-1)?.lang || "en";
      let turn = turns.at(-1);
      if (!turn || turn.lang !== lang) { turn = { id: ++turnIds, lang, said: { f: "", l: "" }, tr: { f: "", l: "" } }; turns.push(turn); }
      turn.said[key] += t.text;
    }
  }

  let heardAt = 0;
  function onTokens(tokens) {
    clearLive();
    for (const t of tokens) addToken(t);
    if (tokens.some((t) => t.text && t.text.trim())) heardAt = Date.now();
    rows = buildRows();
    render();
    queueSend();
  }

  const ABBR = /(?:^|\s)(?:Mr|Mrs|Ms|Dr|St|Sr|Sra|Srta|Lic|Ing|Dra)\.$/;
  // Split final+live text into sentences, keeping which part of each is still provisional.
  function sentences(f, l) {
    const s = f + l, out = [];
    const re = /[.?!…]+["'”’»)]*\s+/g;
    let a = 0, m;
    while ((m = re.exec(s))) {
      if (ABBR.test(s.slice(a, m.index + 1))) continue;
      const b = m.index + m[0].length;
      out.push([a, b]); a = b;
    }
    if (a < s.length) out.push([a, s.length]);
    return out
      .map(([a, b]) => ({ f: s.slice(a, Math.min(b, f.length)), l: s.slice(Math.max(a, f.length), b) }))
      .map((p) => (p.f.trim() ? { f: p.f.replace(/^\s+/, ""), l: p.l } : { f: "", l: p.l.replace(/^\s+/, "") }))
      .filter((p) => (p.f + p.l).trim());
  }

  // Hesitations in either language, and a short word said twice ("I I", "el el").
  const FILLER = /(^|[\s¿¡"“(])(?:u+m+|u+h+m*|e+r+m*|e+h+m*|e+m+|h+m+|m{2,}|m+h+m+)(?=[\s,.?!…]|$)[,…]?/giu;
  const STUTTER = /(?<!\p{L})(\p{L}{1,4})(?:\s+\1)+(?!\p{L})/giu;
  const KEEP_DOUBLE = new Set(["had", "bye", "so", "no", "sí", "si", "ya", "muy", "very", "yes", "ok"]);
  function tidy(text, atStart) {
    if (!prefs.tidy || !text) return text;
    let t = text.replace(FILLER, "$1").replace(STUTTER, (m, w) => (KEEP_DOUBLE.has(w.toLowerCase()) ? m : w));
    t = t.replace(/\s{2,}/g, " ").replace(/\s+([,.?!…])/g, "$1");
    if (atStart) {
      const lead = t.match(/^[\s,.…]+/);
      if (lead) t = t.slice(lead[0].length);
      // "Um, thank you" becomes "Thank you"
      if (t !== text.replace(/^\s+/, "")) t = t.replace(/^([¿¡"“]?)(\p{Ll})/u, (m, p, c) => p + c.toUpperCase());
    }
    return t;
  }
  const tidyPiece = (p) => {
    const f = tidy(p.f, true), l = tidy(p.l, !f.trim());
    return (f + l).trim() ? { f, l } : null;
  };

  // Turns become rows: one sentence of what was said, level with one sentence of its translation.
  function buildRows() {
    const out = [];
    for (const t of turns) {
      const S = sentences(t.said.f, t.said.l).map(tidyPiece).filter(Boolean);
      const Tr = sentences(t.tr.f, t.tr.l).map(tidyPiece).filter(Boolean);
      for (let i = 0; i < Math.max(S.length, Tr.length); i++) out.push({ k: t.id + "." + i, s: t.lang, [t.lang]: S[i] || null, [other(t.lang)]: Tr[i] || null });
    }
    return out;
  }

  function clearText() { turns = []; ptr.en = ptr.es = 0; lastTr.en = lastTr.es = -1; rows = []; render(); queueSend(); }

  /* ── listening ─────────────────────────────────────────────────── */
  let listening = false, ws = null, stream = null, recorder = null, audioCtx = null, meterRaf = 0, retryTimer = 0, retries = 0, idleTimer = 0;

  async function fetchKey() {
    if (!RELAY) throw new Error("noServer");
    let res;
    try {
      res = await fetch(RELAY + "/api/soniox-key", { method: "POST", headers: { "X-Admin-Code": ADMIN_CODE } });
    } catch { throw new Error("noServer"); }
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.api_key) return data.api_key;
    throw new Error({ admin: ADMIN ? "keyRefused" : "sonioxDown", soniox_credit: "noCredit", soniox_key: "sonioxKey", not_configured: "sonioxDown" }[data.error] || "sonioxDown");
  }

  async function start() {
    stopDemo();
    if (!canUseMic()) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setStatus(T.noRecord, "err"); return; }
    listening = true;
    body.classList.add("listening");
    $("#mic").setAttribute("aria-label", "Stop listening");
    setStatus(T.connecting);
    // During a broadcast an admin's mic speaks to everyone; otherwise it's a private conversation.
    if (broadcast && ADMIN) { speaker = true; speakerElsewhere = false; sendSpeaking(true); clearText(); applyMode(); }
    else if (rows.length && rows[0].k.startsWith("b")) clearText(); // leave the ended broadcast's lines behind
    try {
      // Raw voice, as the Soniox SDK takes it: the speech model does better without the phone's call processing.
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } });
    } catch (e) {
      stop();
      setStatus(e && e.name === "NotAllowedError" ? T.micBlocked : T.noMic, "err");
      return;
    }
    if (!listening) { stream.getTracks().forEach((t) => t.stop()); return; }
    startMeter();
    keepAwake();
    heardAt = Date.now();
    clearInterval(idleTimer);
    // A forgotten private session pauses itself; the speeches never do.
    idleTimer = setInterval(() => { if (!speaker && Date.now() - heardAt > LOCAL_IDLE_MS) { stop(); setStatus(T.stopped); } }, 15000);
    connect();
  }

  async function connect() {
    if (!listening) return;
    let key;
    try { key = await fetchKey(); } catch (e) {
      const reason = e.message;
      if (reason === "noServer" && listening && retries < 6) { retries++; setStatus(T.reconnecting); retryTimer = setTimeout(connect, Math.min(4000, 500 * retries)); return; }
      stop();
      setStatus(T[reason] || T.sonioxDown, "err");
      return;
    }
    if (!listening) return;
    const s = new WebSocket(SONIOX_URL, ["soniox-api-key", key]);
    ws = s;
    s.onopen = () => {
      s.send(JSON.stringify({
        model: "stt-rt-v5",
        audio_format: "auto",
        language_hints: ["en", "es"],
        language_hints_strict: true,
        enable_language_identification: true,
        // Soniox's low-latency endpoint settings: speech is finalised sooner after each pause,
        // and the translation follows as soon as its source is final.
        enable_endpoint_detection: true,
        endpoint_latency_adjustment_level: 2,
        endpoint_sensitivity: 0.3,
        max_endpoint_delay_ms: 1000,
        translation: { type: "two_way", language_a: "en", language_b: "es" },
        context: {
          general: [
            { key: "domain", value: "Wedding" },
            { key: "topic", value: "Speeches and conversation between English and Mexican Spanish speakers at the wedding of Sean and Valeria in Tepoztlán, Morelos, Mexico" },
          ],
          terms: ["Sean", "Valeria", "Val", "Tepoztlán", "Piedra Viva", "Morelos", "Ciudad de México", "tornaboda", "Día de Muertos", "lucha libre"],
        },
      }));
      // A fresh recorder per connection, so the server gets the container header first.
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => { if (e.data.size && s.readyState === 1) e.data.arrayBuffer().then((b) => s.readyState === 1 && s.send(b)); };
      recorder.start(60);
      retries = 0;
      setStatus(T.listening, "live");
      sendRows();
    };
    s.onmessage = (e) => {
      let msg; try { msg = JSON.parse(e.data); } catch { return; }
      if (msg.error_code || msg.error_type) { handleError(msg, s); return; }
      if (msg.tokens && msg.tokens.length) onTokens(msg.tokens);
    };
    s.onclose = () => {
      if (ws !== s) return;
      stopRecorder();
      ws = null;
      if (!listening) return;
      // Dropped signal, or the temporary key's session ran out: carry on with a fresh key.
      retries++;
      if (retries > 6) { stop(); setStatus(T.lostConn, "err"); return; }
      setStatus(T.reconnecting);
      retryTimer = setTimeout(connect, Math.min(4000, 400 * retries));
    };
  }

  function handleError(msg, s) {
    const type = String(msg.error_type || ""), code = Number(msg.error_code);
    if (/expired/i.test(type) || /expired/i.test(String(msg.error_message || ""))) { try { s.close(); } catch {} return; } // reconnects with a new key
    if (code === 401 || code === 403 || /auth|api_key/i.test(type)) { stop(); setStatus(T.sonioxKey, "err"); }
    else if (code === 402 || /balance|quota|billing|credit/i.test(type)) { stop(); setStatus(T.noCredit, "err"); }
    else setStatus(msg.error_message ? msg.error_message.slice(0, 60) : "Soniox " + code, "err");
  }

  function stopRecorder() {
    if (recorder && recorder.state !== "inactive") { try { recorder.stop(); } catch {} }
    recorder = null;
  }

  function stop(quiet) {
    listening = false;
    clearTimeout(retryTimer);
    clearInterval(idleTimer);
    retries = 0;
    body.classList.remove("listening");
    $("#mic").setAttribute("aria-label", "Start listening");
    stopRecorder();
    if (ws) {
      const s = ws; ws = null;
      // An empty text frame asks Soniox to finish; its last words still arrive before it closes.
      s.onclose = null;
      if (s.readyState === 1 && !quiet) {
        s.onmessage = (e) => { try { const m = JSON.parse(e.data); if (m.tokens && m.tokens.length) onTokens(m.tokens); if (m.finished) s.close(); } catch {} };
        try { s.send(""); } catch {}
        setTimeout(() => { try { s.close(); } catch {} }, 4000);
      } else { try { s.close(); } catch {} }
    }
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
    stopMeter();
    sendRows();
    if (speaker) { speaker = false; sendSpeaking(false); applyMode(); }
    setStatus(T.tapStart);
  }

  /* the ring round the mic follows the voice */
  function startMeter() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtx.resume().catch(() => {}); // iOS starts it suspended once the tap has been awaited past
      const an = audioCtx.createAnalyser(); an.fftSize = 512;
      audioCtx.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.fftSize), mic = $("#mic");
      const tick = () => {
        an.getByteTimeDomainData(buf);
        let peak = 0; for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
        mic.style.setProperty("--lvl", (1 + Math.min(peak / 64, 1) * 0.35).toFixed(3));
        meterRaf = requestAnimationFrame(tick);
      };
      tick();
    } catch {}
  }
  function stopMeter() {
    cancelAnimationFrame(meterRaf);
    $("#mic").style.removeProperty("--lvl");
    if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null; }
  }

  /* demo: a scripted exchange through the same token path (admins, menu or #demo) */
  let demoTimers = [];
  const DEMO = [
    { lang: "en", said: "Um, thank you all so much for coming all this way. It really means the world to us.", tr: "Muchas gracias a todos por venir desde tan lejos. De verdad significa muchísimo para nosotros." },
    { lang: "es", said: "Bienvenidos a Tepoztlán. Eh, están en su casa.", tr: "Welcome to Tepoztlán. Make yourselves at home." },
    { lang: "en", said: "Has anyone tried the the mezcal yet?", tr: "¿Alguien ya probó el mezcal?" },
    { lang: "es", said: "¡Claro que sí! Salud por los novios.", tr: "Of course! A toast to the bride and groom." },
  ];
  function stopDemo() { demoTimers.forEach(clearTimeout); demoTimers = []; }
  function playDemo() {
    if (listening) stop();
    stopDemo(); clearText(); closeMenu();
    if (screen !== "app") setView(prefs.view || "facing");
    setStatus("Demo", "live");
    let t = 300;
    const at = (ms, fn) => demoTimers.push(setTimeout(fn, ms));
    const words = (s) => s.split(/(?=\s)/);
    for (const line of DEMO) {
      const said = words(line.said), tr = words(line.tr);
      const tok = (x, is_final) => ({ text: x, is_final, language: line.lang, translation_status: "original" });
      let sent = 0; // final words already sent; Soniox sends each final token once
      said.forEach((w, i) => {
        at((t += 240), () => {
          // the newest two words arrive provisional, as Soniox sends them
          const upto = Math.max(sent, i - 1);
          onTokens([...said.slice(sent, upto).map((x) => tok(x, true)), ...said.slice(upto, i + 1).map((x) => tok(x, false))]);
          sent = upto;
        });
      });
      at((t += 250), () => onTokens([...said.slice(sent).map((x) => tok(x, true)), { text: "<end>", is_final: true }]));
      tr.forEach((w) => at((t += 90), () => onTokens([{ text: w, is_final: true, language: other(line.lang), translation_status: "translation" }])));
      t += 1200;
    }
    at(t, () => { demoTimers = []; setStatus(T.tapStart); });
  }

  /* ── menu and controls ─────────────────────────────────────────── */
  function openMenu() { body.classList.add("sheet-open"); $("#sheet").setAttribute("aria-hidden", "false"); }
  function closeMenu() { body.classList.remove("sheet-open"); $("#sheet").setAttribute("aria-hidden", "true"); }

  $$("[data-view]").forEach((b) => b.addEventListener("click", () => {
    const fromOptions = screen === "choose";
    setView(b.dataset.view);
    // Face to face is for talking, so the mic starts with the same tap.
    if (fromOptions && b.dataset.view === "facing" && canUseMic() && !listening) start();
  }));
  $$(".switch[data-opt]").forEach((s) => s.addEventListener("click", () => {
    prefs[s.dataset.opt] = !prefs[s.dataset.opt]; savePrefs();
    if (s.dataset.opt === "tidy" && turns.length) { rows = buildRows(); queueSend(); }
    applyPrefs();
  }));
  $$("[data-broadcast]").forEach((s) => s.addEventListener("click", () => setBroadcast(!broadcast)));
  $("#size").addEventListener("click", () => { prefs.size = (prefs.size + 1) % SIZES.length; savePrefs(); applyPrefs(); });
  $("#mic").addEventListener("click", () => (listening ? stop() : start()));
  $("#to-options").addEventListener("click", showChoose);
  $("#open-menu").addEventListener("click", openMenu);
  $("#close-menu").addEventListener("click", closeMenu);
  $("#scrim").addEventListener("click", closeMenu);
  $("#clear").addEventListener("click", () => { stopDemo(); clearText(); closeMenu(); });
  $("#demo").addEventListener("click", playDemo);
  $("#sign-out").addEventListener("click", () => {
    if (listening) stop();
    store.set("wedding-admin-v1", null);
    location.replace("../");
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  const fs = $("#fullscreen");
  if (document.documentElement.requestFullscreen) {
    fs.hidden = false;
    fs.addEventListener("click", () => { closeMenu(); document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {}); });
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    keepAwake();
    connectRelay(); // phones drop sockets while the screen sleeps
  });

  status = { text: T.tapStart, kind: "" };
  connectRelay();
  // A QR code can open straight into a view: …/translate/?view=es
  const asked = q.get("view");
  if (VIEWS.includes(asked)) setView(asked); else showChoose();
  if (ADMIN && location.hash === "#demo") playDemo();
})();
