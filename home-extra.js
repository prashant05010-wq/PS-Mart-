/* PS Mart - home-extra.js : home aur products page ki sajawat (sirf CSS aur discount tag, koi data nahi badalta). */
(function () {
  var css = [
    "body .home-product-grid .product,body .products .product{box-shadow:0 2px 12px rgba(59,36,22,.07);transition:transform .2s,box-shadow .2s,border-color .2s}",
    "body .home-product-grid .product:hover{transform:translateY(-3px)!important;box-shadow:0 14px 28px rgba(59,36,22,.16)!important}",
    ".hx-off{position:absolute;top:8px;left:8px;z-index:3;padding:3px 9px;border-radius:0 10px 10px 0;background:linear-gradient(135deg,#f7dd9b,#f0bd50 50%,#C9922E);color:#3B2416;font:800 11px/1.2 Inter,'Segoe UI',Arial,sans-serif;letter-spacing:.3px;box-shadow:0 2px 6px rgba(59,36,22,.25)}",
    ".section-head h2{letter-spacing:.2px}",
    ".section-head::after{width:96px;height:3px;border-radius:3px}",
    ".promo-viewport{box-shadow:0 14px 34px rgba(59,36,22,.28)}",
    ".trust-section{border:1.5px solid #e6dac3;background:linear-gradient(180deg,#fff,#fbf6ea);box-shadow:0 6px 20px rgba(59,36,22,.06)}",
    ".trust-box{padding:6px 4px}.trust-icon{width:46px;height:46px;flex:0 0 46px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#F7F1E8;border:1.5px solid #C9922E;font-size:22px}",
    ".seller-banner{position:relative;overflow:hidden;box-shadow:0 12px 30px rgba(59,36,22,.28)}",
    ".seller-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(240,189,80,.35),transparent 70%);pointer-events:none}",
    ".seller-btn{box-shadow:0 6px 16px rgba(201,146,46,.45);transition:transform .2s}.seller-btn:hover{transform:translateY(-2px)}",
    ".home-more button{box-shadow:0 4px 12px rgba(59,36,22,.12);transition:all .2s}.home-more button:hover{background:#3B2416;color:#f7dd9b;border-color:#3B2416}",
    ".cat-tile b{transition:color .2s}.cat-tile:hover b{color:#C9922E}",
    ".ps-footer{background:linear-gradient(180deg,#24150b,#1a0e07)}"
  ].join("\n");
  var st = document.createElement("style"); st.id = "hx-css"; st.textContent = css; document.head.appendChild(st);

  function num(s) { var n = parseFloat(String(s || "").replace(/[^0-9.]/g, "")); return isFinite(n) ? n : 0; }

  function tags() {
    var cards = document.querySelectorAll(".product:not([data-hx])");
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      var price = c.querySelector(".pc-price b"), old = c.querySelector(".pc-price del"), pic = c.querySelector(".pic");
      if (!price || !old || !pic) continue;
      c.setAttribute("data-hx", "1");
      var p = num(price.textContent), o = num(old.textContent);
      if (!(o > p && p > 0)) continue;
      var pct = Math.round((o - p) / o * 100);
      if (pct < 5) continue;
      var t = document.createElement("span");
      t.className = "hx-off"; t.textContent = pct + "% OFF";
      pic.appendChild(t);
    }
  }

  var tm = null;
  function sched() { clearTimeout(tm); tm = setTimeout(function () { try { tags(); } catch (e) {} }, 150); }
  document.addEventListener("DOMContentLoaded", function () {
    sched();
    new MutationObserver(sched).observe(document.body, { childList: true, subtree: true });
  });
})();
