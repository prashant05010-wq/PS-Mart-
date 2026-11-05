/* PS Mart - Smart Search Suggestions
   Sirf approved + visible products se suggestions. Koi nayi table nahi, koi secret key nahi.
   Existing supabaseClient (app.js) aur psImages() reuse hota hai. */
(function () {
  "use strict";

  var input = document.getElementById("search");
  if (!input || typeof supabaseClient === "undefined") return;

  var MIN_CHARS = 2, MAX_ITEMS = 8, DEBOUNCE_MS = 300;

  var CATEGORIES = [
    { id: 1, name: "Mobiles", icon: "\uD83D\uDCF1" },
    { id: 2, name: "Electronics", icon: "\uD83D\uDCBB" },
    { id: 3, name: "Fashion", icon: "\uD83D\uDC55" },
    { id: 4, name: "Beauty", icon: "\uD83D\uDC84" },
    { id: 5, name: "Home", icon: "\uD83C\uDFE0" },
    { id: 6, name: "Grocery", icon: "\uD83D\uDED2" },
    { id: 7, name: "Accessories", icon: "\u231A" }
  ];

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

  var timer = null, reqId = 0, items = [], active = -1, cache = {};

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
    var i = String(text).toLowerCase().indexOf(q.toLowerCase());
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

    /* agar naam me match nahi tha par brand/subcategory me tha, to un products ko bhi dikhao */
    products.forEach(function (p) {
      if (out.length >= MAX_ITEMS) return;
      var name = String(p.name || "").trim();
      if (name) add({ type: "product", label: name, tag: "", img: firstImage(p), href: "product.html?id=" + encodeURIComponent(p.id) });
    });

    return out.slice(0, MAX_ITEMS);
  }

  /* ---------- render ---------- */
  function message(text, spinner) {
    box.innerHTML = "";
    var d = document.createElement("div"); d.className = "ps-sg-msg";
    if (spinner) { var s = document.createElement("span"); s.className = "ps-sg-spin"; d.appendChild(s); }
    d.appendChild(document.createTextNode(text));
    box.appendChild(d); open();
  }

  function render(q, list) {
    items = list; active = -1;
    if (!list.length) { message("No suggestions found"); return; }
    box.innerHTML = "";
    list.forEach(function (it, idx) {
      var a = document.createElement("a");
      a.className = "ps-sg-row"; a.href = it.href; a.setAttribute("role", "option"); a.dataset.idx = idx;
      if (it.type === "product" && it.img) {
        var im = document.createElement("img"); im.className = "ps-sg-thumb"; im.alt = ""; im.loading = "lazy"; im.src = it.img; a.appendChild(im);
      } else {
        var ic = document.createElement("span"); ic.className = "ps-sg-icon"; ic.textContent = it.icon || "\uD83D\uDECD\uFE0F"; a.appendChild(ic);
      }
      var tx = document.createElement("span"); tx.className = "ps-sg-text"; tx.appendChild(highlight(it.label, q)); a.appendChild(tx);
      if (it.tag) { var tg = document.createElement("span"); tg.className = "ps-sg-tag"; tg.textContent = it.tag; a.appendChild(tg); }
      a.addEventListener("mousedown", function (e) { e.preventDefault(); });
      box.appendChild(a);
    });
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
    cache[q] = list;
    render(q, list);
  }

  input.addEventListener("input", function () {
    clearTimeout(timer);
    var q = input.value.trim();
    if (q.length < MIN_CHARS) { reqId++; close(); box.innerHTML = ""; return; }
    timer = setTimeout(function () { run(q); }, DEBOUNCE_MS);
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { if (isOpen()) { e.preventDefault(); setActive(active + 1); } }
    else if (e.key === "ArrowUp") { if (isOpen()) { e.preventDefault(); setActive(active - 1); } }
    else if (e.key === "Escape") { close(); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen() && active >= 0 && items[active]) { location.href = items[active].href; }
      else if (typeof search === "function") { search(); }
    }
  });

  input.addEventListener("focus", function () {
    var q = input.value.trim();
    if (q.length >= MIN_CHARS && box.firstChild) open();
  });

  document.addEventListener("mousedown", function (e) {
    if (e.target === input || box.contains(e.target)) return;
    close();
  });
  window.addEventListener("resize", function () { if (isOpen()) place(); });
  window.addEventListener("scroll", function () { if (isOpen()) place(); }, true);
})();
