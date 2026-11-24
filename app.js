/* Essay Jar — recall practice for essay exams. No build step, no server. */
(() => {
  "use strict";

  const C = window.COURSE;
  const app = document.getElementById("app");
  const modal = document.getElementById("modal");
  let timer = null;
  let lastDraw = null;

  /* ---------- small helpers ---------- */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => (n < 10 ? "0" : "") + n;
  const fmt = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const today = () => fmt(new Date());
  const ymd = (s) => s.split("-").map(Number);
  const addDays = (s, n) => { const [y, m, d] = ymd(s); return fmt(new Date(y, m - 1, d + n)); };
  const diff = (a, b) => { const [y1, m1, d1] = ymd(a), [y2, m2, d2] = ymd(b);
    return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 864e5); };
  const longDate = (s) => { const [y, m, d] = ymd(s);
    return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }); };
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage full or blocked */ } },
    del: (k) => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
    keys: () => { try { return Object.keys(localStorage); } catch (e) { return []; } }
  };
  const reduceMotion = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- in-page timers ----------
     A dial you tap to start; one runs at a time; a soft chime when it ends. */
  let ticker = null;
  let audio = null;
  const BASE_TITLE = document.title;
  const mmss = (sec) => { const t = Math.max(0, Math.ceil(sec)); return Math.floor(t / 60) + ":" + pad(t % 60); };

  const timerHTML = (secs, label, opts = {}) => {
    const locked = !!opts.locked;
    return `
    <div class="timer${opts.big ? " big" : ""}${opts.compact ? " compact" : ""}" data-secs="${secs}" data-left="${secs}" data-state="${locked ? "running" : "idle"}"${locked ? " data-locked" : ""}>
      <button type="button" class="timer-dial" ${locked ? `tabindex="-1" aria-hidden="true"` : `data-tact="toggle" aria-label="Start or pause the ${esc(label.toLowerCase())} timer"`}>
        <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
          <circle class="t-track" cx="60" cy="60" r="52"/>
          <circle class="t-prog" cx="60" cy="60" r="52" pathLength="100"/>
        </svg>
        <span class="t-time">${mmss(secs)}</span>
      </button>
      <div class="t-side">
        <p class="t-label">${esc(label)}</p>
        <p class="t-state" aria-live="polite">${locked ? esc(opts.note || "") : "Tap the dial to start."}</p>
        ${opts.choices ? `<div class="t-chips">${opts.choices.map((m) => `<button type="button" data-tset="${m * 60}" aria-pressed="${m * 60 === secs}">${m} min</button>`).join("")}</div>` : ""}
        ${locked ? "" : `<div class="t-controls"><button type="button" data-tact="toggle">Start</button><button type="button" data-tact="reset">Reset</button></div>`}
      </div>
    </div>`;
  };

  const paintTimer = (el, left) => {
    const total = Number(el.dataset.secs) || 1;
    el.dataset.left = String(left);
    el.querySelector(".t-time").textContent = mmss(left);
    el.querySelector(".t-prog").style.strokeDashoffset = String(100 * (1 - left / total));
  };
  const setTimerState = (el, state) => {
    el.dataset.state = state;
    if (el.hasAttribute("data-locked")) return;
    el.querySelector(".t-state").textContent =
      { idle: "Tap the dial to start.", running: "Running. Tap the dial to pause.", paused: "Paused.", done: "Time’s up." }[state];
    const btn = el.querySelector(".t-controls [data-tact=toggle]");
    if (btn) btn.textContent = { idle: "Start", running: "Pause", paused: "Resume", done: "Again" }[state];
  };
  const stopTicker = () => {
    if (ticker) { clearInterval(ticker.iv); ticker = null; }
    document.title = BASE_TITLE;
  };
  const wakeAudio = () => {
    try {
      const A = window.AudioContext || window.webkitAudioContext;
      if (A && !audio) audio = new A();
      if (audio && audio.state === "suspended") audio.resume();
    } catch (e) { audio = null; }
  };
  const chime = () => {
    try {
      if (audio) {
        const t0 = audio.currentTime;
        [[660, 0], [880, 0.22]].forEach(([f, t]) => {
          const o = audio.createOscillator(), g = audio.createGain();
          o.type = "sine"; o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, t0 + t);
          g.gain.exponentialRampToValueAtTime(0.16, t0 + t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + t + 0.7);
          o.connect(g); g.connect(audio.destination);
          o.start(t0 + t); o.stop(t0 + t + 0.75);
        });
      }
      if (navigator.vibrate) navigator.vibrate([90, 60, 90]);
    } catch (e) { /* sound is optional */ }
  };
  const runTimer = (el, onDone) => {
    stopTicker();
    const end = Date.now() + Number(el.dataset.left) * 1000;
    setTimerState(el, "running");
    const step = () => {
      if (!el.isConnected) { stopTicker(); return; }
      const left = Math.max(0, (end - Date.now()) / 1000);
      paintTimer(el, left);
      el.classList.toggle("low", el.hasAttribute("data-locked") && left < 600);
      document.title = `(${mmss(left)}) ${BASE_TITLE}`;
      if (left <= 0) {
        stopTicker();
        setTimerState(el, "done");
        chime();
        if (onDone) onDone(el);
      }
    };
    ticker = { el, iv: setInterval(step, 250) };
    step();
  };
  // When a timer ends, gently point at the next button.
  const nudgeNext = (el) => {
    const main = el.closest("main");
    const target = main && main.querySelector("[data-nudge]");
    if (target) { target.classList.remove("nudge"); void target.offsetWidth; target.classList.add("nudge"); }
  };

  /* ---------- users and progress ----------
     Users are profiles on this device. A guest's progress lives only in memory. */
  const USERS_KEY = "essayjar:users";
  const CUR_KEY = "essayjar:current";
  const LEGACY_KEY = "essayjar:" + C.id;
  const keyFor = (id) => "essayjar:" + C.id + ":u:" + id;
  const draftPrefix = (id) => "essayjar-draft:" + C.id + ":" + id + ":";
  const newId = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  const norm = (s) => {
    s.learned = s.learned || {};
    s.quiz = s.quiz || {};
    s.quiz.days = s.quiz.days || {};
    s.quiz.last = s.quiz.last || {};
    s.play = s.play || {};
    s.xp = s.xp || 0;
    return s;
  };
  const fresh = () => norm({ v: 1, start: today(), exam: C.examDate, att: {}, due: {} });
  const valid = (s) => !!(s && s.v === 1 && s.att && s.due && s.start && s.exam);
  const loadState = (id) => {
    try { const s = JSON.parse(store.get(keyFor(id))); if (valid(s)) return norm(s); } catch (e) { /* fall through */ }
    return fresh();
  };
  const loadUsers = () => {
    try { const u = JSON.parse(store.get(USERS_KEY)); if (Array.isArray(u)) return u.filter((x) => x && x.id && x.name); } catch (e) { /* fall through */ }
    return [];
  };

  let users = loadUsers();
  const saveUsers = () => store.set(USERS_KEY, JSON.stringify(users));

  // Progress saved before users existed becomes a user called "Me".
  (() => {
    const legacy = store.get(LEGACY_KEY);
    if (!legacy) return;
    try {
      if (valid(JSON.parse(legacy))) {
        const id = newId();
        users.push({ id, name: "Me", created: today() });
        store.set(keyFor(id), legacy);
        saveUsers();
        if (!store.get(CUR_KEY)) store.set(CUR_KEY, id);
      }
    } catch (e) { /* ignore */ }
    store.del(LEGACY_KEY);
  })();

  /* ---------- online accounts ----------
     With an API address in config.js, accounts live in the owner's Google Sheet: name + password,
     progress saved online. Without it, users are profiles on this device (as before). */
  const API = String(window.ESSAYJAR_API || "").trim();
  const ONLINE = /^https:\/\//.test(API);
  const OWNER = String(window.ESSAYJAR_OWNER || "the site owner");
  const ACCT_KEY = "essayjar:acct";
  const GUEST_KEY = "essayjar:guest";
  const dirtyKey = (id) => "essayjar:dirty:" + id;
  const session = {
    get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } },
    del: (k) => { try { sessionStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };
  let acct = null;
  if (ONLINE) { try { acct = JSON.parse(store.get(ACCT_KEY)); if (!acct || !acct.token || !acct.id) acct = null; } catch (e) { acct = null; } }
  const acctUser = (a) => ({ id: "acct-" + a.id, name: a.name, online: true, admin: !!a.admin });
  const apiCall = (action, body, keepalive) => fetch(API, {
    method: "POST", body: JSON.stringify(Object.assign({ action }, body || {})), keepalive: !!keepalive
  }).then((r) => r.json());
  const anyProgress = (s) => !!(s && (Object.keys(s.att || {}).length || Object.keys(s.learned || {}).length ||
    Object.keys(s.play || {}).length || Object.keys((s.quiz || {}).days || {}).length || s.xp));

  let user = ONLINE ? (acct ? acctUser(acct) : null) : (users.find((u) => u.id === store.get(CUR_KEY)) || null);
  let S = user ? loadState(user.id) : fresh();

  let syncT = null, syncAt = 0, syncing = false, syncState = "saved";
  const setSync = (st) => { syncState = st; const el = document.querySelector(".who"); if (el) el.dataset.sync = st; };
  const queueSync = (delay) => {
    if (!user || !user.online || !acct) return;
    const at = Date.now() + delay;
    if (syncT && syncAt <= at) return;
    clearTimeout(syncT);
    syncAt = at;
    syncT = setTimeout(() => { syncT = null; syncNow(false); }, delay);
  };
  const syncNow = (keepalive) => {
    if (!user || !user.online || !acct || syncing || store.get(dirtyKey(user.id)) !== "1") return Promise.resolve();
    syncing = true;
    setSync("saving");
    const stamp = S.updatedAt, uid = user.id;
    return apiCall("save", { token: acct.token, data: S }, keepalive).then((r) => {
      if (r && r.ok) { if (user && user.id === uid && S.updatedAt === stamp) store.del(dirtyKey(uid)); setSync("saved"); }
      else if (r && /log in/i.test(r.error || "")) sessionEnded();
      else setSync("offline");
    }).catch(() => setSync("offline")).then(() => {
      syncing = false;
      if (user && user.online && store.get(dirtyKey(user.id)) === "1") queueSync(15000);
    });
  };
  const save = () => {
    S.updatedAt = Date.now();
    if (!user) return;
    store.set(keyFor(user.id), JSON.stringify(S));
    if (user.online) { store.set(dirtyKey(user.id), "1"); queueSync(2500); }
  };
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") syncNow(true); });

  // Decide which copy wins after login or reload: unsynced newer local work, then the server, then guest/device progress.
  const reconcile = (r, guestS) => {
    const uid = "acct-" + r.user.id;
    let cached = null;
    try { const c = JSON.parse(store.get(keyFor(uid))); if (valid(c)) cached = norm(c); } catch (e) { cached = null; }
    const dirty = store.get(dirtyKey(uid)) === "1";
    let push = false, from = "server";
    if (cached && dirty && (cached.updatedAt || 0) > (r.updated || 0)) { S = cached; push = true; from = "device"; }
    else if (r.data && valid(r.data)) S = norm(r.data);
    else {
      const local = !guestS && users.find((u) => u.name.toLowerCase() === r.user.name.toLowerCase());
      const ls = local ? loadState(local.id) : null;
      if (guestS && anyProgress(guestS)) { S = guestS; from = "guest"; }
      else if (ls && anyProgress(ls)) { S = ls; from = "device"; }
      else S = fresh();
      push = true;
    }
    store.set(keyFor(uid), JSON.stringify(S));
    if (push) { store.set(dirtyKey(uid), "1"); queueSync(400); }
    return from;
  };
  const startSession = (r, guestS) => {
    acct = { token: r.token, id: r.user.id, name: r.user.name, admin: !!r.user.admin };
    store.set(ACCT_KEY, JSON.stringify(acct));
    session.del(GUEST_KEY);
    user = acctUser(acct);
    return reconcile(r, guestS);
  };
  let loginMsg = "";
  const sessionEnded = () => {
    acct = null; user = null; S = fresh();
    store.del(ACCT_KEY);
    loginMsg = "Your session ended. Log in again.";
    location.hash = "#/login";
  };
  const logout = () => {
    const a = acct, u = user;
    const done = () => {
      if (u && store.get(dirtyKey(u.id)) !== "1") store.del(keyFor(u.id));
      acct = null; user = null; S = fresh();
      store.del(ACCT_KEY);
      session.del(GUEST_KEY);
      location.hash = "#/login";
    };
    syncNow(false).then(() => { if (a) apiCall("logout", { token: a.token }).catch(() => {}); done(); }, done);
  };
  const bootSync = () => {
    if (!ONLINE || !acct) return;
    apiCall("me", { token: acct.token }).then((r) => {
      if (r && r.ok) {
        acct.admin = !!r.user.admin; acct.name = r.user.name;
        store.set(ACCT_KEY, JSON.stringify(acct));
        user = acctUser(acct);
        const before = JSON.stringify(S);
        reconcile(r, null);
        setSync("saved");
        const v = location.hash.replace(/^#\/?/, "").split("/")[0];
        if (JSON.stringify(S) !== before && ["", "play", "study", "board", "admin", "account", "how", "settings"].includes(v)) route();
      } else if (r && /log in/i.test(r.error || "")) sessionEnded();
    }).catch(() => setSync("offline"));
  };

  // Presence ping: marks you online for the admin page and picks up a one-time kick.
  let kicked = null;
  const showKick = () => {
    if (!kicked) return;
    stopGame(); gameKey = null; closeModal(); destroyET(); stopTicker();
    clearInterval(timer); timer = null;
    app.onclick = null; app.onsubmit = null; app.innerHTML = "";
    let el = document.getElementById("kicked");
    if (!el) { el = document.createElement("div"); el.id = "kicked"; document.body.appendChild(el); }
    el.innerHTML = `
      <div class="kick-card" role="alertdialog" aria-modal="true" aria-labelledby="kickH">
        <div class="kick-art">${window.bossSVG ? window.bossSVG("final", "kick-boss") : ""}</div>
        <p class="kick-by">${esc(kicked.by || OWNER)} kicked you</p>
        <h2 id="kickH" class="kick-msg">${esc(kicked.msg)}</h2>
        <button class="btn" data-kick-reload>Refresh to come back</button>
      </div>`;
    el.querySelector("[data-kick-reload]").onclick = () => location.reload();
    el.querySelector("[data-kick-reload]").focus();
  };
  const ping = () => {
    if (!ONLINE || !acct || kicked || document.visibilityState !== "visible") return;
    const view = location.hash.replace(/^#\/?/, "").split("/").slice(0, 3).join("/") || "home";
    apiCall("ping", { token: acct.token, view }).then((r) => {
      if (r && r.ok && r.kick) { kicked = r.kick; syncNow(true); showKick(); }
      else if (r && !r.ok && /log in/i.test(r.error || "")) sessionEnded();
    }).catch(() => {});
  };
  setInterval(ping, 15000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") ping(); });
  document.addEventListener("keydown", (ev) => { if (kicked && ev.key !== "Tab") { ev.stopImmediatePropagation(); if (ev.key !== "Enter") ev.preventDefault(); } }, true);

  // Study time: counted while the page is visible and you've touched it in the last 90 seconds.
  const dayLog = () => { const t = today(); S.log = S.log || {}; return (S.log[t] = S.log[t] || { secs: 0, xp: 0, ev: [] }); };
  const trimLog = () => {
    const t = today();
    Object.keys(S.log || {}).forEach((k) => { const age = diff(k, t); if (age > 60) delete S.log[k]; else if (age > 7) delete S.log[k].ev; });
  };
  const logEvent = (k, id, v) => {
    const d = dayLog();
    d.ev = d.ev || [];
    d.ev.push({ t: Date.now(), k, id: id || 0, v: v == null ? "" : v });
    if (d.ev.length > 30) d.ev.splice(0, d.ev.length - 30);
    trimLog();
    save();
  };
  let lastInput = Date.now();
  ["pointerdown", "keydown", "wheel", "touchstart", "input"].forEach((t) => document.addEventListener(t, () => { lastInput = Date.now(); }, { passive: true, capture: true }));
  setInterval(() => {
    if (document.visibilityState !== "visible" || Date.now() - lastInput > 90000) return;
    const d = dayLog();
    d.secs = (d.secs || 0) + 15;
    if (!user) return;
    S.updatedAt = Date.now();
    store.set(keyFor(user.id), JSON.stringify(S));
    if (user.online) { store.set(dirtyKey(user.id), "1"); queueSync(60000); }
  }, 15000);
  const switchTo = (u) => {
    user = u || null;
    if (user) store.set(CUR_KEY, user.id); else store.del(CUR_KEY);
    S = user ? loadState(user.id) : fresh();
  };
  const hasProgress = (s) => Object.keys(s.att).some((id) => s.att[id] && s.att[id].length);
  const deleteUser = (id) => {
    store.del(keyFor(id));
    store.keys().filter((k) => k.startsWith(draftPrefix(id))).forEach((k) => store.del(k));
    users = users.filter((u) => u.id !== id);
    saveUsers();
    if (user && user.id === id) switchTo(null);
  };

  const guestDrafts = {};
  const draft = {
    get: (eid) => (user ? store.get(draftPrefix(user.id) + eid) || "" : guestDrafts[eid] || ""),
    set: (eid, v) => { if (user) store.set(draftPrefix(user.id) + eid, v); else guestDrafts[eid] = v; },
    del: (eid) => { if (user) store.del(draftPrefix(user.id) + eid); else delete guestDrafts[eid]; }
  };

  /* ---------- text matching ---------- */
  const SUP = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
  const GREEK = { "α": "alpha", "β": "beta", "γ": "gamma", "δ": "delta", "ε": "epsilon" };
  const clean = (s) => String(s).toLowerCase()
    .replace(/[\u2080-\u2089]/g, (c) => String(c.charCodeAt(0) - 0x2080))
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => SUP[c])
    .replace(/[αβγδε]/g, (c) => " " + GREEK[c] + " ")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();

  const parseKeys = (k) => !k ? [] : k.split(";")
    .map((g) => g.split("|").map((alt) => clean(alt).split(" ").filter(Boolean)).filter((a) => a.length))
    .filter((g) => g.length);

  const tokenize = (text) => {
    const raws = [], toks = [], re = /\S+/g;
    let m;
    while ((m = re.exec(text))) {
      const r = raws.length;
      raws.push({ s: m[0], i: m.index });
      clean(m[0]).split(" ").filter(Boolean).forEach((w) => toks.push({ w, r }));
    }
    return { raws, toks };
  };

  const lev = (a, b) => {
    if (a === b) return 0;
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[b.length];
  };

  const wordMatch = (w, a) => {
    if (a.length <= 3) return w === a;
    if (w.startsWith(a)) return true;
    if (a.length < 6) return false;
    const tol = a.length >= 10 ? 2 : 1;
    if (Math.abs(w.length - a.length) <= tol && lev(w, a) <= tol) return true;
    return w.length > a.length && lev(w.slice(0, a.length), a) <= tol;
  };

  const findAlt = (toks, alt) => {
    for (let i = 0; i + alt.length <= toks.length; i++) {
      let ok = true;
      for (let j = 0; j < alt.length; j++) { if (!wordMatch(toks[i + j].w, alt[j])) { ok = false; break; } }
      if (ok) return i;
    }
    return -1;
  };

  // Returns the raw-token indexes that proved the atom, or null.
  const checkAtom = (T, atom) => {
    if (!atom.groups.length) return null;
    const hits = [];
    for (const group of atom.groups) {
      let found = false;
      for (const alt of group) {
        const i = findAlt(T.toks, alt);
        if (i >= 0) { for (let j = 0; j < alt.length; j++) hits.push(T.toks[i + j].r); found = true; break; }
      }
      if (!found) return null;
    }
    return hits;
  };

  const highlight = (text, T, hitSet) => {
    let out = "", last = 0, open = false, n = 0;
    T.raws.forEach((r, ri) => {
      const gap = esc(text.slice(last, r.i));
      const hit = hitSet.has(ri);
      if (open && !hit) { out += "</mark>"; open = false; }
      out += gap;
      if (hit && !open) { out += `<mark style="--d:${Math.min(n++, 40) * 70}ms">`; open = true; }
      out += esc(r.s);
      last = r.i + r.s.length;
    });
    if (open) out += "</mark>";
    return out + esc(text.slice(last));
  };

  /* ---------- essays ---------- */
  const E = {};
  C.essays.forEach((e) => {
    e.atoms = [];
    e.sections.forEach((sec, si) => sec.atoms.forEach((a, ai) => {
      a.id = si + "." + ai; a.sec = si; a.groups = parseKeys(a.k); e.atoms.push(a);
    }));
    E[e.id] = e;
  });
  const PWS = (window.PATHWAYS && window.PATHWAYS.items) || [];
  PWS.forEach((e) => {
    e.atoms = [];
    e.sections.forEach((sec, si) => sec.atoms.forEach((a, ai) => {
      a.id = si + "." + ai; a.sec = si; a.groups = parseKeys(a.k); e.atoms.push(a);
    }));
    E[e.id] = e;
  });
  const isPW = (e) => !!(e && e.kind === "pathway");
  const qn = (e) => isPW(e) ? "P" + e.num : "Q" + (e ? e.id : "");
  const en = (e) => isPW(e) ? "Pathway " + e.num : "Essay " + e.id;
  const PLAN_DAYS = Math.max(...C.essays.map((e) => e.day || 1));
  const lectureName = (l) => (C.lectures && C.lectures[l]) || l;

  /* ---------- EssayType: monkeytype-style typing rounds ----------
     Copy round (every word passes through your head), then gaps (key terms
     hidden: cued recall), then first letters only (vanishing cues). */
  const TYPE_MAP = {
    "→": " -> ", "⇌": " <-> ", "⇄": " <-> ", "↑": " high ", "↓": " low ", "⊗": " x ", "⊖": " (-) ", "⊕": " (+) ",
    "–": "-", "—": " - ", "−": "-", "’": "'", "‘": "'", "′": "'", "“": "\"", "”": "\"", "…": "...", "×": "x",
    "≈": "~", "•": " ", "µ": "u", "α": "alpha", "β": "beta", "γ": "gamma", "δ": "delta", "ε": "epsilon", "⁺": "+", "⁻": "-"
  };
  const toTypeable = (s) => String(s || "")
    .replace(/[₀-₉]/g, (c) => String(c.charCodeAt(0) - 0x2080))
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => SUP[c])
    .replace(/[→⇌⇄↑↓⊗⊖⊕–—−’‘′“”…×≈•µαβγδε⁺⁻]/g, (c) => TYPE_MAP[c])
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7E]/g, "");
  const typeWords = (text) => toTypeable(text).split(/\s+/).map((w) => {
    if (/[a-z0-9]/i.test(w)) return w.replace(/^[(\[{"']+/, "").replace(/[)\]}"',.;:!?]+$/, "");
    if (w === "(+)" || w === "(-)") return w;
    return w.replace(/[()\[\]{}"',.;:!?]/g, "");
  }).filter((w) => w && !/^-+$/.test(w));

  const ET_STOP = new Set(["not", "all", "rest", "other", "stored", "before", "low", "high", "the", "and", "with",
    "from", "into", "dark", "night", "trace", "linked", "connect", "coupled", "cross", "balance", "reciprocal", "drug",
    "type", "diet", "active", "black", "white", "pale", "clay", "mouse", "kidney", "renal", "urine", "feces", "faeces", "stool"]);
  const keyTokens = (atoms) => {
    const set = new Set();
    atoms.forEach((a) => a.groups.forEach((g) => g.forEach((alt) => alt.forEach((t) => {
      if ((t.length >= 3 || /\d/.test(t)) && !ET_STOP.has(t)) set.add(t);
    }))));
    return [...set];
  };
  const isKeyWord = (w, keys) => {
    if (/^(I|II|III|IV|V|VI)$/.test(w)) return true;
    const toks = clean(w).split(" ").filter(Boolean);
    return toks.some((t) => /\d/.test(t) || keys.some((k) => (k.length <= 3 ? t === k : wordMatch(t, k))));
  };
  const ET_PLAIN = new Set(["through", "because", "everything", "everyone", "another", "between", "without", "together",
    "normally", "contains", "usually", "therefore", "important", "nothing", "someone", "whether", "anything", "himself", "herself", "neither", "either"]);
  // Key words for the gaps round; passages with few key terms are topped up with their longest words.
  const gapFlags = (words, keys) => {
    const flags = words.map((w) => isKeyWord(w, keys));
    const want = Math.ceil(words.length * 0.2);
    let have = flags.filter(Boolean).length;
    if (have < want) {
      words.map((w, i) => ({ i, n: w.replace(/[^a-z]/gi, "").length, w: w.toLowerCase() }))
        .filter((x) => !flags[x.i] && x.n >= 7 && !ET_PLAIN.has(x.w))
        .sort((a, b) => b.n - a.n)
        .forEach((x) => { if (have < want) { flags[x.i] = true; have++; } });
      // hide every repeat of a topped-up word, so the same word isn't shown in one place and hidden in another
      const picked = new Set(words.filter((_, i) => flags[i]).map((w) => w.toLowerCase()));
      words.forEach((w, i) => { if (picked.has(w.toLowerCase())) flags[i] = true; });
    }
    return flags;
  };
  // Which letters of each word are hidden in a round.
  const maskFor = (words, round, keys) => {
    const gaps = round === "gaps" ? gapFlags(words, keys) : null;
    return words.map((w, i) => {
      const alnum = [...w].map((c) => /[a-z0-9]/i.test(c));
      if (round === "copy") return alnum.map(() => false);
      if (gaps) return alnum.map((a) => gaps[i] && a);
      const n = alnum.filter(Boolean).length;
      let seen = false;
      return alnum.map((a) => { if (!a) return false; if (!seen) { seen = true; return false; } return n > 2; });
    });
  };

  const ROUNDS = [
    { id: "copy", name: "copy", tip: "Start from the question, then type everything that belongs to it." },
    { id: "gaps", name: "gaps", tip: "The question stays. Key terms are hidden: type them from memory. Space on an empty gap skips it." },
    { id: "initials", name: "first letters", tip: "The question stays. Only first letters are left: rebuild every word." }
  ];
  let ET = null;
  const destroyET = () => {
    if (ET) { ET.destroy(); ET = null; }
    document.body.classList.remove("et-focus");
  };

  const mountEssayType = (host, opts) => {
    const passages = opts.passages.filter((p) => p.text && typeWords(p.text).length);
    const st = { p: 0, r: 0, words: [], mask: [], typed: [], ok: [], done: [], cur: 0, start: 0, end: 0, keys: 0, good: 0, finished: false };
    let live = null, idleT = null;

    host.innerHTML = `
      <div class="et">
        <span class="et-mark" aria-hidden="true">${esc(String(opts.cue.num).replace(/^Q/, ""))}</span>
        <div class="et-top">
          <p class="et-cue"><span class="et-qnum">${esc(String(opts.cue.num).replace(/^(\d)/, "Q$1"))}</span><span class="et-qtext">${esc(opts.cue.q)}</span><span class="et-qsec"></span></p>
          <div class="et-config">
            ${passages.length > 1 ? `<div class="et-group" role="group" aria-label="What to type">${passages.map((p, i) =>
              `<button type="button" data-et-p="${i}" aria-pressed="${i === 0}">${esc(p.label)}</button>`).join("")}</div>` : ""}
            <div class="et-group" role="group" aria-label="Round">${ROUNDS.map((r, i) =>
              `<button type="button" data-et-r="${i}" aria-pressed="${i === 0}">${r.name}</button>`).join("")}</div>
          </div>
        </div>
        <p class="et-tip"></p>
        <div class="et-live" aria-hidden="true"><span class="et-count"></span><span class="et-wpm"></span></div>
        <div class="et-wrap">
          <div class="et-words" aria-hidden="true"></div>
          <input class="et-input" type="text" aria-label="Type the passage" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
          <div class="et-blur">Click here or press any key to type</div>
        </div>
        <div class="et-result" hidden></div>
        <p class="et-keys"><span><kbd>tab</kbd> arrow</span><span><kbd>esc</kbd> restart</span><span class="et-logo">essaytype</span></p>
      </div>`;
    const root = host.querySelector(".et");
    const wordsEl = root.querySelector(".et-words");
    const input = root.querySelector(".et-input");
    const resultEl = root.querySelector(".et-result");
    const wrap = root.querySelector(".et-wrap");
    let wordEls = [], caret = null;

    const same = (a, b) => a.toLowerCase() === b.toLowerCase();
    const isHiddenWord = (i) => st.mask[i].some(Boolean);

    const letterHTML = (i) => {
      const w = st.words[i], t = st.typed[i], m = st.mask[i], done = st.done[i];
      let out = "";
      for (let j = 0; j < w.length; j++) {
        const c = w[j];
        if (j < t.length) {
          if (same(t[j], c)) out += `<span class="l ok${m[j] ? " rec" : ""}">${esc(c)}</span>`;
          else out += `<span class="l bad">${esc(m[j] ? t[j] : c)}</span>`;
        } else if (m[j]) out += done ? `<span class="l reveal">${esc(c)}</span>` : `<span class="l h">${esc(c)}</span>`;
        else out += `<span class="l">${esc(c)}</span>`;
      }
      for (let j = w.length; j < t.length; j++) out += `<span class="l bad x">${esc(t[j])}</span>`;
      return out;
    };
    const paintWord = (i) => {
      const el = wordEls[i];
      el.innerHTML = letterHTML(i);
      el.className = "w " + st.roles[i] + (st.done[i] && !st.ok[i] ? " err" : "") + (i === st.cur && !st.finished ? " cur" : "");
    };
    const placeCaret = () => {
      const el = wordEls[st.cur];
      if (!el || st.finished) { if (caret) caret.style.opacity = "0"; return; }
      caret.style.opacity = "";
      const letters = el.children, n = st.typed[st.cur].length;
      let x;
      if (n < letters.length) x = letters[n].offsetLeft;
      else { const last = letters[letters.length - 1]; x = last.offsetLeft + last.offsetWidth; }
      const lh = el.offsetHeight || 1;
      const line = Math.round(el.offsetTop / lh);
      wordsEl.style.transform = `translateY(${-Math.max(0, line - 1) * lh}px)`;
      caret.style.transform = `translate(${x}px, ${el.offsetTop}px)`;
    };
    const updateLive = () => {
      const total = st.words.length;
      root.querySelector(".et-count").textContent = `${Math.min(st.cur, total)}/${total}`;
      const wpm = st.start ? Math.round(wpmNow(performance.now())) : 0;
      root.querySelector(".et-wpm").textContent = st.start ? `${wpm} wpm` : "";
    };
    const wpmNow = (t) => {
      const mins = Math.max((t - st.start) / 60000, 1 / 60);
      let chars = 0;
      st.words.forEach((w, i) => { if (st.done[i] && st.ok[i]) chars += w.length + 1; });
      return chars / 5 / mins;
    };

    const build = () => {
      clearInterval(live); live = null;
      const p = passages[st.p], round = ROUNDS[st.r].id;
      // Every round starts by typing the question itself, so the question becomes the first link of the chain.
      const qWords = typeWords(opts.cue.q), hWords = p.head ? typeWords(p.head) : [];
      const body = [...hWords, ...(hWords.length ? ["->"] : []), ...typeWords(p.text)];
      st.words = [...qWords, "->", ...body];
      st.roles = [...qWords.map(() => "q"), "a", ...hWords.map(() => "hd"), ...(hWords.length ? ["a"] : []), ...typeWords(p.text).map(() => "c")];
      st.mask = [...qWords.map((w) => [...w].map(() => false)), [false, false], ...maskFor(body, round, p.keys || [])];
      root.querySelector(".et-qsec").textContent = p.head ? p.head : "";
      const cue = root.querySelector(".et-cue");
      cue.classList.remove("pulse"); void cue.offsetWidth; cue.classList.add("pulse");
      st.typed = st.words.map(() => "");
      st.ok = st.words.map(() => false);
      st.done = st.words.map(() => false);
      st.cur = 0; st.start = 0; st.end = 0; st.keys = 0; st.good = 0; st.finished = false;
      root.dataset.round = round;
      root.querySelector(".et-tip").textContent = ROUNDS[st.r].tip;
      root.querySelectorAll("[data-et-r]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.etR) === st.r)));
      root.querySelectorAll("[data-et-p]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.etP) === st.p)));
      wordsEl.innerHTML = st.words.map(() => `<span class="w"></span>`).join("") + `<span class="et-caret"></span>`;
      wordsEl.style.transform = "";
      wordEls = [...wordsEl.querySelectorAll(".w")];
      caret = wordsEl.querySelector(".et-caret");
      st.words.forEach((_, i) => paintWord(i));
      resultEl.hidden = true;
      wrap.hidden = false;
      root.querySelector(".et-live").hidden = false;
      input.value = "";
      document.body.classList.remove("et-focus");
      updateLive();
      requestAnimationFrame(placeCaret);
      input.focus({ preventScroll: true });
    };

    const commit = (skipped) => {
      const i = st.cur;
      st.done[i] = true;
      st.ok[i] = !skipped && same(st.typed[i], st.words[i]);
      st.keys++; if (st.ok[i]) st.good++;
      paintWord(i);
      st.cur++;
      if (st.cur >= st.words.length) return finish();
      paintWord(st.cur);
    };
    const addChar = (c) => {
      const i = st.cur, w = st.words[i];
      if (c === " ") {
        if (!st.typed[i].length) { if (isHiddenWord(i)) commit(true); return; }
        return commit(false);
      }
      if (st.typed[i].length >= w.length + 12) return;
      const j = st.typed[i].length;
      st.typed[i] += c;
      st.keys++;
      if (j < w.length && same(c, w[j])) st.good++;
      paintWord(i);
      if (i === st.words.length - 1 && same(st.typed[i], w)) commit(false);
    };

    const begin = () => { if (!st.start) { st.start = performance.now(); live = setInterval(updateLive, 500); } };
    const after = () => {
      if (st.finished) return;
      input.value = st.typed[st.cur];
      document.body.classList.add("et-focus");
      root.classList.add("typing");
      clearTimeout(idleT); idleT = setTimeout(() => root.classList.remove("typing"), 600);
      updateLive();
      placeCaret();
    };
    const onInput = () => {
      if (st.finished) { input.value = ""; return; }
      const v = input.value, prev = st.typed[st.cur];
      if (v.length) begin();
      if (v.startsWith(prev)) [...v.slice(prev.length)].forEach((c) => { if (!st.finished) addChar(c); });
      else if (!v.includes(" ") && prev.startsWith(v)) { st.typed[st.cur] = v; paintWord(st.cur); }
      else { st.typed[st.cur] = ""; [...v].forEach((c) => { if (!st.finished) addChar(c); }); }
      after();
    };
    const onKey = (ev) => {
      if (ev.key === "Tab" && !ev.shiftKey && !ev.ctrlKey && !ev.altKey && !ev.metaKey) {
        ev.preventDefault();
        if (st.finished) return;
        begin();
        const target = st.words[st.cur], typed = st.typed[st.cur];
        if (/^<?->$/.test(target) && target.startsWith(typed)) {
          const at = st.cur;
          [...target.slice(typed.length)].forEach((c) => { if (!st.finished) addChar(c); });
          if (!st.finished && st.cur === at) addChar(" ");
        } else [..."->"].forEach((c) => { if (!st.finished) addChar(c); });
        after();
        return;
      }
      if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); build(); return; }
      if (ev.key === "Backspace" && !input.value && st.cur > 0 && !st.ok[st.cur - 1] && !st.finished) {
        ev.preventDefault();
        paintWord(st.cur);
        st.cur--;
        st.done[st.cur] = false;
        input.value = st.typed[st.cur];
        paintWord(st.cur);
        updateLive();
        placeCaret();
      }
    };

    const finish = () => {
      st.finished = true;
      st.end = performance.now();
      clearInterval(live); live = null;
      document.body.classList.remove("et-focus");
      root.classList.remove("typing");
      input.value = "";
      input.blur();
      const secs = Math.max(1, Math.round((st.end - st.start) / 1000));
      const wpm = Math.round(wpmNow(st.end));
      const acc = st.keys ? Math.round((100 * st.good) / st.keys) : 100;
      const correct = st.ok.filter(Boolean).length;
      const hiddenIdx = st.words.map((_, i) => i).filter((i) => isHiddenWord(i));
      const recalled = hiddenIdx.filter((i) => st.ok[i]).length;
      const missed = [...new Set(hiddenIdx.filter((i) => !st.ok[i]).map((i) => st.words[i]))];
      const typos = [...new Set(st.words.filter((_, i) => !st.ok[i]))];
      const last = st.r === ROUNDS.length - 1;
      const round = ROUNDS[st.r].id;
      let note;
      if (round === "copy") note = acc >= 95 ? "Clean copy. Now take the key terms away." : "Go again until it flows, or move on to gaps.";
      else if (!hiddenIdx.length) note = "Nothing was hidden in this passage.";
      else if (recalled === hiddenIdx.length) note = last ? "Every word rebuilt from first letters. You’re ready to hide it all and type it back." : "Every hidden term came back. Try first letters only.";
      else note = "Read the missed words, then run this round again.";
      wrap.hidden = true;
      root.querySelector(".et-live").hidden = true;
      resultEl.hidden = false;
      resultEl.innerHTML = `
        <div class="et-res">
          <div class="et-big">
            <div><span class="et-lab">wpm</span><span class="et-num">${wpm}</span></div>
            <div><span class="et-lab">acc</span><span class="et-num">${acc}%</span></div>
          </div>
          <dl class="et-stats">
            <div><dt>round</dt><dd>${ROUNDS[st.r].name}</dd></div>
            <div><dt>time</dt><dd>${mmss(secs)}</dd></div>
            <div><dt>words</dt><dd>${correct}/${st.words.length}</dd></div>
            ${hiddenIdx.length ? `<div><dt>recalled</dt><dd>${recalled}/${hiddenIdx.length}</dd></div>` : ""}
          </dl>
        </div>
        <p class="et-note">${esc(note)}</p>
        ${missed.length ? `<p class="et-missed"><span>missed</span> ${missed.map((w) => `<b>${esc(w)}</b>`).join(" ")}</p>`
          : round === "copy" && typos.length ? `<p class="et-missed"><span>typos</span> ${typos.slice(0, 12).map((w) => `<b>${esc(w)}</b>`).join(" ")}</p>` : ""}
        <div class="et-actions">
          ${last ? "" : `<button type="button" data-et-next>next: ${ROUNDS[st.r + 1].name}</button>`}
          <button type="button" data-et-again>again</button>
        </div>`;
      const nb = resultEl.querySelector("[data-et-next]") || resultEl.querySelector("[data-et-again]");
      nb.focus({ preventScroll: true });
      if (last && opts.onLastRound) opts.onLastRound();
    };

    const onClick = (ev) => {
      const b = ev.target.closest("[data-et-r], [data-et-p], [data-et-next], [data-et-again]");
      if (b) {
        if (b.dataset.etR) st.r = Number(b.dataset.etR);
        else if (b.dataset.etP) st.p = Number(b.dataset.etP);
        else if (b.hasAttribute("data-et-next")) st.r = Math.min(st.r + 1, ROUNDS.length - 1);
        build();
        return;
      }
      if (ev.target.closest(".et-wrap")) input.focus({ preventScroll: true });
    };
    const onFocus = () => root.classList.remove("blurred");
    const onBlur = () => root.classList.add("blurred");
    const onResize = () => placeCaret();

    root.addEventListener("click", onClick);
    input.addEventListener("input", onInput);
    input.addEventListener("keydown", onKey);
    input.addEventListener("focus", onFocus);
    input.addEventListener("blur", onBlur);
    window.addEventListener("resize", onResize);
    build();

    return {
      input,
      focus: () => { if (!st.finished) input.focus({ preventScroll: true }); },
      destroy: () => {
        clearInterval(live); clearTimeout(idleT);
        window.removeEventListener("resize", onResize);
        document.body.classList.remove("et-focus");
      }
    };
  };

  /* ---------- scheduling ---------- */
  const atts = (id) => S.att[id] || [];
  const cleanDaysIn = (s, id) => new Set((s.att[id] || []).filter((a) => a.score >= 0.9 && !a.hint).map((a) => a.d)).size;
  const cleanDays = (id) => cleanDaysIn(S, id);
  const status = (id) => {
    const a = atts(id);
    if (!a.length) return isLearned(id) ? "learning" : "new";
    if (cleanDays(id) >= 3) return "ready";
    const last = a[a.length - 1];
    if (last.score >= 0.9 && !last.hint) return "solid";
    return last.score >= 0.7 ? "shaky" : "learning";
  };
  const LABEL = { new: "Not started", learning: "Learning", shaky: "Shaky", solid: "Solid", ready: "Exam-ready" };
  const dayIndex = () => diff(S.start, today()) + 1;
  const daysLeft = () => diff(today(), S.exam);

  const schedule = (id) => {
    const a = atts(id);
    if (!a.length) { if (!isLearned(id)) delete S.due[id]; return; }
    const last = a[a.length - 1];
    let n;
    if (last.score < 0.7) n = 1;
    else if (last.score < 0.9 || last.hint) n = 2;
    else { const cd = cleanDays(id); n = cd >= 3 ? 6 : cd === 2 ? 4 : 3; }
    let due = addDays(today(), n);
    const cap = addDays(S.exam, -1);
    if (diff(cap, due) > 0) due = diff(today(), cap) >= 0 ? cap : today();
    S.due[id] = due;
  };

  const todayList = () => {
    const t = today(), di = dayIndex();
    const reviews = C.essays
      .filter((e) => isLearned(e.id) && S.due[e.id] && diff(S.due[e.id], t) >= 0)
      .sort((a, b) => (S.due[a.id] < S.due[b.id] ? -1 : 1));
    const fresh = C.essays.filter((e) => !isLearned(e.id) && (e.day || 1) <= di);
    return { reviews, fresh };
  };

  const weight = (id) => {
    const w = { new: 3, learning: 5, shaky: 4, solid: 2, ready: 1 }[status(id)];
    return w + (S.due[id] && diff(S.due[id], today()) >= 0 ? 3 : 0);
  };

  const draw = (exam) => {
    let pool;
    if (exam) pool = C.essays.map((e) => ({ e, w: 1 }));
    else {
      const started = C.essays.filter((e) => atts(e.id).length);
      const base = started.length ? started : C.essays.filter((e) => (e.day || 1) <= dayIndex());
      pool = (base.length ? base : C.essays).map((e) => ({ e, w: weight(e.id) }));
    }
    const pick = () => {
      let r = Math.random() * pool.reduce((s, p) => s + p.w, 0);
      for (const p of pool) { r -= p.w; if (r <= 0) return p.e; }
      return pool[pool.length - 1].e;
    };
    let e = pick();
    if (!exam && pool.length > 1 && lastDraw === e.id) e = pick();
    lastDraw = e.id;
    return e;
  };

  /* ---------- shared pieces ---------- */
  const topbar = () => `
    <header class="topbar">
      <a class="brand" href="#/">Essay Jar</a>
      <nav>
        <a href="#/">Essays</a>
        <a href="#/pathways">Pathways</a>
        ${ONLINE && user ? `<a href="#/call">On call</a>` : ""}
        ${ONLINE && user ? `<a href="#/board">Leaderboard</a>` : ""}
        ${user && user.admin ? `<a href="#/admin">Admin</a>` : ""}
        <a href="#/how">How to study</a>
        <a href="#/settings">Settings</a>
        <a class="who${user ? "" : " guest"}" data-sync="${syncState}" href="${ONLINE ? (user ? "#/account" : "#/login") : "#/users"}" title="${ONLINE ? (user ? "Your account" : "Log in") : "Switch or create a user"}">${user ? esc(user.name) : ONLINE ? "Log in" : "Guest"}</a>
      </nav>
    </header>`;

  const footer = () => `
    <footer class="foot">
      <p>Made by Ibad Siddiqui. ${ONLINE ? "Progress saves to your account." : "Progress is saved per user in this browser only; back it up from Settings now and then."}</p>
    </footer>`;

  const guestNotice = () => user ? "" : `
    <div class="notice">
      <p><strong>You’re playing as a guest, so nothing is saved.</strong> ${ONLINE ? "Log in or create an account to keep your progress." : "Create a user to keep your progress on this device."}</p>
      <a class="btn small" href="${ONLINE ? "#/login" : "#/users"}">${ONLINE ? "Log in" : "Create a user"}</a>
    </div>`;

  const tally = (id) => {
    const n = Math.min(cleanDays(id), 3);
    return `<span class="tally" title="${n} of 3 clean recalls on separate days">${[0, 1, 2].map((i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</span>`;
  };

  const row = (e, actions) => {
    const st = status(e.id);
    return `
      <li class="row st-${st}">
        <a class="row-main" href="#/study/${e.id}">
          <span class="num">${e.id}</span>
          <span class="qtext">${esc(e.q)}</span>
        </a>
        <span class="row-side">
          ${actions || `<span class="state">${essayStars(e.id) ? `<span class="mini-stars" title="${essayStars(e.id)} of 9 stars">★ ${essayStars(e.id)}</span>` : ""}${tally(e.id)}<span class="label">${LABEL[st]}</span></span>`}
        </span>
      </li>`;
  };

  const jarSVG = () => {
    const slips = C.essays.map((e, i) => {
      const r = Math.floor(i / 4), c = i % 4;
      const x = 40 + c * 37 + ((i * 37) % 7) - 3;
      const y = 228 - r * 20 + ((i * 53) % 5);
      const rot = ((i * 47) % 34) - 17;
      const st = status(e.id);
      return `<rect class="slip slip-${st}" x="${x}" y="${y}" width="31" height="12" rx="1.5" transform="rotate(${rot} ${x + 15} ${y + 6})"><title>${en(e)}: ${LABEL[st]}</title></rect>`;
    }).join("");
    return `
      <svg class="jar" viewBox="0 0 220 262" aria-hidden="true" focusable="false">
        <path class="jar-glass" d="M60 40h100v18q0 8 10 16q22 18 22 50v104q0 22-22 22H50q-22 0-22-22V124q0-32 22-50q10-8 10-16z"/>
        <rect class="jar-lid" x="54" y="22" width="112" height="20" rx="4"/>
        ${slips}
        <path class="jar-shine" d="M43 100v34"/>
      </svg>`;
  };

  const atomList = (atoms, opts = {}) => `
    <ul class="atoms">
      ${atoms.map((a) => `
        <li class="atom tier-${a.tier}">
          <span class="tier">${a.tier === "pass" ? "Pass" : "Boost"}</span>
          <span class="atom-body">
            <span class="atom-text">${esc(a.s)}</span>
            ${opts.noSrc ? "" : `<span class="src">${esc(a.src || "")}</span>`}
            ${a.note ? `<span class="note">${esc(a.note)}</span>` : ""}
          </span>
        </li>`).join("")}
    </ul>`;

  const pwMap = (e, opts = {}) => `
    <div class="pw-map${opts.blank ? " blank" : ""}" style="--lanes:${e.map.length}">
      ${e.map.map((lane) => `
        <div class="pw-lane">
          <h3>${esc(lane.h)}</h3>
          ${lane.rows.map((r) => r.m
            ? `<div class="pw-m"><b>${esc(r.m)}</b>${r.f ? `<code>${esc(r.f)}</code>` : ""}${r.note ? `<small>${esc(r.note)}</small>` : ""}</div>`
            : `<div class="pw-z"><span class="pw-ar" aria-hidden="true"></span><div class="pw-zt">${r.n !== "" && r.n != null ? `<i>${esc(String(r.n))}</i>` : ""}<b>${esc(r.e)}</b>${r.d ? `<small>${esc(r.d)}</small>` : ""}${r.x ? `<span class="pw-x">✗ ${esc(r.x)}</span>` : ""}</div></div>`).join("")}
        </div>`).join("")}
    </div>
    ${e.foot ? `<ul class="pw-foot">${e.foot.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}`;

  const drawBlock = (e) => isPW(e) ? `
    <section class="block draw-first pw">
      <h2>The pathway</h2>
      ${pwMap(e)}
      <p class="hint">${esc(e.draw)}</p>
    </section>` : `
    <section class="block draw-first">
      <h2>Draw this first</h2>
      ${e.img ? `<img src="${esc(e.img)}" alt="Professor’s diagram for ${en(e).toLowerCase()}">` : ""}
      <p>${esc(e.draw)}</p>
    </section>`;

  const chainBlock = (e) => e.chain ? `
    <section class="block chain">
      <h2>The chain</h2>
      <p class="chain-text"><span class="chain-q">${esc(e.q.replace(/\.$/, ""))}</span>${e.chain.split(/\s*→\s*/).map((l) =>
        `<span class="chain-arrow" aria-hidden="true">→</span><span class="chain-link">${esc(l)}</span>`).join("")}</p>
    </section>` : "";
  const chainPassages = (e) => [
    ...(e.chain ? [{ label: "chain", text: e.chain, keys: keyTokens(e.atoms) }] : []),
    ...(e.hook ? [{ label: "story", text: e.hook, keys: keyTokens(e.atoms) }] : [])
  ];
  // Stories: "clean" (default), "spicy" (18+, opt-in) or "off". **x** marks key terms.
  const storyStyle = () => S.story || (S.spicy ? "spicy" : "clean");
  const storySet = (st) => (st === "spicy" ? window.SPICY : st === "clean" ? window.CLEAN : null) || null;
  const storyTitles = (st) => (st === "spicy" ? window.SPICY_TITLES : window.CLEAN_TITLES) || {};
  const spicyOn = () => storyStyle() === "spicy";
  const spicyFor = (e) => { const set = storySet(storyStyle()); return (set && set[e.id]) || null; };
  const spicyTitle = (e) => storyTitles(storyStyle())[e.id] || "The story";
  const spicyHTML = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  const spicyParts = (e) => {
    const sp = spicyFor(e); if (!sp) return "";
    const labels = startsOf(e).map(([, l]) => l);
    return sp.map((t, k) => `${labels[k] ? `<h3 class="sp-h">${esc(labels[k])}</h3>` : ""}<p>${spicyHTML(t)}</p>`).join("");
  };
  const storyBlock = (e) => spicyFor(e)
    ? `<section class="block story spicy"><h2>${esc(spicyTitle(e))}${spicyOn() ? ` <span class="tag">18+</span>` : ""}</h2>${spicyParts(e)}<p class="hint">The pass-level core of the essay. The chain adds the detail for marks.</p></section>`
    : e.hook ? `<section class="block story"><h2>The story</h2><p>${esc(e.hook)}</p></section>` : "";

  /* ---------- sections: essays | pathways ---------- */
  const sectionTabs = (on) => `
    <nav class="sect-tabs" aria-label="Sections">
      <a href="#/" class="${on === "essays" ? "on" : ""}">Essays <span>${C.essays.filter((e) => isDown(e.id)).length}/${C.essays.length}</span></a>
      <a href="#/pathways" class="${on === "pw" ? "on" : ""}">Pathways <span>${PWS.filter((e) => isDown(e.id)).length}/${PWS.length}</span></a>
    </nav>`;
  const viewPathways = () => {
    const down = PWS.filter((e) => isDown(e.id)).length;
    app.innerHTML = `
      ${topbar()}
      <main class="wrap">
        ${guestNotice()}
        ${sectionTabs("pw")}
        <section class="pw-hero">
          <h1>The ${PWS.length} pathways</h1>
          <p class="lede">In the exam you draw these from memory: every substrate, every enzyme with its number and cofactors, and the disease when it’s missing. Each pathway is a boss. Look at the map once, then play: say each next step before you see it.</p>
          <p class="hero-stats"><span><b>${down}</b> of ${PWS.length} pathway bosses defeated</span></p>
          <div class="actions">
            <button class="btn" data-act="pw-random">Random pathway boss</button>
          </div>
        </section>
        <section class="roster">
          <ul class="bosses pw-bosses">${PWS.map(bossCard).join("")}</ul>
        </section>
        <section class="pw-list">
          ${PWS.map((e) => `
            <article class="pw-item">
              <p class="pw-num">${qn(e)}</p>
              <h2><a href="#/study/${e.id}">${esc(e.q)}</a></h2>
              <div class="actions">
                <a class="btn small" href="#/play/${e.id}">Play</a>
                <a class="btn small ghost" href="#/study/${e.id}">See the map</a>
                <a class="btn small ghost" href="#/type/${e.id}">Type the pathway</a>
              </div>
            </article>`).join("")}
        </section>
      </main>
      ${footer()}`;
  };

  /* ---------- home ---------- */
  const viewHome = () => {
    const { reviews, fresh } = todayList();
    const di = dayIndex(), left = daysLeft();
    const counts = { ready: 0, solid: 0, shaky: 0, learning: 0, new: 0 };
    C.essays.forEach((e) => counts[status(e.id)]++);
    const countText = [["ready", "exam-ready"], ["solid", "solid"], ["shaky", "shaky"], ["learning", "learning"], ["new", "not started"]]
      .filter(([k]) => counts[k]).map(([k, w]) => `${counts[k]} ${w}`).join(", ");

    let when;
    if (left > 1) when = `${left} days until the exam on ${longDate(S.exam)}.`;
    else if (left === 1) when = `The exam is tomorrow, ${longDate(S.exam)}.`;
    else if (left === 0) when = "Exam day. Skim the skeletons and trust your recall.";
    else when = "The exam date has passed. Set the next one in Settings.";

    let phase = "";
    if (di <= PLAN_DAYS) phase = `Day ${di} of the ${PLAN_DAYS}-day learning plan.`;
    else if (left > 0) phase = "Every essay has been introduced. From now on it’s jar draws and mock exams.";

    const items = [
      ...reviews.map((e) => row(e, `<span class="tag">Review</span><a class="btn small" href="#/recall/${e.id}">Boss fight</a>`)),
      ...fresh.map((e) => row(e, `<span class="tag">New</span><button class="btn small ghost" data-learned="${e.id}" title="Learned it outside the app? Adds it to your daily review.">Already learned</button><a class="btn small" href="#/play/${e.id}">Play</a>`))
    ];

    const groups = {};
    C.essays.forEach((e) => { (groups[e.lecture] = groups[e.lecture] || []).push(e); });

    app.innerHTML = `
      ${topbar()}
      <main class="wrap">
        ${guestNotice()}
        ${(() => { const m = loginMsg; loginMsg = ""; return m ? `<p class="callout">${esc(m)}</p>` : ""; })()}
        <section class="hero">
          <div class="hero-text">
            <h1>${esc(C.title)}</h1>
            <p class="sub">${esc(C.subtitle)}</p>
            <p class="lede">${esc(when)} ${esc(phase)}</p>
            <p class="counts">In the jar: ${esc(countText)}.</p>
            ${(() => { const L = levelOf(S.xp); return `<p class="xp"><span class="xp-lvl">Level ${L.lvl}</span><span class="xp-bar" aria-hidden="true"><i style="width:${Math.round((100 * L.into) / L.need)}%"></i></span><span class="xp-n">${L.into} / ${L.need} XP</span></p>`; })()}
            <p class="hero-stats"><span><b>${C.essays.filter((e) => isDown(e.id)).length}</b> of ${C.essays.length} bosses defeated</span><span><b>${mins((S.log && S.log[today()] && S.log[today()].secs) || 0)}</b> studied today</span></p>
            <div class="actions">
              <button class="btn" data-act="draw">Draw from the jar</button>
              <a class="btn ghost" href="#/exam">Final boss: mock exam</a>
              ${ONLINE ? `<a class="btn ghost" href="#/call">Study on call</a>` : ""}
            </div>
          </div>
          <button class="jar-btn" data-act="draw" aria-label="Draw an essay from the jar">${jarSVG()}</button>
        </section>

        ${dailyPanel()}

        <section class="panel today">
          <h2>Today</h2>
          ${items.length
            ? `<p class="hint">New essays: press Play, three short games. Reviews: a boss fight straight from the question, no peeking first.</p><ul class="rows">${items.join("")}</ul>`
            : `<p class="empty">Nothing is due today. Draw from the jar, or run a mock exam.</p>`}
        </section>

        <section class="roster">
          ${sectionTabs("essays")}
          <div class="roster-head">
            <h2>The ${C.essays.length} bosses</h2>
            <p>${C.essays.filter((e) => isDown(e.id)).length} of ${C.essays.length} defeated</p>
          </div>
          ${Object.keys(groups).map((l) => `
            <h3>${esc(lectureName(l))}</h3>
            <ul class="bosses">${groups[l].map(bossCard).join("")}</ul>`).join("")}
        </section>
      </main>
      ${footer()}`;
  };

  /* ---------- notes (study page) ---------- */
  const viewStudy = (e) => {
    const st = status(e.id);
    const plan = e.day ? ` Planned for day ${e.day}.` : "";
    app.innerHTML = `
      ${topbar()}
      <main class="wrap study">
        <p class="meta">${isPW(e) ? `${en(e)} of ${PWS.length}, draw it from memory in the exam.` : `Essay ${e.id}, from ${esc(lectureName(e.lecture))}.${plan}`} Status: ${LABEL[st]}.</p>
        <h1 class="question">${esc(e.q)}</h1>
        <div class="actions">
          <a class="btn" href="#/play/${e.id}">Play</a>
          <a class="btn ghost" href="#/learn/${e.id}">Learn it in one hour</a>
          <a class="btn ghost" href="#/type/${e.id}">Type the chain</a>
          <a class="btn ghost" href="#/recall/${e.id}">Recall it</a>
          <button class="btn ghost" data-act="cover" aria-pressed="false">Cover the answers</button>
        </div>
        <p class="learned-note">${isLearned(e.id)
          ? `Learned on ${esc(longDate(learnedOn(e.id)))}, so it’s in your daily review.${!atts(e.id).length && S.learned[e.id] ? ` <button class="linkbtn" data-unlearn="${e.id}">Not learned yet</button>` : ""}`
          : `Not learned yet. Learned it outside the app? <button class="linkbtn" data-learned="${e.id}">I learned this before today</button>`}</p>
        ${drawBlock(e)}
        ${chainBlock(e)}
        ${storyBlock(e)}
        <section class="points">
          <h2 class="points-title">${isPW(e) ? "What your drawing must contain" : "What the essay must contain"}</h2>
          <p class="hint">Pass points are what you need to pass. Boost points make the answer strong. When covered, tap a line to reveal it.</p>
          ${e.sections.map((s) => `<div class="sec"><h3>${esc(s.h)}</h3>${atomList(s.atoms)}</div>`).join("")}
        </section>
        ${e.links ? `<p class="links">Connections: ${esc(e.links)}</p>` : ""}
      </main>
      ${footer()}`;
  };

  /* ---------- learn: one timed, focused hour per essay ----------
     The essay is split into its parts (the same start points as Build the chain).
     Map + guess → for each part: read the causal chain (timed) → explain it from memory in your
     own words (timed) → see exactly which steps you missed → fix only those (timed).
     Then explain the whole essay once. Every step has a clock that moves you on by itself;
     leaving the tab pauses it and counts as a distraction. */
  const learnKey = (id) => "essayjar:learn:" + id;
  let learnCleanup = null;
  const learnParts = (e) => {
    const n = chainLinks(e).length;
    let st = startsOf(e);
    if (st.length < 2) { st = []; for (let i = 0; i < n; i += 7) st.push([i, "Part " + (st.length + 1)]); }
    return st.map(([from, label], k) => ({ label, from, to: k + 1 < st.length ? st[k + 1][0] : n }));
  };
  const range = (a, b) => [...Array(Math.max(0, b - a))].map((_, k) => a + k);
  // Which chain links does a free explanation cover? true / false, or null for links with no key words ("roles").
  const coverage = (e, text, idxs) => {
    const links = chainLinks(e), qt = qToks(e), res = {};
    idxs.forEach((i) => {
      const ks = linkKeys(links[i], "", qt);
      if (!ks.length) { res[i] = null; return; }
      res[i] = ideaCount(typedHits(text, ks)) >= Math.min(2, ideaCount(ks));
    });
    return res;
  };
  const learnPlan = (e) => {
    const links = chainLinks(e), parts = learnParts(e);
    const words = (i) => links[i].split(/\s+/).length;
    const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
    const r5 = (x) => Math.round(x / 5) * 5;
    const spk = spicyFor(e);
    let p = parts.map((pt, k) => {
      const idx = range(pt.from, pt.to);
      const w = idx.reduce((s, i) => s + words(i), 0) + (spk && spk[k] ? spk[k].split(/\s+/).length * 0.25 : 0);
      return { ...pt, read: clamp(r5((w / 110) * 60 + 20), 60, 240) + 60, explain: clamp(r5(idx.length * 25), 90, 300) };
    });
    const sp = spicyFor(e);
    const storyWords = sp ? sp.join(" ").split(/\s+/).length : (e.hook || "").split(/\s+/).length;
    const prime = clamp(r5((storyWords / (sp ? 120 : 160)) * 60 + 60), 90, 660), whole = clamp(r5(links.length * 20), 300, 720), fixes = p.length * 100;
    const core = p.reduce((s, x) => s + x.read + x.explain, 0);
    const room = 3600 - prime - whole - fixes;
    if (core > room) {
      const f = Math.max(0.6, room / core);
      p = p.map((x) => ({ ...x, read: Math.max(105, r5(x.read * f)), explain: Math.max(75, r5(x.explain * f)) }));
    }
    const total = prime + whole + fixes + p.reduce((s, x) => s + x.read + x.explain, 0);
    return { parts: p, prime, whole, total };
  };

  const viewLearn = (e) => {
    const links = chainLinks(e), plan = learnPlan(e), parts = plan.parts;
    const nextEssay = () => {
      const list = isPW(e) ? PWS : C.essays;
      return list.find((x) => x.id !== e.id && !isLearned(x.id)) || null;
    };
    // L.phase: start, prime, read, explain, result, fix, fixsay, fixresult, whole, done
    let L = { phase: "start", part: 0, elapsed: 0, away: 0, awayN: 0, got: {}, scores: [], wholeScore: null, missed: [] };
    let saved = null;
    try { saved = JSON.parse(store.get(learnKey(e.id)) || "null"); } catch (err) { saved = null; }
    if (saved && (Date.now() - (saved.savedAt || 0) > 6 * 3600e3 || saved.phase === "done")) { store.del(learnKey(e.id)); saved = null; }
    let step = null; // { left, total, onEnd }
    let awaySince = 0, backNote = "";

    const persist = () => {
      if (L.phase === "start" || L.phase === "done") return;
      const ph = ["explain", "result"].includes(L.phase) ? "read" : ["fix", "fixsay", "fixresult"].includes(L.phase) ? "next" : L.phase;
      store.set(learnKey(e.id), JSON.stringify({ ...L, phase: ph, savedAt: Date.now() }));
    };
    const focusOn = () => {
      document.body.classList.add("focus-mode");
      const d = document.documentElement;
      try { if (d.requestFullscreen && !document.fullscreenElement) d.requestFullscreen().catch(() => {}); } catch (err) { /* not allowed */ }
    };
    const focusOff = () => {
      document.body.classList.remove("focus-mode");
      try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); } catch (err) { /* ignore */ }
    };
    const onVis = () => {
      if (["start", "done"].includes(L.phase)) return;
      if (document.visibilityState === "hidden") awaySince = Date.now();
      else if (awaySince) {
        const s = Math.round((Date.now() - awaySince) / 1000);
        awaySince = 0;
        if (s >= 3) { L.away += s; L.awayN++; backNote = `You left for ${s < 60 ? s + " s" : mins(s)}. The clock waited for you. Back to it.`; paintBar(); persist(); }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    learnCleanup = () => { document.removeEventListener("visibilitychange", onVis); focusOff(); learnCleanup = null; };

    const runStep = (secs, onEnd) => {
      step = { left: secs, total: secs, onEnd };
      clearInterval(timer);
      timer = setInterval(() => {
        if (!step || document.visibilityState !== "visible") return;
        step.left--; L.elapsed++;
        if (L.elapsed % 15 === 0) persist();
        paintBar();
        if (step.left <= 0) { const f = step.onEnd; step = null; clearInterval(timer); timer = null; chime(); if (f) f(); }
      }, 1000);
      paintBar();
    };
    const stopStep = () => { step = null; clearInterval(timer); timer = null; };

    const stepLabel = () => ({ prime: "The story", read: "Read", explain: "Explain from memory", result: "Check", fix: "Re-read the missed steps", fixsay: "Say them again", fixresult: "Check", whole: "The whole essay" }[L.phase] || "");
    const paintBar = () => {
      const bar = app.querySelector(".lf-bar");
      if (!bar) return;
      const left = step ? step.left : 0;
      bar.querySelector(".lf-left").textContent = step ? mmss(left) : "–:––";
      const fill = bar.querySelector(".lf-fill");
      fill.style.transition = step && left === step.total ? "none" : "";
      fill.style.width = step ? `${100 * (1 - left / step.total)}%` : "100%";
      bar.querySelector(".lf-total").textContent = `${mins(L.elapsed)} of ~${Math.round(plan.total / 60)} min`;
      bar.classList.toggle("low", !!step && left <= 10);
      const n = app.querySelector(".lf-back");
      if (n) { n.textContent = backNote; n.hidden = !backNote; }
    };
    const shell = (inner) => {
      const inPart = ["read", "explain", "result", "fix", "fixsay", "fixresult"].includes(L.phase);
      const where = inPart ? `Part ${L.part + 1} of ${parts.length}: ${parts[L.part].label}` : L.phase === "whole" ? "Final: the whole essay" : "Before you read";
      return `
        <main class="wrap learn lf">
          <div class="lf-bar">
            <div class="lf-top">
              <span class="lf-where"><b>${qn(e)}</b> ${esc(where)} · ${esc(stepLabel())}</span>
              <span class="lf-total"></span>
              <button type="button" class="lf-quit" data-l="quit">Stop</button>
            </div>
            <div class="lf-row"><span class="lf-left">–:––</span><span class="lf-track"><i class="lf-fill"></i></span></div>
            <ol class="lf-steps" aria-hidden="true">${["prime", ...parts.map((_, i) => i), "whole"].map((x) => {
              const done = x === "prime" ? L.phase !== "prime" : x === "whole" ? false : L.phase === "whole" || x < L.part || (x === L.part && ["fixresult"].includes(L.phase));
              const now = x === "prime" ? L.phase === "prime" : x === "whole" ? L.phase === "whole" : inPart && x === L.part;
              return `<li class="${done ? "done" : now ? "now" : ""}"></li>`;
            }).join("")}</ol>
            <p class="lf-back" hidden></p>
          </div>
          <h1 class="question lf-q">${esc(e.q)}</h1>
          <section class="stage">${inner}</section>
        </main>`;
    };
    const flow = (idx, opts = {}) => `
      <ol class="flow">${idx.map((i) => {
        const g = opts.got ? opts.got[i] : undefined;
        return `<li class="${g === true ? "got" : g === false ? "miss" : g === null ? "neutral" : ""}${opts.ctx && opts.ctx.includes(i) ? " ctx" : ""}"${opts.tap && g !== null ? ` data-li="${i}" tabindex="0" role="button" aria-pressed="${g === true}"` : ""}><span class="fl-n">${i + 1}</span><span class="fl-t">${esc(links[i])}</span>${g === true ? `<span class="fl-m" aria-label="recalled">✓</span>` : g === false ? `<span class="fl-m" aria-label="missed">✗</span>` : ""}</li>`;
      }).join("")}</ol>`;
    const box = (ph) => `
      <label class="sr" for="lfBox">Your explanation</label>
      <textarea id="lfBox" class="answer-box" spellcheck="false" autocomplete="off" placeholder="${esc(ph)}"></textarea>`;
    const idxOf = (k) => range(parts[k].from, parts[k].to);
    const scoreOf = (got) => { const v = Object.values(got).filter((x) => x !== null); return { hit: v.filter(Boolean).length, all: v.length }; };

    const render = () => {
      const P = parts[L.part];
      let inner = "";
      if (L.phase === "start") {
        app.innerHTML = `
          ${topbar()}
          <main class="wrap learn lf-start">
            ${guestNotice()}
            <p class="meta">Learn ${en(e).toLowerCase()} in one focused session.</p>
            <h1 class="question">${esc(e.q)}</h1>
            <div class="lf-plan">
              <p class="lf-big">About <b>${Math.round(plan.total / 60)} minutes</b>, every step timed.</p>
              <ol class="lf-plist">
                <li><span>The story${spicyFor(e) ? " (spicy)" : ""}</span><em>${mmss(plan.prime)}</em></li>
                ${parts.map((p) => `<li><span>${esc(p.label)}</span><em>read ${mmss(p.read)} · explain ${mmss(p.explain)} · fix</em></li>`).join("")}
                <li><span>Explain the whole essay</span><em>${mmss(plan.whole)}</em></li>
              </ol>
            </div>
            <div class="lf-how">
              <p><b>How it works.</b> For each part you read the chain of cause and effect, then hide it and explain it in your own words as if teaching a friend. The app shows exactly which steps you missed, and you fix only those. No copying, no rewriting the same thing again and again.</p>
              <p><b>Stay in it.</b> Put your phone face down. The page goes full screen and the timers move you on by themselves. If you leave this tab the clock pauses and it counts as a distraction.</p>
            </div>
            <div class="actions">
              ${saved ? `<button class="btn" data-l="resume">Carry on: ${esc(saved.phase === "whole" ? "the whole essay" : saved.phase === "prime" ? "the start" : "part " + (saved.part + 1 + (saved.phase === "next" ? 1 : 0)))}</button><button class="btn ghost" data-l="go">Start again</button>`
                : `<button class="btn" data-l="go">Start the session</button>`}
              <a class="btn ghost" href="#/study/${e.id}">Just read the notes</a>
            </div>
            ${isLearned(e.id) ? `<p class="hint">You learned this on ${esc(longDate(learnedOn(e.id)))}. Doing it again is fine, or go straight to <a href="#/play/${e.id}">Play</a>.</p>` : ""}
          </main>
          ${footer()}`;
        return;
      }
      if (L.phase === "prime") inner = `
        <h2>${spicyFor(e) ? esc(spicyTitle(e)) : "The story first"}</h2>
        <p class="hint">${spicyFor(e) ? "This is the core of the essay, the bit that gets you a pass. Understand it first; the chain after adds the detail for marks." : "Read it like a story, not a list. Then you’ll learn the parts one at a time."}</p>
        ${spicyFor(e) ? `<div class="lf-story spicy">${spicyParts(e)}</div>`
          : `${e.hook ? `<div class="lf-story"><p>${esc(e.hook)}</p></div>` : ""}<ol class="lf-map">${parts.map((p) => `<li><b>${esc(p.label)}</b><span>${p.to - p.from} steps</span></li>`).join("")}</ol>`}
        <div class="actions"><button class="btn" data-l="primeDone">Got the story: start part 1</button></div>`;
      if (L.phase === "read") inner = `
        <h2>${esc(P.label)}</h2>
        <p class="hint">Read it as a story: each step causes the next. At every arrow ask yourself <b>why</b>. When the clock runs out it hides and you explain it.</p>
        ${L.part ? `<p class="lf-from">Carries on from: ${esc(links[P.from - 1])}</p>` : ""}
        ${spicyFor(e) && spicyFor(e)[L.part] ? `<div class="lf-story spicy small"><p>${spicyHTML(spicyFor(e)[L.part])}</p></div><p class="lf-now">Now the real steps. Match each one to its scene:</p>` : ""}
        ${flow(idxOf(L.part))}
        <div class="actions"><button class="btn" data-l="readDone">I’ve got it: hide it</button></div>`;
      if (L.phase === "explain") inner = `
        <h2>Explain: ${esc(P.label)}</h2>
        <p class="hint">Teach it to a friend, in order, in your own words: what happens and why. Short phrases and arrows (Tab) are fine. ${idxOf(L.part).length} steps to cover.</p>
        ${L.part ? `<p class="lf-from">Start from: ${esc(links[P.from - 1])}</p>` : ""}
        ${box("Start talking…")}
        <div class="actions"><button class="btn" data-l="check">Check <kbd>ctrl ↵</kbd></button></div>`;
      if (L.phase === "result" || L.phase === "fixresult") {
        const idx = L.phase === "result" ? idxOf(L.part) : L.fixIdx;
        const sc = scoreOf(Object.fromEntries(idx.map((i) => [i, L.got[i]])));
        const missed = idxOf(L.part).filter((i) => L.got[i] === false);
        const last = L.part + 1 >= parts.length;
        inner = `
          <h2>${esc(P.label)}: ${sc.hit} of ${sc.all} ${L.phase === "fixresult" ? "fixed" : "steps"}</h2>
          ${flow(L.phase === "result" ? idx : idxOf(L.part), { got: L.got, tap: true })}
          <p class="hint">Said it in different words and it’s still red? Tap the step to count it.</p>
          <div class="actions">
            ${L.phase === "result" && missed.length
              ? `<button class="btn" data-l="fix">Fix the ${plural(missed.length, "missed step")}</button><button class="btn ghost" data-l="next">Skip</button>`
              : `<button class="btn" data-l="next">${last ? "Final: the whole essay" : "Next part"}</button>`}
          </div>
          <p class="hint">${L.phase === "result" && missed.length ? "Moves on by itself in 20 seconds." : missed.length ? "Still red? It’ll come back in the final round and in Play." : "Clean. Moving on in 20 seconds."}</p>`;
      }
      if (L.phase === "fix") inner = `
        <h2>The steps you missed</h2>
        <p class="hint">Only these, with the step before each one for context. Ask why each one happens.</p>
        ${flow(L.fixShow, { ctx: L.fixShow.filter((i) => !L.fixIdx.includes(i)) })}
        <div class="actions"><button class="btn" data-l="fixReadDone">Hide them</button></div>`;
      if (L.phase === "fixsay") inner = `
        <h2>Say them again</h2>
        <p class="hint">Just the ${plural(L.fixIdx.length, "step")} you missed, in your own words.</p>
        ${box("…")}
        <div class="actions"><button class="btn" data-l="fixCheck">Check <kbd>ctrl ↵</kbd></button></div>`;
      if (L.phase === "whole") inner = `
        <h2>Now the whole essay</h2>
        <p class="hint">Exam conditions: from the question alone, explain the whole essay in order, every part. This is what you’ll do on the day.</p>
        <ol class="lf-map small">${parts.map((p) => `<li><b>${esc(p.label)}</b></li>`).join("")}</ol>
        ${box("From the start…")}
        <div class="actions"><button class="btn" data-l="wholeCheck">Check <kbd>ctrl ↵</kbd></button></div>`;
      if (L.phase === "done") {
        focusOff();
        const sc = L.wholeScore || { hit: 0, all: 1 };
        const pct = Math.round((100 * sc.hit) / Math.max(1, sc.all));
        const nx = nextEssay();
        app.innerHTML = `
          ${topbar()}
          <main class="wrap learn lf-done">
            <h1 class="page-title">${en(e)} learned</h1>
            <div class="kpis">
              <div><b>${pct}%</b><span>of the essay explained from memory</span></div>
              <div><b>${mins(L.elapsed)}</b><span>focused time</span></div>
              <div><b>${L.awayN}</b><span>${L.awayN === 1 ? "time you left" : "times you left"}${L.away ? ` (${mins(L.away)})` : ""}</span></div>
            </div>
            <h2>Your final explanation</h2>
            ${parts.map((p, k) => `<h3 class="lf-ph">${esc(p.label)}</h3>${flow(idxOf(k), { got: L.finalGot })}`).join("")}
            <p class="callout ok">It’s in your daily review from tomorrow. The red steps are your weak spots.</p>
            <div class="actions">
              <a class="btn" href="#/play/${e.id}">Bonus: Play it (Build the chain, Gap rush)</a>
              ${nx ? `<a class="btn ghost" href="#/learn/${nx.id}">Next: learn ${esc(en(nx).toLowerCase())}</a>` : ""}
              <a class="btn ghost" href="#/">Home</a>
            </div>
          </main>
          ${footer()}`;
        return;
      }
      app.innerHTML = shell(inner);
      paintBar();
      const t = app.querySelector("#lfBox");
      if (t) {
        t.focus({ preventScroll: true });
        t.addEventListener("keydown", (ev) => {
          if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") { ev.preventDefault(); const b = app.querySelector("[data-l=check],[data-l=fixCheck],[data-l=wholeCheck],[data-l=primeDone]"); if (b) b.click(); }
        });
      } else { const b = app.querySelector(".stage .btn"); if (b) b.focus({ preventScroll: true }); }
      window.scrollTo(0, 0);
    };

    const go = (phase) => { L.phase = phase; backNote = ""; render(); persist(); };
    const toRead = () => { go("read"); runStep(parts[L.part].read, () => toExplain()); };
    const toExplain = () => { go("explain"); runStep(parts[L.part].explain, () => check()); };
    const text = () => { const t = app.querySelector("#lfBox"); return t ? t.value : ""; };
    const autoNext = () => runStep(20, () => next());
    const check = () => {
      stopStep();
      Object.assign(L.got, coverage(e, text(), idxOf(L.part)));
      L.scores[L.part] = scoreOf(Object.fromEntries(idxOf(L.part).map((i) => [i, L.got[i]])));
      go("result"); autoNext();
    };
    const toFix = () => {
      L.fixIdx = idxOf(L.part).filter((i) => L.got[i] === false);
      L.fixShow = [...new Set(L.fixIdx.flatMap((i) => (i > parts[L.part].from ? [i - 1, i] : [i])))].sort((a, b) => a - b);
      go("fix");
      runStep(Math.min(90, Math.max(30, L.fixIdx.length * 12)), () => toFixSay());
    };
    const toFixSay = () => { go("fixsay"); runStep(Math.min(120, Math.max(45, L.fixIdx.length * 20)), () => fixCheck()); };
    const fixCheck = () => {
      stopStep();
      const c = coverage(e, text(), L.fixIdx);
      L.fixIdx.forEach((i) => { if (c[i]) L.got[i] = true; });
      go("fixresult"); autoNext();
    };
    const next = () => {
      stopStep();
      if (L.part + 1 >= parts.length) { go("whole"); runStep(plan.whole, () => wholeCheck()); return; }
      L.part++; toRead();
    };
    const wholeCheck = () => {
      stopStep();
      L.finalGot = coverage(e, text(), range(0, links.length));
      L.wholeScore = scoreOf(L.finalGot);
      L.missed = range(0, links.length).filter((i) => L.finalGot[i] === false);
      if (!S.learned[e.id]) markLearned(e.id, false);
      logEvent("learn", e.id, Math.round((100 * L.wholeScore.hit) / Math.max(1, L.wholeScore.all)));
      addXP(Math.round(20 + 60 * (L.wholeScore.hit / Math.max(1, L.wholeScore.all))));
      store.del(learnKey(e.id));
      go("done");
    };

    app.onclick = (ev) => {
      const li = ev.target.closest("[data-li]");
      if (li && ["result", "fixresult"].includes(L.phase)) {
        const i = Number(li.dataset.li);
        L.got[i] = !L.got[i];
        L.scores[L.part] = scoreOf(Object.fromEntries(idxOf(L.part).map((k) => [k, L.got[k]])));
        const left = step ? step.left : 0, f = step && step.onEnd;
        render(); persist();
        if (f) runStep(Math.max(left, 10), f);
        return;
      }
      const b = ev.target.closest("[data-l]");
      if (!b || !app.querySelector(".learn")) return;
      const a = b.dataset.l;
      if (a === "go") { store.del(learnKey(e.id)); L = { phase: "prime", part: 0, elapsed: 0, away: 0, awayN: 0, got: {}, scores: [], wholeScore: null, missed: [] }; focusOn(); wakeAudio(); render(); persist(); runStep(plan.prime, () => primeDone()); }
      else if (a === "resume") {
        const sv = saved; L = { ...L, ...sv }; focusOn(); wakeAudio();
        if (sv.phase === "prime") { go("prime"); runStep(plan.prime, () => primeDone()); }
        else if (sv.phase === "whole") { go("whole"); runStep(plan.whole, () => wholeCheck()); }
        else if (sv.phase === "next") next();
        else toRead();
      }
      else if (a === "primeDone") primeDone();
      else if (a === "readDone") { stopStep(); toExplain(); }
      else if (a === "check") check();
      else if (a === "fix") { stopStep(); toFix(); }
      else if (a === "fixReadDone") { stopStep(); toFixSay(); }
      else if (a === "fixCheck") fixCheck();
      else if (a === "next") next();
      else if (a === "wholeCheck") wholeCheck();
      else if (a === "quit") { if (confirm("Stop the session? You can carry on from this part later today.")) { persist(); stopStep(); focusOff(); location.hash = `#/study/${e.id}`; } }
    };
    const primeDone = () => { stopStep(); toRead(); };
    app.onkeydown = null;
    render();
  };

  /* ---------- On call: learn the spicy stories with your partner ----------
     Two phones, one room. The host (the one studying) opens a room and sends the link.
     The partner is the quizmaster: she reads each story to him, then he retells it from memory
     while she taps every key word he says. Missed essays come back later in the same call,
     and essays come back on later days (1, 2, 4, 7 days) until they stick.
     Sync: each side writes only its own half of the room (h / p) and polls the other. */
  const CALL_HOST = (code) => "essayjar:callhost:" + code;
  const callTerms = (id) => {
    const set = storySet(callStyle) || window.CLEAN, sp = set && set[id]; if (!sp) return [];
    const seen = new Set(), out = [];
    sp.forEach((t, part) => (t.match(/\*\*(.+?)\*\*/g) || []).forEach((m) => {
      const w = m.slice(2, -2).trim(), k = w.toLowerCase();
      if (!seen.has(k)) { seen.add(k); out.push({ w, part }); }
    }));
    return out;
  };
  let callStyle = "clean";
  const callTitle = (id) => storyTitles(callStyle)[id] || "The story";
  const callRec = (id) => (S.call || {})[id] || null;
  // A story is "solid" (exam-ready) after 3 good tells (80%+) on 3 different days.
  const CALL_GAPS = [1, 2, 4, 7];
  const goodOf = (r) => (r ? (r.good !== undefined ? r.good : r.score >= 0.8 ? 1 : 0) : 0);
  const callDue = (id) => {
    const r = callRec(id); if (!r) return false;
    const g = goodOf(r);
    const gap = r.score < 0.8 || !g ? 1 : CALL_GAPS[Math.min(g - 1, CALL_GAPS.length - 1)];
    return diff(r.last, today()) >= gap;
  };
  const callLevel = (id) => { const r = callRec(id); if (!r) return "new"; const g = goodOf(r); return g >= 3 && r.score >= 0.8 ? "solid" : r.score >= 0.8 ? "learning" : "shaky"; };
  const LEVEL_TXT = { new: "new", shaky: "shaky", learning: "learning", solid: "solid ✓" };
  const callStats = () => {
    const all = callEssays(), lv = all.map((e) => callLevel(e.id));
    const secs = Object.values(S.call || {}).reduce((a, r) => a + (r.secs || 0), 0);
    return { total: all.length, started: lv.filter((l) => l !== "new").length, solid: lv.filter((l) => l === "solid").length, shaky: lv.filter((l) => l === "shaky").length, secs };
  };
  const hm = (secs) => { const m = Math.round(secs / 60); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
  const clock = (secs) => { secs = Math.max(0, Math.floor(secs)); const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), x = secs % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0"); };
  // Every 10 minutes on the same essay: a roast that gets worse each time.
  const ROASTS = {
    spicy: ["{m} minutes on this one. Don’t tell me you still haven’t learnt shit, you dumb fuck.", "{m} minutes. She could’ve finished twice by now. Say the damn story.", "{m} minutes on ONE essay. The examiner won’t wait while you jerk around. Lock in.", "{m} minutes. Pathetic. Tell the story or hand her the phone and go to sleep."],
    clean: ["{m} minutes on this one. Don’t tell me you still haven’t got it, you absolute clown.", "{m} minutes. A goldfish would’ve learnt it by now. Say it.", "{m} minutes on ONE essay?! Lock in, legend.", "{m} minutes. Even the examiner fell asleep. Finish it."]
  };
  // Lock-in reminders that pop up on both phones every few minutes.
  const NUDGES = {
    spicy: ["Stop e-sexing and study 📚", "Pants on. Pepsin first.", "Horny later. Hyperammonemia now.", "No nudes until this story is done 🙅", "The only thing getting hard tonight is the questions.", "Sexting detected. Back to the urea cycle.", "Eyes on the story, not on her.", "Lock in now, lock the door after the exam 😏", "Every story you nail tonight = one less thing to cry about on the 30th.", "Flirt after the hearts are full ❤️", "Less moaning, more amino acids.", "Your exam doesn’t care how cute she is. Focus."],
    clean: ["Phones down, brains on 📚", "Less chat, more chain.", "Focus check: say the key words out loud.", "You’re doing great. Next story.", "Lock in. Ten more minutes of focus.", "One more story and you’ve earned a break.", "Back to it: the exam won’t wait.", "Say it like you’re writing it on the day."]
  };
  const mask = (w) => w.split(/(\s+)/).map((p) => /\s/.test(p) ? p : p.length <= 2 ? p[0] + "_".repeat(p.length - 1) : p[0] + "_".repeat(p.length - 1)).join("");
  const hearts = (s) => "❤️".repeat(Math.round(s * 5)) + "🤍".repeat(5 - Math.round(s * 5));
  const tellSecs = (id) => Math.max(60, Math.min(180, callTerms(id).length * 7));
  const callEssays = () => C.essays.filter((e) => window.CLEAN && window.CLEAN[e.id]);

  const viewCallSetup = () => {
    if (!ONLINE) {
      app.innerHTML = `${topbar()}<main class="wrap"><h1 class="page-title">On call</h1><p class="callout">On call needs accounts switched on (the owner sets up the online part). Until then it can’t link two phones.</p></main>${footer()}`;
      return;
    }
    if (!acct) {
      app.innerHTML = `${topbar()}<main class="wrap"><h1 class="page-title">On call</h1><p class="callout">Log in first, so your progress from the call is saved to you.</p><div class="actions"><a class="btn" href="#/login">Log in</a></div></main>${footer()}`;
      return;
    }
    callStyle = storyStyle() === "spicy" ? "spicy" : "clean";
    const all = callEssays();
    const due = all.filter((e) => callDue(e.id));
    const fresh = all.filter((e) => !callRec(e.id));
    let nNew = Math.min(4, fresh.length), testFirst = false;
    const picked = new Set();
    const pickDefault = () => { picked.clear(); due.forEach((e) => picked.add(e.id)); fresh.slice(0, nNew).forEach((e) => picked.add(e.id)); };
    pickDefault();
    const draw = () => {
      const mins = [...picked].reduce((s, id) => s + (callRec(id) ? 3 : 6), 0);
      app.innerHTML = `
        ${topbar()}
        <main class="wrap call-setup">
          <p class="meta">Study on a call</p>
          <div class="tabs call-style" role="group" aria-label="Story style">
            <button type="button" data-c="clean" aria-selected="${callStyle === "clean"}">Clean stories</button>
            <button type="button" data-c="spicy" aria-selected="${callStyle === "spicy"}">Spicy stories 18+</button>
          </div>
          <h1 class="page-title">Learn the stories together</h1>
          ${(() => { const st = callStats(), dl = diff(today(), C.examDate); return `<div class="kpis call-kpis">
            <div><b>${st.solid}/${st.total}</b><span>solid (exam-ready)</span></div>
            <div><b>${st.started}/${st.total}</b><span>started</span></div>
            <div><b>${hm(st.secs)}</b><span>studied on calls</span></div>
            <div><b>${dl > 0 ? dl : "–"}</b><span>${dl === 1 ? "day" : "days"} to the exam</span></div>
          </div><p class="hint">A story is <b>solid</b> when you’ve told it at 80%+ on 3 different days. Get all ${st.total} solid before the exam and you won’t forget them.</p>`; })()}
          <p class="lede">You both open the same room on your phones. She reads each story to you, then you tell it back from memory while she taps every key word you say. Anything you miss comes back later in the call, and each story comes back on later days until it sticks.</p>
          <div class="call-quick">
            <button class="btn ghost small" data-c="revall" ${all.some((e) => callRec(e.id)) ? "" : "disabled"}>Review everything I’ve started</button>
            <button class="btn ghost small" data-c="revweak" ${all.some((e) => callRec(e.id) && callLevel(e.id) !== "solid") ? "" : "disabled"}>Review the weak ones</button>
            <button class="btn ghost small" data-c="plan">Back to today’s plan</button>
          </div>
          <p class="hint">Tap any story below to add or remove it. Every story starts from the beginning: she reads it, then you tell it.</p>
          <label class="switch call-tf"><input type="checkbox" data-c="testfirst" ${testFirst ? "checked" : ""}> <span>Harder: on reviews, I tell it first before she reads (sticks better, use it once you know them)</span></label>
          ${due.length ? `<h2>Due for review today <span class="tag">${due.length}</span></h2><p class="hint">These go first.</p>` : `<p class="hint">Nothing due for review today.</p>`}
          <h2>New stories</h2>
          <div class="call-n">
            <button class="btn ghost small" data-c="less" ${nNew <= 0 ? "disabled" : ""}>−</button>
            <b>${nNew}</b> new
            <button class="btn ghost small" data-c="more" ${nNew >= Math.min(8, fresh.length) ? "disabled" : ""}>+</button>
            <span class="hint">4–8 a day works if you actually focus.</span>
          </div>
          <div class="call-grid">${all.map((e) => {
            const r = callRec(e.id);
            return `<button class="call-pick${picked.has(e.id) ? " on" : ""}${callDue(e.id) ? " due" : ""}" data-pick="${e.id}" aria-pressed="${picked.has(e.id)}"><span class="cp-q">${qn(e)}</span><span class="cp-t">${esc(callTitle(e.id))}</span><span class="cp-s">${r ? `${hearts(r.score)}` : ""}</span><span class="cp-l lv-${callLevel(e.id)}">${LEVEL_TXT[callLevel(e.id)]}${callDue(e.id) ? " · due" : ""}${r && r.secs ? ` · ${hm(r.secs)}` : ""}</span></button>`;
          }).join("")}</div>
          <div class="actions">
            <button class="btn" data-c="open" ${picked.size ? "" : "disabled"}>Open the room (${picked.size} ${picked.size === 1 ? "story" : "stories"}, about ${mins} min)</button>
          </div>
          <p class="hint">She doesn’t need an account: she just opens the link you send her.</p>
        </main>
        ${footer()}`;
    };
    app.onclick = (ev) => {
      const b = ev.target.closest("[data-c],[data-pick]"); if (!b || !app.querySelector(".call-setup")) return;
      if (b.dataset.pick) { const id = Number(b.dataset.pick); picked.has(id) ? picked.delete(id) : picked.add(id); return draw(); }
      const a = b.dataset.c;
      if (a === "clean" || a === "spicy") { callStyle = a; return draw(); }
      if (a === "testfirst") { testFirst = b.checked; return; }
      if (a === "revall") { picked.clear(); all.filter((e) => callRec(e.id)).forEach((e) => picked.add(e.id)); return draw(); }
      if (a === "revweak") { picked.clear(); all.filter((e) => callRec(e.id) && callLevel(e.id) !== "solid").forEach((e) => picked.add(e.id)); return draw(); }
      if (a === "plan") { pickDefault(); return draw(); }
      if (a === "less" || a === "more") { nNew = Math.max(0, Math.min(8, fresh.length, nNew + (a === "more" ? 1 : -1))); pickDefault(); return draw(); }
      if (a === "open") {
        const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        const code = [...Array(6)].map(() => ABC[Math.floor(Math.random() * ABC.length)]).join("");
        const order = [...picked].sort((x, y) => (callDue(y) - callDue(x)) || (x - y));
        const H = { v: 1, style: callStyle, testFirst, name: user.name, essays: order, kinds: Object.fromEntries(order.map((id) => [id, callRec(id) ? "review" : "new"])), msgs: [] };
        b.disabled = true; b.textContent = "Opening…";
        apiCall("roomPut", { token: acct.token, code, side: "h", data: H }).then((r) => {
          if (!r || !r.ok) { b.disabled = false; b.textContent = (r && r.error) || "Couldn’t open the room. Try again."; return; }
          session.set(CALL_HOST(code), "1");
          location.hash = "#/call/" + code;
        }).catch(() => { b.disabled = false; b.textContent = "Can’t reach the server. Try again."; });
      }
    };
    draw();
  };

  const viewCallRoom = (code) => {
    code = String(code || "").toUpperCase();
    const host = session.get(CALL_HOST(code)) === "1";
    let H = null, P = null, last = "", err = "", started = {}, seenMsgs = new Set(), firstLoad = true;
    let putting = false, dirty = false;
    const link = `${location.origin}${location.pathname}#/call/${code}`;
    const putMine = () => {
      if (putting) { dirty = true; return; }
      putting = true; dirty = false;
      const body = host ? { token: acct && acct.token, code, side: "h", data: H } : { code, side: "p", data: P };
      apiCall("roomPut", body).catch(() => {}).finally(() => { putting = false; if (dirty) putMine(); });
    };
    const say = (text) => {
      const mine = host ? H : P; if (!mine) return;
      mine.msgs = [...(mine.msgs || []), { id: Date.now() + ":" + Math.random().toString(36).slice(2, 6), text: String(text).slice(0, 120) }].slice(-12);
      seenMsgs.add(mine.msgs[mine.msgs.length - 1].id);
      putMine();
      toastMsg(text, true);
    };
    const toastMsg = (text, mine) => {
      const t = document.createElement("div");
      t.className = "call-toast" + (mine ? " mine" : "");
      t.textContent = (mine ? "You: " : (host ? (P && P.name) || "Her" : (H && H.name) || "Him") + ": ") + text;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 3800);
    };
    const item = () => P && P.queue && P.queue[P.i];
    const startOf = (key) => { if (!started[key]) started[key] = Date.now(); return started[key]; };

    // partner: make her half of the room the first time she joins
    const joinAsPartner = (name) => {
      const q = H.essays.map((id) => ({ id, kind: H.kinds[id] || "new" }));
      P = { v: 1, name: name || "Her", i: 0, queue: q, phase: q.length ? (q[0].kind === "review" && H.testFirst ? "tell" : "read") : "end", taps: {}, hints: {}, scores: {}, requeued: {}, msgs: [], t0: {}, dur: {} };
      P.t0[0] = Date.now();
      putMine(); render();
    };
    const goPhase = (phase) => { P.phase = phase; hintOpen = false; putMine(); render(); };
    const scoreNow = () => {
      const it = item(); const terms = callTerms(it.id);
      return terms.length ? (P.taps[P.i] || []).length / terms.length : 1;
    };
    const finishTell = () => {
      const s = scoreNow();
      P.dur = P.dur || {}; P.t0 = P.t0 || {};
      if (P.t0[P.i]) P.dur[P.i] = Math.round((Date.now() - P.t0[P.i]) / 1000);
      P.scores[P.i] = Math.round(s * 100) / 100;
      const it = item();
      if (s < 0.8 && !P.requeued[it.id]) {
        const at = Math.min(P.i + 3, P.queue.length);
        P.requeued[it.id] = 1;
        P.queue.splice(at, 0, { id: it.id, kind: "again", from: P.i });
      }
      goPhase("result");
    };
    // Undo a tap on the wrong button: one step back at a time. Taps are kept.
    const goBack = () => {
      if (P.phase === "result") {
        delete P.scores[P.i];
        const it = item(), k = P.queue.findIndex((q, j) => j > P.i && q.kind === "again" && q.from === P.i);
        if (k > P.i) { P.queue.splice(k, 1); delete P.requeued[it.id]; }
        started[P.i + ":tell"] = Date.now();
        return goPhase("tell");
      }
      if (P.phase === "tell" && item() && !(item().kind === "review" && H.testFirst)) return goPhase("read");
      if (P.i > 0 && (P.phase === "read" || P.phase === "tell" || P.phase === "end")) { P.i--; return goPhase("result"); }
    };
    const canBack = () => P && (P.phase === "result" || (P.phase === "tell" && item() && !(item().kind === "review" && H.testFirst)) || P.i > 0);
    const nextItem = () => {
      hintOpen = false;
      P.i++;
      P.t0 = P.t0 || {}; P.t0[P.i] = P.t0[P.i] || Date.now();
      const it = item();
      P.phase = !it ? "end" : it.kind === "review" && H.testFirst ? "tell" : "read";
      putMine(); render();
    };

    // host: save every finished attempt to his progress
    const savedKey = "essayjar:callsaved:" + code;
    const saveResults = () => {
      if (!host || !P || !P.scores) return;
      let saved = {}; try { saved = JSON.parse(session.get(savedKey) || "{}"); } catch (e2) { saved = {}; }
      let changed = false;
      Object.entries(P.scores).forEach(([qi, sc]) => {
        if (saved[qi] === sc) return;
        const it = P.queue[qi]; if (!it) return;
        const redo = saved[qi] !== undefined;
        saved[qi] = sc; changed = true;
        S.call = S.call || {};
        const r = S.call[it.id] || { n: 0, last: "", score: 0, good: 0, secs: 0 };
        if (r.good === undefined) r.good = r.score >= 0.8 ? 1 : 0;
        if (r.last !== today()) r.n++;
        if (sc >= 0.8 && r.goodDay !== today()) { r.good++; r.goodDay = today(); }
        if (!redo) r.secs = (r.secs || 0) + ((P.dur || {})[qi] || 0);
        r.last = today(); r.score = sc; S.call[it.id] = r;
        if (!redo) { addXP(Math.round(10 + sc * 30)); logEvent("call", it.id, Math.round(sc * 100)); }
      });
      if (changed) { session.set(savedKey, JSON.stringify(saved)); save(); }
    };

    const storyHTML = (id, opts = {}) => {
      const sp = (storySet(callStyle) || {})[id] || [], labels = startsOf(E[id]).map(([, l]) => l);
      return sp.map((t, k) => `<h3 class="sp-h">${esc(labels[k] || "")}</h3><p>${opts.chips ? chipify(t, id) : spicyHTML(t)}</p>`).join("");
    };
    const chipify = (t, id) => {
      const terms = callTerms(id), tapped = new Set(P.taps[P.i] || []);
      return esc(t).replace(/\*\*(.+?)\*\*/g, (m, w) => {
        const k = terms.findIndex((x) => x.w.toLowerCase() === w.trim().toLowerCase());
        return `<button type="button" class="chip${tapped.has(k) ? " on" : ""}" data-tap="${k}">${w}</button>`;
      });
    };
    // her side only: lines to say in her own words, so he remembers "she told me this"
    const teaseHTML = (id) => {
      const t = ((callStyle === "spicy" ? window.SPICY_TEASE : window.CLEAN_TEASE) || {})[id];
      return t && t.length ? `<div class="call-tease"><p class="ct-h">${callStyle === "spicy" ? "Then say this to him, your way 😏" : "Then say this, your way"}</p>${t.map((x) => `<p>“${esc(x)}”</p>`).join("")}<p class="hint">Make it personal: he’ll remember it was you who said it.</p></div>` : "";
    };
    // time on this story / tonight (each phone counts from when it first saw the story)
    const targetSecs = (q) => (q && (q.kind === "review" || q.kind === "review-read") ? 240 : 420);
    const itemSecs = () => (P && item() ? (Date.now() - startOf("item:" + P.i)) / 1000 : 0);
    const nightSecs = () => {
      if (!P) return 0;
      const doneSecs = Object.entries(P.dur || {}).filter(([qi]) => Number(qi) !== P.i).reduce((a, [, v]) => a + v, 0);
      return doneSecs + (item() ? itemSecs() : 0);
    };
    // her hint panel: pick the bit he missed, send a question that makes him think, not the word
    let hintOpen = false;
    const hintPanel = (id) => {
      const qs = (window.CALL_HINTS || {})[id] || [], labels = startsOf(E[id]).map(([, l]) => l);
      const terms = callTerms(id), tapped = new Set(P.taps[P.i] || []), sent = new Set(P.hints[P.i] || []);
      // a question disappears once every key word it's about has been ticked
      const covered = (part, kws) => {
        const keys = String(kws || "").toLowerCase().split(";").map((x) => x.trim()).filter(Boolean);
        let idx = terms.map((t, k) => ({ t, k })).filter(({ t }) => keys.some((kw) => t.w.toLowerCase().includes(kw)));
        const same = idx.filter(({ t }) => t.part === part); if (same.length) idx = same;
        return idx.length > 0 && idx.every(({ k }) => tapped.has(k));
      };
      const parts = qs.map((list, part) => {
        const missed = [...new Set(terms.map((t, k) => ({ t, k })).filter(({ t, k }) => t.part === part && !tapped.has(k)).map(({ t }) => t.w))];
        const open = list.map((h) => (Array.isArray(h) ? h : [h, ""])).filter(([q, kws]) => !covered(part, kws));
        return { part, missed, open };
      }).filter((x) => x.open.length && x.missed.length);
      return `<div class="hint-panel"><p class="hp-h">${parts.length ? "What did he miss? Send him a question about it." : "He’s said everything. Nothing left to hint 🔥"}</p>${parts.map(({ part, missed, open }) => `<div class="hp-part"><p class="hp-l">${esc(labels[part] || "")}<span>missed: ${esc(missed.slice(0, 6).join(", "))}${missed.length > 6 ? "…" : ""}</span></p>${open.map(([q]) => `<button type="button" class="hp-q${sent.has(q) ? " sent" : ""}" data-hq="${esc(q)}">${sent.has(q) ? "✓ " : ""}${esc(q)}</button>`).join("")}</div>`).join("")}</div>`;
    };
    const reactions = host ? ["❤️", "😘", "🥵", "Hint please", "I got this", "Again?"] : ["😏", "🔥", "💋", "🙄", "Good boy", "Try harder", "Say it properly"];

    const render = () => {
      const keep = document.activeElement && document.activeElement.id === "callMsg" ? document.activeElement.value : null;
      let inner = "";
      if (err) inner = `<p class="callout">${esc(err)}</p><div class="actions"><a class="btn" href="#/">Home</a></div>`;
      else if (!H) inner = `<p class="hint">Opening the room…</p>`;
      else if (!host && !P) inner = `
        <h1 class="page-title">${esc(H.name)} wants you to quiz him</h1>
        <p class="lede">You’re the quizmaster. For each story: <b>read it to him out loud</b> ${callStyle === "spicy" ? "(make it dirty, it helps him remember)" : "(make it fun, it helps him remember)"}, then he <b>tells it back from memory</b> and you <b>tap every key word he says</b>. Below 80% and the story comes back later in the call. ${H.essays.length} ${H.essays.length === 1 ? "story" : "stories"} tonight.${callStyle === "spicy" ? " Spicy stories, 18+." : ""}</p>
        <form class="call-join" autocomplete="off"><input id="callName" maxlength="20" placeholder="Your name"><button class="btn" type="submit">Join</button></form>`;
      else if (host && !P) inner = `
        <h1 class="page-title">Room ${code}</h1>
        <p class="lede">Send her this link on the call. When she opens it, you start.</p>
        <div class="call-link"><input readonly value="${esc(link)}" aria-label="Room link"><button class="btn" data-k="share">${navigator.share ? "Send link" : "Copy link"}</button></div>
        <p class="hint">Waiting for her to join…</p>`;
      else {
        const it = item(), total = P.queue.length;
        const doneN = Object.keys(P.scores || {}).length;
        const head = `<div class="call-top"><span class="ct-who">${esc(host ? (P.name || "Her") : H.name)} is in · Room ${code}</span><span class="ct-n">${Math.min(P.i + 1, total)} of ${total}</span></div>
          <div class="call-bar"><i style="width:${(100 * Math.min(P.i, total)) / Math.max(1, total)}%"></i></div>
          <div class="call-clock">${it ? `<span>this essay <b class="cc-item">${clock(itemSecs())}</b></span>` : ""}<span>tonight <b class="cc-all">${clock(nightSecs())}</b></span><span>done <b>${doneN}</b> of ${total}</span></div>`;
        if (P.phase === "end" || !it) {
          const sc = Object.entries(P.scores).map(([qi, s]) => ({ it: P.queue[qi], s }));
          const best = {}; sc.forEach(({ it: q, s }) => { if (q) best[q.id] = s; });
          inner = `${head}<h1 class="page-title">Done for tonight 🔥</h1>
            <div class="kpis call-kpis"><div><b>${Object.keys(best).length}</b><span>${Object.keys(best).length === 1 ? "story" : "stories"} tonight</span></div><div><b>${hm(Object.values(P.dur || {}).reduce((a, b) => a + b, 0))}</b><span>studied together</span></div>${host ? `<div><b>${callStats().solid}/${callStats().total}</b><span>solid overall</span></div>` : ""}</div>
            <ol class="call-sum">${Object.entries(best).map(([id, s]) => { const t = Object.entries(P.dur || {}).filter(([qi]) => P.queue[qi] && String(P.queue[qi].id) === String(id)).reduce((a, [, v]) => a + v, 0); return `<li><span>${qn(E[id])} ${esc(callTitle(id))}</span><span>${hearts(s)} <small>${clock(t)}</small></span></li>`; }).join("")}</ol>
            <p class="lede">${host ? "Saved. The ones you nailed come back in a couple of days, the shaky ones tomorrow. Do the due ones first next time." : "Thank you for helping him. Same time tomorrow?"}</p>
            ${host ? `<div class="actions"><a class="btn" href="#/call">New call</a><a class="btn ghost" href="#/">Home</a></div>` : `<div class="actions"><button class="btn ghost" data-k="back">← Back</button></div>`}`;
        } else {
          const e = E[it.id], terms = callTerms(it.id), tapped = P.taps[P.i] || [];
          const tag = it.kind === "review" ? (H.testFirst ? "Review: tell it from the start" : "Review: she reads it, then you tell it") : it.kind === "review-read" ? "Review: she reads it first" : it.kind === "again" ? "Second go" : "New story";
          const title = `<p class="meta">${qn(e)} · ${esc(tag)}</p><h1 class="call-title">${esc(callTitle(it.id))}</h1><p class="call-q">${esc(e.q)}</p>`;
          if (P.phase === "read") inner = host
            ? `${head}${title}<p class="lede">Listen while she reads it. Picture each scene: every bit of the story is a real step.</p><div class="lf-story spicy">${storyHTML(it.id)}</div>`
            : `${head}${title}<p class="lede"><b>Read this to him out loud.</b> Slowly, with feeling. The highlighted words are the ones he has to say back.</p><div class="lf-story spicy">${storyHTML(it.id)}</div>${teaseHTML(it.id)}
               <div class="actions">${canBack() ? `<button class="btn ghost" data-k="back">← Back</button>` : ""}<button class="btn" data-k="tell">Done reading: now he tells it</button></div>`;
          if (P.phase === "tell") {
            const secs = tellSecs(it.id), left = Math.max(0, secs - Math.floor((Date.now() - startOf(P.i + ":tell")) / 1000));
            const hints = (P.hints[P.i] || []).filter((h) => typeof h === "string");
            inner = host
              ? `${head}${title}<div class="call-timer${left <= 10 ? " low" : ""}">${mmss(left)}</div>
                 <p class="lede"><b>Tell her the story</b>, from the start, in your own words. Say the key words out loud.</p>
                 <ol class="call-cues">${startsOf(e).map(([, l]) => `<li>${esc(l)}</li>`).join("")}</ol>
                 <p class="call-count">She’s heard <b>${tapped.length}</b> of ${terms.length} key words</p>
                 ${hints.length ? `<div class="call-hints"><p class="ch-h">She’s asking:</p>${hints.map((h) => `<p class="hintq">${esc(h)}</p>`).join("")}</div>` : ""}`
              : `${head}${title}<div class="call-timer${left <= 10 ? " low" : ""}">${mmss(left)}</div>
                 <p class="lede"><b>He tells it now.</b> Tap each highlighted word as he says it (near enough counts). Tap again to undo.</p>
                 <div class="lf-story spicy chips">${storyHTML(it.id, { chips: true })}</div>
                 <p class="call-count"><b>${tapped.length}</b> of ${terms.length}</p>
                 <div class="actions">${canBack() ? `<button class="btn ghost" data-k="back">← Back</button>` : ""}${it.kind === "review" && H.testFirst ? `<button class="btn ghost" data-k="readfirst">He’s lost: read it first</button>` : ""}<button class="btn ghost" data-k="hint" aria-expanded="${!!hintOpen}">${hintOpen ? "Close hints" : "Give a hint"}</button><button class="btn" data-k="done">He’s finished</button></div>
                 ${hintOpen ? hintPanel(it.id) : ""}`;
          }
          if (P.phase === "result") {
            const s = P.scores[P.i] || 0, missed = terms.filter((_, k) => !tapped.includes(k));
            const back = s < 0.8 && it.kind !== "again";
            inner = `${head}${title}<div class="call-score">${hearts(s)}<b>${Math.round(s * 100)}%</b></div>
              <p class="lede">${s >= 0.95 ? "Perfect. He knows this one." : s >= 0.8 ? "Good enough to pass. It comes back in a couple of days." : back ? "Not yet. This one comes back later tonight." : "Still shaky. It comes back tomorrow."}</p>
              ${missed.length ? `<p class="hint">Missed:</p><div class="call-missed">${missed.map((m) => `<span>${esc(m.w)}</span>`).join("")}</div>` : ""}
              ${host ? "" : `<div class="actions"><button class="btn ghost" data-k="back">← Back</button><button class="btn" data-k="next">${P.i + 1 >= P.queue.length ? "Finish" : "Next story"}</button></div>`}`;
          }
        }
      }
      const showChat = H && P && !err;
      app.innerHTML = `
        <main class="wrap call-room">
          ${inner}
          ${showChat ? `<div class="call-chat">
            <div class="call-react">${reactions.map((r) => `<button type="button" data-say="${esc(r)}">${esc(r)}</button>`).join("")}</div>
            <form class="call-msg" autocomplete="off"><input id="callMsg" maxlength="120" placeholder="${host ? "Say something to her…" : "Say something to him…"}"><button class="btn small" type="submit">Send</button></form>
          </div>` : ""}
        </main>`;
      if (keep !== null) { const i = document.getElementById("callMsg"); if (i) { i.value = keep; i.focus(); } }
    };

    const poll = () => apiCall("roomGet", { code }).then((r) => {
      if (!document.querySelector(".call-room")) return;
      if (!r || !r.ok) { if (firstLoad) { err = (r && r.error) || "Couldn’t open the room."; render(); } return; }
      firstLoad = false;
      if (r.h) { H = host ? (H || r.h) : r.h; callStyle = H.style || "spicy"; }
      if (!host && r.p && !P) P = r.p;
      if (host && r.p) P = r.p;
      const other = host ? r.p : r.h;
      ((other && other.msgs) || []).forEach((m) => { if (!seenMsgs.has(m.id)) { seenMsgs.add(m.id); if (last) toastMsg(m.text, false); } });
      saveResults();
      const snap = JSON.stringify([r.h && r.h.essays, host ? r.p : null, !host ? r.h && r.h.name : null]);
      if (snap !== last || !last) { last = snap; render(); }
    }).catch(() => {});

    app.onclick = (ev) => {
      if (!document.querySelector(".call-room")) return;
      const sy = ev.target.closest("[data-say]"); if (sy) return say(sy.dataset.say);
      const k = ev.target.closest("[data-k]"); const tp = ev.target.closest("[data-tap]");
      if (k && k.dataset.k === "share") {
        if (navigator.share) navigator.share({ title: "Quiz me", text: "Open this and quiz me 😏", url: link }).catch(() => {});
        else { try { navigator.clipboard.writeText(link); k.textContent = "Copied"; } catch (e2) { /* ignore */ } }
        return;
      }
      if (host || !P) return;
      const hq = ev.target.closest("[data-hq]");
      if (hq) {
        const q = hq.dataset.hq, hs = (P.hints[P.i] || []).filter((h) => typeof h === "string");
        if (!hs.includes(q)) { P.hints[P.i] = [...hs, q]; putMine(); }
        hq.classList.add("sent"); hq.textContent = "✓ " + q; return;
      }
      if (tp) {
        const n = Number(tp.dataset.tap); if (n < 0) return;
        const arr = P.taps[P.i] || []; P.taps[P.i] = arr.includes(n) ? arr.filter((x) => x !== n) : [...arr, n];
        putMine();
        app.querySelectorAll(`[data-tap="${n}"]`).forEach((c) => c.classList.toggle("on", P.taps[P.i].includes(n)));
        const c = app.querySelector(".call-count b"); if (c) c.textContent = P.taps[P.i].length;
        const hp = app.querySelector(".hint-panel"); if (hp && hintOpen) hp.outerHTML = hintPanel(item().id);
        return;
      }
      if (!k) return;
      if (k.dataset.k === "tell") goPhase("tell");
      else if (k.dataset.k === "hint") { hintOpen = !hintOpen; render(); if (hintOpen) { const hp = app.querySelector(".hint-panel"); if (hp && hp.scrollIntoView) hp.scrollIntoView({ block: "start", behavior: "smooth" }); } }
      else if (k.dataset.k === "done") finishTell();
      else if (k.dataset.k === "next") nextItem();
      else if (k.dataset.k === "back") goBack();
      else if (k.dataset.k === "readfirst") { item().kind = "review-read"; goPhase("read"); }
    };
    app.onsubmit = (ev) => {
      if (!document.querySelector(".call-room")) return;
      ev.preventDefault();
      if (ev.target.closest(".call-join")) { if (!H) return; joinAsPartner(document.getElementById("callName").value.trim()); return; }
      if (ev.target.closest(".call-msg")) { const i = document.getElementById("callMsg"); if (i.value.trim()) { say(i.value.trim()); i.value = ""; } }
    };
    // lock-in reminders: every 4 minutes, and when the chat gets too flirty
    let lastNudge = Date.now(), lastFlirt = 0, nudgeI = Math.floor(Math.random() * 50);
    const roasted = {};
    const nudge = (text) => {
      const t = document.createElement("div");
      t.className = "call-toast nudge"; t.textContent = text;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 6000);
    };
    const checkNudge = () => {
      if (!P || !H || P.phase === "end" || document.visibilityState !== "visible") return;
      const list = NUDGES[callStyle] || NUDGES.clean, now = Date.now();
      const recent = [...((H && H.msgs) || []), ...((P && P.msgs) || [])].filter((m) => now - Number(String(m.id).split(":")[0]) < 60000).length;
      if (recent >= 6 && now - lastFlirt > 90000) { lastFlirt = lastNudge = now; return nudge(callStyle === "spicy" ? "Less flirting, more nitrogen 🙄" : "Less chat, more chain."); }
      const tens = item() ? Math.floor(itemSecs() / 600) : 0;
      if (tens >= 1 && (roasted[P.i] || 0) < tens) {
        roasted[P.i] = tens; lastNudge = now;
        const rl = ROASTS[callStyle] || ROASTS.clean;
        return nudge("⏰ " + rl[Math.min(tens - 1, rl.length - 1)].replace("{m}", tens * 10));
      }
      if (now - lastNudge > 180000) { lastNudge = now; nudge(list[nudgeI++ % list.length].replace("{days}", diff(today(), C.examDate))); }
    };
    // timers on screen tick every second; the room is fetched every 1.5 s
    let tick = 0;
    clearInterval(timer);
    timer = setInterval(() => {
      tick++;
      const t = app.querySelector(".call-timer");
      if (t && P && P.phase === "tell") { const it = item(); const left = Math.max(0, tellSecs(it.id) - Math.floor((Date.now() - startOf(P.i + ":tell")) / 1000)); t.textContent = mmss(left); t.classList.toggle("low", left <= 10); }
      const ci = app.querySelector(".cc-item"), ca = app.querySelector(".cc-all");
      if (ci) { const sec = itemSecs(); ci.textContent = clock(sec); ci.classList.toggle("over", sec > targetSecs(item())); }
      if (ca) ca.textContent = clock(nightSecs());
      if (tick % 2 === 0) checkNudge();
      if (tick % 3 === 0 && document.visibilityState === "visible") poll();
    }, 500);
    render(); poll();
  };

  /* ---------- daily review ----------
     Every day: short free-recall questions on every essay you have learned (no multiple choice).
     All questions are cut from the essay's own chain, section headings and points.
     Missed questions come back at the end of the session; weak essays get their full recall pulled forward. */
  const rng = (seed) => {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return () => {
      h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };
  };
  const shuffle = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const GREEK_NAMES = new Set(["alpha", "beta", "gamma", "delta", "epsilon"]);
  const HEAD_STOP = new Set(["with", "from", "what", "when", "which", "into", "their", "them", "this", "that", "these", "those"]);
  const chainLinks = (e) => (e.chain || "").split(/\s*→\s*/).filter(Boolean);
  const wordCore = (w) => w.replace(/^[(\[{"'“‘]+/, "").replace(/[)\]}"'”’.,;:!?]+$/, "");
  const toks = (s) => clean(s).split(" ").filter(Boolean);
  const hasTok = (have, t) => have.some((h) => (t.length <= 3 ? h === t : wordMatch(h, t)));
  const qToks = (e) => new Set(toks(e.q).filter((t) => t.length >= 4));

  const learnedOn = (id) => S.learned[id] || (atts(id)[0] && atts(id)[0].d) || null;
  const isLearned = (id) => !!learnedOn(id);
  const markLearned = (id, before) => {
    if (!S.learned[id]) S.learned[id] = before ? addDays(today(), -1) : today();
    if (!atts(id).length && !S.due[id]) S.due[id] = before ? today() : addDays(today(), 1);
    save();
  };
  const unmarkLearned = (id) => { delete S.learned[id]; if (!atts(id).length) delete S.due[id]; save(); };

  // Essays learned before today; the freshest and weakest come first, up to 6 a day.
  const reviewPool = () => [...C.essays, ...PWS].filter((e) => { const d = learnedOn(e.id); return d && diff(d, today()) > 0; });
  const reviewPriority = (e) => {
    const t = today(), q = S.quiz.last[e.id];
    let p = diff(learnedOn(e.id), t) <= 3 ? 3 : 0;
    p += q ? Math.min(diff(q.d, t), 4) + (q.score < 0.7 ? 3 : 0) : 5;
    const st = status(e.id);
    if (st === "learning" || st === "shaky") p += 2;
    if (st === "ready") p -= 1;
    if (S.due[e.id] && diff(S.due[e.id], t) >= 0) p += 1;
    return p;
  };
  const isWeak = (e) => ["learning", "shaky"].includes(status(e.id)) || (S.quiz.last[e.id] && S.quiz.last[e.id].score < 0.7);

  // ---- question makers (each one is cut from the essay's own material) ----
  const headingToks = (h) => {
    const out = [];
    h.split(/\s+/).forEach((w) => {
      const core = wordCore(w), caps = /^[A-Z0-9₀-₉⁺]{2,}$/.test(core);
      toks(core).forEach((t) => { if (!HEAD_STOP.has(t) && (t.length >= 4 || /\d/.test(t) || caps)) out.push(t); });
    });
    return [...new Set(out)];
  };
  const mkSkeleton = (e) => ({
    type: "skeleton", e, secs: 40, box: true,
    prompt: "Type the sections of this essay, in the order you’d write them.",
    rows: e.sections.map((s) => ({ text: s.h, need: headingToks(s.h) })),
    grade(answer) {
      const have = toks(answer);
      this.rows.forEach((r) => { const m = r.need.filter((t) => hasTok(have, t)).length; r.got = r.need.length ? m >= Math.max(1, Math.ceil(r.need.length * 0.6)) : false; });
      return this.rows.filter((r) => r.got).length / this.rows.length >= 0.7;
    },
    regrade() { return this.rows.filter((r) => r.got).length / this.rows.length >= 0.7; }
  });
  const mkSection = (e, si) => {
    const sec = e.sections[si];
    const pass = sec.atoms.filter((a) => a.tier === "pass");
    const counted = pass.length ? pass : sec.atoms;
    return {
      type: "section", e, secs: 90, box: true, heading: sec.h,
      prompt: `Write everything that goes under “${sec.h}”.`,
      rows: sec.atoms.map((a) => ({ text: a.s, atom: a, tier: a.tier })),
      grade(answer) {
        const T = tokenize(answer);
        this.rows.forEach((r) => { r.got = !!checkAtom(T, r.atom); });
        return this.regrade();
      },
      regrade() { return counted.filter((a) => this.rows.find((r) => r.atom === a).got).length / counted.length >= 0.7; }
    };
  };
  const gapWords = (link, keys, qt, ctx) => {
    const words = link.split(/\s+/), out = [];
    words.forEach((w, wi) => {
      const core = wordCore(w), ct = toks(core);
      if (!ct.length || /^(I|II|III|IV|V|VI)$/.test(core) || core.replace(/[^a-z]/gi, "").length < 4) return;
      if (!isKeyWord(core, keys)) return;
      if (ct.some((t) => qt.has(t) || ctx.has(t))) return;
      if (words.filter((x, i) => i !== wi && toks(wordCore(x)).join() === ct.join()).length) return;
      out.push({ wi, core });
    });
    return out;
  };
  const gapGrade = (answer, core) => {
    const need = toks(core).filter((t) => (t.length >= 2 || /\d/.test(t)) && !GREEK_NAMES.has(t));
    const have = toks(answer);
    if (!need.length) return false;
    if (have.join("") === toks(core).join("")) return true;
    return need.every((t) => hasTok(have, t));
  };
  const mkGap = (e, r) => {
    const links = chainLinks(e), keys = keyTokens(e.atoms), qt = qToks(e);
    const cands = [];
    links.forEach((link, li) => {
      const ctx = new Set([...toks(links[li - 1] || ""), ...toks(links[li + 1] || "")]);
      gapWords(link, keys, qt, ctx).forEach((g) => cands.push({ li, ...g }));
    });
    if (!cands.length) return null;
    const c = cands[Math.floor(r() * cands.length)];
    const words = links[c.li].split(/\s+/);
    const shown = (mark) => words.map((w, i) => {
      if (i !== c.wi) return esc(w);
      const core = wordCore(w), at = w.indexOf(core);
      return esc(w.slice(0, at)) + mark(core) + esc(w.slice(at + core.length));
    }).join(" ");
    return {
      type: "gap", e, secs: 15, box: false, answerText: c.core,
      prompt: "Fill the gap in the chain.",
      context: { before: links[c.li - 1] || null, after: links[c.li + 1] || null },
      html: shown(() => `<span class="blank" aria-label="gap"></span>`),
      reveal: (ok) => shown((core) => `<mark class="${ok ? "yes" : "no"}">${esc(core)}</mark>`),
      grade(answer) { return gapGrade(answer, c.core); }
    };
  };
  const linkTargets = (link, keys) => {
    const set = new Set();
    link.split(/\s+/).forEach((w) => {
      const core = wordCore(w);
      if (isKeyWord(core, keys)) toks(core).forEach((t) => { if ((t.length >= 3 || /\d/.test(t)) && !GREEK_NAMES.has(t)) set.add(t); });
    });
    if (!set.size) toks(link).forEach((t) => { if (t.length >= 5) set.add(t); });
    return [...set];
  };
  const mkNext = (e, r) => {
    const links = chainLinks(e), keys = keyTokens(e.atoms);
    if (links.length < 2) return null;
    const ks = [];
    for (let k = -1; k < links.length - 1; k++) if (linkTargets(links[k + 1], keys).length) ks.push(k);
    if (!ks.length) return null;
    const k = ks[Math.floor(r() * ks.length)];
    const target = links[k + 1], need = linkTargets(target, keys);
    return {
      type: "next", e, secs: 25, box: true,
      prompt: k < 0 ? "How does the chain start, right after the question?" : "What comes next in the chain?",
      context: { before2: k > 0 ? links[k - 1] : null, before: k >= 0 ? links[k] : null, after: links[k + 2] || null },
      target, need,
      grade(answer) {
        const have = toks(answer);
        this.hit = this.need.filter((t) => hasTok(have, t));
        return this.hit.length >= Math.max(1, Math.ceil(this.need.length * 0.5));
      }
    };
  };
  const mkWhich = (pool, r) => {
    const opts = [];
    pool.forEach((e) => {
      const keys = keyTokens(e.atoms), qt = qToks(e);
      chainLinks(e).forEach((l) => {
        const kt = linkTargets(l, keys);
        if (!isPW(e) && kt.length >= 2 && !toks(l).some((t) => qt.has(t))) opts.push({ e, l });
      });
    });
    if (!opts.length) return null;
    const o = opts[Math.floor(r() * opts.length)];
    return {
      type: "which", e: o.e, secs: 15, box: false, link: o.l,
      prompt: "Which essay does this belong to? Type its number.",
      grade(answer) { return parseInt(String(answer).replace(/\D+/g, ""), 10) === o.e.id; }
    };
  };

  const buildReview = (salt, exclude) => {
    const t = today(), skip = new Set(exclude || []);
    const pool = reviewPool().filter((e) => !skip.has(e.id));
    if (!pool.length) return [];
    const r = rng(`${t}:${user ? user.id : "guest"}:${salt}`);
    const chosen = pool.map((e) => ({ e, p: reviewPriority(e) + r() * 0.5 }))
      .sort((a, b) => b.p - a.p).slice(0, 6).map((x) => x.e);
    const per = Math.max(2, Math.min(4, Math.ceil(8 / chosen.length)));
    const day = diff("2026-01-01", t);
    const first = [], rest = [];
    chosen.forEach((e) => {
      first.push(mkSkeleton(e));
      let kinds = ["gap", "next", "section"];
      const start = (day + e.id) % 3;
      kinds = [...kinds.slice(start), ...kinds.slice(0, start)].slice(0, per - 1);
      if (isWeak(e) && !kinds.includes("section")) kinds[kinds.length - 1] = "section";
      kinds.forEach((k) => {
        const it = k === "gap" ? mkGap(e, r) : k === "next" ? mkNext(e, r) : mkSection(e, (day + e.id + rest.length) % e.sections.length);
        if (it) rest.push(it);
      });
    });
    if (reviewPool().length >= 3) { const w = mkWhich(reviewPool(), r); if (w) rest.push(w); }
    // interleave: no two questions from the same essay back to back where possible
    let mixed = shuffle(rest, r);
    for (let i = 1; i < mixed.length; i++) {
      if (mixed[i].e.id === mixed[i - 1].e.id) {
        const j = mixed.findIndex((x, n) => n > i && x.e.id !== mixed[i - 1].e.id);
        if (j > 0) [mixed[i], mixed[j]] = [mixed[j], mixed[i]];
      }
    }
    return [...shuffle(first, r), ...mixed];
  };
  const streak = () => streakOf(S, today());
  const minutes = (items) => Math.max(1, Math.round(items.reduce((s, it) => s + it.secs, 0) / 60));
  const essayList = (ids) => ids.map((id) => "Q" + id).join(", ");

  const dailyPanel = () => {
    const pool = reviewPool(), t = today(), rec = S.quiz.days[t], st = streak();
    const streakHTML = st ? `<p class="streak"><span>${st}</span> ${st === 1 ? "day" : "days"} in a row</p>` : "";
    if (!pool.length) {
      const todayOnly = [...C.essays, ...PWS].filter((e) => learnedOn(e.id) === t);
      return `
        <section class="panel daily">
          <div class="daily-head"><h2>Daily review</h2>${streakHTML}</div>
          <p class="empty">${todayOnly.length
            ? `You learned ${essayList(todayOnly.map((e) => e.id))} today. Its first daily review is tomorrow: a night’s sleep in between makes the review count more.`
            : "Starts the day after you learn your first essay. Learned one already? Press “Already learned” next to it in the list."}</p>
        </section>`;
    }
    if (rec && rec.done) {
      const left = pool.filter((e) => !rec.essays.includes(e.id));
      return `
        <section class="panel daily done">
          <div class="daily-head"><h2>Daily review</h2>${streakHTML}</div>
          <p>Done for today: ${rec.first} of ${rec.n} right first time, on ${essayList(rec.essays)}.</p>
          ${left.length ? `<div class="actions"><a class="btn ghost" href="#/daily/more">Review ${left.length} more ${left.length === 1 ? "essay" : "essays"}</a></div>` : ""}
        </section>`;
    }
    const items = buildReview(0, []);
    const ids = [...new Set(items.map((it) => it.e.id))].sort((a, b) => a - b);
    return `
      <section class="panel daily">
        <div class="daily-head"><h2>Daily review</h2>${streakHTML}</div>
        <p>${items.length} quick questions on ${essayList(ids)}, everything you’ve learned. About ${minutes(items)} minutes. Type your answers; no multiple choice.</p>
        <div class="actions"><a class="btn" href="#/daily">Start daily review</a></div>
      </section>`;
  };

  const viewDaily = (more) => {
    const t = today();
    const done = (S.quiz.days[t] && S.quiz.days[t].essays) || [];
    const items = buildReview(more ? 1 + Object.keys(S.quiz.days).length : 0, more ? done : []);
    if (!items.length) {
      app.innerHTML = `${topbar()}<main class="wrap narrow"><h1 class="page-title">Daily review</h1>
        <p class="lede">Nothing to review yet. Your daily review starts the day after you learn your first essay.</p>
        <div class="actions"><a class="btn" href="#/">Back to today</a></div></main>${footer()}`;
      return;
    }
    const queue = items.map((it, i) => ({ it, i, retry: false }));
    const first = {};
    let pos = 0, cur = null;

    const cueHTML = (e) => `<p class="cue-line"><span>${qn(e)}</span> ${esc(e.q)}</p>`;
    const flow = (parts) => parts.filter((p) => p != null).join(`<span class="chain-arrow" aria-hidden="true">→</span>`);
    const body = (it) => {
      if (it.type === "gap") return `<p class="qflow">${flow([it.context.before ? `<span class="dim">${esc(it.context.before)}</span>` : `<span class="dim">${esc(it.e.q.replace(/\.$/, ""))}</span>`, it.html, it.context.after ? `<span class="dim">${esc(it.context.after)}</span>` : null])}</p>`;
      if (it.type === "next") return `<p class="qflow">${flow([it.context.before2 ? `<span class="dim">${esc(it.context.before2)}</span>` : null, it.context.before ? esc(it.context.before) : `<span class="dim">${esc(it.e.q.replace(/\.$/, ""))}</span>`, `<span class="blank wide" aria-label="next link"></span>`])}</p>`;
      if (it.type === "which") return `<blockquote class="qquote">${esc(it.link)}</blockquote>`;
      return "";
    };
    const feedback = (it, ok) => {
      const head = `<p class="fb-head">${ok ? "Right." : "Not quite."}</p>`;
      if (it.type === "gap") return head + `<p class="qflow">${it.reveal(ok)}</p>`;
      if (it.type === "which") return head + `<p>It’s <strong>${qn(it.e)}</strong>: ${esc(it.e.q)}</p>`;
      if (it.type === "next") {
        const marked = it.target.split(/\s+/).map((w) => {
          const core = wordCore(w), tk = toks(core).filter((x) => it.need.includes(x));
          if (!tk.length) return esc(w);
          const at = w.indexOf(core);
          return esc(w.slice(0, at)) + `<mark class="${tk.every((x) => it.hit.includes(x)) ? "yes" : "no"}">${esc(core)}</mark>` + esc(w.slice(at + core.length));
        }).join(" ");
        return head + `<p class="qflow"><span class="chain-arrow" aria-hidden="true">→</span>${marked}${it.context.after ? `<span class="chain-arrow" aria-hidden="true">→</span><span class="dim">${esc(it.context.after)}</span>` : ""}</p>`;
      }
      const got = it.rows.filter((r) => r.got).length;
      const label = it.type === "skeleton" ? `${got} of ${it.rows.length} sections` : `${it.rows.filter((r) => r.got && r.tier === "pass").length} of ${it.rows.filter((r) => r.tier === "pass").length} pass points`;
      return `<p class="fb-head">${ok ? "Right." : "Not quite."} <span class="fb-count">${label}</span></p>
        <p class="hint">Tap a line if the check missed something you did write.</p>
        <ul class="atoms learn-check">${it.rows.map((r, ri) => `
          <li><button class="check-row ${r.got ? "got" : "missed"} tier-${r.tier || "pass"}" data-row="${ri}" aria-pressed="${!!r.got}">
            <span class="mark" aria-hidden="true">${r.got ? "✓" : r.tier === "boost" ? "○" : "⊗"}</span>
            <span class="atom-body"><span class="atom-text"><span class="hl">${esc(r.text)}</span></span>${it.type === "section" ? `<span class="src">${r.tier === "boost" ? "Boost" : "Pass"}</span>` : ""}</span>
          </button></li>`).join("")}</ul>`;
    };

    const render = () => {
      if (pos >= queue.length) return finish();
      cur = { q: queue[pos], checked: false, ok: false };
      const it = cur.q.it;
      const total = items.length, n = Math.min(pos + 1, total);
      app.innerHTML = `
        ${topbar()}
        <main class="wrap narrow daily-page">
          <p class="meta">${cur.q.retry ? `Second go: you missed this one earlier. ${queue.length - pos} left.` : `Daily review, question ${n} of ${total}.`}</p>
          <ol class="steps" aria-hidden="true">${queue.map((_, i) => `<li class="${i < pos ? "done" : i === pos ? "now" : ""}"></li>`).join("")}</ol>
          <section class="qcard">
            ${it.type === "which" ? "" : cueHTML(it.e)}
            <h1 class="qprompt">${esc(it.prompt)}</h1>
            ${body(it)}
            <label class="sr" for="qans">Your answer</label>
            ${it.box
              ? `<textarea id="qans" class="answer-box short" spellcheck="false" autocomplete="off" placeholder="${it.type === "section" ? "Everything you remember, any order. Tab types an arrow." : "Your answer"}"></textarea>`
              : `<input id="qans" class="quiz-input" ${it.type === "which" ? 'inputmode="numeric"' : ""} spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="${it.type === "which" ? "Essay number" : "The missing word"}">`}
            <div class="actions" id="qact">
              <button class="btn" data-q="check">Check</button>
              <button class="btn ghost" data-q="skip">I don’t know</button>
            </div>
            <div id="qfb" class="qfb" hidden></div>
          </section>
          <p class="kbd-hint">${it.box ? "Ctrl + Enter checks." : "Enter checks."} Enter again goes to the next question.</p>
        </main>`;
      const a = document.getElementById("qans");
      a.focus();
      a.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" && (!it.box || ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); check(false); }
      });
    };
    const showFeedback = () => {
      const it = cur.q.it, fb = document.getElementById("qfb");
      fb.hidden = false;
      fb.className = "qfb " + (cur.ok ? "ok" : "miss");
      const flip = it.type === "gap" || it.type === "next" || it.type === "which";
      fb.innerHTML = feedback(it, cur.ok) + `
        <div class="actions">
          <button class="btn" data-q="next">${pos + 1 >= queue.length && (cur.ok || cur.q.retry) ? "Finish" : "Next"}</button>
          ${flip ? `<button class="btn ghost" data-q="flip">${cur.ok ? "Count it as wrong" : "I was right"}</button>` : ""}
        </div>`;
      document.getElementById("qact").hidden = true;
      fb.querySelector("[data-q=next]").focus({ preventScroll: true });
    };
    const check = (skip) => {
      if (!cur || cur.checked) return;
      const it = cur.q.it, a = document.getElementById("qans");
      cur.checked = true;
      if (skip) { if (it.rows) it.rows.forEach((r) => { r.got = false; }); cur.ok = false; }
      else cur.ok = it.grade(a.value);
      a.readOnly = true;
      showFeedback();
    };
    const next = () => {
      const it = cur.q.it;
      if (!cur.q.retry) first[cur.q.i] = cur.ok;
      if (!cur.ok && !cur.q.retry) queue.push({ it: Object.assign(Object.create(Object.getPrototypeOf(it)), it, { rows: it.rows ? it.rows.map((r) => Object.assign({}, r, { got: false })) : undefined }), i: cur.q.i, retry: true });
      pos++;
      window.scrollTo(0, 0);
      render();
    };

    const finish = () => {
      const per = {};
      items.forEach((it, i) => { const p = (per[it.e.id] = per[it.e.id] || { n: 0, ok: 0 }); p.n++; if (first[i]) p.ok++; });
      const firstOK = items.filter((_, i) => first[i]).length;
      const moved = [];
      Object.keys(per).forEach((id) => {
        const p = per[id], score = p.ok / p.n;
        S.quiz.last[id] = { d: t, score };
        if (score < 0.6 && (!S.due[id] || diff(t, S.due[id]) > 1)) { S.due[id] = addDays(t, 1); moved.push(Number(id)); }
      });
      const rec = S.quiz.days[t] || { done: true, n: 0, first: 0, essays: [] };
      rec.done = true; rec.n += items.length; rec.first += firstOK;
      rec.essays = [...new Set([...rec.essays, ...Object.keys(per).map(Number)])];
      S.quiz.days[t] = rec;
      S.xp = (S.xp || 0) + firstOK * 10;
      dayLog().xp = (dayLog().xp || 0) + firstOK * 10;
      logEvent("daily", 0, `${firstOK}/${items.length}`);
      const st = streak();
      const left = reviewPool().filter((e) => !rec.essays.includes(e.id));
      app.innerHTML = `
        ${topbar()}
        <main class="wrap narrow daily-page">
          <h1 class="page-title">Done for today</h1>
          <p class="lede">${firstOK} of ${items.length} right first time, +${firstOK * 10} XP.${st ? ` ${st} ${st === 1 ? "day" : "days"} in a row.` : ""}</p>
          <ul class="daily-sum">${Object.keys(per).map((id) => {
            const p = per[id], e = E[id];
            return `<li><span class="ds-q"><b>${qn(e)}</b> ${esc(e.q)}</span><span class="ds-bar" aria-hidden="true"><i style="width:${Math.round((100 * p.ok) / p.n)}%"></i></span><span class="ds-n">${p.ok} of ${p.n}</span></li>`;
          }).join("")}</ul>
          ${moved.length ? `<p class="callout">${essayList(moved)} ${moved.length === 1 ? "was" : "were"} weak today, so the full recall moves to tomorrow.</p>` : ""}
          <p class="hint">Everything you missed came back once at the end. Tomorrow’s review mixes in new angles on the same essays.${user ? "" : " You’re a guest, so this isn’t saved."}</p>
          <div class="actions">
            <a class="btn" href="#/">Back to today</a>
            ${left.length ? `<a class="btn ghost" href="#/daily/more">Review ${left.length} more ${left.length === 1 ? "essay" : "essays"}</a>` : ""}
          </div>
        </main>
        ${footer()}`;
    };

    app.onclick = (ev) => {
      if (!app.querySelector(".daily-page") || !cur) return;
      const b = ev.target.closest("[data-q], [data-row]");
      if (!b) return;
      const it = cur.q.it;
      if (b.dataset.row != null && cur.checked && it.rows) {
        const r = it.rows[Number(b.dataset.row)];
        r.got = !r.got;
        cur.ok = it.regrade();
        const y = window.scrollY; showFeedback(); window.scrollTo(0, y);
        return;
      }
      const act = b.dataset.q;
      if (act === "check") check(false);
      else if (act === "skip") check(true);
      else if (act === "flip") { cur.ok = !cur.ok; showFeedback(); }
      else if (act === "next") next();
    };
    render();
  };

  /* ---------- play: three short games per essay ----------
     1. Build the chain: pick the right next link out of three (learn the order by playing it).
     2. Gap rush: 90 seconds, type the missing key terms (production, against the clock).
     3. Boss fight: write the essay; every point you recall hits the boss live. */
  const SOUND_KEY = "essayjar:sound";
  const soundOn = () => store.get(SOUND_KEY) !== "off";
  const blip = (kind) => {
    if (!soundOn()) return;
    try {
      wakeAudio();
      if (!audio) return;
      const t0 = audio.currentTime;
      const notes = kind === "good" ? [[523, 0], [784, 0.07]] : kind === "hit" ? [[660, 0], [990, 0.06]]
        : kind === "win" ? [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.3]] : [[196, 0], [147, 0.09]];
      notes.forEach(([f, t]) => {
        const o = audio.createOscillator(), g = audio.createGain();
        o.type = kind === "bad" ? "triangle" : "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0 + t);
        g.gain.exponentialRampToValueAtTime(0.1, t0 + t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + t + (kind === "win" ? 0.35 : 0.18));
        o.connect(g); g.connect(audio.destination);
        o.start(t0 + t); o.stop(t0 + t + 0.4);
      });
    } catch (e) { /* sound is optional */ }
  };
  let gameTick = null, gameKey = null;
  document.addEventListener("keydown", (ev) => { if (gameKey) gameKey(ev); });
  const stopGame = () => { clearInterval(gameTick); gameTick = null; gameKey = null; };

  const addXP = (n) => { const x = Math.max(0, Math.round(n)); S.xp = (S.xp || 0) + x; const d = dayLog(); d.xp = (d.xp || 0) + x; save(); };
  const levelOf = (xp) => {
    let lvl = 1, need = 100, left = xp || 0;
    while (left >= need) { left -= need; lvl++; need = 100 + (lvl - 1) * 50; }
    return { lvl, into: left, need };
  };
  const setStars = (id, game, stars, score) => {
    const r = (S.play[id] = S.play[id] || {});
    const prev = r[game] || { stars: 0, best: 0 };
    r[game] = { stars: Math.max(prev.stars, stars), best: Math.max(prev.best, score || 0) };
    save();
    return prev;
  };
  const starsHTML = (n, of = 3) => `<span class="stars" aria-label="${n} of ${of} stars">${"★".repeat(n)}<span class="off">${"★".repeat(Math.max(0, of - n))}</span></span>`;
  const isDown = (id) => !!(S.play[id] && S.play[id].boss && S.play[id].boss.stars >= 3);
  const bossCard = (e) => {
    const b = window.bossFor(e.id), st = status(e.id), n = essayStars(e.id), down = isDown(e.id);
    return `
      <li class="bcard st-${st}${down ? " down" : ""}">
        <a href="#/play/${e.id}">
          <span class="bc-art">${window.bossSVG(e.id)}${down ? `<span class="bc-stamp">Defeated</span>` : ""}</span>
          <span class="bc-text">
            <span class="bc-top"><b>${qn(e)}</b>${esc(b.name)}</span>
            <span class="bc-q">${esc(e.q)}</span>
            <span class="bc-meta"><span class="bc-stars">★ ${n} of 9</span><span>${down ? "Defeated" : LABEL[st]}</span></span>
          </span>
        </a>
      </li>`;
  };
  const essayStars = (id) => ["build", "gaps", "boss"].reduce((s, g) => s + ((S.play[id] && S.play[id][g] && S.play[id][g].stars) || 0), 0);

  const GAMES = [
    { id: "build", name: "Build the chain", what: "Say each next step in your own words before you see any options. Recalled steps are critical hits. Stuck? You get three jumbled-keyword options instead.", time: "about 4 minutes" },
    { id: "gaps", name: "Gap rush", what: "90 seconds against the clock. Type the missing key term in each link. Streaks multiply your points.", time: "90 seconds" },
    { id: "boss", name: "Boss fight", what: "Write the essay from the question alone. Every point you remember hits the boss, live, as you type.", time: "about 5 minutes" }
  ];
  const viewPlay = (e) => {
    const rec = S.play[e.id] || {};
    const nextUp = GAMES.find((g) => !(rec[g.id] && rec[g.id].stars));
    app.innerHTML = `
      ${topbar()}
      <main class="wrap play-hub">
        ${guestNotice()}
        <section class="hub-head">
          <div class="hub-art${isDown(e.id) ? " down" : ""}">${window.bossSVG(e.id)}${isDown(e.id) ? `<span class="bc-stamp">Defeated</span>` : ""}</div>
          <div class="hub-text">
            <p class="hub-boss"><b>${esc(window.bossFor(e.id).name)}</b>${esc(window.bossFor(e.id).title)}</p>
            <h1 class="question">${esc(e.q)}</h1>
            <p class="meta">${en(e)}. ${isDown(e.id) ? "Defeated. Play again any time to keep it sharp." : "Three games, easiest first. Weaken it, then finish it in the boss fight."} ${essayStars(e.id)} of 9 stars.</p>
          </div>
        </section>
        ${isLearned(e.id) ? "" : `
        <a class="learn-first" href="#/learn/${e.id}">
          <span class="lf1-n" aria-hidden="true">1</span>
          <span class="lf1-body"><b>Learn it first, about ${Math.round(learnPlan(e).total / 60)} minutes</b><span>Read each part, explain it from memory, fix what you missed. Every step is timed. Then the games below make it stick.</span></span>
          <span class="btn">Start</span>
        </a>`}
        <ol class="levels">${GAMES.map((g, i) => {
          const r = rec[g.id], up = nextUp && nextUp.id === g.id;
          return `
          <li class="level${up ? " up" : ""}${r && r.stars ? " done" : ""}">
            <span class="lv-n" aria-hidden="true">${i + 1}</span>
            <div class="lv-body">
              <h2>${g.name}</h2>
              <p>${g.what}</p>
              <p class="lv-meta">${starsHTML(r ? r.stars : 0)}<span>${g.time}${r && r.best ? `, best ${r.best}` : ""}</span></p>
            </div>
            <a class="btn${up ? "" : " ghost"}" href="${g.id === "boss" ? `#/boss/${e.id}` : `#/game/${g.id}/${e.id}`}">${r && r.stars ? "Play again" : "Play"}</a>
          </li>`;
        }).join("")}</ol>
        <p class="hint">${isLearned(e.id) ? `Want to go through it properly again? <a href="#/learn/${e.id}">Learn it in one hour</a> or <a href="#/study/${e.id}">open the notes</a>.` : `Or just <a href="#/study/${e.id}">open the notes</a>.`}</p>
      </main>
      ${footer()}`;
  };

  const gameShell = (e, hud, keys) => `
    ${topbar()}
    <main class="wrap game-page">
      <div class="game">
        <div class="g-top">
          <p class="et-cue"><span class="et-qnum">${qn(e)}</span><span class="et-qtext">${esc(e.q)}</span></p>
          <div class="g-hud">${hud}<button type="button" class="g-sound" data-g="sound" aria-pressed="${soundOn()}">${soundOn() ? "sound on" : "sound off"}</button></div>
        </div>
        <div class="g-arena"></div>
        <div class="g-bar" aria-hidden="true"><i></i></div>
        <div class="g-stage"></div>
        <p class="et-keys">${keys}<a class="g-quit" href="#/play/${e.id}">quit</a></p>
      </div>
    </main>`;
  const attackKind = (combo) => (combo >= 10 ? "bolt" : combo >= 5 ? "fireball" : "arrow");
  const floatPts = (el, txt, cls) => {
    const f = document.createElement("span");
    f.className = "g-float" + (cls ? " " + cls : "");
    f.textContent = txt;
    el.appendChild(f);
    setTimeout(() => f.remove(), 950);
  };
  const resultsHTML = (o) => `
    <div class="g-res">
      <p class="g-res-title">${esc(o.title)}</p>
      <p class="g-stars">${starsHTML(o.stars)}${o.stars > o.prevStars && o.prevStars ? `<span class="g-new">new best</span>` : ""}</p>
      <dl class="et-stats">${o.stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
      ${o.note ? `<p class="et-note">${esc(o.note)}</p>` : ""}
      ${o.missed && o.missed.length ? `<div class="g-missed"><p>Read these once more:</p><ul>${o.missed.map((m) => `<li>${m}</li>`).join("")}</ul></div>` : ""}
      <div class="g-actions">
        ${o.next ? `<a class="g-btn main" href="${o.next.href}">${o.next.label}</a>` : ""}
        <button type="button" class="g-btn" data-g="again">Play again</button>
        <a class="g-btn" href="#/play/${o.id}">All games</a>
      </div>
    </div>`;
  const gameClicks = (e, extra) => (ev) => {
    const b = ev.target.closest("[data-g]");
    if (!b) return extra && extra(ev);
    if (b.dataset.g === "sound") {
      store.set(SOUND_KEY, soundOn() ? "off" : "on");
      b.setAttribute("aria-pressed", String(soundOn()));
      b.textContent = soundOn() ? "sound on" : "sound off";
      if (soundOn()) blip("good");
    } else if (b.dataset.g === "again") route();
  };

  // ---- 1. Build the chain ----
  // Each link: say it first (type key words), and only then see options.
  // Options show jumbled key terms, not the sentence, so you can't recognise wording.
  const CALL_STOP = new Set(["about", "each", "only", "than", "that", "them", "they", "with", "from", "into", "over",
    "using", "uses", "used", "make", "made", "makes", "gets", "have", "has", "does", "their", "this", "these", "those",
    "such", "like", "both", "more", "less", "then", "when", "which", "what", "goes", "comes", "work", "works", "best",
    "keep", "keeps", "send", "sends", "small", "short", "whole", "last", "first", "also", "there", "where", "here",
    "most", "some", "very", "just", "body", "bits", "part", "parts", "turns", "turned", "becomes", "become", "called",
    "gives", "give", "takes", "take", "come", "out", "for", "and", "the", "are", "its", "via", "not", "all", "can"]);
  const keyWordsOf = (link) => {
    const seen = new Set(), out = [];
    link.split(/\s+/).forEach((raw, pos) => {
      const w = raw.replace(/^[(\[“"']+|[)\],.;:!?”"']+$/g, "");
      const c = clean(w).split(" ").filter(Boolean);
      if (!c.length) return;
      if (!c.some((t) => (t.length >= 4 || /\d/.test(t)) && !CALL_STOP.has(t))) return;
      const k = c.join(" ");
      if (seen.has(k)) return;
      seen.add(k); out.push({ raw: w, pos, brk: /[,;:)\]]$/.test(raw), open: /^[(\[]/.test(raw), toks: c.filter((t) => (t.length >= 4 || /\d/.test(t)) && !CALL_STOP.has(t)) });
    });
    return out;
  };
  const typedHits = (typed, keys) => {
    const T = clean(typed).split(" ").filter(Boolean);
    return keys.filter((k) => k.toks.some((a) => T.some((w) => wordMatch(w, a) || (w.length >= 4 && a.startsWith(w)) || (/\d/.test(a) && w === a))));
  };
  // Start points inside each chain (index into chainLinks), so you can skip what you already know.
  // Key words of one chain link, minus words given away by the question (and the link above, if given).
  // Words next to each other ("released amino acids") count as one idea.
  const linkKeys = (link, prevLink, qt) => {
    const prev = new Set(toks(prevLink || ""));
    const ks = keyWordsOf(link).map((k) => ({ ...k, toks: k.toks.filter((t) => !prev.has(t) && !qt.has(t)) })).filter((k) => k.toks.length);
    let g = -1, last = -9, brk = false;
    ks.forEach((k) => { if (k.pos !== last + 1 || brk || k.open) g++; k.idea = g; last = k.pos; brk = k.brk; });
    return ks;
  };
  const ideaCount = (ks) => new Set(ks.map((k) => k.idea)).size;
  const CHECKPOINTS = {
    1: [[0, "Mouth and stomach"], [11, "Small intestine"], [19, "Absorption"], [21, "Fate of the amino acids"]],
    2: [[0, "Why the cell destroys its own proteins"], [6, "1. Lysosomes"], [11, "2. Ubiquitin–proteasome system"]],
    3: [[0, "Transamination and PLP"], [8, "ALT"], [13, "AST"], [18, "Link to deamination"]],
    4: [[0, "Overview and amino acid oxidases"], [10, "Glutamate dehydrogenase"], [15, "Transdeamination"], [20, "Non-oxidative deamination"]],
    5: [[0, "Synthesis of serotonin"], [7, "Roles of serotonin"], [10, "Synthesis of melatonin"], [15, "Regulation and roles of melatonin"]],
    6: [[0, "Synthesis"], [11, "Roles of each"], [15, "Degradation"], [18, "Parkinson’s disease"]],
    7: [[0, "Sources of NH₃"], [7, "Levels and hyperammonemia"], [10, "Why NH₃ is toxic"]],
    8: [[0, "Glutamate"], [10, "Glutamine"], [22, "Glucose–alanine cycle"]],
    9: [[0, "Urea cycle"], [17, "Aspartate–argininosuccinate shunt"], [27, "Regulation and clinical"]],
    10: [[0, "Normal pathway"], [18, "Phenylketonuria"], [29, "Tyrosine disorders"]],
    11: [[0, "Pathway"], [18, "Regulation"], [26, "Factors that stimulate heme synthesis"]],
    12: [[0, "General"], [4, "Symptoms by what piles up"], [12, "Enzyme → porphyria"]],
    13: [[0, "Absorption"], [9, "Transport and uptake"], [12, "Storage and use"], [16, "Regulation"], [23, "Clinical"]],
    14: [[0, "Formation"], [12, "Transport to the liver"], [17, "Conjugation"]],
    15: [[0, "Secretion into bile"], [4, "In the intestine"], [13, "Enterohepatic cycle and urine"]],
    16: [[0, "Basics"], [4, "Hemolytic"], [11, "Parenchymal"], [16, "Obstructive"], [22, "Neonatal"], [27, "Hereditary forms"]],
    17: [[0, "Pathway"], [15, "Regulation"]],
    18: [[0, "Breakdown to uric acid"], [15, "Gout"], [24, "Lesch–Nyhan syndrome"], [27, "Immunodeficiencies and others"]],
    19: [[0, "Ribonucleotide reductase"], [6, "Regulation"], [18, "Synthesis of dTMP"]],
    20: [[0, "Pathway"], [18, "Orotic aciduria"], [25, "Other clinical links"]],
    101: [[0, "Phenylalanine → tyrosine"], [3, "Tyrosine → homogentisate"], [7, "Ring cleavage → fumarate"], [14, "Glucogenic and ketogenic, PKU"]],
    102: [[0, "Mitochondria"], [5, "Cytosol"], [13, "Nitrogens, cost and the shunt"]],
    103: [[0, "Building the ring"], [8, "Adding ribose: OMP → UMP"], [15, "UTP and CTP"], [21, "dTMP for DNA"]],
    104: [[0, "Nucleotides → nucleosides"], [5, "Bases → xanthine"], [10, "Uric acid"]],
    105: [[0, "Mitochondria: ALA"], [3, "Cytosol: PBG → coproporphyrinogen"], [11, "Back in mitochondria → heme"]]
  };
  const startsOf = (e) => (CHECKPOINTS[e.id] || []).filter(([i]) => i < chainLinks(e).length);

  const viewBuild = (e) => {
    const links = chainLinks(e);
    const r = rng(`${e.id}:${Date.now()}`);
    const others = C.essays.filter((x) => x.id !== e.id).flatMap((x) => chainLinks(x));
    const qt = qToks(e);
    const st = { i: 0, from: 0, combo: 0, best: 0, score: 0, miss: 0, lock: false, missed: [], opts: [], phase: "call", recalled: 0, callable: 0, got: [] };
    app.innerHTML = gameShell(e,
      `<span class="g-stat"><b class="g-score">0</b> pts</span><span class="g-stat g-combo"></span>`,
      `<span class="b-keys-call"><kbd>enter</kbd> check <kbd>tab</kbd> I'm stuck</span><span class="b-keys-pick" hidden><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> pick</span><span>say it before you see it: recalled steps are critical hits</span>`);
    const stage = app.querySelector(".g-stage"), bar = app.querySelector(".g-bar i");
    const arena = window.mountArena(app.querySelector(".g-arena"), e.id, {});
    // Key words you must produce: skip words given away by the question or the link just above.
    const callKeys = (i) => linkKeys(links[i], links[i - 1], qt);
    const jumble = (link) => {
      const kw = keyWordsOf(link).map((k) => k.raw);
      return (kw.length ? shuffle(kw, r) : [link]).join("  ·  ");
    };
    const options = (i) => {
      const right = links[i];
      const near = links.slice(i + 1, i + 6).filter((l) => l !== right);
      const far = links.filter((l, j) => j < i - 1 && l !== right);
      const d1 = near.length ? near[Math.floor(r() * near.length)] : far[Math.floor(r() * far.length)];
      const pool = others.filter((l) => l !== right && l !== d1);
      const d2 = pool[Math.floor(r() * pool.length)];
      return shuffle([right, d1, d2].filter(Boolean), r).map((l) => ({ link: l, show: jumble(l) }));
    };
    const hud = () => {
      app.querySelector(".g-score").textContent = st.score;
      app.querySelector(".g-combo").textContent = st.combo >= 2 ? `streak ×${Math.min(st.combo, 10)}` : "";
      bar.style.width = `${(100 * st.i) / links.length}%`;
      if (st.phase === "choose") bar.style.width = "0%";
      const call = st.phase === "call";
      if (st.phase === "choose") { app.querySelector(".b-keys-call").hidden = true; app.querySelector(".b-keys-pick").hidden = true; return; }
      app.querySelector(".b-keys-call").hidden = !call;
      app.querySelector(".b-keys-pick").hidden = call;
    };
    const render = () => {
      const done = links.slice(0, st.i), shown = done.slice(-3);
      const call = st.phase === "call";
      stage.innerHTML = `
        <div class="b-chain">
          ${done.length > 3 ? `<p class="b-more">${done.length - 3} links above</p>` : `<p class="b-link b-q">${esc(e.q.replace(/\.$/, ""))}</p>`}
          ${shown.map((l, k) => `${done.length > 3 && k === 0 ? "" : `<span class="b-arrow" aria-hidden="true">↓</span>`}<p class="b-link${k === shown.length - 1 ? " last" : ""}">${esc(l)}</p>`).join("")}
          <span class="b-arrow" aria-hidden="true">↓</span>
          <p class="b-slot">${call ? "Say the next step in your own words" : "Which idea comes next?"} <span>${st.i + 1} of ${links.length}</span></p>
        </div>
        ${call ? `
        <form class="b-call" autocomplete="off">
          <input class="b-in" type="text" placeholder="key words, any order, e.g. lysosome pH 5" aria-label="Next step in your own words" autocapitalize="off" spellcheck="false">
          <button type="submit" class="g-btn main">Check</button>
          <button type="button" class="g-btn" data-stuck>I'm stuck</button>
        </form>
        ${st.got.length ? `<p class="b-near">You had: ${st.got.map((g) => `<mark>${esc(g)}</mark>`).join(" ")}. One more key idea.</p>` : ""}` : `
        <div class="b-cards">${st.opts.map((o, k) => `<button type="button" class="b-card" data-pick="${k}"><span class="b-key">${k + 1}</span><span>${esc(o.show)}</span></button>`).join("")}</div>`}`;
      const inp = stage.querySelector(".b-in");
      if (inp) inp.focus({ preventScroll: true });
    };
    const choose = () => {
      st.phase = "choose";
      const pts = startsOf(e);
      stage.innerHTML = `
        <div class="b-from">
          <p class="b-from-h">Where do you want to start?</p>
          <p class="b-from-sub">Skip the parts you already know. The steps before your start point stay on screen as a reminder.</p>
          <div class="b-from-list">${pts.map(([i, label], k) => `<button type="button" class="b-from-btn${k ? "" : " first"}" data-from="${i}"><span class="b-key">${k + 1}</span><span class="b-from-l">${esc(k ? label : "From the start")}${k ? "" : `<small>${esc(label)} · full run, earns stars</small>`}</span><span class="b-from-n">${k ? `step ${i + 1} of ${links.length}` : `${links.length} steps`}</span></button>`).join("")}</div>
        </div>`;
      hud();
      const f = stage.querySelector(".b-from-btn"); if (f) f.focus({ preventScroll: true });
    };
    const begin = (from) => {
      st.i = st.from = Math.max(0, Math.min(from, links.length - 1));
      startLink();
    };
    const startLink = () => {
      st.lock = false; st.got = []; st.tries = 0;
      st.keys = callKeys(st.i);
      st.phase = st.keys.length ? "call" : "pick";
      if (st.phase === "call") st.callable++;
      st.opts = options(st.i);
      render(); hud();
    };
    const advance = () => {
      if (!stage.isConnected) return;
      st.i++;
      if (st.i >= links.length) return end();
      startLink();
    };
    const toPick = () => { st.phase = "pick"; render(); hud(); };
    const showFull = (cls) => {
      const slot = stage.querySelector(".b-slot");
      if (slot) { slot.className = "b-link b-reveal " + cls; slot.textContent = links[st.i]; }
    };
    const check = (typed) => {
      if (st.lock) return;
      if (!typed.trim()) return toPick();
      const hits = typedHits(typed, st.keys);
      const need = Math.min(2, ideaCount(st.keys));
      if (ideaCount(hits) >= need) {
        st.lock = true;
        st.combo++; st.best = Math.max(st.best, st.combo); st.recalled++;
        const pts = 20 * Math.min(st.combo, 10);
        st.score += pts;
        arena.attack(st.combo >= 5 ? attackKind(st.combo) : "fireball", "crit +" + pts);
        blip("good");
        stage.querySelector(".b-call").remove();
        const nr = stage.querySelector(".b-near"); if (nr) nr.remove();
        showFull("good");
        hud();
        setTimeout(advance, 1300);
      } else {
        st.tries++;
        st.got = [...new Set([...st.got, ...hits.map((h) => h.raw)])];
        if (st.tries >= 2 || !hits.length) { blip("bad"); return toPick(); }
        render();
      }
    };
    const pick = (k) => {
      if (st.phase !== "pick" || st.lock || !st.opts[k]) return;
      st.lock = true;
      const right = links[st.i], btns = [...stage.querySelectorAll(".b-card")];
      const ri = st.opts.findIndex((o) => o.link === right);
      if (k === ri) {
        st.combo++; st.best = Math.max(st.best, st.combo);
        const pts = 5 * Math.min(st.combo, 10);
        st.score += pts;
        btns[k].classList.add("right");
        arena.attack(attackKind(st.combo), "+" + pts);
        blip("good");
      } else {
        st.combo = 0; st.miss++;
        st.missed.push(right);
        btns[k].classList.add("wrong");
        btns[ri].classList.add("right", "reveal");
        arena.taunt();
        blip("bad");
      }
      if (st.keys.length) st.missed.push(right);
      showFull(k === ri ? "ok" : "bad");
      hud();
      setTimeout(advance, k === ri ? 1500 : 2200);
    };
    const end = () => {
      stopGame();
      bar.style.width = "100%";
      const n = links.length - st.from, rate = st.callable ? st.recalled / st.callable : 1;
      const part = st.from > 0;
      const stars = st.miss <= 1 && rate >= 0.6 ? 3 : st.miss <= Math.ceil(n * 0.15) ? 2 : 1;
      const prev = part ? { stars: ((S.play || {})[e.id] || {}).build ? S.play[e.id].build.stars || 0 : 0 } : setStars(e.id, "build", stars, st.score);
      const fromLabel = part ? (startsOf(e).find(([i]) => i === st.from) || [0, ""])[1] : "";
      addXP(st.score / 10);
      logEvent("build", e.id, part ? 0 : stars);
      arena.taunt(stars === 3 ? "Grr... you know my chain. Face me in the boss fight!" : null);
      blip("win");
      stage.innerHTML = resultsHTML({
        id: e.id, title: part ? `Practised from “${fromLabel}”` : rate >= 0.9 && !st.miss ? "Perfect chain" : "Chain built", stars: part ? prev.stars : stars, prevStars: prev.stars,
        stats: [["recalled", `${st.recalled} of ${st.callable}`], ["score", st.score], ["best streak", "×" + st.best], ["wrong picks", st.miss]],
        note: part ? (stars === 3 ? "That part is solid. Stars only count on a full run from the start, so do one when you’re ready." : "Practice run. The steps below are the ones you couldn’t say yet; stars only count on a full run from the start.")
          : stars === 3 ? "You said most of it before seeing it. That's real recall." : "3 stars needs 60% said from memory. The steps below are the ones you couldn't say yet.",
        missed: [...new Set(st.missed)].map((m) => esc(m)),
        next: { href: `#/game/gaps/${e.id}`, label: "Next: Gap rush" }
      });
      const n1 = stage.querySelector(".g-btn.main"); if (n1) n1.focus({ preventScroll: true });
    };
    app.onclick = gameClicks(e, (ev) => {
      const fb = ev.target.closest("[data-from]"); if (fb && st.phase === "choose") return begin(Number(fb.dataset.from));
      if (ev.target.closest("[data-stuck]")) return toPick();
      const c = ev.target.closest("[data-pick]"); if (c) pick(Number(c.dataset.pick));
    });
    app.onsubmit = (ev) => { if (ev.target.closest(".b-call")) { ev.preventDefault(); check(stage.querySelector(".b-in").value); } };
    gameKey = (ev) => {
      if (st.phase === "choose") {
        const pts = startsOf(e), k = Number(ev.key) - 1;
        if (pts[k]) { ev.preventDefault(); begin(pts[k][0]); }
        return;
      }
      if (st.phase === "call") { if (ev.key === "Tab") { ev.preventDefault(); toPick(); } return; }
      if (["1", "2", "3"].includes(ev.key)) { ev.preventDefault(); pick(Number(ev.key) - 1); }
    };
    if (startsOf(e).length > 1) choose(); else startLink();
  };

  // ---- 2. Gap rush ----
  const viewRush = (e) => {
    const links = chainLinks(e), keys = keyTokens(e.atoms), qt = qToks(e);
    const r = rng(`${e.id}:rush:${Date.now()}`);
    const gaps = [];
    links.forEach((link, li) => {
      const cands = gapWords(link, keys, qt, new Set(toks(links[li - 1] || "")));
      if (cands.length) gaps.push({ li, ...cands[Math.floor(r() * cands.length)] });
    });
    const LIMIT = 90;
    const st = { k: 0, combo: 0, best: 0, score: 0, right: 0, wrong: 0, missed: [], queue: gaps.slice(), retried: new Set(), t0: 0, over: false, lock: false };
    app.innerHTML = gameShell(e,
      `<span class="g-stat"><b class="g-score">0</b> pts</span><span class="g-stat g-combo"></span><span class="g-stat g-time">1:30</span>`,
      `<span><kbd>enter</kbd> check</span><span><kbd>tab</kbd> skip</span>`);
    const stage = app.querySelector(".g-stage"), bar = app.querySelector(".g-bar i");
    const arena = window.mountArena(app.querySelector(".g-arena"), e.id, {});
    bar.style.width = "100%";
    const hud = () => {
      app.querySelector(".g-score").textContent = st.score;
      app.querySelector(".g-combo").textContent = st.combo >= 2 ? `streak ×${Math.min(st.combo, 10)}` : "";
    };
    const showWord = (g, cls) => {
      const words = links[g.li].split(/\s+/);
      return words.map((w, i) => {
        if (i !== g.wi) return esc(w);
        const core = wordCore(w), at = w.indexOf(core);
        return esc(w.slice(0, at)) + (cls ? `<mark class="${cls}">${esc(core)}</mark>` : `<span class="r-blank" aria-label="gap"></span>`) + esc(w.slice(at + core.length));
      }).join(" ");
    };
    const render = () => {
      const g = st.queue[st.k];
      stage.innerHTML = `
        <div class="r-card">
          ${links[g.li - 1] ? `<p class="r-prev">${esc(links[g.li - 1])} <span aria-hidden="true">→</span></p>` : `<p class="r-prev">${esc(e.q.replace(/\.$/, ""))} <span aria-hidden="true">→</span></p>`}
          <p class="r-link">${showWord(g)}</p>
          <label class="sr" for="rIn">Missing word</label>
          <input id="rIn" class="r-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type the missing word">
          <p class="r-count">${Math.min(st.k + 1, st.queue.length)} of ${st.queue.length}</p>
        </div>`;
      const inp = document.getElementById("rIn");
      inp.focus({ preventScroll: true });
      inp.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") { ev.preventDefault(); answer(inp.value, false); }
        else if (ev.key === "Tab") { ev.preventDefault(); answer("", true); }
      });
      inp.addEventListener("input", () => { if (!st.t0) start(); }, { once: true });
    };
    const start = () => {
      st.t0 = Date.now();
      gameTick = setInterval(() => {
        const left = Math.max(0, LIMIT - (Date.now() - st.t0) / 1000);
        bar.style.width = `${(100 * left) / LIMIT}%`;
        const tEl = app.querySelector(".g-time");
        if (tEl) { tEl.textContent = mmss(left); tEl.classList.toggle("low", left < 15); }
        if (left <= 0) end(true);
      }, 100);
    };
    const answer = (val, skip) => {
      if (st.lock || st.over) return;
      if (!st.t0) start();
      st.lock = true;
      const g = st.queue[st.k], ok = !skip && gapGrade(val, g.core);
      const card = stage.querySelector(".r-card");
      if (ok) {
        st.combo++; st.best = Math.max(st.best, st.combo); st.right++;
        const pts = 10 * Math.min(st.combo, 10);
        st.score += pts;
        card.querySelector(".r-link").innerHTML = showWord(g, "yes");
        arena.attack(attackKind(st.combo), "+" + pts);
        blip("good");
      } else {
        st.combo = 0; st.wrong++;
        st.missed.push(g);
        card.querySelector(".r-link").innerHTML = showWord(g, "no");
        card.classList.add("shake");
        arena.taunt();
        blip("bad");
        if (!st.retried.has(g)) { st.retried.add(g); st.queue.push(g); }
      }
      hud();
      setTimeout(() => {
        st.lock = false;
        if (st.over || !stage.isConnected) return;
        st.k++;
        if (st.k >= st.queue.length) return end(false);
        render();
      }, ok ? 420 : 1500);
    };
    const end = (timeUp) => {
      if (st.over) return;
      st.over = true;
      stopGame();
      const total = gaps.length, firstRight = gaps.filter((g) => !st.missed.includes(g)).length;
      const reached = Math.min(st.k, st.queue.length);
      const covered = new Set(st.queue.slice(0, reached)).size;
      const acc = covered ? firstRight / total : 0;
      const finished = !timeUp;
      const stars = finished && acc >= 0.85 ? 3 : acc >= 0.6 ? 2 : covered ? 1 : 0;
      const prev = setStars(e.id, "gaps", stars, st.score);
      addXP(st.score / 10);
      logEvent("gaps", e.id, stars);
      arena.taunt(stars === 3 ? "You’ve learned my words... the boss fight decides it!" : null);
      if (stars && !S.learned[e.id] && !atts(e.id).length) markLearned(e.id, false);
      blip(stars >= 2 ? "win" : "bad");
      stage.innerHTML = resultsHTML({
        id: e.id, title: timeUp ? "Time!" : "All gaps done", stars, prevStars: prev.stars,
        stats: [["score", st.score], ["right first time", `${firstRight}/${total}`], ["best streak", "×" + st.best], ["xp", "+" + Math.round(st.score / 10)]],
        note: stars === 3 ? "You can produce the key terms. Time for the boss." : timeUp ? "Faster next time: skip with tab when a word won’t come." : "Play again to clear every gap first time.",
        missed: [...new Set(st.missed)].map((g) => showWord(g, "no")),
        next: { href: `#/boss/${e.id}`, label: "Next: Boss fight" }
      });
      const n1 = stage.querySelector(".g-btn.main"); if (n1) n1.focus({ preventScroll: true });
    };
    app.onclick = gameClicks(e);
    gameKey = null;
    if (!gaps.length) { end(false); return; }
    render();
  };

  /* ---------- type: EssayType on its own, for any essay ---------- */
  const viewType = (e) => {
    app.innerHTML = `
      ${topbar()}
      <main class="wrap learn type-page">
        <p class="meta">EssayType, ${en(e).toLowerCase()}. Every round starts with the question, then the whole essay as one chain.</p>
        <h1 class="question">${esc(e.q)}</h1>
        <section class="stage">
          <div id="etHost"></div>
          <div class="actions">
            <a class="btn" href="#/recall/${e.id}">Recall it from the question</a>
            <a class="btn ghost" href="#/study/${e.id}">Open the notes</a>
          </div>
        </section>
      </main>`;
    const host = document.getElementById("etHost");
    ET = mountEssayType(host, { passages: chainPassages(e), cue: { num: qn(e), q: e.q } });
  };

  /* ---------- recall and exam ---------- */
  const shortText = (s) => { const w = s.split(/\s+/); return w.slice(0, 7).join(" ") + (w.length > 7 ? "…" : ""); };
  const bossStars = (score) => (score >= 0.999 ? 3 : score >= 0.7 ? 2 : score >= 0.4 ? 1 : 0);
  const BOSS_SECS = 360;
  const viewRecall = (e, mode) => {
    const exam = mode === "exam", timed = mode === "boss";
    const st = { hint: false, conf: null, done: false, mode };
    const passTotal = passOf(e).length;
    const saved = draft.get(e.id);

    app.innerHTML = `
      ${topbar()}
      <main class="wrap recall">
        ${guestNotice()}
        <p class="meta">${exam ? "Mock exam. No notes, no hints." : `${en(e)}. Diagram first, then everything else you remember, in any order.`}</p>
        <h1 class="question">${esc(e.q)}</h1>
        ${exam ? timerHTML(C.examMinutes * 60, "Time left", { locked: true, big: true, note: "No pausing, like the real thing. It hands itself in at zero." }) : `
        <div class="bosshud">
          <div class="bh-arena"></div>
          <div class="bh-row">
            <p class="bh-tip">Every point you write hits the boss. Pass points take its HP; boost points are lightning bonus hits.</p>
            ${timed ? `<span class="bh-time">${mmss(BOSS_SECS)}</span>` : ""}
          </div>
          <div class="bh-hits" aria-hidden="true"></div>
        </div>`}
        <div class="skeleton" id="skeleton" hidden>
          <p>The sections, nothing more:</p>
          <ol>${e.sections.map((s) => `<li>${esc(s.h)}</li>`).join("")}</ol>
        </div>
        <label class="sr" for="ans">Your answer</label>
        <textarea id="ans" class="answer-box" spellcheck="false" autocomplete="off"
          placeholder="Sketch the diagram on paper first, then type everything you remember.">${esc(saved)}</textarea>
        <div class="bar">
          <div class="conf" role="group" aria-label="How sure do you feel?">
            <span class="conf-q">How sure do you feel?</span>
            <button type="button" data-conf="0" aria-pressed="false">Blank</button>
            <button type="button" data-conf="1" aria-pressed="false">Shaky</button>
            <button type="button" data-conf="2" aria-pressed="false">Sure</button>
          </div>
          <div class="bar-actions">
            ${exam ? "" : `<button type="button" class="btn ghost" id="hintBtn">Show the skeleton</button>`}
            <button type="button" class="btn" id="checkBtn">${exam ? "Hand in" : "Check my answer"}</button>
          </div>
        </div>
        <p class="kbd-hint">Tab types an arrow. Ctrl + Enter checks.</p>
        <div id="result"></div>
      </main>`;

    const ans = document.getElementById("ans");
    ans.focus();
    if (exam) ans.addEventListener("keydown", wakeAudio, { once: true });
    ans.addEventListener("input", () => draft.set(e.id, ans.value));
    if (!exam) {
      let seen = null, liveT = null, down = false;
      const hud = app.querySelector(".bosshud");
      const arena = window.mountArena(hud.querySelector(".bh-arena"), e.id, { hp: true, big: true });
      st.arena = arena;
      const spawn = (a) => {
        const h = document.createElement("span");
        h.className = "bh-hit" + (a.tier === "boost" ? " crit" : "");
        h.textContent = (a.tier === "boost" ? "bonus: " : "hit: ") + shortText(a.s);
        const box = hud.querySelector(".bh-hits");
        box.prepend(h);
        while (box.children.length > 3) box.lastChild.remove();
        setTimeout(() => h.remove(), 2600);
      };
      const hp = (quiet) => {
        const T = tokenize(ans.value);
        const now = new Set(e.atoms.filter((a) => checkAtom(T, a)).map((a) => a.id));
        const fresh = seen ? e.atoms.filter((a) => now.has(a.id) && !seen.has(a.id)) : [];
        seen = now;
        const left = passOf(e).filter((a) => !now.has(a.id)).length;
        arena.hp(left, passTotal);
        if (!quiet && fresh.length) {
          fresh.forEach((a, k) => setTimeout(() => { spawn(a); arena.attack(a.tier === "boost" ? "bolt" : "fireball", a.tier === "boost" ? "bonus" : "−1 HP"); }, k * 260));
          blip("hit");
        }
        if (left === 0 && !down) {
          down = true;
          setTimeout(() => arena.defeat(), quiet ? 0 : fresh.length * 260 + 420);
          hud.querySelector(".bh-tip").textContent = "Boss defeated! Keep going: boost points are bonus hits.";
          if (!quiet) blip("win");
        }
      };
      hp(true);
      ans.addEventListener("input", () => { clearTimeout(liveT); liveT = setTimeout(() => hp(false), 250); });
      if (timed) {
        const t0 = Date.now();
        gameTick = setInterval(() => {
          const left = Math.max(0, BOSS_SECS - (Date.now() - t0) / 1000);
          const tEl = hud.querySelector(".bh-time");
          if (tEl) { tEl.textContent = mmss(left); tEl.classList.toggle("low", left < 60); }
          if (left <= 0) finish();
        }, 250);
      }
    }
    ans.addEventListener("keydown", (ev) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") { ev.preventDefault(); finish(); }
    });
    app.querySelectorAll("[data-conf]").forEach((b) => b.addEventListener("click", () => {
      st.conf = Number(b.dataset.conf);
      app.querySelectorAll("[data-conf]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    }));
    const hintBtn = document.getElementById("hintBtn");
    if (hintBtn) hintBtn.addEventListener("click", () => {
      st.hint = true;
      document.getElementById("skeleton").hidden = false;
      hintBtn.disabled = true;
      hintBtn.textContent = "Skeleton shown";
    });
    document.getElementById("checkBtn").addEventListener("click", () => finish());

    if (exam) runTimer(app.querySelector(".timer"), () => finish());

    function finish() {
      if (st.done) return;
      st.done = true;
      stopTicker();
      stopGame();
      const text = ans.value;
      draft.del(e.id);
      const T = tokenize(text);
      const got = {}, hitSet = new Set();
      e.atoms.forEach((a) => {
        const hits = checkAtom(T, a);
        got[a.id] = !!hits;
        if (hits) hits.forEach((h) => hitSet.add(h));
      });
      const R = { text, T, hitSet, got, recovered: {}, stage: "retry" };
      const list = (S.att[e.id] = S.att[e.id] || []);
      list.push({ d: today(), score: 0, boost: 0, hint: st.hint, conf: st.conf, exam });
      R.idx = list.length - 1;
      updateScore(e, R);
      logEvent(exam ? "exam" : "boss", e.id, Math.round(S.att[e.id][R.idx].score * 100));
      if (!exam && st.arena && missedPass(e, R).length) st.arena.taunt(`Ha! I survived with ${missedPass(e, R).length} HP. Read what you missed and come back.`);
      if (!exam) {
        const p = passOf(e), b = boostOf(e);
        R.xp = 10 * p.filter((a) => R.got[a.id]).length + 5 * b.filter((a) => R.got[a.id]).length;
        addXP(R.xp);
      }
      if (!missedPass(e, R).length) R.stage = "review";
      ans.hidden = true;
      app.querySelector(".bar").hidden = true;
      app.querySelector(".kbd-hint").hidden = true;
      renderResult(e, R, st);
      document.getElementById("result").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth" });
    }
  };

  const passOf = (e) => e.atoms.filter((a) => a.tier === "pass");
  const boostOf = (e) => e.atoms.filter((a) => a.tier === "boost");
  const missedPass = (e, R) => passOf(e).filter((a) => !R.got[a.id]);

  const updateScore = (e, R) => {
    const p = passOf(e), b = boostOf(e);
    const rec = S.att[e.id][R.idx];
    rec.score = p.length ? p.filter((a) => R.got[a.id]).length / p.length : 0;
    rec.boost = b.length ? b.filter((a) => R.got[a.id]).length / b.length : 0;
    schedule(e.id);
    if (!rec.exam) setStars(e.id, "boss", bossStars(rec.score), Math.round(rec.score * 100));
    save();
  };

  const verdict = (e, R, st) => {
    const rec = S.att[e.id][R.idx];
    const pct = Math.round(rec.score * 100);
    const lines = [];
    if (st.mode === "exam") lines.push(rec.score >= 0.9 ? "You beat the final boss." : "The final boss survives this time. Train the weak essays and come back.");
    if (st.mode !== "exam") {
      const left = passOf(e).filter((a) => !R.got[a.id]).length;
      lines.push(left ? `The boss survived with ${left} HP.` : "Boss defeated.");
      if (R.xp) lines.push(`+${R.xp} XP.`);
    }
    if (st.conf === 2 && rec.score < 0.7) lines.push(`You felt sure and got ${pct}%. This one is fooling you, so it comes back soon.`);
    else if (st.conf === 0 && rec.score >= 0.7) lines.push(`You felt blank and still got ${pct}%. You know more than you think.`);
    else if (rec.score >= 0.9) lines.push("Clean recall.");
    else if (rec.score >= 0.7) lines.push("Close. Fix the gaps below.");
    else lines.push("Not there yet. Read only the lines you missed, then it comes back tomorrow.");
    if (rec.hint) lines.push("You used the skeleton, so this doesn’t count as a clean recall.");
    const cd = cleanDays(e.id);
    if (status(e.id) === "ready") lines.push("Three clean recalls on separate days: this essay is exam-ready.");
    else if (rec.score >= 0.9 && !rec.hint) lines.push(`${cd} of 3 clean recalls on separate days.`);
    if (S.due[e.id]) lines.push(`Next review: ${longDate(S.due[e.id])}.`);
    if (!user) lines.push("You’re a guest, so this result disappears when you close the page.");
    return lines.join(" ");
  };

  const renderResult = (e, R, st) => {
    const box = document.getElementById("result");
    const p = passOf(e), b = boostOf(e);
    const gp = p.filter((a) => R.got[a.id]).length;
    const gb = b.filter((a) => R.got[a.id]).length;
    const missed = missedPass(e, R);

    const bySec = {};
    missed.forEach((a) => { const h = e.sections[a.sec].h; bySec[h] = (bySec[h] || 0) + 1; });
    const secList = Object.keys(bySec).map((h) => `${h}: ${bySec[h]}`).join("; ");

    const retry = R.stage === "retry" ? `
      <section class="block retry">
        <h2>Second go, before you look</h2>
        <p>You missed ${plural(missed.length, "pass point")}. Where they were: ${esc(secList)}. Type whatever comes back now.</p>
        <label class="sr" for="retryBox">Second attempt</label>
        <textarea id="retryBox" class="answer-box short" spellcheck="false" autocomplete="off"></textarea>
        <div class="actions">
          <button class="btn" data-act="retry">Check again</button>
          <button class="btn ghost" data-act="skip">Show me the checklist</button>
        </div>
      </section>` : "";

    const recovered = Object.keys(R.recovered).length;
    const checklist = R.stage === "review" ? `
      <section class="checklist">
        <h2>Checklist</h2>
        <p class="hint">Ticked automatically from your words. Tap a line to correct it; the score updates. Read the missed lines carefully — that’s your study for this essay today.${recovered ? ` ${plural(recovered, "point")} came back on the second go: good, but they don’t count yet.` : ""}</p>
        ${e.sections.map((s) => `
          <div class="sec">
            <h3>${esc(s.h)}</h3>
            <ul class="atoms">
              ${s.atoms.map((a) => {
                const state = R.got[a.id] ? "got" : R.recovered[a.id] ? "recovered" : "missed";
                const mark = state === "got" ? "✓" : state === "recovered" ? "↺" : a.tier === "pass" ? "⊗" : "○";
                return `
                <li>
                  <button class="check-row ${state} tier-${a.tier}" data-atom="${a.id}" aria-pressed="${state === "got"}">
                    <span class="mark" aria-hidden="true">${mark}</span>
                    <span class="atom-body">
                      <span class="atom-text"><span class="hl">${esc(a.s)}</span></span>
                      <span class="src">${a.tier === "pass" ? "Pass" : "Boost"}, ${esc(a.src || "")}</span>
                    </span>
                  </button>
                </li>`;
              }).join("")}
            </ul>
          </div>`).join("")}
      </section>` : "";

    box.innerHTML = `
      <section class="score-card">
        <p class="score"><strong>${gp} of ${p.length}</strong> pass points${b.length ? `, ${gb} of ${b.length} boost points` : ""}.${st.mode !== "exam" ? ` <span class="score-stars">${starsHTML(bossStars(S.att[e.id][R.idx].score))}</span>` : ""}</p>
        <p class="verdict">${esc(verdict(e, R, st))}</p>
      </section>
      <section class="block your-answer">
        <h2>Your answer</h2>
        <div class="answer-view">${R.text.trim() ? highlight(R.text, R.T, R.hitSet) : "<em>Nothing typed.</em>"}</div>
      </section>
      ${retry}
      ${checklist}
      <div class="actions end">
        <a class="btn ghost" href="#/study/${e.id}">Open the notes</a>
        <a class="btn ghost" href="#/type/${e.id}">Type the chain</a>
        <button class="btn ghost" data-act="draw">Draw another</button>
        <a class="btn" href="#/">Back to today</a>
      </div>`;

    const rb = document.getElementById("retryBox");
    if (rb) rb.focus();

    box.querySelectorAll("[data-act=retry]").forEach((btn) => btn.addEventListener("click", () => {
      const T2 = tokenize(rb.value);
      missed.forEach((a) => { if (checkAtom(T2, a)) R.recovered[a.id] = true; });
      R.stage = "review";
      renderResult(e, R, st);
    }));
    box.querySelectorAll("[data-act=skip]").forEach((btn) => btn.addEventListener("click", () => {
      R.stage = "review";
      renderResult(e, R, st);
    }));
    box.querySelectorAll("[data-atom]").forEach((btn) => btn.addEventListener("click", () => {
      const id = btn.dataset.atom;
      R.got[id] = !R.got[id];
      if (R.got[id]) delete R.recovered[id];
      updateScore(e, R);
      const y = window.scrollY;
      renderResult(e, R, st);
      window.scrollTo(0, y);
    }));
  };

  /* ---------- exam start ---------- */
  const viewExamStart = () => {
    app.innerHTML = `
      ${topbar()}
      <main class="wrap narrow">
        ${guestNotice()}
        <div class="final-art">${window.bossSVG("final")}</div>
        <h1 class="page-title">The final boss: ${esc(window.bossFor("final").name)}</h1>
        <p class="lede">One essay from all ${C.essays.length}, every one equally likely, just like the box. ${C.examMinutes} minutes on the clock, no notes and no hints. When time runs out it hands itself in.</p>
        <p class="hint">Do one every two or three days once all essays are introduced. Do at least one on paper to feel your handwriting speed.</p>
        <div class="actions"><button class="btn" data-act="exam-draw">Draw my question</button></div>
      </main>
      ${footer()}`;
  };

  /* ---------- how to study ---------- */
  const viewHow = () => {
    app.innerHTML = `
      ${topbar()}
      <main class="wrap narrow how">
        <h1 class="page-title">How to study with Essay Jar</h1>
        <p class="lede">It isn’t rereading and it isn’t rote memorising. You learn each essay by pulling it out of your memory, again and again, spread over days, until you can write it from the question alone.</p>

        <section class="block">
          <h2>A new essay: press Play</h2>
          <p>Three short games, easiest first. No reading the chain first: you learn it by playing it.</p>
          <ol>
            <li><strong>Build the chain</strong> (about 2 minutes): the chain grows one link at a time. Type the next step in a few key words of your own before any options appear; only if you are stuck do you get three options, shown as jumbled key terms so you have to think about the idea instead of recognising a sentence. Guessing wrong is fine: the full step lights up and you remember it better for having tried.</li>
            <li><strong>Gap rush</strong> (90 seconds): type the missing key term in each link, against the clock. Streaks multiply your points.</li>
            <li><strong>Boss fight</strong> (6 minutes): write the essay from the question. Every point you remember hits the boss, live, as you type.</li>
          </ol>
          <p>Each game gives up to 3 stars. Play a game again until it’s 3 stars, then move on. Finishing Gap rush puts the essay in your daily review.</p>
          <p class="hint">Why this sticks better than reading: every click and every word you type is a recall with instant feedback, the rounds are short, and it gets harder as you get better (pick it, then type it, then write it all).</p>
        </section>

        <section class="block">
          <h2>Learn: one focused hour per essay</h2>
          <ol>
            <li><strong>The map and a guess (90 s).</strong> See the parts of the essay and guess what each one says. Guessing first makes the reading stick.</li>
            <li><strong>Each part: read, then explain.</strong> Read the chain of cause and effect on a timer, asking why at every arrow. Then it hides and you explain it in your own words, like teaching a friend. Explaining is what makes it make sense, and it’s exactly what you do in the exam.</li>
            <li><strong>Fix only what you missed.</strong> The app shows which steps you left out. You re-read just those, with the step before each one, and say them again.</li>
            <li><strong>The whole essay.</strong> From the question alone, every part in order. That puts it in your daily review.</li>
          </ol>
          <p>Every step has a clock that moves you on by itself, the page goes full screen, and leaving the tab pauses the clock and counts as a distraction. No rewriting the same thing over and over: the repetition comes after, in Play.</p>
          <p class="hint">Under an hour per essay. Then Play is the bonus: Build the chain and Gap rush drill the order and the details.</p>
        </section>

        <section class="block">
          <h2>EssayType</h2>
          <p>The typing game. Every essay has a <strong>chain</strong>: the whole essay as one sequence of links (“HCl denatures proteins → chief cells secrete pepsinogen → …”), in the order you draw and write it, with the reason for each step. Every round starts with you typing the question, then the chain, so the question becomes the first link. The question stays pinned above the text in cyan the whole time. Three rounds, each harder than the last:</p>
          <ol>
            <li><strong>Copy.</strong> Type the text exactly. It makes you read every word instead of skimming.</li>
            <li><strong>Gaps.</strong> Key terms disappear and you type them from memory. Recalled words turn yellow; missed ones show up in red.</li>
            <li><strong>First letters.</strong> Only first letters are left. You rebuild every word yourself.</li>
          </ol>
          <p class="hint">Tab types an arrow. Read each link as you type it and ask why it leads to the next: typing without thinking is just copying. You’ll find it in Learn, on every essay’s notes, and after every recall (“Type the chain”).</p>
        </section>

        <section class="block">
          <h2>Daily review, every day</h2>
          <p>From the day after you learn an essay, it’s in your daily review on the home page. About 5 to 8 minutes of short typed questions, all cut from the essay’s own chain, sections and points:</p>
          <ul>
            <li><strong>Sections:</strong> from the question alone, type the essay’s sections. That’s the skeleton you write from in the exam.</li>
            <li><strong>Fill the gap:</strong> a piece of the chain with one key term missing.</li>
            <li><strong>What comes next:</strong> a link of the chain; type the next one. That trains the order you write in.</li>
            <li><strong>Write the section:</strong> one section from memory, checked point by point.</li>
            <li><strong>Which essay:</strong> a fact; type its essay number, so similar essays don’t blur together.</li>
          </ul>
          <p>No multiple choice: picking an answer from options is recognition, and your exam asks you to produce the essay from nothing. Anything you miss comes back once at the end. An essay that goes badly gets its full recall moved to tomorrow. Up to 6 essays a day, freshest and weakest first; once you’ve learned more than that, they rotate, and “Review more” covers the rest.</p>
          <p class="hint">Learned an essay outside the app? Press “Already learned” next to it, or “I learned this before today” on its notes page.</p>
        </section>

        <section class="block">
          <h2>A review: press Recall</h2>
          <ol>
            <li><strong>Question only.</strong> Say how sure you feel, sketch the diagram on paper, type everything.</li>
            <li><strong>Second go.</strong> You’re told which sections had gaps. Try once more before looking.</li>
            <li><strong>Checklist.</strong> Read the lines you missed, not the whole essay.</li>
          </ol>
          <p>The app brings each essay back after one to six days depending on how it went. Three clean recalls on separate days and it’s exam-ready.</p>
        </section>

        <section class="block">
          <h2>After day ten</h2>
          <p>Draw from the jar every day (it favours your weak essays) and do a mock exam every two or three days.</p>
        </section>

        <section class="block">
          <h2>Why it works</h2>
          <ul>
            <li><strong>Retrieval practice.</strong> Recalling beats rereading for long-term memory, and free recall is exactly what an essay exam asks for.</li>
            <li><strong>Spacing.</strong> Short sessions spread over days beat one long session, so reviews are scheduled, not crammed.</li>
            <li><strong>Relearning to criterion.</strong> Every point has to come back at least once, then on three separate days.</li>
            <li><strong>The question is the cue.</strong> You always start from the exact exam wording, and in EssayType you type it before every round, so that wording is what launches the essay on the day.</li>
            <li><strong>Feedback and a second go.</strong> Finding the gap yourself, then trying again, fixes it better than just reading the answer.</li>
            <li><strong>Pictures and stories.</strong> The diagram and the story give each fact a hook.</li>
            <li><strong>Reasons, not lists.</strong> Each link in a chain says why the next one happens. Asking “why?” at every step (elaborative interrogation) makes facts stick far better than memorising them blind.</li>
            <li><strong>Every day, a little.</strong> A few minutes of recall on everything learned beats a big re-read later; each successful retrieval makes the next one easier and slows forgetting.</li>
            <li><strong>Fading cues.</strong> EssayType removes help step by step (all text, then gaps, then first letters), so recall gets harder just as you get better.</li>
            <li><strong>Honest confidence.</strong> Rating how sure you feel shows which essays only feel familiar.</li>
          </ul>
        </section>

        <section class="block">
          <h2>Rules that make it work</h2>
          <ul>
            <li>Recall before you read. Opening the notes first throws away most of the benefit.</li>
            <li>Struggle a little before checking. The effort is what makes it stick.</li>
            <li>Don’t use the skeleton hint unless you’re completely stuck.</li>
            <li>Sleep. Memory is consolidated overnight, so late-night cramming backfires.</li>
          </ul>
        </section>
      </main>
      ${footer()}`;
  };

  /* ---------- login, account, leaderboard, admin ---------- */
  const ago = (iso) => {
    if (!iso) return "never";
    const t = new Date(iso), ms = Date.now() - t.getTime();
    if (isNaN(ms)) return "never";
    if (ms < 120000) return "just now";
    if (ms < 3600000) return Math.round(ms / 60000) + " min ago";
    const hm = pad(t.getHours()) + ":" + pad(t.getMinutes()), d = diff(fmt(t), today());
    if (d === 0) return "today at " + hm;
    if (d === 1) return "yesterday at " + hm;
    return t.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };
  const mins = (secs) => (secs >= 3600 ? `${Math.floor(secs / 3600)} h ${Math.round((secs % 3600) / 60)} min` : `${Math.round((secs || 0) / 60)} min`);
  const activeDay = (d, k) => !!((d.quiz && d.quiz.days && d.quiz.days[k] && d.quiz.days[k].done) || (d.log && d.log[k] && d.log[k].secs >= 60));
  const streakOf = (d, t) => {
    let n = 0, cur = t;
    if (!activeDay(d, cur)) cur = addDays(cur, -1);
    while (activeDay(d, cur)) { n++; cur = addDays(cur, -1); }
    return n;
  };
  const eventText = (ev) => {
    const q = ev.id ? (E[ev.id] ? qn(E[ev.id]) : `Q${ev.id}`) : "";
    const b = ev.id && window.bossFor ? window.bossFor(ev.id).name : q;
    return ({
      build: `Built the chain for ${q} (${ev.v} ${ev.v === 1 ? "star" : "stars"})`,
      gaps: `Gap rush on ${q} (${ev.v} ${ev.v === 1 ? "star" : "stars"})`,
      boss: Number(ev.v) >= 100 ? `Defeated ${b} (${q})` : `Fought ${b} (${q}), ${ev.v}%`,
      exam: `Mock exam on ${q}, ${ev.v}%`,
      daily: `Daily review, ${ev.v} right`,
      learn: `Learned ${q}`,
      call: `On call: told the ${q} story, ${ev.v}%`
    })[ev.k] || ev.k;
  };
  const summarize = (d, t) => {
    d = d || {};
    const log = d.log || {}, play = d.play || {};
    const week = Object.keys(log).filter((k) => { const a = diff(k, t); return a >= 0 && a < 7; }).reduce((s, k) => s + (log[k].secs || 0), 0);
    const events = [];
    Object.keys(log).forEach((k) => (log[k].ev || []).forEach((ev) => events.push(ev)));
    events.sort((a, b) => b.t - a.t);
    return {
      xp: d.xp || 0, lvl: levelOf(d.xp || 0).lvl, today: (log[t] && log[t].secs) || 0, week,
      bosses: Object.keys(play).filter((id) => play[id] && play[id].boss && play[id].boss.stars >= 3).length,
      stars: Object.keys(play).reduce((s, id) => s + ["build", "gaps", "boss"].reduce((x, g) => x + ((play[id][g] && play[id][g].stars) || 0), 0), 0),
      learned: new Set([...Object.keys(d.learned || {}), ...Object.keys(d.att || {}).filter((id) => (d.att[id] || []).length)]).size,
      streak: streakOf(d, t), daily: !!(d.quiz && d.quiz.days && d.quiz.days[t] && d.quiz.days[t].done), events, log
    };
  };

  const viewLogin = () => {
    if (!ONLINE) { location.hash = "#/users"; return; }
    if (user) { location.hash = "#/"; return; }
    let mode = "login";
    const msg = loginMsg; loginMsg = "";
    const render = (err) => {
      app.innerHTML = `
        <main class="wrap login-page">
          <div class="login-art" aria-hidden="true">${[1, 7, 12, 18, 9].map((k) => window.bossSVG(k)).join("")}</div>
          <section class="login-card">
            <h1 class="login-title">Essay Jar</h1>
            <p class="login-sub">Twenty biochem bosses stand between you and the colloquium. Learn their essays to defeat them.</p>
            <div class="tabs" role="tablist">
              <button type="button" role="tab" data-mode="login" aria-selected="${mode === "login"}">Log in</button>
              <button type="button" role="tab" data-mode="signup" aria-selected="${mode === "signup"}">Create account</button>
            </div>
            <form id="authForm" autocomplete="on" novalidate>
              <label>Name <input name="name" maxlength="24" required autocomplete="username" autocapitalize="off" spellcheck="false" placeholder="Your name"></label>
              <label>Password <input name="pass" type="password" required autocomplete="${mode === "login" ? "current-password" : "new-password"}" placeholder="${mode === "login" ? "Your password" : "At least 6 characters"}"></label>
              ${mode === "signup" ? `<p class="fine">Your name, level and bosses defeated appear on the leaderboard. ${esc(OWNER)}, who runs this site, can see your progress and study time.</p>` : ""}
              <p class="err" id="authErr" ${err || msg ? "" : "hidden"}>${esc(err || msg)}</p>
              <button class="btn wide" type="submit">${mode === "login" ? "Log in" : "Create account"}</button>
            </form>
            <button type="button" class="linkbtn guest-link" data-act="guest-play">Play as a guest instead (nothing is saved)</button>
          </section>
        </main>`;
      const f = document.getElementById("authForm");
      f.querySelector("input[name=name]").focus();
      f.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const name = f.querySelector("input[name=name]").value.trim().replace(/\s+/g, " "), pass = f.querySelector("input[name=pass]").value;
        const errEl = document.getElementById("authErr");
        const fail = (m) => { errEl.textContent = m; errEl.hidden = false; btn.disabled = false; btn.textContent = mode === "login" ? "Log in" : "Create account"; };
        const btn = f.querySelector("button[type=submit]");
        if (!/^[A-Za-z0-9 _.-]{2,24}$/.test(name)) return fail("Use 2 to 24 letters, numbers or spaces for your name.");
        if (pass.length < 6) return fail(mode === "login" ? "Type your password." : "Use a password of at least 6 characters.");
        btn.disabled = true;
        btn.textContent = mode === "login" ? "Logging in…" : "Creating your account…";
        const guestS = !user && anyProgress(S) ? S : null;
        apiCall(mode, { name, pass }).then((r) => {
          if (!r || !r.ok) return fail((r && r.error) || "Something went wrong. Try again.");
          const from = startSession(r, guestS);
          if (from === "device") loginMsg = "We brought your progress from this device into your account.";
          if (from === "guest") loginMsg = "Your guest progress is now saved to your account.";
          location.hash = "#/";
        }).catch(() => fail("Can’t reach the server. Check your internet and try again."));
      });
    };
    app.onclick = (ev) => {
      const t = ev.target.closest("[data-mode]");
      if (t && t.dataset.mode !== mode) { mode = t.dataset.mode; render(); }
    };
    render();
  };

  const viewAccount = () => {
    if (!ONLINE) { location.hash = "#/users"; return; }
    if (!user) { location.hash = "#/login"; return; }
    const sm = summarize(S, today());
    const state = { saved: "Everything is saved online.", saving: "Saving…", offline: "Offline. Your progress is kept on this device and saves as soon as you’re back online." }[syncState] || "";
    app.innerHTML = `
      ${topbar()}
      <main class="wrap narrow account">
        <h1 class="page-title">${esc(user.name)}</h1>
        <p class="lede">Level ${sm.lvl}, ${sm.xp} XP. ${sm.bosses} of ${C.essays.length} bosses defeated. ${mins(sm.today)} studied today.</p>
        <p class="hint" id="syncLine">${esc(state)}</p>
        <div class="actions">
          <a class="btn" href="#/board">Leaderboard</a>
          ${user.admin ? `<a class="btn ghost" href="#/admin">Admin</a>` : ""}
          <button class="btn ghost" data-act="logout">Log out</button>
        </div>
      </main>
      ${footer()}`;
  };

  const viewBoard = () => {
    if (!ONLINE || !user) { location.hash = ONLINE ? "#/login" : "#/"; return; }
    app.innerHTML = `
      ${topbar()}
      <main class="wrap narrow board">
        <h1 class="page-title">Leaderboard</h1>
        <p class="lede">Everyone fighting the same ${C.essays.length} bosses. XP comes from every right answer.</p>
        <div id="boardBox"><p class="hint">Loading…</p></div>
      </main>
      ${footer()}`;
    syncNow(false).then(() => apiCall("board", { token: acct.token, today: today() })).then((r) => {
      const box = document.getElementById("boardBox");
      if (!box) return;
      if (!r || !r.ok) { box.innerHTML = `<p class="err">${esc((r && r.error) || "Couldn’t load the leaderboard.")}</p>`; return; }
      const rows = r.rows.slice().sort((a, b) => b.xp - a.xp || b.bosses - a.bosses);
      box.innerHTML = `<ol class="lb">${rows.map((x, i) => `
        <li class="${x.name.toLowerCase() === user.name.toLowerCase() ? "me" : ""}">
          <span class="lb-rank">${i + 1}</span>
          <span class="lb-name">${esc(x.name)}${x.activeToday ? `<span class="lb-today">studied today</span>` : ""}</span>
          <span class="lb-stat"><b>Level ${levelOf(x.xp).lvl}</b>${x.xp} XP</span>
          <span class="lb-stat"><b>${x.bosses} of ${C.essays.length}</b>bosses</span>
          <span class="lb-stat"><b>${x.streak}</b>day streak</span>
        </li>`).join("")}</ol>`;
    }).catch(() => { const box = document.getElementById("boardBox"); if (box) box.innerHTML = `<p class="err">Can’t reach the server right now.</p>`; });
  };

  const viewAdmin = () => {
    if (!ONLINE || !user) { location.hash = ONLINE ? "#/login" : "#/"; return; }
    if (!user.admin) { location.hash = "#/"; return; }
    app.innerHTML = `
      ${topbar()}
      <main class="wrap admin">
        <h1 class="page-title">Admin</h1>
        <p class="lede">Who’s studying, how much and what they’re doing.</p>
        <div id="adminBox"><p class="hint">Loading…</p></div>
      </main>
      ${footer()}`;
    let data = [], open = null, kickFor = null, kickNote = "";
    const t = today();
    const isOn = (u) => (u.onlineAt && Date.now() - u.onlineAt < 45000) || Date.now() - new Date(u.lastSeen || 0).getTime() < 60000;
    const where = (v) => {
      const [a, b, c] = String(v || "").split("/");
      const e = E[Number(a === "game" ? c : b)];
      const names = { home: "home", "": "home", play: "boss hub", study: "recall", learn: "learn", type: "EssayType", review: "daily review", exam: "mock exam", board: "leaderboard", pathways: "pathways", how: "how to study", settings: "settings", account: "account" };
      const g = { build: "Build the chain", gaps: "Gap rush" };
      const what = a === "game" ? g[b] || "a game" : names[a] || a;
      return what + (e ? " · " + qn(e) : "");
    };
    const draw = () => {
      const box = document.getElementById("adminBox");
      if (!box) return;
      const rows = data.map((u) => Object.assign({ u }, summarize(u.data, t)))
        .sort((a, b) => new Date(b.u.lastSeen || 0) - new Date(a.u.lastSeen || 0));
      const online = rows.filter((r) => isOn(r.u)).length;
      const todayN = rows.filter((r) => r.today >= 60).length;
      const totalToday = rows.reduce((s, r) => s + r.today, 0);
      box.innerHTML = `
        <div class="kpis">
          <div><b>${rows.length}</b><span>accounts</span></div>
          <div><b>${online}</b><span>online now</span></div>
          <div><b>${todayN}</b><span>studied today</span></div>
          <div><b>${mins(totalToday)}</b><span>studied today, all users</span></div>
        </div>
        ${kickFor ? `
        <form class="kickbar" autocomplete="off">
          <p class="kb-h">Kick <b>${esc(kickFor)}</b> with a message</p>
          <div class="kb-row">
            <input name="msg" maxlength="300" placeholder="e.g. Go to sleep, you've done enough 😴" aria-label="Kick message">
            <button class="btn" type="submit">Kick</button>
            <button class="btn ghost" type="button" data-kick-cancel>Cancel</button>
          </div>
          <p class="hint">One time only: they see your message on their screen within about 15 seconds, and refreshing brings them straight back.</p>
        </form>` : ""}
        ${kickNote ? `<p class="kick-note">${esc(kickNote)}</p>` : ""}
        <div class="table-wrap"><table class="users-table">
          <thead><tr><th>Name</th><th>Last seen</th><th>Today</th><th>Last 7 days</th><th>Bosses</th><th>Learned</th><th>Level</th><th>Streak</th><th>Daily review</th></tr></thead>
          <tbody>${rows.map((r, i) => {
            const on = isOn(r.u);
            return `
            <tr class="${open === i ? "open" : ""}" data-row="${i}" tabindex="0">
              <td><span class="dot${on ? " on" : ""}" title="${on ? "Online now" : ""}"></span>${esc(r.u.name)}${r.u.admin ? ` <span class="tag">owner</span>` : ""}${on && !r.u.admin && r.u.name.toLowerCase() !== user.name.toLowerCase() ? ` <button type="button" class="kick-btn" data-kick="${esc(r.u.name)}">Kick</button>` : ""}</td>
              <td>${on ? `online now${r.u.view ? `<small class="where">${esc(where(r.u.view))}</small>` : ""}` : esc(ago(r.u.lastSeen))}</td>
              <td>${mins(r.today)}</td><td>${mins(r.week)}</td>
              <td>${r.bosses} of ${C.essays.length}</td><td>${r.learned}</td><td>${r.lvl}</td><td>${r.streak}</td>
              <td>${r.daily ? "done" : "not yet"}</td>
            </tr>
            ${open === i ? `<tr class="detail"><td colspan="9">${detail(r)}</td></tr>` : ""}`;
          }).join("")}</tbody>
        </table></div>
        <p class="hint">Tap a person to see their bosses, study time and recent activity.</p>`;
    };
    const detail = (r) => {
      const play = (r.u.data && r.u.data.play) || {};
      const days = [...Array(14)].map((_, k) => addDays(t, k - 13));
      const maxS = Math.max(600, ...days.map((d) => (r.log[d] && r.log[d].secs) || 0));
      return `
        <div class="ud">
          <div>
            <h3>Bosses</h3>
            <ul class="ud-bosses">${C.essays.map((e) => {
              const p = play[e.id] || {}, st = ["build", "gaps", "boss"].reduce((x, g) => x + ((p[g] && p[g].stars) || 0), 0);
              const down = p.boss && p.boss.stars >= 3;
              return `<li class="${down ? "down" : st ? "some" : ""}" title="${esc(window.bossFor(e.id).name)}"><span>${qn(e)}</span><b>${down ? "defeated" : st ? st + " of 9" : "not started"}</b></li>`;
            }).join("")}</ul>
          </div>
          <div>
            <h3>Minutes studied, last 14 days</h3>
            <div class="ud-chart">${days.map((d) => {
              const secs = (r.log[d] && r.log[d].secs) || 0;
              return `<span title="${esc(longDate(d))}: ${mins(secs)}"><i style="height:${Math.round((100 * secs) / maxS)}%"></i><em>${Number(d.slice(8))}</em></span>`;
            }).join("")}</div>
            <h3>Recent activity</h3>
            ${r.events.length ? `<ul class="ud-feed">${r.events.slice(0, 25).map((ev) => `<li><span>${esc(ago(new Date(ev.t).toISOString()))}</span>${esc(eventText(ev))}</li>`).join("")}</ul>` : `<p class="hint">Nothing yet.</p>`}
          </div>
        </div>`;
    };
    const load = (quiet) => apiCall("admin", { token: acct.token }).then((r) => {
      const box = document.getElementById("adminBox");
      if (!box) return;
      if (!r || !r.ok) { if (!quiet) box.innerHTML = `<p class="err">${esc((r && r.error) || "Couldn’t load.")}</p>`; return; }
      data = r.users;
      if (!(quiet && kickFor)) draw();
    });
    // Keep "online now" live while you're on this page.
    const live = setInterval(() => {
      if (!document.getElementById("adminBox")) return clearInterval(live);
      if (document.visibilityState === "visible") load(true).catch(() => {});
    }, 20000);
    app.onsubmit = (ev) => {
      if (!ev.target.closest(".kickbar")) return;
      ev.preventDefault();
      const name = kickFor, msg = ev.target.querySelector("input[name=msg]").value.trim();
      const btn = ev.target.querySelector("button[type=submit]");
      btn.disabled = true; btn.textContent = "Kicking…";
      apiCall("kick", { token: acct.token, name, msg }).then((r) => {
        kickFor = null;
        kickNote = r && r.ok ? `Kicked ${name}. They’ll see “${msg || "You were kicked by the owner."}” within about 15 seconds.` : (r && r.error) || "Couldn’t kick.";
        draw();
      }).catch(() => { kickFor = null; kickNote = "Can’t reach the server right now."; draw(); });
    };
    app.onclick = (ev) => {
      const kb = ev.target.closest("[data-kick]");
      if (kb) { kickFor = kb.dataset.kick; kickNote = ""; draw(); const i = document.querySelector(".kickbar input"); if (i) i.focus(); return; }
      if (ev.target.closest("[data-kick-cancel]")) { kickFor = null; draw(); return; }
      const tr = ev.target.closest("tr[data-row]");
      if (!tr) return;
      const i = Number(tr.dataset.row);
      open = open === i ? null : i;
      draw();
    };
    syncNow(false).then(() => load(false)).catch(() => { const box = document.getElementById("adminBox"); if (box) box.innerHTML = `<p class="err">Can’t reach the server right now.</p>`; });
  };

  /* ---------- users ---------- */
  const viewUsers = () => {
    if (ONLINE) { location.hash = user ? "#/account" : "#/login"; return; }
    const keep = !user && hasProgress(S);
    const statLine = (s) => {
      const started = Object.keys(s.att).filter((id) => s.att[id] && s.att[id].length);
      const ready = started.filter((id) => cleanDaysIn(s, id) >= 3).length;
      return started.length ? `${started.length} of ${C.essays.length} started, ${ready} exam-ready` : "No progress yet";
    };
    app.innerHTML = `
      ${topbar()}
      <main class="wrap narrow users">
        <h1 class="page-title">Who’s studying?</h1>
        <p class="lede">Each user keeps their own progress, exam date and plan on this device. As a guest nothing is saved.</p>

        ${users.length ? `
        <ul class="user-list">
          ${users.map((u) => `
            <li class="${user && user.id === u.id ? "current" : ""}">
              <span class="u-name">${esc(u.name)}</span>
              <span class="u-stat">${esc(statLine(user && user.id === u.id ? S : loadState(u.id)))}</span>
              <span class="u-actions">
                ${user && user.id === u.id ? `<span class="tag">Current</span>` : `<button class="btn small" data-user="${esc(u.id)}">Switch</button>`}
                <button class="btn small ghost danger-btn" data-deluser="${esc(u.id)}">Delete</button>
              </span>
            </li>`).join("")}
        </ul>` : ""}

        <form id="newUser" class="block" autocomplete="off">
          <h2>Create a user</h2>
          <label>Name <input name="name" maxlength="30" required placeholder="Your name"></label>
          ${keep ? `<label class="check"><input type="checkbox" name="keep" checked> Keep what I just did as a guest</label>` : ""}
          <p class="err" id="userErr" hidden></p>
          <button class="btn" type="submit">Create and switch</button>
        </form>

        ${user ? `<p><button class="btn ghost" data-act="guest">Continue as guest</button></p>` : `<p class="hint">You’re currently a guest.</p>`}
        <p class="hint">Users live in this browser only. On another phone or laptop, create the user there and move progress with Settings → Export and Import.</p>
      </main>
      ${footer()}`;

    document.getElementById("newUser").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      const name = String(f.get("name") || "").trim().replace(/\s+/g, " ");
      const err = document.getElementById("userErr");
      if (!name) { err.textContent = "Type a name first."; err.hidden = false; return; }
      if (users.some((u) => u.name.toLowerCase() === name.toLowerCase())) {
        err.textContent = "That name is already a user on this device. Pick another or switch to it."; err.hidden = false; return;
      }
      const carry = keep && f.get("keep") ? S : null;
      const u = { id: newId(), name, created: today() };
      users.push(u); saveUsers();
      if (carry) store.set(keyFor(u.id), JSON.stringify(carry));
      switchTo(u);
      if (!carry) save();
      location.hash = "#/";
    });
  };

  /* ---------- settings ---------- */
  const viewSettings = () => {
    app.innerHTML = `
      ${topbar()}
      <main class="wrap narrow settings">
        <h1 class="page-title">Settings</h1>
        <p class="lede">${user ? `For ${esc(user.name)}.` : "You’re a guest: changes last until you close the page."} <a href="#/users">${user ? "Switch user" : "Create a user"}</a></p>
        <form id="dates" class="block">
          <h2>Dates</h2>
          <label>Exam date <input type="date" name="exam" value="${esc(S.exam)}" required></label>
          <label>Plan start date <input type="date" name="start" value="${esc(S.start)}" required></label>
          <p class="hint">New essays appear on their planned day counted from the start date (${PLAN_DAYS} days to introduce all of them).</p>
          <button class="btn" type="submit">Save dates</button>
          <p class="saved" id="saved" hidden>Dates saved.</p>
        </form>
        <section class="block">
          <h2>Stories</h2>
          <p>Each essay has a short story with the core you need to pass. You read it first in Learn, and it’s on the notes page and in On call. Pick the version you want; it only changes your account.</p>
          <div class="story-pick" role="radiogroup" aria-label="Story style">
            ${[["clean", "Clean", "Everyday settings, no sex."], ["spicy", "Spicy 18+", "Dirty jokes, each one a real step."], ["off", "Off", "No stories."]].map(([v, l, d]) => `<label class="switch"><input type="radio" name="storyStyle" value="${v}" ${storyStyle() === v ? "checked" : ""}> <span><b>${l}</b> · ${d}</span></label>`).join("")}
          </div>
        </section>
        <section class="block">
          <h2>Back up or move your progress</h2>
          ${user ? `
          <p>Export to keep a backup or to move this user to another device; import there after creating the user.</p>
          <div class="actions">
            <button class="btn ghost" data-act="export">Export progress</button>
            <label class="btn ghost file">Import progress<input type="file" accept="application/json,.json" id="importFile"></label>
          </div>
          <p class="saved" id="importMsg" hidden></p>` : `<p>Create a user first; guests have nothing saved to export.</p>`}
        </section>
        ${user ? `
        <section class="block danger">
          <h2>Start over</h2>
          <p>Deletes every attempt and schedule for ${esc(user.name)}. The user stays.</p>
          <button class="btn ghost danger-btn" data-act="reset">Delete my progress</button>
        </section>` : ""}
      </main>
      ${footer()}`;

    app.querySelectorAll("input[name=storyStyle]").forEach((r) => r.addEventListener("change", (ev) => { S.story = ev.target.value; S.spicy = ev.target.value === "spicy"; save(); }));
    document.getElementById("dates").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      S.exam = f.get("exam"); S.start = f.get("start");
      Object.keys(S.att).forEach((id) => schedule(Number(id)));
      save();
      document.getElementById("saved").hidden = false;
    });
    const imp = document.getElementById("importFile");
    if (imp) imp.addEventListener("change", (ev) => {
      const file = ev.target.files[0];
      const msg = document.getElementById("importMsg");
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!valid(data)) throw new Error("bad");
          S = norm(data); save();
          msg.textContent = `Progress imported into ${user.name}.`;
        } catch (err) {
          msg.textContent = "That file isn’t an Essay Jar progress file. Nothing was changed.";
        }
        msg.hidden = false;
      };
      reader.readAsText(file);
    });
  };

  /* ---------- the jar slip ---------- */
  const showSlip = (e, exam) => {
    modal.innerHTML = `
      <div class="veil" data-act="close"></div>
      <div class="slip-card" role="dialog" aria-modal="true" aria-labelledby="slipq">
        <p class="slip-num">Essay ${e.id}</p>
        <p class="slip-q" id="slipq">${esc(e.q)}</p>
        <div class="actions">
          ${exam
            ? `<a class="btn" href="#/exam/${e.id}">Start the clock</a>`
            : `<a class="btn" href="#/recall/${e.id}">Recall it</a><button class="btn ghost" data-act="draw">Draw again</button>`}
        </div>
      </div>`;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    const first = modal.querySelector(".btn");
    if (first) first.focus();
  };
  const closeModal = () => {
    modal.hidden = true; modal.innerHTML = "";
    document.body.classList.remove("modal-open");
  };

  /* ---------- global actions ---------- */
  document.addEventListener("click", (ev) => {
    if (ev.target.closest('a[href^="#/exam/"]')) wakeAudio();
    const tBtn = ev.target.closest("[data-tact], [data-tset]");
    if (tBtn) {
      const el = tBtn.closest(".timer");
      if (!el || el.hasAttribute("data-locked")) return;
      if (tBtn.dataset.tset) {
        stopTicker();
        el.dataset.secs = tBtn.dataset.tset;
        el.querySelectorAll("[data-tset]").forEach((b) => b.setAttribute("aria-pressed", String(b === tBtn)));
        paintTimer(el, Number(tBtn.dataset.tset));
        setTimerState(el, "idle");
        return;
      }
      if (tBtn.dataset.tact === "reset") {
        stopTicker();
        paintTimer(el, Number(el.dataset.secs));
        setTimerState(el, "idle");
        return;
      }
      wakeAudio();
      if (el.dataset.state === "running") { stopTicker(); setTimerState(el, "paused"); }
      else {
        if (el.dataset.state === "done") paintTimer(el, Number(el.dataset.secs));
        runTimer(el, nudgeNext);
      }
      return;
    }
    const lb = ev.target.closest("[data-learned], [data-unlearn]");
    if (lb) {
      if (lb.dataset.learned) markLearned(Number(lb.dataset.learned), true);
      else unmarkLearned(Number(lb.dataset.unlearn));
      route();
      return;
    }
    const sw = ev.target.closest("[data-user]");
    if (sw) { switchTo(users.find((u) => u.id === sw.dataset.user)); location.hash = "#/"; return; }
    const del = ev.target.closest("[data-deluser]");
    if (del) {
      const u = users.find((x) => x.id === del.dataset.deluser);
      if (u && confirm(`Delete ${u.name} and all of their progress on this device?`)) { deleteUser(u.id); route(); }
      return;
    }
    const el = ev.target.closest("[data-act]");
    if (!el) return;
    const act = el.dataset.act;
    if (act === "draw") { closeModal(); showSlip(draw(false), false); }
    if (act === "pw-random") { const p = PWS[Math.floor(Math.random() * PWS.length)]; if (p) location.hash = `#/play/${p.id}`; }
    else if (act === "exam-draw") showSlip(draw(true), true);
    else if (act === "close") closeModal();
    else if (act === "guest") { switchTo(null); location.hash = "#/"; }
    else if (act === "guest-play") { session.set(GUEST_KEY, "1"); location.hash = "#/"; route(); }
    else if (act === "logout") logout();
    else if (act === "cover") {
      const on = el.getAttribute("aria-pressed") !== "true";
      el.setAttribute("aria-pressed", String(on));
      el.textContent = on ? "Show all answers" : "Cover the answers";
      document.querySelector(".points").classList.toggle("covered", on);
      document.querySelectorAll(".atom-text").forEach((t) => t.classList.remove("peek"));
    }
    else if (act === "export" && user) {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `essay-jar-${user.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${today()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
    else if (act === "reset" && user) {
      if (confirm(`Delete every attempt and schedule for ${user.name}?`)) {
        S = fresh(); save();
        store.keys().filter((k) => k.startsWith(draftPrefix(user.id))).forEach((k) => store.del(k));
        location.hash = "#/";
        route();
      }
    }
  });
  // Reveal one covered line at a time on the notes page.
  document.addEventListener("click", (ev) => {
    const t = ev.target.closest(".covered .atom");
    if (t) t.querySelector(".atom-text").classList.add("peek");
  });
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && !modal.hidden) closeModal(); });
  // Any key brings you back into EssayType; moving the mouse brings the page back.
  document.addEventListener("keydown", (ev) => {
    if (!ET || document.activeElement === ET.input || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === "TEXTAREA" || tag === "SELECT" || (tag === "INPUT" && document.activeElement !== ET.input)) return;
    if (ev.key.length === 1 && !(tag === "BUTTON" && (ev.key === " "))) ET.focus();
  });
  document.addEventListener("mousemove", () => document.body.classList.remove("et-focus"), { passive: true });
  // In answer boxes, Tab types an arrow (Shift + Tab still moves focus).
  document.addEventListener("keydown", (ev) => {
    const t = ev.target;
    if (ev.key !== "Tab" || ev.shiftKey || ev.ctrlKey || ev.altKey || ev.metaKey) return;
    if (!t || t.tagName !== "TEXTAREA" || !t.classList.contains("answer-box") || t.readOnly) return;
    ev.preventDefault();
    const before = t.value.slice(0, t.selectionStart);
    t.setRangeText((!before || /\s$/.test(before) ? "" : " ") + "→ ", t.selectionStart, t.selectionEnd, "end");
    t.dispatchEvent(new Event("input", { bubbles: true }));
  });

  /* ---------- router ---------- */
  const route = () => {
    clearInterval(timer); timer = null;
    if (learnCleanup) learnCleanup();
    stopTicker();
    destroyET();
    closeModal();
    app.onclick = null; app.onsubmit = null;
    stopGame();
    if (kicked) return showKick();
    const [view, arg, arg2] = location.hash.replace(/^#\/?/, "").split("/");
    const e = E[Number(view === "game" ? arg2 : arg)];
    window.scrollTo(0, 0);
    if (ONLINE && !user && session.get(GUEST_KEY) !== "1" && !["login", "how"].includes(view) && !(view === "call" && arg)) return viewLogin();
    if (view === "study" && e) return viewStudy(e);
    if (view === "learn" && e) return viewLearn(e);
    if (view === "type" && e) return viewType(e);
    if (view === "play" && e) return viewPlay(e);
    if (view === "game" && e && arg === "build") return viewBuild(e);
    if (view === "game" && e && arg === "gaps") return viewRush(e);
    if (view === "boss" && e) return viewRecall(e, "boss");
    if (view === "daily") return viewDaily(arg === "more");
    if (view === "call") return arg ? viewCallRoom(arg) : viewCallSetup();
    if (view === "recall" && e) return viewRecall(e, "practice");
    if (view === "exam" && e) return viewRecall(e, "exam");
    if (view === "exam") return viewExamStart();
    if (view === "pathways") return viewPathways();
    if (view === "how") return viewHow();
    if (view === "users") return viewUsers();
    if (view === "login") return viewLogin();
    if (view === "account") return viewAccount();
    if (view === "board") return viewBoard();
    if (view === "admin") return viewAdmin();
    if (view === "settings") return viewSettings();
    viewHome();
  };
  window.addEventListener("hashchange", route);
  route();
  bootSync();
  setTimeout(ping, 1500);
})();
