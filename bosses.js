/*
  Essay Jar bosses: one original biochem villain per essay, drawn as SVG, plus the arena they fight in.
  Each boss: arch (body shape), c1/c2 (body colours), glow (eye colour), label (badge on the body),
  crown (optional), name, title, taunts (said when you get one wrong).
*/
(function () {
  "use strict";
  var INK = "#16181d";
  var B = {
    1: { arch: "blob", c1: "#b8f06a", c2: "#3d8b2e", glow: "#ff4d6d", label: "HCl", name: "Gastrix", title: "the Acid Maw", taunts: ["My acid digests your memory!", "Pepsin? Never heard of it."] },
    2: { arch: "ghost", c1: "#c8b6ff", c2: "#5b3cc4", glow: "#ffd166", label: "Ub", name: "Ubiquitor", title: "the Tagger", taunts: ["You’re tagged for destruction!", "Straight to the proteasome with you."] },
    3: { arch: "golem", c1: "#a7c4d4", c2: "#3c5a6b", glow: "#7cf2c4", label: "PLP", name: "The Transaminator", title: "Keeper of PLP", taunts: ["Your amino groups belong to me!", "ALT or AST? You mixed them up!"] },
    4: { arch: "demon", c1: "#ff9ecf", c2: "#a61e6a", glow: "#b6ff5c", label: "GDH", name: "Deamina", title: "Queen of Ammonia", taunts: ["I strip your amino groups bare!", "Direct or indirect? You don’t know!"] },
    5: { arch: "ghost", c1: "#9aa8ff", c2: "#2b3a9e", glow: "#ffe46b", label: "5-HT", name: "Lord Pineal", title: "the Night Shade", taunts: ["Sleep... and forget everything.", "Melatonin needs darkness. So does your memory."] },
    6: { arch: "demon", c1: "#ffb08a", c2: "#c2410c", glow: "#fff176", label: "NE", name: "Adrenal Fury", title: "Rage of the Medulla", taunts: ["Fight or flight? You’ll flee!", "DOPA, dopamine... what comes next?"] },
    7: { arch: "ghost", c1: "#8ef0d6", c2: "#0f766e", glow: "#ff5c8a", label: "NH₃", name: "The Ammonia Wraith", title: "Haunter of Neurons", taunts: ["I cross your blood-brain barrier!", "Your α-ketoglutarate is mine!"] },
    8: { arch: "golem", c1: "#ffd978", c2: "#b7791f", glow: "#57e3ff", label: "Gln", name: "Glutamine Golem", title: "the Carrier", taunts: ["I carry your ammonia... and your marks!", "Glutamate or glutamine? Ha!"] },
    9: { arch: "serpent", c1: "#a8e6a3", c2: "#2f7a33", glow: "#ffdd57", label: "Orn", name: "Ornithine Ouroboros", title: "the Endless Cycle", taunts: ["The cycle never ends!", "Where does fumarate go? You forgot!"] },
    10: { arch: "blob", c1: "#e2a8ff", c2: "#7b2fa8", glow: "#ff6b6b", label: "Phe", crown: true, name: "The Phenyl King", title: "Lord of PKU", taunts: ["Bow to the Phenyl King!", "Smell that? Mousy. Like your answer."] },
    11: { arch: "crystal", c1: "#ff8f8f", c2: "#8f1d1d", glow: "#ffe066", label: "ALA", crown: true, name: "Hemin Overlord", title: "Ruler of ALA", taunts: ["I inhibit your progress!", "Three ways I stop ALA synthase. Name one!"] },
    12: { arch: "demon", c1: "#ff7a7a", c2: "#7a0b1f", glow: "#ffd23f", label: "PBG", name: "Count Porphyrin", title: "the Light-Shy", taunts: ["Sunlight burns me, but you burn more!", "Which enzyme? Which porphyria? Ha!"] },
    13: { arch: "golem", c1: "#c9b3a6", c2: "#5b3b2c", glow: "#ff8c42", label: "Fe²⁺", name: "The Ferritin Fortress", title: "Hoarder of Iron", taunts: ["Hepcidin locks the door on you!", "How much iron per transferrin? Ha!"] },
    14: { arch: "blob", c1: "#fff27a", c2: "#c9a10a", glow: "#ff3d71", label: "Bil", name: "Bilirubin Blob", title: "the Yellow Ooze", taunts: ["I ride albumin straight to your brain!", "Conjugate me if you can!"] },
    15: { arch: "blob", c1: "#d9b88f", c2: "#6b4423", glow: "#9cff57", label: "UBG", name: "Stercobilin Sludge", title: "of the Lower Gut", taunts: ["Down the gut you go!", "Urobilinogen or stercobilin? Confused yet?"] },
    16: { arch: "ghost", c1: "#f4f19c", c2: "#a8a313", glow: "#ff5ca8", label: "34", name: "The Jaundice Jester", title: "Painter in Yellow", taunts: ["Hemolytic or obstructive? Pick one!", "Dark urine, pale stools. What does it mean?"] },
    17: { arch: "serpent", c1: "#8fd6ff", c2: "#155e8f", glow: "#ffb02e", label: "PRPP", name: "The PRPP Hydra", title: "Many-Headed Synthesis", taunts: ["Cut one brake, two more appear!", "What does AMP inhibit? You don’t know!"] },
    18: { arch: "crystal", c1: "#d9f3ff", c2: "#3a8fc4", glow: "#ff4757", label: "UA", name: "Urate Golem", title: "Lord of Gout", taunts: ["My crystals stab your joints!", "Xanthine oxidase sends its regards."] },
    19: { arch: "ghost", c1: "#c3c9d2", c2: "#3b4048", glow: "#6bf0ff", label: "RNR", name: "The Reductase Reaper", title: "Harvester of Ribose", taunts: ["dATP says stop. So do I.", "Thioredoxin? It’s mine now."] },
    20: { arch: "blob", c1: "#ffc078", c2: "#c25a0b", glow: "#5cf2ff", label: "OA", name: "Orotic Ooze", title: "Clogger of UMP", taunts: ["No UMP for you!", "Uridine? You’ll never find it."] },
    final: { arch: "crystal", c1: "#ffe08a", c2: "#b5651d", glow: "#ff2e63", label: "C5", crown: true, name: "The Colloquium", title: "Final boss", taunts: ["Twenty essays. One slip of paper. Ready?"] }
  };
  var GENERIC = ["Is that all you remember?", "Wrong! Try that link again.", "Ha! The exam will be harder than me."];

  var uid = 0;
  var eyes = function (x1, x2, y, glow, r) {
    r = r || 13;
    return '<g class="bs-eyes">' +
      '<ellipse cx="' + x1 + '" cy="' + y + '" rx="' + r + '" ry="' + (r * 1.12) + '" fill="#fff8e7" stroke="' + INK + '" stroke-width="3"/>' +
      '<ellipse cx="' + x2 + '" cy="' + y + '" rx="' + r + '" ry="' + (r * 1.12) + '" fill="#fff8e7" stroke="' + INK + '" stroke-width="3"/>' +
      '<circle class="bs-pupil" cx="' + (x1 + 3) + '" cy="' + (y + 3) + '" r="' + (r * 0.5) + '" fill="' + glow + '"/>' +
      '<circle class="bs-pupil" cx="' + (x2 - 3) + '" cy="' + (y + 3) + '" r="' + (r * 0.5) + '" fill="' + glow + '"/>' +
      '<circle cx="' + (x1 + 5) + '" cy="' + (y + 0.5) + '" r="' + (r * 0.17) + '" fill="#fff"/>' +
      '<circle cx="' + (x2 - 1) + '" cy="' + (y + 0.5) + '" r="' + (r * 0.17) + '" fill="#fff"/>' +
      '<path d="M' + (x1 - r - 5) + ' ' + (y - r - 7) + ' L' + (x1 + r) + ' ' + (y - r + 3) + '" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M' + (x2 + r + 5) + ' ' + (y - r - 7) + ' L' + (x2 - r) + ' ' + (y - r + 3) + '" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/>' +
      '</g>';
  };
  var mouth = function (cx, y, w, long) {
    var f = long ? 15 : 10;
    return '<path d="M' + (cx - w) + ' ' + y + ' Q' + cx + ' ' + (y + w * 0.95) + ' ' + (cx + w) + ' ' + y + ' Q' + cx + ' ' + (y + w * 0.35) + ' ' + (cx - w) + ' ' + y + 'Z" fill="' + INK + '" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M' + (cx - w * 0.55 - 5) + ' ' + (y + w * 0.11) + ' l5 ' + f + ' l5 ' + (-f + 1) + 'Z M' + (cx + w * 0.55 + 5) + ' ' + (y + w * 0.11) + ' l-5 ' + f + ' l-5 ' + (-f + 1) + 'Z" fill="#fff8e7"/>';
  };
  var label = function (x, y, text, fill, size) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-family="Roboto Mono, ui-monospace, monospace" font-weight="700" font-size="' + (size || 17) + '" fill="' + (fill || INK) + '" opacity="0.8">' + text + '</text>';
  };
  var crown = function (y) {
    return '<path d="M68 ' + (y + 26) + ' L76 ' + y + ' L89 ' + (y + 16) + ' L100 ' + (y - 6) + ' L111 ' + (y + 16) + ' L124 ' + y + ' L132 ' + (y + 26) + 'Z" fill="#f6c945" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>' +
      '<circle cx="100" cy="' + (y + 16) + '" r="4" fill="#e63946"/><circle cx="83" cy="' + (y + 20) + '" r="3" fill="#4cc9f0"/><circle cx="117" cy="' + (y + 20) + '" r="3" fill="#4cc9f0"/>';
  };
  var mirror = function (svg) { return '<g transform="translate(200 0) scale(-1 1)">' + svg + '</g>'; };

  var ARCH = {
    blob: function (b, g) {
      return '<path d="M34 150 C24 104 46 58 100 52 C154 58 176 104 166 150 C168 170 152 174 144 166 C136 180 122 178 116 168 C108 180 92 180 84 168 C78 178 64 180 56 166 C46 174 30 170 34 150Z" fill="url(#' + g + ')" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<ellipse cx="70" cy="80" rx="15" ry="8" fill="#fff" opacity="0.35" transform="rotate(-28 70 80)"/>' +
        (b.crown ? crown(28) : '') + label(100, 82, b.label) + eyes(80, 120, 106, b.glow) + mouth(100, 136, 24);
    },
    ghost: function (b, g) {
      var arm = '<path d="M46 108 C28 112 18 128 22 144 C30 134 38 130 48 130Z" fill="url(#' + g + ')" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>';
      return arm + mirror(arm) +
        '<path d="M44 176 L44 96 C44 50 70 30 100 30 C130 30 156 50 156 96 L156 176 C146 166 138 166 128 178 C120 168 110 166 100 178 C90 166 80 168 72 178 C62 166 54 166 44 176Z" fill="url(#' + g + ')" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<ellipse cx="74" cy="58" rx="13" ry="7" fill="#fff" opacity="0.35" transform="rotate(-30 74 58)"/>' +
        eyes(80, 120, 88, b.glow) + mouth(100, 118, 20) + label(100, 160, b.label);
    },
    golem: function (b, g) {
      var armL = '<rect x="18" y="72" width="32" height="74" rx="13" fill="url(#' + g + ')" stroke="' + INK + '" stroke-width="4"/>';
      return armL + mirror(armL) +
        '<rect x="46" y="62" width="108" height="110" rx="18" fill="url(#' + g + ')" stroke="' + INK + '" stroke-width="4"/>' +
        '<rect x="64" y="22" width="72" height="50" rx="12" fill="url(#' + g + ')" stroke="' + INK + '" stroke-width="4"/>' +
        '<path d="M58 92 l12 10 l-6 12 M146 140 l-10 6 l4 12" stroke="' + INK + '" stroke-width="3" fill="none" opacity="0.45" stroke-linecap="round"/>' +
        '<rect x="74" y="40" width="20" height="9" rx="3" fill="' + b.glow + '" stroke="' + INK + '" stroke-width="2.5" class="bs-pupil"/>' +
        '<rect x="106" y="40" width="20" height="9" rx="3" fill="' + b.glow + '" stroke="' + INK + '" stroke-width="2.5" class="bs-pupil"/>' +
        '<path d="M70 34 L94 40 M130 34 L106 40" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M84 60 L116 60" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>' +
        '<circle cx="100" cy="120" r="28" fill="' + INK + '"/><circle class="bs-core" cx="100" cy="120" r="22" fill="' + b.glow + '"/>' +
        label(100, 126, b.label, INK, b.label.length > 3 ? 14 : 17);
    },
    crystal: function (b, g) {
      var shard = '<path d="M46 98 L18 122 L42 154 L54 128Z" fill="url(#' + g + ')" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>';
      return shard + mirror(shard) +
        '<path d="M58 170 L44 98 L76 44 L100 24 L124 44 L156 98 L142 170Z" fill="url(#' + g + ')" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M76 44 L90 98 L58 170 M124 44 L110 98 L142 170 M90 98 L110 98" stroke="#fff" stroke-opacity="0.35" stroke-width="3" fill="none"/>' +
        (b.crown ? crown(4) : '') + eyes(82, 118, 100, b.glow, 12) + mouth(100, 132, 20) + label(100, 160, b.label);
    },
    serpent: function (b, g) {
      return '<circle cx="100" cy="114" r="54" fill="none" stroke="' + INK + '" stroke-width="36"/>' +
        '<circle cx="100" cy="114" r="54" fill="none" stroke="url(#' + g + ')" stroke-width="28"/>' +
        '<circle cx="100" cy="114" r="54" fill="none" stroke="#fff" stroke-opacity="0.18" stroke-width="20" stroke-dasharray="5 9"/>' +
        '<path d="M92 86 l-8 14 l16 0Z" fill="' + b.c2 + '" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="M60 58 C60 26 140 26 140 58 C140 80 120 90 100 90 C80 90 60 80 60 58Z" fill="url(#' + g + ')" stroke="' + INK + '" stroke-width="4"/>' +
        eyes(84, 116, 54, b.glow, 10) + mouth(100, 72, 17, true) + label(100, 121, b.label, b.glow, b.label.length > 3 ? 15 : 19);
    },
    demon: function (b, g) {
      var wing = '<path d="M64 96 C40 58 14 66 6 94 C20 90 28 98 28 110 C38 104 46 110 48 120 C56 112 64 114 70 120Z" fill="' + b.c2 + '" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>';
      var horn = '<path d="M68 64 C56 44 58 26 72 14 C72 34 80 46 88 56Z" fill="#f2e6d0" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>';
      return wing + mirror(wing) + horn + mirror(horn) +
        '<circle cx="100" cy="106" r="56" fill="url(#' + g + ')" stroke="' + INK + '" stroke-width="4"/>' +
        '<ellipse cx="74" cy="78" rx="13" ry="7" fill="#fff" opacity="0.3" transform="rotate(-35 74 78)"/>' +
        eyes(82, 118, 96, b.glow, 12) + mouth(100, 122, 22, true) + label(100, 154, b.label);
    }
  };

  window.BOSSES = B;
  window.bossFor = function (key) { return B[key] || B.final; };
  window.bossSVG = function (key, cls) {
    var b = window.bossFor(key), g = "bg" + (++uid);
    return '<svg class="boss-svg' + (cls ? " " + cls : "") + '" viewBox="0 0 200 200" role="img" aria-label="' + b.name + '">' +
      '<defs><radialGradient id="' + g + '" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="' + b.c1 + '"/><stop offset="1" stop-color="' + b.c2 + '"/></radialGradient></defs>' +
      '<ellipse class="bs-shadow" cx="100" cy="188" rx="56" ry="8" fill="#000" opacity="0.28"/>' +
      '<g class="bs-body">' + ARCH[b.arch](b, g) + '</g></svg>';
  };

  // ---- the arena: projectiles fly from the left and hit the boss ----
  var PROJ = {
    arrow: '<svg viewBox="0 0 64 14" width="64" height="14"><path d="M2 7 H50" stroke="#e8dcc0" stroke-width="3.5" stroke-linecap="round"/><path d="M48 1 L63 7 L48 13Z" fill="#f1f1f1" stroke="#16181d" stroke-width="1.5"/><path d="M2 7 L10 1 M2 7 L10 13 M8 7 L16 1 M8 7 L16 13" stroke="#e2b714" stroke-width="3" stroke-linecap="round"/></svg>',
    fireball: '<span class="pj-fire"></span>',
    bolt: '<svg viewBox="0 0 70 30" width="70" height="30"><path d="M2 16 L24 8 L22 16 L46 6 L42 15 L68 12 L40 24 L44 16 L20 26 L22 18Z" fill="#fff36b" stroke="#ffb703" stroke-width="2" stroke-linejoin="round"/></svg>'
  };
  window.mountArena = function (host, key, opts) {
    opts = opts || {};
    var b = window.bossFor(key);
    host.innerHTML =
      '<div class="arena' + (opts.big ? " big" : "") + '">' +
        '<div class="ar-info"><p class="ar-name">' + b.name + '</p><p class="ar-title">' + b.title + '</p>' +
          (opts.hp ? '<div class="ar-hp" aria-hidden="true"><i></i></div><p class="ar-hpn" aria-live="polite"></p>' : '') + '</div>' +
        '<div class="ar-boss"><div class="ar-sprite">' + window.bossSVG(key) + '</div><p class="ar-taunt" hidden></p></div>' +
        '<div class="ar-fx" aria-hidden="true"></div>' +
      '</div>';
    var root = host.querySelector(".arena"), sprite = root.querySelector(".ar-sprite"), fx = root.querySelector(".ar-fx");
    var tauntEl = root.querySelector(".ar-taunt"), tauntT = null, ti = 0;
    var retrigger = function (el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
    var targetX = function () {
      var r = root.getBoundingClientRect(), s = sprite.getBoundingClientRect();
      return Math.max(80, (s.left - r.left) + s.width * 0.42);
    };
    return {
      attack: function (kind, text) {
        if (root.classList.contains("dead")) return;
        var p = document.createElement("span");
        p.className = "proj pj-" + (PROJ[kind] ? kind : "arrow");
        p.innerHTML = PROJ[kind] || PROJ.arrow;
        p.style.setProperty("--tx", targetX() + "px");
        p.style.top = (38 + Math.random() * 18) + "%";
        fx.appendChild(p);
        setTimeout(function () {
          p.remove();
          if (!root.isConnected) return;
          retrigger(sprite, "hit");
          var boom = document.createElement("span");
          boom.className = "ar-boom pj-" + kind;
          boom.style.left = targetX() + "px";
          fx.appendChild(boom);
          setTimeout(function () { boom.remove(); }, 500);
          if (text) {
            var d = document.createElement("span");
            d.className = "ar-dmg" + (kind === "bolt" ? " crit" : "");
            d.textContent = text;
            d.style.left = (targetX() + 10) + "px";
            fx.appendChild(d);
            setTimeout(function () { d.remove(); }, 900);
          }
        }, 380);
      },
      taunt: function (text) {
        if (root.classList.contains("dead")) return;
        var list = (b.taunts || []).concat(GENERIC);
        tauntEl.textContent = text || list[(ti++) % list.length];
        tauntEl.hidden = false;
        retrigger(sprite, "laugh");
        retrigger(root, "ouch");
        clearTimeout(tauntT);
        tauntT = setTimeout(function () { tauntEl.hidden = true; }, 2000);
      },
      hp: function (left, total) {
        var bar = root.querySelector(".ar-hp i"), n = root.querySelector(".ar-hpn");
        if (bar) bar.style.width = (total ? (100 * left) / total : 0) + "%";
        if (n) n.innerHTML = "<b>" + left + "</b> of " + total + " HP";
      },
      defeat: function () {
        if (root.classList.contains("dead")) return;
        root.classList.add("dead");
        tauntEl.hidden = true;
        var s = document.createElement("span");
        s.className = "ar-stamp";
        s.textContent = "Defeated";
        root.querySelector(".ar-boss").appendChild(s);
      },
      boss: b
    };
  };
})();
