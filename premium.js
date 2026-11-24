/* PS Mart premium.js: scroll animation aur loading skeleton. Koi data ya login ko nahi chhuta. */
(function () {
  function reveal() {
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    var els = document.querySelectorAll(".section-head,.trust-section,.seller-banner,.promo");
    for (var i = 0; i < els.length; i++) { if (els[i].getAttribute("data-pm")) continue; els[i].setAttribute("data-pm", "1"); els[i].classList.add("pm-rv"); io.observe(els[i]); }
  }
  function skeleton() {
    var gs = document.querySelectorAll(".home-product-grid");
    for (var i = 0; i < gs.length; i++) {
      var g = gs[i];
      if (g.children.length || g.getAttribute("data-sk")) continue;
      g.setAttribute("data-sk", "1");
      var h = ""; for (var k = 0; k < 5; k++) h += '<div class="pm-sk"><i></i><i></i><i></i></div>';
      g.innerHTML = h;
      (function (grid) {
        var mo = new MutationObserver(function () {
          var real = false, c = grid.children;
          for (var j = 0; j < c.length; j++) if (!c[j].classList.contains("pm-sk")) { real = true; break; }
          if (real) { var s = grid.querySelectorAll(".pm-sk"); for (var t = 0; t < s.length; t++) s[t].remove(); mo.disconnect(); }
        });
        mo.observe(grid, { childList: true });
        setTimeout(function () { var s = grid.querySelectorAll(".pm-sk"); for (var t = 0; t < s.length; t++) s[t].remove(); mo.disconnect(); }, 12000);
      })(g);
    }
  }
  function run() { try { skeleton(); reveal(); } catch (e) {} }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
  window.addEventListener("load", run);
})();
