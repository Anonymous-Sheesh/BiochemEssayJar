/* Essay Jar — recall practice for essay exams. No build step, no server. */
(() => {
  "use strict";

  const C = window.COURSE;
  const KEY = "essayjar:" + C.id;
  const DRAFT = "essayjar-draft:" + C.id + ":";
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
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage full or blocked */ } },
    del: (k) => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  /* ---------- progress ---------- */
  const fresh = () => ({ v: 1, start: today(), exam: C.examDate, att: {}, due: {} });
  const load = () => {
    try { const s = JSON.parse(store.get(KEY)); if (s && s.v === 1 && s.att && s.due) return s; } catch (e) { /* fall through */ }
    return fresh();
  };
  let S = load();
  const save = () => store.set(KEY, JSON.stringify(S));
  save();

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

  /* ---------- scheduling ---------- */
  const atts = (id) => S.att[id] || [];
  const cleanDays = (id) => new Set(atts(id).filter((a) => a.score >= 0.9 && !a.hint).map((a) => a.d)).size;
  const status = (id) => {
    const a = atts(id);
    if (!a.length) return "new";
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
    if (!a.length) { delete S.due[id]; return; }
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
      .filter((e) => atts(e.id).length && S.due[e.id] && diff(S.due[e.id], t) >= 0)
      .sort((a, b) => (S.due[a.id] < S.due[b.id] ? -1 : 1));
    const fresh = C.essays.filter((e) => !atts(e.id).length && (e.day || 1) <= di);
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
  const topbar = (back) => `
    <header class="topbar">
      <a class="brand" href="#/">Essay Jar</a>
      <nav>${back ? `<a href="#/">Today</a>` : ""}<a href="#/settings">Settings</a></nav>
    </header>`;

  const footer = () => `
    <footer class="foot">
      <p>Made by Ibad Siddiqui. Progress is saved in this browser only, so back it up from Settings now and then.</p>
    </footer>`;

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

    let phase;
    if (di <= PLAN_DAYS) phase = `Day ${di} of the ${PLAN_DAYS}-day learning plan.`;
    else if (left > 0) phase = "Every essay has been introduced. From now on it’s jar draws and mock exams.";
    else phase = "";

    const items = [
      ...reviews.map((e) => row(e, `<span class="tag">Review</span><a class="btn small" href="#/recall/${e.id}">Recall</a>`)),
      ...fresh.map((e) => row(e, `<span class="tag">New</span><a class="btn small ghost" href="#/study/${e.id}">Study</a><a class="btn small" href="#/recall/${e.id}">Recall</a>`))
    ];

    const groups = {};
    C.essays.forEach((e) => { (groups[e.lecture] = groups[e.lecture] || []).push(e); });

    app.innerHTML = `
      ${topbar(false)}
      <main class="wrap">
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

        <section class="panel today">
          <h2>Today</h2>
          ${items.length
            ? `<p class="hint">New essays: study them, then close the notes and recall. Reviews: recall straight away, no peeking.</p><ul class="rows">${items.join("")}</ul>`
            : `<p class="empty">Nothing is due today. Draw from the jar, or run a mock exam.</p>`}
        </section>

        <section class="all">
          <h2>All ${C.essays.length} essays</h2>
          ${Object.keys(groups).map((l) => `
            <h3>${esc((C.lectures && C.lectures[l]) || l)}</h3>
            <ul class="rows">${groups[l].map((e) => row(e)).join("")}</ul>`).join("")}
        </section>
      </main>
      ${footer()}`;
  };

  /* ---------- study ---------- */
  const viewStudy = (e) => {
    const st = status(e.id);
    const plan = e.day ? ` Planned for day ${e.day}.` : "";
    app.innerHTML = `
      ${topbar(true)}
      <main class="wrap study">
        <p class="meta">Essay ${e.id}, from ${esc((C.lectures && C.lectures[e.lecture]) || e.lecture)}.${plan} Status: ${LABEL[st]}.</p>
        <h1 class="question">${esc(e.q)}</h1>
        <div class="actions">
          <button class="btn ghost" data-act="cover" aria-pressed="false">Cover the answers</button>
          <a class="btn" href="#/recall/${e.id}">Close the notes and recall</a>
        </div>

        <section class="block draw-first">
          <h2>Draw this first</h2>
          ${e.img ? `<img src="${esc(e.img)}" alt="Professor’s diagram for essay ${e.id}">` : ""}
          <p>${esc(e.draw)}</p>
        </section>

        ${e.hook ? `<section class="block story"><h2>The story</h2><p>${esc(e.hook)}</p></section>` : ""}

        <section class="points">
          <h2 class="points-title">What the essay must contain</h2>
          <p class="hint">Pass points are what you need to pass. Boost points make the answer strong. Tap a covered line to reveal it.</p>
          ${e.sections.map((s) => `
            <div class="sec">
              <h3>${esc(s.h)}</h3>
              <ul class="atoms">
                ${s.atoms.map((a) => `
                  <li class="atom tier-${a.tier}">
                    <span class="tier">${a.tier === "pass" ? "Pass" : "Boost"}</span>
                    <span class="atom-body">
                      <span class="atom-text" tabindex="-1">${esc(a.s)}</span>
                      <span class="src">${esc(a.src || "")}</span>
                      ${a.note ? `<span class="note">${esc(a.note)}</span>` : ""}
                    </span>
                  </li>`).join("")}
              </ul>
            </div>`).join("")}
        </section>

        ${e.links ? `<p class="links">Connections: ${esc(e.links)}</p>` : ""}
      </main>
      ${footer()}`;
  };

  /* ---------- recall and exam ---------- */
  const viewRecall = (e, mode) => {
    const exam = mode === "exam";
    const st = { hint: false, conf: null, done: false };
    const draft = store.get(DRAFT + e.id) || "";

    app.innerHTML = `
      ${topbar(true)}
      <main class="wrap recall">
        <p class="meta">${exam ? "Mock exam. No notes, no hints." : `Essay ${e.id}. Type everything you remember, in any order.`}</p>
        <h1 class="question">${esc(e.q)}</h1>
        ${exam ? `<p class="clock" id="clock">${pad(C.examMinutes)}:00</p>` : ""}
        <div class="skeleton" id="skeleton" hidden>
          <p>The sections, nothing more:</p>
          <ol>${e.sections.map((s) => `<li>${esc(s.h)}</li>`).join("")}</ol>
        </div>
        <label class="sr" for="ans">Your answer</label>
        <textarea id="ans" class="answer-box" spellcheck="false" autocomplete="off"
          placeholder="Start with what you would draw, then write everything else.">${esc(draft)}</textarea>
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
        <p class="kbd-hint">Ctrl + Enter also checks.</p>
        <div id="result"></div>
      </main>`;

    const ans = document.getElementById("ans");
    ans.focus();
    ans.addEventListener("input", () => store.set(DRAFT + e.id, ans.value));
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

    if (exam) {
      const end = Date.now() + C.examMinutes * 60000;
      const clock = document.getElementById("clock");
      const tick = () => {
        const ms = Math.max(0, end - Date.now());
        const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000);
        clock.textContent = pad(m) + ":" + pad(s);
        clock.classList.toggle("low", ms < 10 * 60000);
        if (ms <= 0) finish();
      };
      tick();
      timer = setInterval(tick, 1000);
    }

    function finish() {
      if (st.done) return;
      st.done = true;
      clearInterval(timer); timer = null;
      const text = ans.value;
      store.del(DRAFT + e.id);
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
      ans.readOnly = true;
      app.querySelector(".bar").hidden = true;
      app.querySelector(".kbd-hint").hidden = true;
      ans.hidden = true;
      renderResult(e, R, st);
      document.getElementById("result").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
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
    else lines.push("Not there yet. Study it once more, then recall it again tomorrow.");
    if (rec.hint) lines.push("You used the skeleton, so this doesn’t count as a clean recall.");
    const cd = cleanDays(e.id);
    if (status(e.id) === "ready") lines.push("Three clean recalls on separate days: this essay is exam-ready.");
    else if (rec.score >= 0.9 && !rec.hint) lines.push(`${cd} of 3 clean recalls on separate days.`);
    if (S.due[e.id]) lines.push(`Next review: ${longDate(S.due[e.id])}.`);
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
        <p>You missed ${missed.length} pass point${missed.length === 1 ? "" : "s"}. Where they were: ${esc(secList)}. Type whatever comes back now.</p>
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
        <p class="hint">Ticked automatically from your words. Tap a line to correct it; the score updates.${recovered ? ` ${recovered} point${recovered === 1 ? "" : "s"} came back on the second go — good, but they don’t count yet.` : ""}</p>
        ${e.sections.map((s, si) => `
          <div class="sec">
            <h3>${esc(s.h)}</h3>
            <ul class="atoms">
              ${s.atoms.map((a) => {
                const state = R.got[a.id] ? "got" : R.recovered[a.id] ? "recovered" : "missed";
                const mark = state === "got" ? "✓" : state === "recovered" ? "↺" : a.tier === "pass" ? "⊗" : "○";
                return `
                <li>
                  <button class="check-row ${state} tier-${a.tier}" data-atom="${si}.${s.atoms.indexOf(a)}" aria-pressed="${state === "got"}">
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
        <a class="btn ghost" href="#/study/${e.id}">Study this essay</a>
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
      const [si, ai] = btn.dataset.atom.split(".").map(Number);
      const a = e.sections[si].atoms[ai];
      R.got[a.id] = !R.got[a.id];
      if (R.got[a.id]) delete R.recovered[a.id];
      updateScore(e, R);
      const y = window.scrollY;
      renderResult(e, R, st);
      window.scrollTo(0, y);
    }));
  };

  /* ---------- exam start ---------- */
  const viewExamStart = () => {
    app.innerHTML = `
      ${topbar(true)}
      <main class="wrap narrow">
        <h1 class="page-title">Mock exam</h1>
        <p class="lede">One essay from all ${C.essays.length}, every one equally likely, just like the box. ${C.examMinutes} minutes on the clock, no notes and no hints. When time runs out it hands itself in.</p>
        <p class="hint">Do one of these every few days once all essays are introduced, and do at least one on paper to feel your handwriting speed.</p>
        <div class="actions"><button class="btn" data-act="exam-draw">Draw my question</button></div>
      </main>
      ${footer()}`;
  };

  /* ---------- settings ---------- */
  const viewSettings = () => {
    app.innerHTML = `
      ${topbar(true)}
      <main class="wrap narrow settings">
        <h1 class="page-title">Settings</h1>
        <form id="dates" class="block">
          <h2>Dates</h2>
          <label>Exam date <input type="date" name="exam" value="${esc(S.exam)}" required></label>
          <label>Plan start date <input type="date" name="start" value="${esc(S.start)}" required></label>
          <p class="hint">New essays appear on their planned day counted from the start date (${PLAN_DAYS} days to introduce all of them).</p>
          <button class="btn" type="submit">Save dates</button>
          <p class="saved" id="saved" hidden>Dates saved.</p>
        </form>
        <section class="block">
          <h2>Back up your progress</h2>
          <p>Progress lives in this browser. Export it to move between laptop and phone, or as a backup.</p>
          <div class="actions">
            <button class="btn ghost" data-act="export">Export progress</button>
            <label class="btn ghost file">Import progress<input type="file" accept="application/json,.json" id="importFile"></label>
          </div>
          <p class="saved" id="importMsg" hidden></p>
        </section>
        <section class="block danger">
          <h2>Start over</h2>
          <p>Deletes every attempt and schedule on this device.</p>
          <button class="btn ghost danger-btn" data-act="reset">Delete my progress</button>
        </section>
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
    document.getElementById("importFile").addEventListener("change", (ev) => {
      const file = ev.target.files[0];
      const msg = document.getElementById("importMsg");
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!data || data.v !== 1 || !data.att || !data.due) throw new Error("bad");
          S = data; save();
          msg.textContent = "Progress imported.";
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
    const el = ev.target.closest("[data-act]");
    if (!el) return;
    const act = el.dataset.act;
    if (act === "draw") { closeModal(); showSlip(draw(false), false); }
    else if (act === "exam-draw") showSlip(draw(true), true);
    else if (act === "close") closeModal();
    else if (act === "cover") {
      const on = el.getAttribute("aria-pressed") !== "true";
      el.setAttribute("aria-pressed", String(on));
      el.textContent = on ? "Show all answers" : "Cover the answers";
      document.querySelector(".points").classList.toggle("covered", on);
      document.querySelectorAll(".atom-text").forEach((t) => t.classList.remove("peek"));
    }
    else if (act === "export") {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `essay-jar-progress-${today()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
    else if (act === "reset") {
      if (confirm("Delete every attempt and schedule on this device?")) {
        S = fresh(); save();
        C.essays.forEach((e) => store.del(DRAFT + e.id));
        location.hash = "#/";
        route();
      }
    }
  });
  // Reveal one covered line at a time on the study page.
  document.addEventListener("click", (ev) => {
    const t = ev.target.closest(".covered .atom");
    if (t) t.querySelector(".atom-text").classList.add("peek");
  });
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && !modal.hidden) closeModal(); });

  /* ---------- router ---------- */
  const route = () => {
    clearInterval(timer); timer = null;
    closeModal();
    const [view, arg] = location.hash.replace(/^#\/?/, "").split("/");
    const e = E[Number(arg)];
    window.scrollTo(0, 0);
    if (view === "study" && e) return viewStudy(e);
    if (view === "recall" && e) return viewRecall(e, "practice");
    if (view === "exam" && e) return viewRecall(e, "exam");
    if (view === "exam") return viewExamStart();
    if (view === "settings") return viewSettings();
    viewHome();
  };
  window.addEventListener("hashchange", route);
  route();
})();
