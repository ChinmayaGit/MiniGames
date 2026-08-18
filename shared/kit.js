/**
 * MiniGames shared kit — lobby, invites, join, loading, warnings, leave.
 * Game HTML files should only keep rules, board, and theme.
 *
 * <link rel="stylesheet" href="shared/boot.css">
 * <link rel="stylesheet" href="shared/shell.css">
 * <script src="https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js"></script>
 * <script src="shared/kit.js"></script>
 */
(function (global) {
  const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const WIFI_HINT =
    "Same Wi‑Fi is easiest. Two different home Wi‑Fi on the same ISP (two routers, even a few km apart) often cannot connect. Put one phone on mobile data, or join the same Wi‑Fi. Different ISPs, or one person on mobile data, usually work at any distance.";
  const STUN = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ];

  const $ = (id) => document.getElementById(id);
  let toastTimer = 0;
  let cfg = { hubHref: "index.html", nameKey: "minigame-name", maxPlayers: 8 };

  function init(options) {
    cfg = Object.assign({}, cfg, options || {});
    ensureChrome();
    const saved = localStorage.getItem(cfg.nameKey);
    if (saved && $("name")) $("name").value = saved;
    const roomParam = (new URLSearchParams(location.search).get("room") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    if ($("join-code") && roomParam.length === 4) $("join-code").value = roomParam;
    document.body.setAttribute("data-phase", "home");
    ready();
    return { roomParam };
  }

  function ready() {
    document.documentElement.classList.remove("booting");
  }

  function screens() {
    return {
      home: $("screen-home"),
      lobby: $("screen-lobby"),
      game: $("screen-game"),
      end: $("screen-end"),
    };
  }

  function showScreen(name) {
    Object.values(screens()).forEach((el) => {
      if (el) el.classList.remove("active");
    });
    const el = screens()[name];
    if (el) el.classList.add("active");
    document.body.setAttribute("data-phase", name || "home");
  }

  function toast(msg) {
    const el = $("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
  }

  function showError(id, msg) {
    const el = $(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("show", !!msg);
  }

  function requireName() {
    const input = $("name");
    const name = (input && input.value || "").trim();
    if (!name) {
      showError("home-error", "Enter your name first.");
      if (input) {
        input.classList.add("bad");
        input.focus();
      }
      return "";
    }
    input.classList.remove("bad");
    showError("home-error", "");
    return name.slice(0, 16);
  }

  function rememberName(name) {
    if (name) localStorage.setItem(cfg.nameKey, name);
  }

  function setBusy(on) {
    if (typeof cfg.setBusy === "function") cfg.setBusy(!!on);
  }

  function isBusy() {
    return typeof cfg.isBusy === "function" ? !!cfg.isBusy() : false;
  }

  function showWarmup(title, text) {
    ensureChrome();
    setBusy(true);
    if ($("warmup-title") && title) $("warmup-title").textContent = title;
    if ($("warmup-text") && text) $("warmup-text").textContent = text;
    $("warmup").classList.add("show");
  }

  function hideWarmup() {
    setBusy(false);
    const box = $("warmup");
    if (box) box.classList.remove("show");
    ["btn-create", "btn-join", "btn-solo"].forEach((id) => {
      if ($(id)) $(id).disabled = false;
    });
  }

  function setJoinStatus(kind, text, busy) {
    const box = $("join-status");
    if (!box) return;
    box.className = "join-status" + (kind ? " show " + kind : "");
    if ($("join-status-text")) $("join-status-text").textContent = text || "";
    const pending = kind === "connecting" || kind === "joining";
    if (busy == null) busy = isBusy();
    ["btn-join", "btn-create", "btn-solo"].forEach((id) => {
      if ($(id)) $(id).disabled = pending || !!busy;
    });
    if (kind === "fail") hideWarmup();
  }

  function waitForPeer(ok, fail) {
    if (typeof Peer !== "undefined") {
      ok();
      return;
    }
    showWarmup("Waking up multiplayer…", "The connection service may be asleep. Wait here — don’t tap again.");
    let n = 0;
    const t = setInterval(() => {
      n += 1;
      if (typeof Peer !== "undefined") {
        clearInterval(t);
        ok();
      } else if (n >= 50) {
        clearInterval(t);
        fail();
      }
    }, 250);
  }

  function randomCode() {
    let s = "";
    for (let i = 0; i < 4; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    return s;
  }

  function inviteUrl(room) {
    const u = new URL(location.href);
    u.search = "";
    u.hash = "";
    if (room) u.searchParams.set("room", room);
    return u.toString();
  }

  function setQr(url) {
    const img = $("qr");
    if (img) img.src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + encodeURIComponent(url);
  }

  async function copyInvite(url) {
    try {
      await navigator.clipboard.writeText(url);
      toast("Invite link copied");
    } catch (e) {
      toast(url || "Could not copy");
    }
  }

  function peerOptions(extraIce) {
    return {
      debug: 0,
      secure: location.protocol === "https:",
      config: {
        iceCandidatePoolSize: 8,
        iceServers: STUN.concat(extraIce || []),
      },
    };
  }

  function wifiHint() {
    return WIFI_HINT;
  }

  function stripRoomFromUrl() {
    const u = new URL(location.href);
    if (!u.searchParams.has("room")) return;
    u.searchParams.delete("room");
    const q = u.searchParams.toString();
    history.replaceState({}, "", u.pathname + (q ? "?" + q : "") + u.hash);
  }

  function renderPlayerList(players, myId, statusOf) {
    const list = $("lobby-players");
    if (!list) return;
    list.replaceChildren();
    for (const p of players) {
      const seat = document.createElement("div");
      seat.className = "seat" + (p.id === myId ? " you" : "");
      const dot = document.createElement("div");
      dot.className = "dot";
      dot.style.background = p.color || "#888";
      dot.textContent = String(p.name || "?").slice(0, 1).toUpperCase();
      const meta = document.createElement("div");
      meta.className = "meta";
      const b = document.createElement("b");
      b.textContent = p.name + (p.id === "host" ? " (host)" : "");
      const s = document.createElement("span");
      s.textContent = statusOf ? statusOf(p) : (p.connected ? "connected" : "offline");
      meta.append(b, s);
      seat.append(dot, meta);
      list.append(seat);
    }
  }

  function ensureChrome() {
    if (!$("warmup")) {
      const wrap = document.createElement("div");
      wrap.id = "warmup";
      wrap.className = "warmup";
      wrap.setAttribute("aria-live", "polite");
      wrap.innerHTML =
        '<div class="warmup-card"><div class="warmup-spin" aria-hidden="true"></div>' +
        '<b id="warmup-title">Waking up…</b>' +
        '<p id="warmup-text">The site may be asleep. Wait here — don’t tap again.</p></div>';
      document.body.insertBefore(wrap, document.body.firstChild);
    }
    if (!$("toast")) {
      const t = document.createElement("div");
      t.className = "toast";
      t.id = "toast";
      document.body.appendChild(t);
    }
    const home = $("screen-home");
    if (home && !home.querySelector(".all-games")) {
      const p = document.createElement("p");
      p.className = "all-games";
      p.innerHTML = '<a href="' + (cfg.hubHref || "index.html") + '">← All games</a>';
      home.insertBefore(p, home.firstChild);
    }
    const panel = home && home.querySelector(".panel");
    if (panel && !$("net-warn")) {
      const warn = document.createElement("div");
      warn.className = "net-warn";
      warn.id = "net-warn";
      warn.innerHTML = "<b>Wi‑Fi tip</b> " + WIFI_HINT;
      panel.appendChild(warn);
    }
    if (!$("zoom-bar")) {
      const bar = document.createElement("div");
      bar.className = "zoom-bar";
      bar.id = "zoom-bar";
      bar.innerHTML =
        '<button type="button" id="btn-zoom-out" title="Zoom out" aria-label="Zoom out">−</button>' +
        '<span id="zoom-label">100%</span>' +
        '<button type="button" id="btn-zoom-in" title="Zoom in" aria-label="Zoom in">+</button>';
      document.body.appendChild(bar);
    }
    bindZoom();
  }

  const ZOOM_KEY = "minigames-zoom";
  const ZOOM_MIN = 0.8;
  const ZOOM_MAX = 1.6;
  const ZOOM_STEP = 0.1;
  let zoomLevel = 1;

  function bindZoom() {
    try {
      const saved = parseFloat(localStorage.getItem(ZOOM_KEY));
      if (saved && saved >= ZOOM_MIN && saved <= ZOOM_MAX) zoomLevel = saved;
    } catch (e) {}
    applyZoom();
    if ($("btn-zoom-in")) $("btn-zoom-in").onclick = () => setZoom(zoomLevel + ZOOM_STEP);
    if ($("btn-zoom-out")) $("btn-zoom-out").onclick = () => setZoom(zoomLevel - ZOOM_STEP);
  }

  function setZoom(next) {
    zoomLevel = Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next)) * 10) / 10;
    applyZoom();
    try { localStorage.setItem(ZOOM_KEY, String(zoomLevel)); } catch (e) {}
  }

  function applyZoom() {
    document.documentElement.style.setProperty("--mg-zoom", String(zoomLevel));
    if ($("zoom-label")) $("zoom-label").textContent = Math.round(zoomLevel * 100) + "%";
    if ($("btn-zoom-out")) $("btn-zoom-out").disabled = zoomLevel <= ZOOM_MIN;
    if ($("btn-zoom-in")) $("btn-zoom-in").disabled = zoomLevel >= ZOOM_MAX;
  }

  function bindHome(handlers) {
    const h = handlers || {};
    if ($("btn-create")) $("btn-create").onclick = () => h.onCreate && h.onCreate();
    if ($("btn-join")) $("btn-join").onclick = () => h.onJoin && h.onJoin($("join-code").value);
    if ($("join-code")) {
      $("join-code").addEventListener("keydown", (e) => {
        if (e.key === "Enter" && h.onJoin) h.onJoin($("join-code").value);
      });
    }
    if ($("btn-solo") && h.onSolo) $("btn-solo").onclick = h.onSolo;
    if ($("name")) {
      $("name").addEventListener("input", () => {
        if ($("name").value.trim()) $("name").classList.remove("bad");
      });
    }
    if ($("btn-copy")) {
      $("btn-copy").onclick = () => copyInvite(h.inviteUrl ? h.inviteUrl() : inviteUrl());
    }
    ["btn-lobby-leave", "btn-game-leave", "btn-invite-leave", "btn-reconnect-leave"].forEach((id) => {
      if ($(id) && h.onLeave) $(id).onclick = h.onLeave;
    });
    if ($("btn-home") && h.onHome) $("btn-home").onclick = h.onHome;
    if ($("btn-again") && h.onAgain) $("btn-again").onclick = h.onAgain;
    if ($("btn-start") && h.onStart) $("btn-start").onclick = h.onStart;
  }

  global.MiniGames = {
    $,
    init,
    ready,
    showScreen,
    toast,
    showError,
    requireName,
    rememberName,
    showWarmup,
    hideWarmup,
    setJoinStatus,
    waitForPeer,
    randomCode,
    inviteUrl,
    setQr,
    copyInvite,
    peerOptions,
    wifiHint,
    stripRoomFromUrl,
    renderPlayerList,
    bindHome,
    setZoom,
  };
})(window);
