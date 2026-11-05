/* PS Mart - Related Products & Recommendations (product.html)
   Sirf approved + in-stock + visible products. Koi fake data nahi.
   Existing supabaseClient reuse hota hai; koi nayi table / secret key nahi.
   Sections: Similar Products, More From This Category, You May Also Like,
   Frequently Bought Together (sirf asli order data se, warna hide). */
(function () {
  "use strict";

  var COLS = "id,name,brand,category_id,subcategory,price,old_price,image_url,image_urls,rating,review_count,stock,group_id,seller_id";
  var STOP = { "the": 1, "and": 1, "for": 1, "with": 1, "pack": 1, "set": 1, "new": 1, "combo": 1, "of": 1, "in": 1, "by": 1, "to": 1, "a": 1 };
  var SHOW_FIRST = 6, MAX_PER_SECTION = 12;

  /* ================= pure helpers (test ke liye bahar bhi diye hain) ================= */
  function tokens(name) {
    var s = String(name || "").toLowerCase().replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9\u0900-\u097f]+/g, " ");
    var out = [], seen = {};
    s.split(" ").forEach(function (w) {
      if (w.length < 3 || /^\d+$/.test(w) || STOP[w] || seen[w]) return;
      seen[w] = 1; out.push(w);
    });
    return out;
  }
  function overlap(a, b) {
    var set = {}; a.forEach(function (w) { set[w] = 1; });
    var n = 0; b.forEach(function (w) { if (set[w]) n++; });
    return n;
  }
  function norm(x) { return String(x || "").trim().toLowerCase(); }
  function priceScore(cur, other) {
    cur = Number(cur) || 0; other = Number(other) || 0;
    if (!cur || !other) return 0;
    var r = other / cur;
    if (r >= 0.7 && r <= 1.4) return 2;
    if (r >= 0.5 && r <= 2) return 1;
    return 0;
  }
  function scoreOf(cur, curTok, p) {
    var s = 0, ov = overlap(curTok, tokens(p.name));
    var sameSub = !!norm(cur.subcategory) && norm(cur.subcategory) === norm(p.subcategory);
    var sameBrand = !!norm(cur.brand) && norm(cur.brand) === norm(p.brand);
    if (sameSub) s += 5;
    if (sameBrand) s += 3;
    s += Math.min(ov, 4) * 2;
    s += priceScore(cur.price, p.price);
    return { score: s, overlap: ov, sameSub: sameSub, sameBrand: sameBrand };
  }
  /* alag-alag sellers ko aage-peeche mila do */
  function interleaveBySeller(list) {
    var groups = {}, order = [];
    list.forEach(function (p) {
      var k = String(p.seller_id || "x");
      if (!groups[k]) { groups[k] = []; order.push(k); }
      groups[k].push(p);
    });
    var out = [], more = true;
    while (more) {
      more = false;
      order.forEach(function (k) { if (groups[k].length) { out.push(groups[k].shift()); more = true; } });
    }
    return out;
  }

  /* sections banao: ek product ek hi section me aata hai */
  function buildSections(cur, catList, brandList, preUsed) {
    var curTok = tokens(cur.name), used = {}; used[String(cur.id)] = 1;
    (preUsed || []).forEach(function (i) { used[String(i)] = 1; });
    function take(list, n) {
      var out = [];
      for (var i = 0; i < list.length && out.length < n; i++) {
        var id = String(list[i].id);
        if (used[id]) continue;
        used[id] = 1; out.push(list[i]);
      }
      return out;
    }
    var pool = catList.concat(brandList.filter(function (b) {
      return !catList.some(function (c) { return String(c.id) === String(b.id); });
    }));
    var scored = pool.map(function (p) { var m = scoreOf(cur, curTok, p); m.p = p; return m; });

    /* A. Similar: same subcategory, ya product-type words milte hon */
    var simPool = scored.filter(function (m) {
      var sameCat = String(m.p.category_id) === String(cur.category_id);
      return sameCat && (m.sameSub || m.overlap >= 1);
    }).sort(function (a, b) { return b.score - a.score; }).map(function (m) { return m.p; });
    var similar = take(simPool, MAX_PER_SECTION);

    /* B. More from this category: baaki same category, alag sellers mila ke */
    var catPool = scored.filter(function (m) { return String(m.p.category_id) === String(cur.category_id); })
      .sort(function (a, b) { return b.score - a.score; }).map(function (m) { return m.p; });
    var moreCat = take(interleaveBySeller(catPool), MAX_PER_SECTION);

    /* C. You may also like: same brand (kisi bhi category me) ya milte keywords */
    var likePool = scored.filter(function (m) { return m.sameBrand || m.overlap >= 1; })
      .sort(function (a, b) { return b.score - a.score; }).map(function (m) { return m.p; });
    var like = take(likePool, MAX_PER_SECTION);

    return { similar: similar, moreCat: moreCat, like: like, used: used };
  }

  /* ================= browser part ================= */
  var api = { tokens: tokens, overlap: overlap, scoreOf: scoreOf, buildSections: buildSections, interleaveBySeller: interleaveBySeller };
  if (typeof window !== "undefined") window.PSRelated = api;
  if (typeof document === "undefined" || typeof supabaseClient === "undefined") return;

  var pid = new URLSearchParams(location.search).get("id");
  if (!pid) return;

  function esc(t) { return typeof psEsc === "function" ? psEsc(t) : String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function inr(n) { return typeof money === "function" ? money(n) : "\u20B9" + Number(n || 0).toLocaleString("en-IN"); }
  function firstImg(p) {
    try {
      if (typeof psImages === "function") { var l = psImages(p); if (l && l[0]) return l[0]; }
    } catch (e) {}
    return (p.image_url && /^https:\/\//.test(p.image_url)) ? p.image_url : "";
  }

  var css = document.createElement("style");
  css.textContent =
    "#psRelated{margin-top:6px}" +
    ".psr-sec{background:#fff;border-radius:14px;box-shadow:0 2px 10px rgba(59,36,22,.08);margin:14px 0;padding:14px 12px}" +
    ".psr-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}" +
    ".psr-head h2{font-size:17px;color:#3B2416;border-left:4px solid #C9922E;padding-left:9px}" +
    ".psr-head a{font-size:13px;color:#C9922E;font-weight:700;text-decoration:none}" +
    ".psr-row{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;padding-bottom:6px;scrollbar-width:none}" +
    ".psr-row::-webkit-scrollbar{display:none}" +
    ".psr-row .psr-card{flex:0 0 150px;scroll-snap-align:start}" +
    ".psr-card{position:relative;background:#fff;border:1px solid #eadfca;border-radius:12px;overflow:hidden;min-width:0}" +
    ".psr-card a.psr-link{display:block;text-decoration:none;color:#3B2416}" +
    ".psr-pic{aspect-ratio:1/1;background:#F7F1E8;display:flex;align-items:center;justify-content:center;position:relative}" +
    ".psr-pic img{width:100%;height:100%;object-fit:contain}" +
    ".psr-rate{position:absolute;left:6px;bottom:6px;background:#1b7a3a;color:#fff;font-size:11px;font-weight:700;border-radius:6px;padding:2px 6px}" +
    ".psr-body{padding:8px 9px 10px}" +
    ".psr-body h3{font-size:13px;font-weight:600;line-height:1.3;height:34px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}" +
    ".psr-price{margin-top:5px;font-size:14px}" +
    ".psr-price b{color:#3B2416}.psr-price del{color:#9a8a78;font-size:12px;margin-right:5px}" +
    ".psr-off{color:#1b7a3a;font-size:12px;font-weight:700;margin-left:5px}" +
    ".psr-heart{position:absolute;right:6px;top:6px;z-index:2;border:0;background:rgba(255,255,255,.92);width:28px;height:28px;border-radius:50%;font-size:15px;color:#3B2416;cursor:pointer}" +
    ".psr-more{display:none;margin:10px auto 0;padding:9px 22px;border:1px solid #C9922E;background:#fff;color:#3B2416;border-radius:20px;font-weight:700;cursor:pointer}" +
    ".psr-skel{flex:0 0 150px;height:215px;border-radius:12px;background:linear-gradient(90deg,#f3ece0 25%,#fbf7ef 50%,#f3ece0 75%);background-size:200% 100%;animation:psrSh 1.2s infinite}" +
    "@keyframes psrSh{to{background-position:-200% 0}}" +
    "@media(min-width:900px){" +
    ".psr-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));overflow:visible}" +
    ".psr-row .psr-card{flex:none}.psr-row .psr-hide{display:none}" +
    ".psr-more.psr-on{display:block}}" +
    "@media(max-width:899px){.psr-row .psr-hide{display:block}}";
  document.head.appendChild(css);

  function cardHtml(p, hidden) {
    var off = 0;
    if (p.old_price && Number(p.old_price) > Number(p.price)) off = Math.round((Number(p.old_price) - Number(p.price)) / Number(p.old_price) * 100);
    var rating = Number(p.rating || 0);
    var img = firstImg(p);
    return '<article class="psr-card' + (hidden ? " psr-hide" : "") + '">' +
      '<button class="psr-heart" aria-label="Wishlist" onclick="event.preventDefault();event.stopPropagation();if(typeof toggleWishlist===\'function\')toggleWishlist(\'' + esc(p.id) + '\',this)">\u2661</button>' +
      '<a class="psr-link" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
      '<div class="psr-pic">' + (img ? '<img src="' + esc(img) + '" alt="' + esc(p.name) + '" loading="lazy">' : '<span style="font-size:40px">\uD83D\uDECD\uFE0F</span>') +
      (rating > 0 ? '<span class="psr-rate">' + rating.toFixed(1) + ' \u2605</span>' : "") + '</div>' +
      '<div class="psr-body"><h3>' + esc(p.name) + '</h3>' +
      '<div class="psr-price">' + (off ? "<del>" + inr(p.old_price) + "</del>" : "") + "<b>" + inr(p.price) + "</b>" + (off ? '<span class="psr-off">' + off + "% off</span>" : "") + "</div>" +
      "</div></a></article>";
  }

  function sectionHtml(id, title, list, viewAll) {
    var cards = list.map(function (p, i) { return cardHtml(p, i >= SHOW_FIRST); }).join("");
    return '<section class="psr-sec" id="' + id + '"><div class="psr-head"><h2>' + esc(title) + "</h2>" +
      (viewAll ? '<a href="' + esc(viewAll) + '">View All \u2192</a>' : "") + "</div>" +
      '<div class="psr-row">' + cards + "</div>" +
      (list.length > SHOW_FIRST ? '<button class="psr-more psr-on" type="button" data-more="' + id + '">Show more</button>' : "") + "</section>";
  }

  async function listProducts(filter) {
    var variants = [
      { cols: COLS, hidden: true }, { cols: COLS, hidden: false }, { cols: "*", hidden: false }
    ];
    for (var i = 0; i < variants.length; i++) {
      var qb = supabaseClient.from("products").select(variants[i].cols).eq("status", "approved").gt("stock", 0);
      if (variants[i].hidden) qb = qb.eq("listing_hidden", false);
      var r = await filter(qb);
      if (!r.error) return r.data || [];
    }
    return [];
  }

  /* Sirf asli order data: Supabase function ps_bought_together (optional). Na ho ya data kam ho to khali -> section hide. */
  async function boughtTogether(cur) {
    try {
      var rp = await supabaseClient.rpc("ps_bought_together", { p_product: String(cur.id), p_limit: 6 });
      if (rp.error || !rp.data || !rp.data.length) return [];
      var ids = rp.data.map(function (x) { return x.product_id; }).filter(function (i) { return String(i) !== String(cur.id); });
      if (!ids.length) return [];
      return await listProducts(function (qb) { return qb.in("id", ids).limit(6); });
    } catch (e) { return []; }
  }

  async function run() {
    var wrap = document.querySelector(".pm-wrap");
    if (!wrap || !wrap.parentNode) return;
    var box = document.createElement("div");
    box.id = "psRelated"; box.className = "pm-wrap";
    box.innerHTML = '<section class="psr-sec"><div class="psr-head"><h2>Similar Products</h2></div><div class="psr-row">' +
      '<div class="psr-skel"></div><div class="psr-skel"></div><div class="psr-skel"></div><div class="psr-skel"></div></div></section>';
    wrap.parentNode.insertBefore(box, wrap.nextSibling);

    try {
      /* 1) abhi khula product (stock ho ya na ho, wo bas reference hai) */
      var cr = await supabaseClient.from("products").select("*").eq("id", pid).eq("status", "approved").maybeSingle();
      var cur = cr && cr.data;
      if (!cur) { box.remove(); return; }

      /* 2) candidates (same category + same brand) aur Frequently Bought (asli order data) parallel me */
      var jobs = [listProducts(function (qb) { return qb.eq("category_id", cur.category_id).neq("id", cur.id).limit(60); })];
      var brand = String(cur.brand || "").trim();
      var hasBrand = brand && !/[%_\\]/.test(brand);
      jobs.push(hasBrand ? listProducts(function (qb) { return qb.ilike("brand", brand).neq("id", cur.id).limit(20); }) : Promise.resolve([]));
      jobs.push(boughtTogether(cur));
      var res = await Promise.all(jobs);
      function dropSameGroup(arr) {
        return arr.filter(function (p) { return !(cur.group_id && p.group_id && String(p.group_id) === String(cur.group_id)); });
      }
      var catList = dropSameGroup(res[0] || []);
      var brandList = dropSameGroup(res[1] || []);
      var fbt = res[2] || [];

      var S = buildSections(cur, catList, brandList, fbt.map(function (p) { return p.id; }));
      var html = "";
      var catLink = "products.html?cat=" + encodeURIComponent(cur.category_id);
      var subLink = cur.subcategory ? catLink + "&q=" + encodeURIComponent(cur.subcategory) : catLink;
      if (fbt.length) html += sectionHtml("psrBought", "Frequently Bought Together", fbt, "");
      if (S.similar.length) html += sectionHtml("psrSimilar", "Similar Products", S.similar, subLink);
      if (S.moreCat.length) html += sectionHtml("psrCategory", "More From This Category", S.moreCat, catLink);
      if (S.like.length) html += sectionHtml("psrLike", "You May Also Like", S.like, hasBrand ? "products.html?q=" + encodeURIComponent(brand) : "");
      if (!html) { box.remove(); return; }
      box.innerHTML = html;

      box.addEventListener("click", function (ev) {
        var b = ev.target.closest && ev.target.closest("[data-more]");
        if (!b) return;
        var sec = document.getElementById(b.getAttribute("data-more"));
        if (sec) sec.querySelectorAll(".psr-hide").forEach(function (c) { c.classList.remove("psr-hide"); });
        b.remove();
      });
    } catch (err) {
      console.log("Related products error:", err && err.message);
      if (box && box.remove) box.remove();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
