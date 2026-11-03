// While the speeches are broadcast, the whole site shows them: any page a guest opens takes them
// to the live subtitles (translate/), and they come back here when the speeches end. Sean and
// Val are taken there too, until they leave the subtitles themselves (translate.js then sets
// wedding-bc-exit for this tab, until the broadcast ends).
(() => {
  const host = location.hostname;
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(host);
  const WS = (local ? `ws://${host}:8932` : "wss://subtitulos.valeriaandseanharrigan.workers.dev") + "/ws?role=viewer";
  const EXIT = "wedding-bc-exit";
  const session = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    del(k) { try { sessionStorage.removeItem(k); } catch {} },
  };
  const admin = (() => { try { return !!localStorage.getItem("wedding-admin-v1"); } catch { return false; } })();
  // the site's root, from this script's own address (…/assets/gpt/speech-watch.js)
  const root = new URL("../../", document.currentScript.src).pathname;

  let sock = null, retry = 0, on = false, gone = false, hiddenAt = 0;
  function go() {
    if (gone || !on || (admin && session.get(EXIT))) return;
    // a page that's busy (photos still uploading) holds the speeches back until it's done
    if (window.svHoldTakeover?.()) return void setTimeout(go, 2000);
    gone = true;
    const here = location.pathname + location.search + location.hash;
    location.replace(`${root}translate/?speeches=1&from=${encodeURIComponent(here)}`);
  }
  function connect() {
    if (gone || (sock && sock.readyState <= 1)) return;
    let s;
    try { s = new WebSocket(WS); } catch { return; }
    sock = s;
    s.onopen = () => { retry = 0; };
    s.onmessage = (e) => {
      let m;
      try { m = JSON.parse(e.data); } catch { return; }
      if (m.t !== "state") return;
      on = !!m.broadcast;
      if (on) go(); else session.del(EXIT);
    };
    s.onclose = () => {
      if (sock !== s) return;
      sock = null;
      setTimeout(connect, Math.min(15000, 1000 * 2 ** retry++));
    };
  }
  connect();
  // Phones drop sockets while the screen sleeps; after a while away, start a fresh one.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") { hiddenAt = Date.now(); return; }
    if (sock && hiddenAt && Date.now() - hiddenAt > 20000) { const s = sock; sock = null; try { s.close(); } catch {} }
    hiddenAt = 0;
    connect();
  });
  // coming back to a page from the browser's back/forward memory
  addEventListener("pageshow", (e) => { if (e.persisted) { gone = false; connect(); } });
})();
