/* PS Mart - Smart Search Suggestions
   - Typing par suggestions (sirf approved + visible products)
   - Khali search box par: Recent searches (sirf is device me), Popular categories, Popular products (asli reviews ke hisaab se)
   - Spelling galti: kuch na mile to "Did you mean ...?" (site ke asli product words se)
   Koi nayi table nahi, koi secret key nahi. Existing supabaseClient / psImages() reuse hote hain. */
(function () {
  "use strict";

  var MIN_CHARS = 2, MAX_ITEMS = 8, DEBOUNCE_MS = 300, RECENT_MAX = 6, RKEY = "ps_recent_searches";

  var CATEGORIES = [
    { id: 1, name: "Mobiles", icon: "\uD83D\uDCF1" },
    { id: 2, name: "Electronics", icon: "\uD83D\uDCBB" },
    { id: 3, name: "Fashion", icon: "\uD83D\uDC55" },
    { id: 4, name: "Beauty", icon: "\uD83D\uDC84" },
    { id: 5, name: "Home", icon: "\uD83C\uDFE0" },
    { id: 6, name: "Grocery", icon: "\uD83D\uDED2" },
    { id: 7, name: "Accessories", icon: "\u231A" }
  ];

  /* ================= pure helpers (test ke liye bahar bhi diye hain) ================= */
  /* Damerau-Levenshtein (adjacent letters ki adla-badli bhi 1 galti) */
  function dl(a, b) {
    var al = a.length, bl = b.length, d = [], i, j;
    if (!al) return bl; if (!bl) return al;
    for (i = 0; i <= al; i++) d[i] = [i];
    for (j = 1; j <= bl; j++) d[0][j] = j;
    for (i = 1; i <= al; i++) {
      for (j = 1; j <= bl; j++) {
        var c = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[al][bl];
  }

  function wordsOf(text) {
    return String(text || "").toLowerCase().replace(/\([^)]*\)/g, " ").split(/[^a-z]+/).filter(function (w) { return w.length >= 3; });
  }

  /* query ke galat spelling wale shabd ko vocab ke sabse paas ke shabd se badlo. Kuch na badla to null. */
  function correctQuery(q, vocab) {
    var set = {}; vocab.forEach(function (w) { set[w] = 1; });
    var changed = false;
    var out = String(q).toLowerCase().split(/\s+/).filter(Boolean).map(function (w) {
      if (w.length < 4 || !/^[a-z]+$/.test(w) || set[w]) return w;
      var max = w.length <= 6 ? 1 : 2, best = null, bd = 99;
      for (var i = 0; i < vocab.length; i++) {
        var v = vocab[i];
        if (Math.abs(v.length - w.length) > max) continue;
        var d = dl(w, v);
        if (d <= max && (d < bd || (d === bd && v.length < best.length))) { best = v; bd = d; }
      }
      if (best) { changed = true; return best; }
      return w;
    });
    return changed ? out.join(" ") : null;
  }

  /* recent searches (localStorage, sirf isi device me) */
  function getRecent() {
    try {
      var a = JSON.parse(localStorage.getItem(RKEY) || "[]");
      return Array.isArray(a) ? a.filter(function (x) { return typeof x === "string" && x; }).slice(0, RECENT_MAX) : [];
    } catch (e) { return []; }
  }
  function putRecent(a) { try { localStorage.setItem(RKEY, JSON.stringify(a.slice(0, RECENT_MAX))); } catch (e) {} }
  function saveRecent(q) {
    q = String(q || "").trim().slice(0, 60);
    if (q.length < MIN_CHARS) return;
    var a = getRecent().filter(function (x) { return x.toLowerCase() !== q.toLowerCase(); });
    a.unshift(q); putRecent(a);
  }
  function removeRecent(q) { putRecent(getRecent().filter(function (x) { return x !== q; })); }
  function clearRecent() { try { localStorage.removeItem(RKEY); } catch (e) {} }

  if (typeof window !== "undefined") window.PSSearch = { dl: dl, wordsOf: wordsOf, correctQuery: correctQuery, getRecent: getRecent, saveRecent: saveRecent, removeRecent: removeRecent, clearRecent: clearRecent };

  /* ================= browser part ================= */
  var input = typeof document !== "undefined" ? document.getElementById("search") : null;
  if (!input || typeof supabaseClient === "undefined") return;

  /* ---------- styles ---------- */
  var st = document.createElement("style");
  st.textContent =
    "#ps-suggest{position:fixed;z-index:99999;background:#fff;border:1px solid #e8dcc8;border-radius:12px;" +
    "box-shadow:0 10px 28px rgba(59,36,22,.18);overflow-y:auto;max-height:70vh;display:none;font-family:inherit}" +
    "#ps-suggest .ps-sg-row{display:flex;align-items:center;gap:10px;padding:9px 12px;color:#3B2416;text-decoration:none;" +
    "font-size:14px;border-bottom:1px solid #f3ece0;cursor:pointer}" +
    "#ps-suggest .ps-sg-row:last-child{border-bottom:0}" +
    "#ps-suggest .ps-sg-row:hover,#ps-suggest .ps-sg-row.ps-active{background:#F7F1E8}" +
    "#ps-suggest .ps-sg-thumb{flex:0 0 38px;width:38px;height:38px;border-radius:8px;object-fit:cover;background:#F7F1E8;border:1px solid #eadfca}" +
    "#ps-suggest .ps-sg-icon{flex:0 0 38px;width:38px;height:38px;border-radius:50%;background:#F7F1E8;border:1px solid #C9922E;" +
    "display:flex;align-items:center;justify-content:center;font-size:18px}" +
    "#ps-suggest .ps-sg-text{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    "#ps-suggest .ps-sg-text b{color:#3B2416;font-weight:700}" +
    "#ps-suggest .ps-sg-tag{flex:0 0 auto;font-size:11px;color:#8a6a2f;background:#fbf3e0;border-radius:6px;padding:2px 7px}" +
    "#ps-suggest .ps-sg-msg{padding:14px 12px;font-size:13px;color:#7a6a58;display:flex;align-items:center;gap:8px}" +
    "#ps-suggest .ps-sg-spin{width:14px;height:14px;border:2px solid #e8dcc8;border-top-color:#C9922E;border-radius:50%;animation:psSgSpin .7s linear infinite}" +
    "#ps-suggest .ps-sg-h{display:flex;justify-content:space-between;align-items:center;padding:10px 12px 4px;font-size:12px;font-weight:700;color:#8a6a2f;text-transform:uppercase;letter-spacing:.3px}" +
    "#ps-suggest .ps-sg-h button{border:0;background:none;color:#C9922E;font-weight:700;font-size:12px;cursor:pointer;text-transform:none}" +
    "#ps-suggest .ps-sg-x{flex:0 0 auto;border:0;background:none;color:#9a8a78;font-size:16px;padding:4px 6px;cursor:pointer}" +
    "#ps-suggest .ps-sg-chips{display:flex;flex-wrap:wrap;gap:8px;padding:6px 12px 12px}" +
    "#ps-suggest .ps-sg-chip{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border:1px solid #C9922E;border-radius:18px;background:#fff;color:#3B2416;font-size:13px;text-decoration:none}" +
    "#ps-suggest .ps-sg-chip:hover{background:#F7F1E8}" +
    "@keyframes psSgSpin{to{transform:rotate(360deg)}}";
  document.head.appendChild(st);

  var box = document.createElement("div");
  box.id = "ps-suggest";
  box.setAttribute("role", "listbox");
  document.body.appendChild(box);

  input.setAttribute("autocomplete", "off");
  input.setAttribute("aria-autocomplete", "list");
  /* purana inline Enter handler hatao; neeche apna handler wahi kaam karta hai (aur suggestion bhi sambhalta hai) */
  input.removeAttribute("onkeydown");

  var timer = null, reqId = 0, items = [], active = -1, cache = {}, vocabP = null, popularP = null;

  /* ---------- helpers ---------- */
  function anchorEl() { return input.parentElement || input; }

  function place() {
    var r = anchorEl().getBoundingClientRect();
    box.style.left = Math.round(r.left) + "px";
    box.style.top = Math.round(r.bottom + 4) + "px";
    box.style.width = Math.round(r.width) + "px";
  }

  function open() { place(); box.style.display = "block"; }
  function close() { box.style.display = "none"; active = -1; }
  function isOpen() { return box.style.display === "block"; }

  function highlight(text, q) {
    var frag = document.createDocumentFragment();
    var i = String(text).toLowerCase().indexOf(String(q || "").toLowerCase());
    if (i < 0 || !q) { frag.appendChild(document.createTextNode(text)); return frag; }
    frag.appendChild(document.createTextNode(text.slice(0, i)));
    var b = document.createElement("b");
    b.textContent = text.slice(i, i + q.length);
    frag.appendChild(b);
    frag.appendChild(document.createTextNode(text.slice(i + q.length)));
    return frag;
  }

  function firstImage(p) {
    try {
      if (typeof psImages === "function") { var l = psImages(p); if (l && l[0]) return l[0]; }
      if (p.image_url && /^https:\/\//.test(p.image_url)) return p.image_url;
    } catch (e) {}
    return "";
  }

  /* ---------- data ---------- */
  async function fetchProducts(q) {
    var safe = q.replace(/[,()%*\\"'`]/g, " ").replace(/\s+/g, " ").trim();
    if (!safe) return [];
    var pat = "%" + safe + "%";
    var variants = [
      { cols: "id,name,brand,category_id,subcategory,image_url,image_urls", hidden: true, brand: true },
      { cols: "id,name,brand,category_id,subcategory,image_url,image_urls", hidden: false, brand: true },
      { cols: "id,name,category_id,subcategory,image_url,image_urls", hidden: false, brand: false }
    ];
    for (var i = 0; i < variants.length; i++) {
      var v = variants[i];
      var qb = supabaseClient.from("products").select(v.cols).eq("status", "approved");
      if (v.hidden) qb = qb.eq("listing_hidden", false);
      var orf = "name.ilike." + pat + ",subcategory.ilike." + pat;
      if (v.brand) orf += ",brand.ilike." + pat;
      var r = await qb.or(orf).limit(30);
      if (!r.error) return r.data || [];
    }
    return [];
  }

  /* spelling help ke liye site ke asli shabd (ek baar load, phir memory me) */
  function loadVocab() {
    if (!vocabP) vocabP = (async function () {
      var set = {};
      CATEGORIES.forEach(function (c) { wordsOf(c.name).forEach(function (w) { set[w] = 1; }); });
      var colsList = ["name,brand,subcategory", "name,subcategory", "name"];
      for (var i = 0; i < colsList.length; i++) {
        try {
          var r = await supabaseClient.from("products").select(colsList[i]).eq("status", "approved").limit(1000);
          if (!r.error) {
            (r.data || []).forEach(function (p) {
              [p.name, p.brand, p.subcategory].forEach(function (t) { wordsOf(t).forEach(function (w) { set[w] = 1; }); });
            });
            break;
          }
        } catch (e) {}
      }
      return Object.keys(set);
    })();
    return vocabP;
  }

  /* popular products: asli reviews/rating ke hisaab se (kuch na ho to section nahi dikhta) */
  function loadPopular() {
    if (!popularP) popularP = (async function () {
      for (var i = 0; i < 2; i++) {
        try {
          var qb = supabaseClient.from("products").select("id,name,image_url,image_urls,review_count,rating,stock").eq("status", "approved").gt("stock", 0);
          if (i === 0) qb = qb.eq("listing_hidden", false);
          var r = await qb.order("review_count", { ascending: false, nullsFirst: false }).limit(5);
          if (!r.error) return (r.data || []).filter(function (p) { return Number(p.review_count || 0) > 0 || Number(p.rating || 0) > 0; });
        } catch (e) {}
      }
      return [];
    })();
    return popularP;
  }

  function build(q, products) {
    var ql = q.toLowerCase(), out = [], seen = {};
    function add(o) { var k = o.type + "|" + o.label.toLowerCase(); if (!seen[k]) { seen[k] = 1; out.push(o); } }

    CATEGORIES.filter(function (c) { return c.name.toLowerCase().indexOf(ql) >= 0; }).slice(0, 2).forEach(function (c) {
      add({ type: "cat", label: c.name, tag: "Category", icon: c.icon, href: "products.html?cat=" + c.id });
    });

    var subs = 0, brands = 0;
    products.forEach(function (p) {
      var sub = String(p.subcategory || "").trim();
      if (subs < 2 && sub && sub.toLowerCase().indexOf(ql) >= 0) {
        var before = out.length;
        add({ type: "sub", label: sub, tag: "Subcategory", icon: "\uD83D\uDDC2\uFE0F",
          href: "products.html?" + (p.category_id ? "cat=" + p.category_id + "&" : "") + "q=" + encodeURIComponent(sub) });
        if (out.length > before) subs++;
      }
      var br = String(p.brand || "").trim();
      if (brands < 2 && br && br.toLowerCase().indexOf(ql) >= 0) {
        var b2 = out.length;
        add({ type: "brand", label: br, tag: "Brand", icon: "\uD83C\uDFF7\uFE0F", href: "products.html?q=" + encodeURIComponent(br) });
        if (out.length > b2) brands++;
      }
    });

    products.forEach(function (p) {
      if (out.length >= MAX_ITEMS) return;
      var name = String(p.name || "").trim();
      if (!name || name.toLowerCase().indexOf(ql) < 0) return;
      add({ type: "product", label: name, tag: "", img: firstImage(p), href: "product.html?id=" + encodeURIComponent(p.id) });
    });

    /* naam me match nahi tha par brand/subcategory me tha, to un products ko bhi dikhao */
    products.forEach(function (p) {
      if (out.length >= MAX_ITEMS) return;
      var name = String(p.name || "").trim();
      if (name) add({ type: "product", label: name, tag: "", img: firstImage(p), href: "product.html?id=" + encodeURIComponent(p.id) });
    });

    return out.slice(0, MAX_ITEMS);
  }

  /* ---------- render ---------- */
  function message(text, spinner) {
    box.innerHTML = ""; items = [];
    var d = document.createElement("div"); d.className = "ps-sg-msg";
    if (spinner) { var s = document.createElement("span"); s.className = "ps-sg-spin"; d.appendChild(s); }
    d.appendChild(document.createTextNode(text));
    box.appendChild(d); open();
  }

  function rowEl(it, hq, onClick) {
    var a = document.createElement("a");
    a.className = "ps-sg-row"; a.setAttribute("href", it.href); a.setAttribute("role", "option");
    if (it.type === "product" && it.img) {
      var im = document.createElement("img"); im.className = "ps-sg-thumb"; im.alt = ""; im.loading = "lazy"; im.src = it.img; a.appendChild(im);
    } else {
      var ic = document.createElement("span"); ic.className = "ps-sg-icon"; ic.textContent = it.icon || "\uD83D\uDECD\uFE0F"; a.appendChild(ic);
    }
    var tx = document.createElement("span"); tx.className = "ps-sg-text"; tx.appendChild(highlight(it.label, hq)); a.appendChild(tx);
    if (it.tag) { var tg = document.createElement("span"); tg.className = "ps-sg-tag"; tg.textContent = it.tag; a.appendChild(tg); }
    a.addEventListener("mousedown", function (e) { e.preventDefault(); });
    if (onClick) a.addEventListener("click", onClick);
    return a;
  }

  function render(q, list) {
    items = list; active = -1;
    if (!list.length) { message("No suggestions found"); return; }
    box.innerHTML = "";
    list.forEach(function (it) {
      box.appendChild(rowEl(it, it.hl || q, function () { saveRecent(it.hl || q); }));
    });
    open();
  }

  function headEl(title, clearFn) {
    var h = document.createElement("div"); h.className = "ps-sg-h";
    var t = document.createElement("span"); t.textContent = title; h.appendChild(t);
    if (clearFn) {
      var b = document.createElement("button"); b.setAttribute("type", "button"); b.textContent = "Clear";
      b.addEventListener("mousedown", function (e) { e.preventDefault(); });
      b.addEventListener("click", clearFn); h.appendChild(b);
    }
    return h;
  }

  /* khali search box: Recent + Popular categories + Popular products */
  async function showHome() {
    var id = ++reqId;
    var popular = await loadPopular();
    if (id !== reqId) return;
    box.innerHTML = ""; items = []; active = -1;

    var rec = getRecent();
    if (rec.length) {
      box.appendChild(headEl("Recent searches", function () { clearRecent(); showHome(); }));
      rec.forEach(function (term) {
        var it = { type: "recent", label: term, icon: "\uD83D\uDD58", href: "products.html?q=" + encodeURIComponent(term) };
        var row = rowEl(it, "", null);
        var x = document.createElement("button"); x.setAttribute("type", "button"); x.className = "ps-sg-x"; x.textContent = "\u2715"; x.setAttribute("aria-label", "Remove");
        x.addEventListener("mousedown", function (e) { e.preventDefault(); });
        x.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); removeRecent(term); showHome(); });
        row.appendChild(x);
        box.appendChild(row); items.push(it);
      });
    }

    box.appendChild(headEl("Popular categories", null));
    var chips = document.createElement("div"); chips.className = "ps-sg-chips";
    CATEGORIES.forEach(function (c) {
      var a = document.createElement("a"); a.className = "ps-sg-chip"; a.setAttribute("href", "products.html?cat=" + c.id);
      a.textContent = c.icon + " " + c.name; chips.appendChild(a);
    });
    box.appendChild(chips);

    if (popular && popular.length) {
      box.appendChild(headEl("Popular products", null));
      popular.forEach(function (p) {
        var it = { type: "product", label: String(p.name || ""), img: firstImage(p), tag: "", href: "product.html?id=" + encodeURIComponent(p.id) };
        box.appendChild(rowEl(it, "", null)); items.push(it);
      });
    }
    open();
  }

  function setActive(n) {
    var rows = box.querySelectorAll(".ps-sg-row");
    if (!rows.length) return;
    if (n < 0) n = rows.length - 1;
    if (n >= rows.length) n = 0;
    rows.forEach(function (r) { r.classList.remove("ps-active"); });
    rows[n].classList.add("ps-active");
    rows[n].scrollIntoView({ block: "nearest" });
    active = n;
  }

  /* ---------- run ---------- */
  async function run(q) {
    var id = ++reqId;
    if (cache[q]) { render(q, cache[q]); return; }
    message("Searching...", true);
    var products = [];
    try { products = await fetchProducts(q); } catch (e) { products = []; }
    if (id !== reqId) return;             /* purana jawab, ignore */
    var list = build(q, products);

    /* kuch nahi mila: spelling ki galti ho sakti hai */
    if (!products.length) {
      var fix = null;
      try { fix = correctQuery(q, await loadVocab()); } catch (e) { fix = null; }
      if (id !== reqId) return;
      if (fix) {
        var p2 = [];
        try { p2 = await fetchProducts(fix); } catch (e) { p2 = []; }
        if (id !== reqId) return;
        list = [{ type: "fix", label: "Did you mean \"" + fix + "\"?", tag: "Spelling", icon: "\u270F\uFE0F", hl: fix, href: "products.html?q=" + encodeURIComponent(fix) }]
          .concat(build(fix, p2)).slice(0, MAX_ITEMS);
      }
    }
    cache[q] = list;
    render(q, list);
  }

  input.addEventListener("input", function () {
    clearTimeout(timer);
    var q = input.value.trim();
    if (q.length < MIN_CHARS) { timer = setTimeout(showHome, 120); return; }
    timer = setTimeout(function () { run(q); }, DEBOUNCE_MS);
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { if (isOpen()) { e.preventDefault(); setActive(active + 1); } }
    else if (e.key === "ArrowUp") { if (isOpen()) { e.preventDefault(); setActive(active - 1); } }
    else if (e.key === "Escape") { close(); }
    else if (e.key === "Enter") {
      e.preventDefault();
      saveRecent(input.value);
      if (isOpen() && active >= 0 && items[active]) { location.href = items[active].href; }
      else if (typeof search === "function") { search(); }
    }
  });

  function onFocus() {
    var q = input.value.trim();
    if (q.length >= MIN_CHARS) { if (box.firstChild) open(); else run(q); }
    else showHome();
  }
  input.addEventListener("focus", onFocus);
  input.addEventListener("click", function () { if (!isOpen()) onFocus(); });

  document.addEventListener("mousedown", function (e) {
    if (e.target === input || box.contains(e.target)) return;
    close();
  });
  window.addEventListener("resize", function () { if (isOpen()) place(); });
  window.addEventListener("scroll", function () { if (isOpen()) place(); }, true);

  /* search button / search() se bhi recent save ho */
  if (typeof window.search === "function") {
    var origSearch = window.search;
    window.search = function () { saveRecent(input.value); return origSearch.apply(this, arguments); };
  }
})();
