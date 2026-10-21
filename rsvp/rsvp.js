// RSVPs for the wedding week's outings: seanandvaleria.com/rsvp/?e=<event>.
// Events and answers live in the sv-gallery Worker (D1), on the same guest list as the gallery.
// A guest taps their name once (shared with the gallery), then answers for themselves and anyone
// in their party. No account and no password: the link is the invitation.
(() => {
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const API = local ? `http://${location.hostname}:8933` : "https://sv-gallery.valeriaandseanharrigan.workers.dev";
  const SITE = "https://seanandvaleria.com/rsvp/";

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
  };
  const q = new URLSearchParams(location.search);
  const LANG = ["en", "es"].includes(q.get("lang")) ? q.get("lang") : store.get("wedding-language", "en") === "es" ? "es" : "en";
  const SLUG = (q.get("e") || "").toLowerCase();
  const ADMIN_CODE = store.get("wedding-admin-v1", "");
  // The same fingerprint the site's gate checks (accessHash in assets/gpt/site.js); see gallery.js.
  const SITE_KEY = "ecaf6dd0ad0c57473723257f3733a39aa525d0e226da7dcdd46c710ccbece8dc";
  let DEVICE = store.get("wedding-gallery-device", "");
  if (!DEVICE) {
    DEVICE = crypto.randomUUID ? crypto.randomUUID() : [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, "0")).join("");
    store.set("wedding-gallery-device", DEVICE);
  }

  const T = {
    en: {
      back: "← seanandvaleria.com", indexTitle: "Itinerary", indexLede: "Let us know which plans you’re joining.",
      areas: { CDMX: "Mexico City", "Tepoztlán": "Morelos" },
      yes: "Going", maybe: "Maybe", no: "Can’t go", noAnswer: "No answer yet",
      youAre: "You’re", answeringAs: "Answering as", change: "Change", pickName: "Tap your name",
      whoQ: "Who are you?", whoHint: "Pick your name once. This phone will remember it.",
      search: "Search names", notListed: (s) => s ? `Add “${s}”` : "Not on the list? Type your name", cancel: "Cancel",
      yourGroup: "Answering for your group too?", addSomeone: "+ Someone else", remove: "Remove",
      note: "Anything we should know? (optional)", send: "Send RSVP", update: "Update RSVP", sent: "Thank you! Your RSVP is in.", savedNow: "Saved",
      seats: (left, cap) => `${left} of ${cap} seats left`, full: (n) => n ? `Only ${n} ${n === 1 ? "seat" : "seats"} left` : "All the seats are taken",
      closed: "RSVPs for this are closed.", draft: "Draft · only you two can see this", missing: "We couldn’t find that RSVP.", allLink: "See the whole itinerary",
      error: "Something went wrong. Please try again.", map: "Map", whoComing: "Who’s coming", nobodyYet: "No one yet. Be the first!",
      pickFirst: "Tap your name first", pickAnswer: "Choose Going, Maybe or Can’t go",
      adminTitle: "Admin", csv: "Download CSV", share: "Share link", copied: "Link copied", notes: "Notes",
      by: (n) => `answered by ${n}`, totals: (c) => `${c.yes} going · ${c.maybe} maybe · ${c.no} can’t go`,
      until: "until", rsvpBy: (d) => `Please answer by ${d}`, tbc: "Date and place to come",
    },
    es: {
      back: "← seanandvaleria.com", indexTitle: "Itinerario", indexLede: "Cuéntennos a qué planes se apuntan.",
      areas: { CDMX: "Ciudad de México", "Tepoztlán": "Morelos" },
      yes: "Voy", maybe: "Tal vez", no: "No puedo", noAnswer: "Sin respuesta",
      youAre: "Eres", answeringAs: "Respondes como", change: "Cambiar", pickName: "Toca tu nombre",
      whoQ: "¿Quién eres?", whoHint: "Elige tu nombre una vez. Este teléfono lo recordará.",
      search: "Buscar nombres", notListed: (s) => s ? `Agregar “${s}”` : "¿No estás en la lista? Escribe tu nombre", cancel: "Cancelar",
      yourGroup: "¿Respondes también por tu grupo?", addSomeone: "+ Otra persona", remove: "Quitar",
      note: "¿Algo que debamos saber? (opcional)", send: "Enviar respuesta", update: "Actualizar respuesta", sent: "¡Gracias! Ya tenemos tu respuesta.", savedNow: "Guardado",
      seats: (left, cap) => `Quedan ${left} de ${cap} lugares`, full: (n) => n ? `Solo ${n === 1 ? "queda 1 lugar" : `quedan ${n} lugares`}` : "Ya no hay lugares",
      closed: "Ya no se reciben respuestas para esto.", draft: "Borrador · solo ustedes dos lo ven", missing: "No encontramos esa invitación.", allLink: "Ver todo el itinerario",
      error: "Algo salió mal. Inténtalo de nuevo.", map: "Mapa", whoComing: "Quién va", nobodyYet: "Nadie todavía. ¡Sé el primero!",
      pickFirst: "Primero toca tu nombre", pickAnswer: "Elige Voy, Tal vez o No puedo",
      adminTitle: "Admin", csv: "Descargar CSV", share: "Compartir enlace", copied: "Enlace copiado", notes: "Notas",
      by: (n) => `respondió ${n}`, totals: (c) => `${c.yes} van · ${c.maybe} tal vez · ${c.no} no pueden`,
      until: "hasta", rsvpBy: (d) => `Por favor respondan antes del ${d}`, tbc: "Fecha y lugar por confirmar",
    },
  }[LANG];
  const L = (e, key) => e[`${key}_${LANG}`] || e[`${key}_en`] || "";

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
  const put = (node, ...kids) => node.replaceChildren(...kids.flat().filter((k) => k != null && k !== false));
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-t]").forEach((n) => { if (typeof T[n.dataset.t] === "string") n.textContent = T[n.dataset.t]; });

  // ── state ─────────────────────────────────────────────────────────────────
  const S = {
    guests: [], guestById: new Map(), admin: false,
    me: JSON.parse(store.get("wedding-gallery-me", "null") || "null"),
    event: null, counts: null, answers: [],
    draft: new Map(), // guest id → answer, for the people on this phone's form
    extra: new Set(),  // people added with "+ Someone else"
    note: "",
  };
  const nameOf = (id) => S.guestById.get(id)?.name;
  const partyOf = (id) => S.guestById.get(id)?.party;

  class ApiError extends Error { constructor(status, data) { super(data.error || "error"); this.status = status; this.data = data; } }
  async function api(path, { method = "GET", json } = {}) {
    const headers = { "X-Device": DEVICE, "X-Guest-Code": SITE_KEY };
    if (ADMIN_CODE) headers["X-Admin-Code"] = ADMIN_CODE;
    let body;
    if (json) { headers["Content-Type"] = "application/json"; body = JSON.stringify(json); }
    let res;
    try { res = await fetch(API + path, { method, headers, body }); } catch { throw new ApiError(0, { error: "network" }); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, data);
    return data;
  }

  async function loadGuests() {
    const s = await api("/api/state");
    S.guests = s.guests;
    S.guestById = new Map(s.guests.map((g) => [g.id, g]));
    S.admin = s.admin;
    if (S.me && !S.guestById.has(S.me.id)) setMe(null);
  }
  // The people this phone answers for: you, then your party, then anyone added.
  function circle() {
    if (!S.me) return [];
    const party = partyOf(S.me.id);
    const mates = party ? S.guests.filter((g) => g.party === party && g.id !== S.me.id).map((g) => g.id) : [];
    return [...new Set([S.me.id, ...mates, ...S.extra])];
  }
  const meParam = () => { const ids = circle(); return ids.length ? `?me=${ids.join(",")}` : ""; };

  function setMe(g) {
    S.me = g ? { id: g.id, name: g.name } : null;
    store.set("wedding-gallery-me", g ? JSON.stringify(S.me) : null);
  }

  // ── dates ─────────────────────────────────────────────────────────────────
  const locale = LANG === "es" ? "es-MX" : "en-GB";
  const asDate = (t) => new Date(t + (t.length === 16 ? ":00Z" : "Z"));
  const fmtDay = (t) => asDate(t).toLocaleDateString(locale, { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
  const fmtTime = (t) => asDate(t).toLocaleTimeString("en-US", { timeZone: "UTC", hour: "numeric", minute: "2-digit" });
  const cap = (s) => s.replace(/^\p{L}/u, (c) => c.toUpperCase());
  // "2:00 PM – 5:30 PM", or nothing for an all-day plan
  function hours(e) {
    if (!e.starts_local || e.starts_local.slice(11) === "00:00") return "";
    const end = e.ends_local && e.ends_local.slice(0, 10) === e.starts_local.slice(0, 10) ? ` – ${fmtTime(e.ends_local)}` : "";
    return fmtTime(e.starts_local) + end;
  }
  const when = (e) => e.starts_local ? [cap(fmtDay(e.starts_local)), hours(e)].filter(Boolean).join(" · ") : T.tbc;

  // ── sheets (the gallery's name picker) ────────────────────────────────────
  const wrap = $("#sheet-wrap"), sheet = $("#sheet");
  let sheetClose = null;
  function openSheet(build) {
    sheetClose?.(undefined);
    put(sheet, ...build());
    wrap.hidden = false;
    document.body.classList.add("locked");
    return new Promise((resolve) => {
      sheetClose = (value) => { sheetClose = null; wrap.hidden = true; document.body.classList.remove("locked"); resolve(value); };
      setTimeout(() => sheet.querySelector("input")?.focus({ preventScroll: true }), 60);
    });
  }
  const closeSheet = (v) => sheetClose?.(v);
  wrap.addEventListener("click", (e) => { if (e.target === wrap) closeSheet(undefined); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !wrap.hidden) closeSheet(undefined); });

  function namePicker({ q, hint, exclude = new Set() }) {
    let query = "";
    const list = el("div", { class: "list" });
    const norm = (x) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const draw = () => {
      const s = norm(query.trim());
      const pool = S.guests.filter((g) => !exclude.has(g.id) && (!s || norm(g.name).includes(s)));
      const rows = pool.slice(0, 200).map((g) => el("button", { class: "row", type: "button", onclick: () => closeSheet(g) },
        el("span", {}, g.name), g.party ? el("small", { text: g.party }) : null));
      if (!S.guests.some((g) => norm(g.name) === s)) rows.push(el("button", { class: "row add", type: "button", onclick: async () => {
        if (query.trim().length < 2) return input.focus();
        try {
          const { guest } = await api("/api/guests", { method: "POST", json: { name: query.trim() } });
          if (!S.guestById.has(guest.id)) { S.guests.push(guest); S.guestById.set(guest.id, guest); }
          closeSheet(guest);
        } catch { toast(T.error); }
      } }, T.notListed(query.trim())));
      put(list, ...rows);
    };
    const input = el("input", { class: "field", type: "search", placeholder: T.search, autocomplete: "off", enterkeyhint: "search", oninput: (e) => { query = e.target.value; draw(); } });
    draw();
    return openSheet(() => [
      el("p", { class: "q", text: q }),
      hint ? el("p", { class: "hint", text: hint }) : null,
      input, list,
      el("div", { class: "sheet-foot" }, el("button", { class: "btn", type: "button", text: T.cancel, onclick: () => closeSheet(null) })),
    ]);
  }

  async function pickWho() {
    const g = await namePicker({ q: T.whoQ, hint: T.whoHint });
    if (!g) return false;
    setMe(g);
    S.extra.clear();
    await loadEvent();
    return true;
  }

  // ── one event ─────────────────────────────────────────────────────────────
  const main = $("#main");
  async function loadEvent() {
    const d = await api(`/api/events/${encodeURIComponent(SLUG)}${meParam()}`);
    S.event = d.event;
    S.counts = d.counts;
    S.answers = d.answers;
    S.admin = d.admin;
    // Start the form from what's already been said for these people.
    S.draft = new Map();
    for (const a of S.answers) if (circle().includes(a.g)) S.draft.set(a.g, a.a);
    const mine = S.me && S.answers.find((a) => a.g === S.me.id);
    S.note = mine?.note || "";
    renderEvent();
  }

  function renderEvent() {
    const e = S.event;
    document.title = `${L(e, "title")} · RSVP · Sean & Valeria`;
    $("#eyebrow").textContent = e.listed ? ["RSVP", e.area].filter(Boolean).join(" · ") : T.draft;
    $("#title").textContent = L(e, "title");
    $("#lede").textContent = when(e);
    $("#admin-pill").hidden = !S.admin;

    const left = e.capacity ? Math.max(0, e.capacity - S.counts.yes) : null;
    const details = el("section", { class: "ev-card" },
      e.place || e.address ? el("p", { class: "ev-place" },
        el("span", {}, el("b", { text: e.place || "" }), e.address ? el("small", { text: e.address }) : null),
        e.map_url ? el("a", { class: "btn small", href: e.map_url, target: "_blank", rel: "noopener", text: T.map }) : null) : null,
      L(e, "details") ? el("p", { class: "ev-details", text: L(e, "details") }) : null,
      left != null ? el("p", { class: "ev-seats", text: T.seats(left, e.capacity) }) : null,
      e.rsvp_by ? el("p", { class: "ev-seats", text: T.rsvpBy(cap(fmtDay(e.rsvp_by + "T12:00"))) }) : null);

    put(main, details, renderForm(), renderWho(), S.admin ? renderAdmin() : null,
      el("p", { class: "ev-all" }, el("a", { href: `./?lang=${LANG}`, text: T.allLink })));
  }

  function renderForm() {
    const e = S.event;
    if (!e.open && !S.admin) return el("section", { class: "ev-form" }, el("p", { class: "hint", text: T.closed }));
    if (!S.me) return el("section", { class: "ev-form" },
      el("button", { class: "btn solid big", type: "button", text: T.pickName, onclick: pickWho }));

    const ids = circle();
    const saved = new Map(S.answers.filter((a) => ids.includes(a.g)).map((a) => [a.g, a.a]));
    const choice = (id) => el("div", { class: "answer", role: "group", "aria-label": nameOf(id) },
      ["yes", "maybe", "no"].map((a) => el("button", { type: "button", class: "ans-" + a, "aria-pressed": String(S.draft.get(id) === a), text: T[a],
        onclick: () => { S.draft.get(id) === a && id !== S.me.id ? S.draft.delete(id) : S.draft.set(id, a); renderEvent(); } })));
    const person = (id, i) => el("div", { class: "person" + (i ? " mate" : "") },
      el("p", { class: "person-name" }, i ? nameOf(id) : el("span", {}, el("small", { text: T.answeringAs }), S.me.name),
        i ? null : el("button", { class: "link", type: "button", text: T.change, onclick: pickWho }),
        S.extra.has(id) ? el("button", { class: "link", type: "button", text: T.remove, onclick: () => { S.extra.delete(id); S.draft.delete(id); renderEvent(); } }) : null),
      choice(id));

    const changed = [...S.draft].some(([g, a]) => saved.get(g) !== a);
    const hasSaved = saved.has(S.me.id);
    const noteBox = el("textarea", { class: "field note", rows: 2, maxlength: 500, placeholder: T.note, oninput: (ev) => { S.note = ev.target.value; sendBtn.disabled = false; } });
    noteBox.value = S.note;
    const sendBtn = el("button", { class: "btn solid big", type: "button", text: hasSaved ? T.update : T.send, onclick: send });
    sendBtn.disabled = hasSaved && !changed;
    return el("section", { class: "ev-form" },
      person(ids[0], 0),
      ids.length > 1 ? el("p", { class: "group-q", text: T.yourGroup }) : null,
      ids.slice(1).map((id, i) => person(id, i + 1)),
      el("button", { class: "tag add", type: "button", text: T.addSomeone, onclick: async () => {
        const g = await namePicker({ q: T.addSomeone.replace("+ ", ""), exclude: new Set(ids) });
        if (!g) return;
        S.extra.add(g.id);
        renderEvent();
      } }),
      noteBox, sendBtn);
  }

  async function send() {
    if (!S.me) return toast(T.pickFirst);
    if (!S.draft.has(S.me.id) && !S.draft.size) return toast(T.pickAnswer);
    const answers = [...S.draft].map(([guestId, answer]) => ({ guestId, answer }));
    try {
      await api(`/api/events/${encodeURIComponent(SLUG)}/rsvps`, { method: "PUT", json: { by: S.me.id, answers, note: S.note } });
      toast(T.sent);
      await loadEvent();
    } catch (err) {
      if (err.data?.error === "full") toast(T.full(err.data.left));
      else if (err.data?.error === "closed") toast(T.closed);
      else toast(T.error);
    }
  }

  // Going and maybe, as name tags; admins also see who can't go and who hasn't answered.
  function renderWho() {
    const e = S.event;
    const by = (a) => S.answers.filter((x) => x.a === a).map((x) => x.g).sort((x, y) => (nameOf(x) || "").localeCompare(nameOf(y) || ""));
    const tags = (ids) => el("div", { class: "tags" }, ids.map((id) => el("span", { class: "tag" + (circle().includes(id) ? " me" : "") }, nameOf(id) || "—")));
    const block = (a, ids) => el("div", { class: "who-block" }, el("span", { class: "meta-label", text: `${T[a] || T.noAnswer} · ${ids.length}` }), ids.length ? tags(ids) : null);
    if (!e.show_guests && !S.admin) return null;
    const going = by("yes"), maybe = by("maybe");
    const blocks = [block("yes", going), maybe.length ? block("maybe", maybe) : null];
    if (S.admin) {
      const answered = new Set(S.answers.map((x) => x.g));
      blocks.push(block("no", by("no")));
      const none = S.guests.filter((g) => !answered.has(g.id) && !g.added).map((g) => g.id).sort((x, y) => nameOf(x).localeCompare(nameOf(y)));
      blocks.push(el("details", { class: "who-block" }, el("summary", { class: "meta-label", text: `${T.noAnswer} · ${none.length}` }), tags(none)));
    }
    return el("section", { class: "ev-who" }, el("h2", { text: T.whoComing }),
      !going.length && !maybe.length && !S.admin ? el("p", { class: "hint", text: T.nobodyYet }) : null, blocks);
  }

  function renderAdmin() {
    const e = S.event;
    const notes = S.answers.filter((a) => a.note);
    const link = `${SITE}?e=${e.slug}`;
    return el("section", { class: "ev-admin" },
      el("h2", { text: T.adminTitle }),
      el("p", { class: "hint", text: T.totals(S.counts) }),
      notes.length ? el("div", { class: "who-block" }, el("span", { class: "meta-label", text: T.notes }),
        notes.map((a) => el("p", { class: "ev-note" }, el("b", { text: nameOf(a.g) || "—" }), ` ${a.note}`))) : null,
      el("div", { class: "sheet-foot" },
        el("button", { class: "btn", type: "button", text: T.share, onclick: () => shareLink(L(e, "title"), link) }),
        el("button", { class: "btn", type: "button", text: T.csv, onclick: () => downloadCsv(e) })));
  }

  async function shareLink(title, url) {
    try {
      if (navigator.share) return await navigator.share({ title, url });
      await navigator.clipboard.writeText(url);
      toast(T.copied);
    } catch {}
  }

  function downloadCsv(e) {
    const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["event", "name", "party", "side", "answer", "note", "answered_by", "updated_utc"]];
    for (const a of S.answers) {
      const g = S.guestById.get(a.g) || {};
      rows.push([e.slug, g.name, g.party, g.side, a.a, a.note, nameOf(a.by), a.at]);
    }
    const blob = new Blob(["﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n")], { type: "text/csv" });
    el("a", { href: URL.createObjectURL(blob), download: `rsvp-${e.slug}.csv` }).click();
  }

  // ── every event: the itinerary, by city and then by day ───────────────────
  async function renderIndex() {
    const d = await api(`/api/events${meParam()}`);
    S.admin = d.admin;
    $("#title").textContent = T.indexTitle;
    $("#title").classList.add("script");
    $("#lede").textContent = T.indexLede;
    $("#admin-pill").hidden = !S.admin;
    const mineFor = (slug) => S.me && d.mine.find((m) => m.e === slug && m.g === S.me.id)?.a;
    // Each plan opens its own page. With a mouse, resting on a plan shows its details on a card
    // just below it, without moving anything.
    const row = (e) => {
      const mine = mineFor(e.slug);
      const details = L(e, "details");
      return el("div", { class: "ev-row" },
        el("a", { class: "ev-link", href: `./?e=${e.slug}&lang=${LANG}`, "aria-describedby": details ? `info-${e.slug}` : null },
          e.listed ? null : el("small", { text: T.draft }),
          el("b", { text: L(e, "title") }),
          el("em", { text: [hours(e), e.place].filter(Boolean).join(" · ") })),
        mine ? el("span", { class: "pill ans-" + mine, text: T[mine] }) : null,
        details ? el("div", { class: "info-pop", id: `info-${e.slug}`, role: "tooltip" },
          e.address ? el("small", { text: e.address }) : null, el("p", { text: details })) : null);
    };
    // Map keeps the order the events come in (by sort), so cities and days read in date order.
    const group = (list, key) => [...list.reduce((m, e) => m.set(key(e), [...(m.get(key(e)) || []), e]), new Map())];
    put(main,
      el("div", { class: "itin" }, group(d.events, (e) => e.area || "").map(([area, events]) =>
        el("section", { class: "itin-area" },
          area ? el("header", { class: "area-head" }, el("h2", { text: area }), T.areas[area] ? el("small", { text: T.areas[area] }) : null) : null,
          group(events, (e) => e.starts_local?.slice(0, 10) || "").map(([day, list]) =>
            el("div", { class: "itin-day" },
              el("h3", { class: "day-head", text: day ? cap(fmtDay(day + "T12:00")) : T.tbc }),
              el("div", { class: "ev-list" }, list.map(row))))))),
      S.me ? el("p", { class: "ev-all" }, `${T.youAre} ${S.me.name} · `, el("button", { class: "link", type: "button", text: T.change, onclick: async () => { const g = await namePicker({ q: T.whoQ, hint: T.whoHint }); if (g) { setMe(g); renderIndex(); } } })) : null);
  }

  let toastTimer = 0;
  function toast(text) {
    const t = $("#toast");
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
  }

  $("#admin-pill").addEventListener("click", () => $(".ev-admin")?.scrollIntoView({ behavior: "smooth" }));
  async function boot() {
    try {
      await loadGuests();
      if (SLUG) await loadEvent();
      else await renderIndex();
    } catch (err) {
      if (err.status === 404) {
        $("#title").textContent = "RSVP";
        put(main, el("p", { class: "ev-all" }, T.missing, " ", el("a", { href: `./?lang=${LANG}`, text: T.allLink })));
      } else toast(T.error);
    }
  }
  boot();
})();
