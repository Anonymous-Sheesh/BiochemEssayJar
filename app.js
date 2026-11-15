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

  let user = users.find((u) => u.id === store.get(CUR_KEY)) || null;
  let S = user ? loadState(user.id) : fresh();
  const save = () => { if (user) store.set(keyFor(user.id), JSON.stringify(S)); };
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
        <span class="et-mark" aria-hidden="true">${esc(opts.cue.num)}</span>
        <div class="et-top">
          <p class="et-cue"><span class="et-qnum">Q${esc(opts.cue.num)}</span><span class="et-qtext">${esc(opts.cue.q)}</span><span class="et-qsec"></span></p>
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
        <a href="#/">Today</a>
        <a href="#/how">How to study</a>
        <a href="#/settings">Settings</a>
        <a class="who${user ? "" : " guest"}" href="#/users" title="Switch or create a user">${user ? esc(user.name) : "Guest"}</a>
      </nav>
    </header>`;

  const footer = () => `
    <footer class="foot">
      <p>Made by Ibad Siddiqui. Progress is saved per user in this browser only; back it up from Settings now and then.</p>
    </footer>`;

  const guestNotice = () => user ? "" : `
    <div class="notice">
      <p><strong>You’re studying as a guest, so nothing is saved.</strong> Create a user to keep your progress on this device.</p>
      <a class="btn small" href="#/users">Create a user</a>
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
          ${actions || `<span class="state">${tally(e.id)}<span class="label">${LABEL[st]}</span></span>`}
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
      return `<rect class="slip slip-${st}" x="${x}" y="${y}" width="31" height="12" rx="1.5" transform="rotate(${rot} ${x + 15} ${y + 6})"><title>Essay ${e.id}: ${LABEL[st]}</title></rect>`;
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

  const drawBlock = (e) => `
    <section class="block draw-first">
      <h2>Draw this first</h2>
      ${e.img ? `<img src="${esc(e.img)}" alt="Professor’s diagram for essay ${e.id}">` : ""}
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
  const storyBlock = (e) => e.hook ? `<section class="block story"><h2>The story</h2><p>${esc(e.hook)}</p></section>` : "";

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
      ...reviews.map((e) => row(e, `<span class="tag">Review</span><a class="btn small" href="#/recall/${e.id}">Recall</a>`)),
      ...fresh.map((e) => row(e, `<span class="tag">New</span><button class="btn small ghost" data-learned="${e.id}" title="Learned it outside the app? Adds it to your daily review.">Already learned</button><a class="btn small" href="#/learn/${e.id}">Learn</a>`))
    ];

    const groups = {};
    C.essays.forEach((e) => { (groups[e.lecture] = groups[e.lecture] || []).push(e); });

    app.innerHTML = `
      ${topbar()}
      <main class="wrap">
        ${guestNotice()}
        <section class="hero">
          <div class="hero-text">
            <h1>${esc(C.title)}</h1>
            <p class="sub">${esc(C.subtitle)}</p>
            <p class="lede">${esc(when)} ${esc(phase)}</p>
            <p class="counts">In the jar: ${esc(countText)}.</p>
            <div class="actions">
              <button class="btn" data-act="draw">Draw from the jar</button>
              <a class="btn ghost" href="#/exam">Mock exam, ${C.examMinutes} minutes</a>
            </div>
          </div>
          <button class="jar-btn" data-act="draw" aria-label="Draw an essay from the jar">${jarSVG()}</button>
        </section>

        ${dailyPanel()}

        <section class="panel today">
          <h2>Today</h2>
          ${items.length
            ? `<p class="hint">New essays: press Learn and follow the steps. Reviews: recall straight from the question, no peeking first.</p><ul class="rows">${items.join("")}</ul>`
            : `<p class="empty">Nothing is due today. Draw from the jar, or run a mock exam.</p>`}
        </section>

        <section class="all">
          <h2>All ${C.essays.length} essays</h2>
          ${Object.keys(groups).map((l) => `
            <h3>${esc(lectureName(l))}</h3>
            <ul class="rows">${groups[l].map((e) => row(e)).join("")}</ul>`).join("")}
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
        <p class="meta">Essay ${e.id}, from ${esc(lectureName(e.lecture))}.${plan} Status: ${LABEL[st]}.</p>
        <h1 class="question">${esc(e.q)}</h1>
        <div class="actions">
          <a class="btn" href="#/learn/${e.id}">Learn it step by step</a>
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
          <h2 class="points-title">What the essay must contain</h2>
          <p class="hint">Pass points are what you need to pass. Boost points make the answer strong. When covered, tap a line to reveal it.</p>
          ${e.sections.map((s) => `<div class="sec"><h3>${esc(s.h)}</h3>${atomList(s.atoms)}</div>`).join("")}
        </section>
        ${e.links ? `<p class="links">Connections: ${esc(e.links)}</p>` : ""}
      </main>
      ${footer()}`;
  };

  /* ---------- learn: guided first session for a new essay ----------
     Warm-up guess → diagram (read, hide, sketch, compare) → each section
     (read, hide, type back, re-read only misses, repeat) → whole essay recall. */
  const viewLearn = (e) => {
    const secs = e.sections;
    const steps = ["warm", "draw", ...secs.map((_, i) => i), "whole"];
    const L = { step: 0, phase: "read", targets: null, recalled: {}, result: null };
    const stepName = (s) => s === "warm" ? "Warm-up guess" : s === "draw" ? "The chain"
      : s === "whole" ? "The whole essay" : secs[s].h;

    const render = () => {
      stopTicker();
      destroyET();
      const s = steps[L.step];
      if (s === "whole" && !S.learned[e.id]) markLearned(e.id, false);
      app.innerHTML = `
        ${topbar()}
        <main class="wrap learn">
          ${guestNotice()}
          <p class="meta">Learning essay ${e.id}. Step ${L.step + 1} of ${steps.length}: ${esc(stepName(s))}.</p>
          <ol class="steps" aria-hidden="true">${steps.map((_, i) => `<li class="${i < L.step ? "done" : i === L.step ? "now" : ""}"></li>`).join("")}</ol>
          <h1 class="question">${esc(e.q)}</h1>
          <section class="stage">${stage(s)}</section>
        </main>`;
      const host = document.getElementById("etHost");
      if (host) {
        const passages = s === "draw"
          ? chainPassages(e)
          : [{ label: "points", head: secs[s].h, text: (L.targets || secs[s].atoms).map((a) => a.s).join(" "), keys: keyTokens(L.targets || secs[s].atoms) }];
        ET = mountEssayType(host, { passages, cue: { num: e.id, q: e.q }, onLastRound: () => nudgeNext(host) });
        window.scrollTo(0, Math.max(0, host.getBoundingClientRect().top + window.scrollY - 96));
      }
      const box = app.querySelector(".stage textarea");
      if (box) box.focus();
      if (box) box.addEventListener("keydown", (ev) => {
        if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") {
          ev.preventDefault();
          const b = app.querySelector("[data-l=check], [data-l=next]");
          if (b) b.click();
        }
      });
    };

    const stage = (s) => {
      if (s === "warm") return `
        <h2>Warm-up guess</h2>
        <p>Before you read anything, type whatever you already know or can guess about this question. Wrong guesses are fine: trying first makes the reading stick better.</p>
        <label class="sr" for="warm">Your guess</label>
        <textarea id="warm" class="answer-box short" spellcheck="false" autocomplete="off" placeholder="Anything that comes to mind…"></textarea>
        <div class="actions"><button class="btn" data-l="next">Continue</button><button class="btn ghost" data-l="next">Skip</button></div>`;

      if (s === "draw") {
        if (L.phase === "hidden") return `
          <h2>Sketch it from memory</h2>
          <p>Take a sheet of paper and draw the diagram without looking: metabolites, arrows, enzymes, cofactors. Then compare.</p>
          <div class="actions"><button class="btn" data-l="compare">Compare with the original</button></div>`;
        if (L.phase === "type") return `
          <h2>Type the chain</h2>
          <p class="hint">The question, then the whole essay as one chain. Read each link as you type it: it says what happens and why. Copy first, then gaps, then first letters. The story is there too.</p>
          <div id="etHost"></div>
          <div class="actions">
            <button class="btn" data-l="hide" data-nudge>I’m ready: hide it and sketch</button>
            <button class="btn ghost" data-l="read">Back to reading</button>
          </div>`;
        return `
          ${L.phase === "compare" ? `<p class="callout">Correct your sketch where it differs. If it was far off, read it once more and sketch again.</p>` : `<p>Read the diagram, the chain and the story for three minutes. Follow the chain link by link and ask why each step leads to the next. Then type the chain in EssayType, then hide everything and sketch the diagram on paper.</p>${timerHTML(180, "Reading time")}`}
          ${drawBlock(e)}
          ${L.phase === "compare" ? "" : chainBlock(e)}
          ${storyBlock(e)}
          <div class="actions">
            ${L.phase === "compare"
              ? `<button class="btn ghost" data-l="hide">Sketch it again</button><button class="btn" data-l="next">Next: the sections</button>`
              : `<button class="btn" data-l="type" data-nudge>Type it in EssayType</button><button class="btn ghost" data-l="hide">Skip to sketching</button>`}
          </div>`;
      }

      if (s === "whole") return `
        <h2>The whole essay</h2>
        <p>Every section has come back at least once. Now close everything and write the full essay from the question alone, diagram first. This first full recall starts the essay’s review schedule.</p>
        <p class="callout ok">Essay ${e.id} is now marked as learned. It joins your daily review from tomorrow.</p>
        <p class="hint">Take a 5 to 10 minute break first: stand up, get some water, don’t look at the notes. A short gap makes this recall work harder, and that effort is what makes it stick.</p>
        ${timerHTML(300, "Break", { choices: [5, 10] })}
        <div class="actions"><a class="btn" href="#/recall/${e.id}" data-nudge>Recall the whole essay</a></div>`;

      // a section
      const sec = secs[s];
      const shown = L.targets || sec.atoms;
      const passTotal = sec.atoms.filter((a) => a.tier === "pass").length;
      const readSecs = Math.min(150, Math.max(30, Math.round(shown.length * 25 / 5) * 5));
      if (L.phase === "read") return `
        <h2>${esc(sec.h)}</h2>
        <p class="hint">${L.targets
          ? `Read the ${plural(L.targets.length, "point")} you missed, about ${mmss(readSecs)}. Then type them in EssayType, then hide them and type them back.`
          : `Read these ${plural(sec.atoms.length, "point")}, about ${mmss(readSecs)}. Notice how they connect. Then type them in EssayType, then hide them and type them back from memory.`}</p>
        ${timerHTML(readSecs, "Reading time", { compact: true })}
        ${atomList(shown, { noSrc: true })}
        <div class="actions"><button class="btn" data-l="type" data-nudge>Type it in EssayType</button><button class="btn ghost" data-l="hide">Skip to hide and type back</button></div>`;
      if (L.phase === "type") return `
        <h2>${esc(sec.h)}</h2>
        <p class="hint">Each round runs question, then section, then points, so the points are always chained to their question. Copy first, then gaps, then first letters.</p>
        <div id="etHost"></div>
        <div class="actions">
          <button class="btn" data-l="hide" data-nudge>I’m ready: hide and type them back</button>
          <button class="btn ghost" data-l="read">Back to reading</button>
        </div>`;
      if (L.phase === "hidden") return `
        <h2>${esc(sec.h)}</h2>
        <p class="hint">${L.targets
          ? `Type the ${plural(L.targets.length, "point")} you missed. Your own words, any order.`
          : `Type everything from this section: ${plural(passTotal, "pass point")}${sec.atoms.length > passTotal ? ` and ${plural(sec.atoms.length - passTotal, "boost point")}` : ""}. Your own words, any order.`}</p>
        <p class="cue-line"><span>Q${e.id}</span> ${esc(e.q)} <b>→ ${esc(sec.h)}</b></p>
        <label class="sr" for="secBox">Your recall</label>
        <textarea id="secBox" class="answer-box short" spellcheck="false" autocomplete="off"></textarea>
        <div class="actions"><button class="btn" data-l="check">Check</button></div>`;
      // phase "checked"
      const missed = sec.atoms.filter((a) => a.tier === "pass" && !L.recalled[a.id]);
      const R = L.result;
      return `
        <h2>${esc(sec.h)}</h2>
        <p class="score"><strong>${passTotal - missed.length} of ${passTotal}</strong> pass points recalled in this section.</p>
        ${R.text.trim() ? `<div class="block your-answer"><div class="answer-view">${highlight(R.text, R.T, R.hitSet)}</div></div>` : ""}
        <p class="hint">Tap a line if the check missed something you did write.</p>
        <ul class="atoms learn-check">
          ${sec.atoms.map((a) => {
            const got = !!L.recalled[a.id];
            const mark = got ? "✓" : a.tier === "pass" ? "⊗" : "○";
            return `<li><button class="check-row ${got ? "got" : "missed"} tier-${a.tier}" data-la="${a.id}" aria-pressed="${got}">
              <span class="mark" aria-hidden="true">${mark}</span>
              <span class="atom-body"><span class="atom-text"><span class="hl">${esc(a.s)}</span></span>
              <span class="src">${a.tier === "pass" ? "Pass" : "Boost"}</span></span></button></li>`;
          }).join("")}
        </ul>
        <div class="actions">
          ${missed.length
            ? `<button class="btn" data-l="reread">Re-read the ${plural(missed.length, "missed point")}</button><button class="btn ghost" data-l="next">Move on anyway</button>`
            : `<p class="callout ok">Section done.</p><button class="btn" data-l="next">${L.step + 1 < steps.length - 1 ? "Next section" : "Next: the whole essay"}</button>`}
        </div>`;
    };

    app.onclick = (ev) => {
      const b = ev.target.closest("[data-l], [data-la]");
      if (!b || !app.querySelector(".learn")) return;
      if (b.dataset.la) {
        L.recalled[b.dataset.la] = !L.recalled[b.dataset.la];
        return render();
      }
      const act = b.dataset.l;
      const s = steps[L.step];
      if (act === "next") { L.step = Math.min(L.step + 1, steps.length - 1); L.phase = "read"; L.targets = null; L.result = null; window.scrollTo(0, 0); }
      else if (act === "hide") L.phase = "hidden";
      else if (act === "type") L.phase = "type";
      else if (act === "read") L.phase = "read";
      else if (act === "compare") L.phase = "compare";
      else if (act === "reread") {
        L.targets = secs[s].atoms.filter((a) => a.tier === "pass" && !L.recalled[a.id]);
        L.phase = "read";
      }
      else if (act === "check") {
        const text = document.getElementById("secBox").value;
        const T = tokenize(text), hitSet = new Set();
        (L.targets || secs[s].atoms).forEach((a) => {
          const hits = checkAtom(T, a);
          if (hits) { L.recalled[a.id] = true; hits.forEach((h) => hitSet.add(h)); }
        });
        L.result = { text, T, hitSet };
        L.phase = "checked";
      }
      render();
    };
    render();
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
  const reviewPool = () => C.essays.filter((e) => { const d = learnedOn(e.id); return d && diff(d, today()) > 0; });
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
  const mkGap = (e, r) => {
    const links = chainLinks(e), keys = keyTokens(e.atoms), qt = qToks(e);
    const cands = [];
    links.forEach((link, li) => {
      const ctx = new Set([...toks(links[li - 1] || ""), ...toks(links[li + 1] || "")]);
      link.split(/\s+/).forEach((w, wi) => {
        const core = wordCore(w), ct = toks(core);
        if (!ct.length || /^(I|II|III|IV|V|VI)$/.test(core) || core.replace(/[^a-z]/gi, "").length < 4) return;
        if (!isKeyWord(core, keys)) return;
        if (ct.some((t) => qt.has(t) || ctx.has(t))) return;
        if (link.split(/\s+/).filter((x, i) => i !== wi && toks(wordCore(x)).join() === ct.join()).length) return;
        cands.push({ li, wi, core });
      });
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
      grade(answer) {
        const need = toks(c.core).filter((t) => (t.length >= 2 || /\d/.test(t)) && !GREEK_NAMES.has(t));
        const have = toks(answer);
        if (!need.length) return false;
        if (have.join("") === toks(c.core).join("")) return true;
        return need.every((t) => hasTok(have, t));
      }
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
        if (kt.length >= 2 && !toks(l).some((t) => qt.has(t))) opts.push({ e, l });
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
  const streak = () => {
    let n = 0, d = today();
    if (!(S.quiz.days[d] && S.quiz.days[d].done)) d = addDays(d, -1);
    while (S.quiz.days[d] && S.quiz.days[d].done) { n++; d = addDays(d, -1); }
    return n;
  };
  const minutes = (items) => Math.max(1, Math.round(items.reduce((s, it) => s + it.secs, 0) / 60));
  const essayList = (ids) => ids.map((id) => "Q" + id).join(", ");

  const dailyPanel = () => {
    const pool = reviewPool(), t = today(), rec = S.quiz.days[t], st = streak();
    const streakHTML = st ? `<p class="streak"><span>${st}</span> ${st === 1 ? "day" : "days"} in a row</p>` : "";
    if (!pool.length) {
      const todayOnly = C.essays.filter((e) => learnedOn(e.id) === t);
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

    const cueHTML = (e) => `<p class="cue-line"><span>Q${e.id}</span> ${esc(e.q)}</p>`;
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
      if (it.type === "which") return head + `<p>It’s <strong>Q${it.e.id}</strong>: ${esc(it.e.q)}</p>`;
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
      save();
      const st = streak();
      const left = reviewPool().filter((e) => !rec.essays.includes(e.id));
      app.innerHTML = `
        ${topbar()}
        <main class="wrap narrow daily-page">
          <h1 class="page-title">Done for today</h1>
          <p class="lede">${firstOK} of ${items.length} right first time.${st ? ` ${st} ${st === 1 ? "day" : "days"} in a row.` : ""}</p>
          <ul class="daily-sum">${Object.keys(per).map((id) => {
            const p = per[id], e = E[id];
            return `<li><span class="ds-q"><b>Q${id}</b> ${esc(e.q)}</span><span class="ds-bar" aria-hidden="true"><i style="width:${Math.round((100 * p.ok) / p.n)}%"></i></span><span class="ds-n">${p.ok} of ${p.n}</span></li>`;
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

  /* ---------- type: EssayType on its own, for any essay ---------- */
  const viewType = (e) => {
    app.innerHTML = `
      ${topbar()}
      <main class="wrap learn type-page">
        <p class="meta">EssayType, essay ${e.id}. Every round starts with the question, then the whole essay as one chain.</p>
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
    ET = mountEssayType(host, { passages: chainPassages(e), cue: { num: e.id, q: e.q } });
  };

  /* ---------- recall and exam ---------- */
  const viewRecall = (e, mode) => {
    const exam = mode === "exam";
    const st = { hint: false, conf: null, done: false };
    const saved = draft.get(e.id);

    app.innerHTML = `
      ${topbar()}
      <main class="wrap recall">
        ${guestNotice()}
        <p class="meta">${exam ? "Mock exam. No notes, no hints." : `Essay ${e.id}. Diagram first, then everything else you remember, in any order.`}</p>
        <h1 class="question">${esc(e.q)}</h1>
        ${exam ? timerHTML(C.examMinutes * 60, "Time left", { locked: true, big: true, note: "No pausing, like the real thing. It hands itself in at zero." }) : ""}
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
    save();
  };

  const verdict = (e, R, st) => {
    const rec = S.att[e.id][R.idx];
    const pct = Math.round(rec.score * 100);
    const lines = [];
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
        <p class="score"><strong>${gp} of ${p.length}</strong> pass points${b.length ? `, ${gb} of ${b.length} boost points` : ""}.</p>
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
        <h1 class="page-title">Mock exam</h1>
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
          <h2>A new essay: press Learn</h2>
          <ol>
            <li><strong>Warm-up guess.</strong> Type what you know before reading. Trying first makes the reading stick.</li>
            <li><strong>The diagram.</strong> Read it with the story, type the story in EssayType, then hide it, sketch it on paper, compare, fix.</li>
            <li><strong>Section by section.</strong> Read a few points, run them through EssayType, then hide them and type them back. Re-read only what you missed and go again, until every pass point has come back once.</li>
            <li><strong>The whole essay.</strong> After a short break, from the question alone. This starts its review schedule.</li>
          </ol>
          <p class="hint">About 25 to 40 minutes per essay. Two new essays a day for the first ten days.</p>
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

  /* ---------- users ---------- */
  const viewUsers = () => {
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
    else if (act === "exam-draw") showSlip(draw(true), true);
    else if (act === "close") closeModal();
    else if (act === "guest") { switchTo(null); location.hash = "#/"; }
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
    stopTicker();
    destroyET();
    closeModal();
    app.onclick = null;
    const [view, arg] = location.hash.replace(/^#\/?/, "").split("/");
    const e = E[Number(arg)];
    window.scrollTo(0, 0);
    if (view === "study" && e) return viewStudy(e);
    if (view === "learn" && e) return viewLearn(e);
    if (view === "type" && e) return viewType(e);
    if (view === "daily") return viewDaily(arg === "more");
    if (view === "recall" && e) return viewRecall(e, "practice");
    if (view === "exam" && e) return viewRecall(e, "exam");
    if (view === "exam") return viewExamStart();
    if (view === "how") return viewHow();
    if (view === "users") return viewUsers();
    if (view === "settings") return viewSettings();
    viewHome();
  };
  window.addEventListener("hashchange", route);
  route();
})();
