/* PS Mart - assured.js
   PS MART ASSURED ka reusable component: badge, product listing par chhota badge, product page par assurance section.
   Badge SIRF un products par dikhta hai jinhe admin ne ps_assured table me chalu kiya hai.
   Koi secret key nahi. app.js ka supabaseClient use hota hai. */
(function () {
  if (window.PSAssured) return;

  var MAP = null, LOADING = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- CSS ---------- */
  var css = [
    ".psa-b{display:inline-flex;align-items:center;gap:7px;margin-top:6px;max-width:100%;vertical-align:middle}",
    ".psa-b svg{flex:0 0 auto;display:block}",
    ".psa-b .t{display:flex;flex-direction:column;line-height:1.1;min-width:0}",
    ".psa-b .t b{font:800 11px/1.1 Inter,'Segoe UI',Arial,sans-serif;letter-spacing:.9px;color:#3B2416;white-space:nowrap}",
    ".psa-b .t i{font:500 10px/1.2 Inter,'Segoe UI',Arial,sans-serif;font-style:normal;color:#7a5a2a;white-space:nowrap}",
    ".psa-b.lg .t b{font-size:14px;letter-spacing:1.2px}.psa-b.lg .t i{font-size:12px}",
    ".psa-box{margin:14px 0 6px;border:1.5px solid #C9922E;border-radius:14px;background:#F7F1E8;overflow:hidden;font-family:Inter,'Segoe UI',Arial,sans-serif}",
    ".psa-head{display:flex;align-items:center;padding:12px 14px;background:linear-gradient(110deg,#24150b,#3B2416 60%,#6c3e17)}",
    ".psa-head .psa-b{margin:0}",
    ".psa-head .psa-b .t b{color:#f7dd9b}.psa-head .psa-b .t i{color:#e9d9b6}",
    ".psa-trust{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:16px 0 6px;padding-top:14px;border-top:1px solid #e6dac3}",
    ".psa-tile{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;text-decoration:none;color:#3B2416;font:600 12px/1.25 Inter,'Segoe UI',Arial,sans-serif;min-width:0}",
    ".psa-ti{width:52px;height:52px;border-radius:14px;background:#F7F1E8;border:1px solid #eadcc0;display:flex;align-items:center;justify-content:center}",
    ".psa-ti svg{width:30px;height:30px}",
    ".psa-tile.on .psa-ti{border-color:#C9922E;background:#fff}",
    ".psa-exwrap{margin:6px 0 10px}",
    ".psa-ex{display:flex;gap:10px;align-items:flex-start;padding:8px 0;font:500 13px/1.45 Inter,'Segoe UI',Arial,sans-serif;color:#3B2416}",
    ".psa-exi{flex:0 0 26px;height:26px;border-radius:50%;background:#F7F1E8;border:1px solid #C9922E;display:flex;align-items:center;justify-content:center}",
    ".psa-exi svg{width:15px;height:15px}",
    "@media(max-width:700px){.psa-trust,.psa-exwrap{margin-left:14px;margin-right:14px}}",
    ".psa-rows{display:grid;grid-template-columns:1fr;gap:0}",
    ".psa-row{display:flex;gap:12px;padding:12px 14px;border-top:1px solid #e6dac3}",
    ".psa-row:first-child{border-top:0}",
    ".psa-ic{flex:0 0 34px;height:34px;border-radius:50%;background:#fff;border:1.5px solid #C9922E;display:flex;align-items:center;justify-content:center}",
    ".psa-ic svg{width:18px;height:18px}",
    ".psa-row h4{margin:0 0 3px;font-size:14px;font-weight:700;color:#3B2416}",
    ".psa-row p{margin:0;font-size:13px;line-height:1.5;color:#5b4632}",
    ".psa-row a{color:#8a5a12;font-weight:600}",
    ".psa-note{margin-top:6px;padding:8px 10px;border-radius:8px;background:#fff;border:1px dashed #C9922E;font-size:12.5px;color:#3B2416}",
    "@media(min-width:760px){.psa-rows{grid-template-columns:1fr 1fr}.psa-row:nth-child(2){border-top:0}.psa-row:nth-child(even){border-left:1px solid #e6dac3}}"
  ].join("\n");
  var st = document.createElement("style");
  st.id = "psa-css"; st.textContent = css;
  document.head.appendChild(st);

  /* ---------- Badge (shield + checkmark, SVG) ---------- */
  var uid = 0;
  function shield(px) {
    var g = "psag" + (++uid);
    return '<svg width="' + px + '" height="' + px + '" viewBox="0 0 48 56" role="img" aria-label="PS Mart Assured" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#f7dd9b"/><stop offset=".5" stop-color="#e3b04b"/><stop offset="1" stop-color="#C9922E"/></linearGradient></defs>' +
      '<path d="M24 2 44 9v17c0 14-8.6 23.2-20 28C12.6 49.200 4 40 4 26V9z" fill="url(#' + g + ')"/>' +
      '<path d="M24 6.500 40 12v14c0 11.300-6.800 19-16 23.300C14.800 45 8 37.300 8 26V12z" fill="#3B2416"/>' +
      '<path d="M16 27.500l6 6 11-12.500" fill="none" stroke="#F7F1E8" stroke-width="4.200" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
  }
  function badge(size, withSub) {
    var lg = size === "lg";
    return '<span class="psa-b' + (lg ? " lg" : "") + '">' + shield(lg ? 34 : 22) +
      '<span class="t"><b>PS MART ASSURED</b>' + (withSub ? "" : "") + "</span></span>";
  }

  function icon(kind) {
    var p = {
      ret: '<path d="M4 10h11a5 5 0 0 1 0 10H8" /><path d="M8 6 4 10l4 4"/>',
      ver: '<path d="M12 3 20 6v6c0 5-3.400 8-8 9-4.600-1-8-4-8-9V6z"/><path d="M8.500 12.500l2.500 2.500 4.500-5"/>',
      cod: '<rect x="2.500" y="7" width="19" height="10" rx="2"/><circle cx="12" cy="12" r="2.500"/><path d="M6 10v4M18 10v4"/>',
      pay: '<rect x="3" y="6" width="18" height="12" rx="2.500"/><path d="M8 10h8M8 10c2.500 0 2.500 3 0 3h-1l4 3"/>',
      sup: '<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3" y="13" width="4" height="6" rx="1.500"/><rect x="17" y="13" width="4" height="6" rx="1.500"/><path d="M19 19c0 1.500-2 2.500-5 2.500"/>'
    }[kind];
    return '<svg viewBox="0 0 24 24" fill="none" stroke="#3B2416" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>";
  }

  /* ---------- Data ---------- */
  function load() {
    if (MAP) return Promise.resolve(MAP);
    if (LOADING) return LOADING;
    if (typeof supabaseClient === "undefined") return Promise.resolve({});
    LOADING = supabaseClient.from("ps_assured")
      .select("product_id,verified_seller,return_eligible,return_note")
      .eq("assured", true)
      .then(function (r) {
        MAP = {};
        if (!r.error && Array.isArray(r.data)) r.data.forEach(function (x) { MAP[String(x.product_id)] = x; });
        else if (r.error) console.log("PS Assured:", r.error.message);
        return MAP;
      }, function () { MAP = {}; return MAP; });
    return LOADING;
  }

  /* ---------- Product listing (cards) ---------- */
  function decorateCards(map) {
    if (/\/(index\.html)?$/.test(location.pathname)) return; /* home page par badge nahi */
    var cards = document.querySelectorAll(".product:not([data-psa])");
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      var a = c.querySelector('a[href*="product.html?id="]');
      if (!a) continue;
      c.setAttribute("data-psa", "1");
      var m = (a.getAttribute("href") || "").match(/[?&]id=([^&#]+)/);
      if (!m) continue;
      var id = decodeURIComponent(m[1]);
      if (!map[id]) continue;
      var host = c.querySelector(".pc-body") || c;
      var anchor = host.querySelector(".pc-price") || host.querySelector("h3");
      var holder = document.createElement("div");
      holder.className = "psa-card";
      holder.innerHTML = badge("sm", false);
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(holder, anchor.nextSibling);
      else host.appendChild(holder);
    }
  }

  /* ---------- Product detail section ---------- */
  function detailHtml(info) {
    var rows = "";
    if (info.return_eligible !== false) {
      rows += '<div class="psa-row"><span class="psa-ic">' + icon("ret") + '</span><div><h4>7 Days Return &amp; Support</h4>' +
        "<p>You can request a return within 7 days of delivery for eligible issues (damaged, defective, wrong or not as described). " +
        "Every request is reviewed by PS Mart and is subject to approval. " +
        '<a href="policies.html#return">Return conditions</a></p></div></div>';
    } else {
      rows += '<div class="psa-row"><span class="psa-ic">' + icon("ret") + '</span><div><h4>Return not available for this product</h4>' +
        '<p>This product is not eligible for return. You can still contact support for any order issue. <a href="policies.html#return">Return Policy</a></p></div></div>';
    }
    if (info.verified_seller) {
      rows += '<div class="psa-row"><span class="psa-ic">' + icon("ver") + '</span><div><h4>Verified Seller</h4>' +
        "<p>This seller has completed verification with PS Mart.</p></div></div>";
    }
    rows += '<div class="psa-row"><span class="psa-ic">' + icon("sup") + '</span><div><h4>Customer Support</h4>' +
      '<p>Need help with an order? <a href="contact.html">Contact PS Mart support</a>.</p></div></div>';
    var note = info.return_note ? '<div class="psa-note"><b>Product note:</b> ' + esc(info.return_note) + "</div>" : "";
    return '<div class="psa-head">' + badge("lg", true) + '</div><div class="psa-rows">' + rows + "</div>" +
      (note ? '<div style="padding:0 14px 12px">' + note + "</div>" : "");
  }

  function tile(href, svg, label, on) {
    return '<a class="psa-tile' + (on ? " on" : "") + '" href="' + href + '"><span class="psa-ti">' + svg + "</span><span>" + label + "</span></a>";
  }

  /* "Product highlights" / "Key Features" wale section ko dhundo (dono layout me chalta hai) */
  function findAnchor(d) {
    var want = ["product highlights", "key features", "product description", "specifications", "all details"];
    var hs = d.querySelectorAll("h2,h3,summary");
    for (var w = 0; w < want.length; w++) {
      for (var h = 0; h < hs.length; h++) {
        var txt = (hs[h].textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
        if (txt.indexOf(want[w]) === 0) {
          var sec = hs[h].closest(".info-section,.ps-sec,.ps-wide,details");
          if (sec && sec !== d && d.contains(sec)) return sec;
        }
      }
    }
    return null;
  }

  function renderDetail(map) {
    var d = document.getElementById("detail");
    if (!d) return;
    /* galti se #detail ke bahar bani purani rows hata do */
    var all = document.querySelectorAll(".psa-trust,.psa-exwrap");
    for (var z = 0; z < all.length; z++) { if (!d.contains(all[z])) all[z].parentNode.removeChild(all[z]); }
    if (d.querySelector(".psa-trust")) return;
    if (!d.querySelector(".action-buttons") && !d.querySelector(".detail-info")) return; /* detail abhi bana nahi */
    var id = new URLSearchParams(location.search).get("id");
    var a = id && map[String(id)];

    var old = d.querySelectorAll(".ps-trust");
    for (var k = 0; k < old.length; k++) old[k].parentNode.removeChild(old[k]);

    var target = findAnchor(d);
    var retOk = !(a && a.return_eligible === false);

    var row = document.createElement("div");
    row.className = "psa-trust";
    row.innerHTML =
      tile("policies.html#return", icon("ret"), retOk ? "7-Day<br>Return" : "No<br>Return", false) +
      tile("policies.html#refund", icon("cod"), "Cash on<br>Delivery", false) +
      tile("policies.html#refund", icon("pay"), "Secure<br>Payment", false) +
      (a ? tile("policies.html#assured", shield(30), "PS Mart<br>Assured", true)
         : tile("contact.html", icon("sup"), "Customer<br>Support", false));

    var parent = target ? target.parentNode : d;
    var ref = target || null;
    parent.insertBefore(row, ref);

    /* sirf zaruri chhoti lines (table nahi): Verified Seller aur product ka return note */
    var ex = "";
    if (a && a.verified_seller) {
      ex += '<div class="psa-ex"><span class="psa-exi">' + icon("ver") + "</span><span><b>Verified Seller</b>. Seller verification completed with PS Mart.</span></div>";
    }
    if (a && a.return_note) {
      ex += '<div class="psa-ex"><span class="psa-exi">' + icon("ret") + "</span><span><b>Return note:</b> " + esc(a.return_note) + "</span></div>";
    }
    if (ex) {
      var exBox = document.createElement("div");
      exBox.className = "psa-exwrap";
      exBox.innerHTML = ex;
      parent.insertBefore(exBox, ref);
    }
  }

  var timer = null;
  function run() {
    load().then(function (map) {
      try { decorateCards(map); } catch (e) { console.log("PSA cards:", e); }
      try { renderDetail(map); } catch (e) { console.log("PSA detail:", e); }
    });
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(run, 120); }

  document.addEventListener("DOMContentLoaded", function () {
    run();
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  });

  window.PSAssured = { badge: badge, shield: shield, icon: icon, load: load, esc: esc };
})();
