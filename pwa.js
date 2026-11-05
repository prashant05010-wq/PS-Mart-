/* PS Mart - PWA: service worker register + "Install app" bar
   Android/Chrome: asli Install button. iPhone (Safari): "Add to Home Screen" ka tip.
   Pehle se installed (standalone) ho to kuch nahi dikhta. Dismiss karne par 7 din tak dobara nahi. */
(function () {
  "use strict";

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }

  var standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  if (standalone) return;

  var KEY = "ps_pwa_dismissed", DAYS = 7, deferred = null, bar = null;

  function dismissed() {
    try { var t = Number(localStorage.getItem(KEY) || 0); return !!t && (Date.now() - t) < DAYS * 86400000; } catch (e) { return false; }
  }
  function remember() { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} }
  function hide() { if (bar && bar.parentNode) bar.parentNode.removeChild(bar); bar = null; }

  var st = document.createElement("style");
  st.textContent =
    "#ps-pwa{position:fixed;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:9000;max-width:520px;margin:0 auto;" +
    "background:#3B2416;color:#fff;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.3);padding:12px 12px 12px 14px;display:flex;align-items:center;gap:10px;font-family:inherit}" +
    "#ps-pwa .t{flex:1;font-size:13px;line-height:1.35}" +
    "#ps-pwa .t b{display:block;font-size:14px}" +
    "#ps-pwa button{border:0;cursor:pointer;font-family:inherit}" +
    "#ps-pwa .go{background:#C9922E;color:#fff;font-weight:700;font-size:13px;border-radius:9px;padding:9px 14px;white-space:nowrap}" +
    "#ps-pwa .x{background:none;color:#e9d9bd;font-size:18px;padding:4px 6px}";
  document.head.appendChild(st);

  function show(title, text, btnText, onGo) {
    if (bar || dismissed()) return;
    bar = document.createElement("div"); bar.id = "ps-pwa";
    var t = document.createElement("div"); t.className = "t";
    var b = document.createElement("b"); b.textContent = title;
    t.appendChild(b); t.appendChild(document.createTextNode(text));
    bar.appendChild(t);
    if (btnText) {
      var go = document.createElement("button"); go.type = "button"; go.className = "go"; go.textContent = btnText;
      go.addEventListener("click", onGo); bar.appendChild(go);
    }
    var x = document.createElement("button"); x.type = "button"; x.className = "x"; x.setAttribute("aria-label", "Close"); x.textContent = "\u2715";
    x.addEventListener("click", function () { remember(); hide(); });
    bar.appendChild(x);
    document.body.appendChild(bar);
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); deferred = e;
    show("PS Mart app install karein", "Home screen se seedha kholein, tez aur app jaisa.", "Install", function () {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.then(function () { deferred = null; remember(); hide(); }).catch(function () { hide(); });
    });
  });

  window.addEventListener("appinstalled", function () { remember(); hide(); });

  var ua = navigator.userAgent || "";
  var isIOS = /iphone|ipad|ipod/i.test(ua) && !window.MSStream;
  var isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|opios/i.test(ua);
  if (isIOS && isSafari) {
    setTimeout(function () {
      show("PS Mart ko Home Screen par rakhein", "Neeche Share button dabayein, phir \"Add to Home Screen\" chunein.", "", null);
    }, 4000);
  }
})();
