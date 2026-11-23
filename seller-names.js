/* PS Mart - seller-names.js
   Har product card, product page aur order me us product ke ASLI seller ka naam dikhata hai.
   Naam Supabase ke function get_product_seller_names / get_seller_names se aata hai (sirf shop ka naam).
   Naam na mile to purana label waise hi rehta hai. Koi secret key nahi. */
(function () {
  if (window.PSSellerNames) return;

  var BYPROD = {}, BYSELL = {}, T = null;

  var st = document.createElement("style");
  st.textContent = ".psn-sold{margin:2px 0 5px;font:500 12px/1.35 Inter,'Segoe UI',Arial,sans-serif;color:#7c6a58;overflow-wrap:anywhere}" +
    ".psn-sold b{font-weight:700;color:#3B2416}";
  document.head.appendChild(st);

  function client() { return (typeof supabaseClient !== "undefined") ? supabaseClient : null; }

  function missing(map, ids) {
    var out = [];
    for (var i = 0; i < ids.length; i++) {
      var id = String(ids[i]);
      if (id && !(id in map) && out.indexOf(id) === -1) out.push(id);
    }
    return out;
  }

  async function loadProducts(ids) {
    ids = missing(BYPROD, ids).slice(0, 100);
    if (!ids.length || !client()) return;
    ids.forEach(function (id) { BYPROD[id] = ""; }); /* dobara dobara na poochhe */
    try {
      var r = await client().rpc("get_product_seller_names", { p_product_ids: ids });
      if (!r.error && Array.isArray(r.data)) {
        r.data.forEach(function (x) { BYPROD[String(x.product_id)] = String(x.seller_name || "").trim(); });
      }
    } catch (e) { /* function nahi bana to purana label rehne do */ }
  }

  async function loadSellers(ids) {
    ids = missing(BYSELL, ids).slice(0, 100);
    if (!ids.length || !client()) return;
    ids.forEach(function (id) { BYSELL[id] = ""; });
    try {
      var r = await client().rpc("get_seller_names", { p_seller_ids: ids });
      if (!r.error && Array.isArray(r.data)) {
        r.data.forEach(function (x) { BYSELL[String(x.seller_id)] = String(x.seller_name || "").trim(); });
      }
    } catch (e) {}
  }

  function soldLine(name) {
    var d = document.createElement("div");
    d.className = "psn-sold";
    d.appendChild(document.createTextNode("Sold by "));
    var b = document.createElement("b"); b.textContent = name; d.appendChild(b);
    return d;
  }

  /* ---- product cards ---- */
  function cardId(c) {
    var a = c.querySelector('a[href*="product.html?id="]');
    var m = a && (a.getAttribute("href") || "").match(/[?&]id=([^&#]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }
  function applyCard(c, name) {
    if (!name || c.querySelector(".psn-sold")) return;
    var smalls = c.querySelectorAll("small");
    for (var i = 0; i < smalls.length; i++) {
      if ((smalls[i].textContent || "").trim() === "PS Mart Seller") {
        smalls[i].textContent = "Sold by " + name; return;
      }
    }
    var body = c.querySelector(".pc-body");
    if (!body) return;
    var h = body.querySelector("h3");
    var line = soldLine(name);
    if (h && h.parentNode) h.parentNode.insertBefore(line, h.nextSibling); else body.appendChild(line);
  }

  /* ---- product detail page ---- */
  function applyDetail(name) {
    var d = document.getElementById("detail");
    if (!d || !name) return;
    var w = document.createTreeWalker(d, NodeFilter.SHOW_TEXT, null, false), hits = [], n;
    while ((n = w.nextNode())) { if (n.nodeValue.indexOf("PS Mart Seller") > -1) hits.push(n); }
    hits.forEach(function (t) {
      var p = t.parentNode;
      if (p && p.tagName === "SMALL" && t.nodeValue.trim() === "PS Mart Seller") t.nodeValue = "Sold by " + name;
      else t.nodeValue = t.nodeValue.split("PS Mart Seller").join(name);
    });
  }

  async function run() {
    /* cards */
    var cards = [].slice.call(document.querySelectorAll(".product:not([data-psn])")), items = [];
    cards.forEach(function (c) { c.setAttribute("data-psn", "1"); var id = cardId(c); if (id) items.push([c, id]); });
    /* detail */
    var pid = new URLSearchParams(location.search).get("id");
    var d = document.getElementById("detail");
    var needDetail = d && pid && /PS Mart Seller/.test(d.textContent || "");
    /* orders */
    var ords = [].slice.call(document.querySelectorAll("[data-psn-seller]:not([data-psn-done])"));

    var pids = items.map(function (x) { return x[1]; });
    if (needDetail) pids.push(pid);
    if (pids.length) await loadProducts(pids);
    items.forEach(function (x) { applyCard(x[0], BYPROD[x[1]]); });
    if (needDetail) applyDetail(BYPROD[String(pid)]);

    if (ords.length) {
      await loadSellers(ords.map(function (o) { return o.getAttribute("data-psn-seller"); }));
      ords.forEach(function (o) {
        o.setAttribute("data-psn-done", "1");
        var nm = BYSELL[String(o.getAttribute("data-psn-seller"))];
        if (nm) { o.textContent = ""; o.appendChild(soldLine(nm)); }
      });
    }
  }

  function sched() { clearTimeout(T); T = setTimeout(function () { run().catch(function () {}); }, 150); }
  function start() {
    sched();
    new MutationObserver(sched).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();

  window.PSSellerNames = { productName: function (id) { return BYPROD[String(id)] || ""; } };
})();
