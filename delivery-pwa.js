/* PS Mart Delivery - PWA helper (install button, install guide, internet status).
   Install karna bilkul optional hai. Koi secret ya private data yahan nahi hai.
   Delivery pages par ye file ek baar include hoti hai. Dukaan wali pwa.js se alag hai. */
(function () {
  "use strict";

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }

  var standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  var deferred = null;

  var css =
    ".dpw-bar{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;max-width:760px;margin:10px auto 0;padding:0 14px}" +
    ".dpw-ins{border:0;border-radius:12px;padding:11px 16px;background:linear-gradient(135deg,#f7dd9b,#f0bd50 45%,#C9922E);color:#24150b;font:700 14px Inter,'Segoe UI',Arial,sans-serif;cursor:pointer;box-shadow:0 6px 14px rgba(201,146,46,.4)}" +
    ".dpw-how{color:#8a5a12;font:600 13px Inter,'Segoe UI',Arial,sans-serif;text-decoration:underline;cursor:pointer;background:none;border:0;padding:6px 0}" +
    ".dpw-net{position:fixed;left:0;right:0;top:0;z-index:9999;padding:9px 14px;text-align:center;font:700 13px Inter,'Segoe UI',Arial,sans-serif;display:none}" +
    ".dpw-net.off{display:block;background:#8b1e1e;color:#fff}.dpw-net.on{display:block;background:#1b7a3c;color:#fff}" +
    ".dpw-modal{position:fixed;inset:0;background:rgba(36,21,11,.6);z-index:10000;display:none;align-items:flex-end;justify-content:center}" +
    ".dpw-modal.show{display:flex}" +
    ".dpw-sheet{background:#fff;width:100%;max-width:520px;max-height:88vh;overflow:auto;border-radius:18px 18px 0 0;padding:20px 18px 24px;font-family:Inter,'Segoe UI',Arial,sans-serif;color:#2a1a0e}" +
    "@media(min-width:700px){.dpw-modal{align-items:center}.dpw-sheet{border-radius:18px}}" +
    ".dpw-sheet h3{margin:0 0 12px;font:700 22px Georgia,serif;color:#3B2416}" +
    ".dpw-sheet h4{margin:14px 0 4px;font-size:14px;color:#8a5a12}" +
    ".dpw-sheet p,.dpw-sheet li{font-size:14px;line-height:1.55;margin:0}" +
    ".dpw-sheet ol{margin:4px 0 0 18px;padding:0}" +
    ".dpw-close{margin-top:18px;width:100%;padding:13px;border:1.5px solid #C9922E;border-radius:12px;background:#fff;color:#3B2416;font:700 15px Inter,Arial,sans-serif;cursor:pointer}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  function all(sel) { return document.querySelectorAll(sel); }
  function setInstallVisible(v) { var b = all("[data-dp-install]"); for (var i = 0; i < b.length; i++) b[i].hidden = !v; }
  function hideAllInstallUi() {
    setInstallVisible(false);
    var h = all("[data-dp-howto],[data-dp-bar]"); for (var i = 0; i < h.length; i++) h[i].hidden = true;
  }

  /* ----- install guide ----- */
  var modal = null;
  function guide() {
    if (!modal) {
      modal = document.createElement("div"); modal.className = "dpw-modal";
      modal.innerHTML =
        '<div class="dpw-sheet" role="dialog" aria-modal="true" aria-label="App install guide"><h3>PS Mart Scanner install karein</h3>' +
        "<p>Install karna zaruri nahi hai. Aap website se bhi wahi account aur wahi data use kar sakte hain.</p>" +
        "<h4>Android (Chrome)</h4><ol><li>Chrome ke upar daayein <b>3 dots</b> dabayein.</li><li><b>Install app</b> ya <b>Add to Home screen</b> chuniye.</li><li><b>Install</b> dabayein.</li></ol>" +
        "<h4>Windows / Laptop (Chrome ya Edge)</h4><ol><li>Address bar ke daayein taraf <b>install icon</b> dabayein, ya 3 dots menu me <b>Install PS Mart Scanner</b> / <b>Save and share &rarr; Install page as app</b> chuniye.</li><li>Desktop par shortcut ban jayega.</li></ol>" +
        "<h4>iPhone (Safari)</h4><ol><li>Neeche <b>Share</b> button dabayein.</li><li><b>Add to Home Screen</b> chuniye.</li></ol>" +
        '<button type="button" class="dpw-close">Theek hai</button></div>';
      modal.addEventListener("click", function (e) { if (e.target === modal || (e.target.className || "") === "dpw-close") modal.classList.remove("show"); });
      document.body.appendChild(modal);
    }
    modal.classList.add("show");
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    var ins = t.closest && t.closest("[data-dp-install]");
    var how = t.closest && t.closest("[data-dp-howto]");
    if (ins) {
      e.preventDefault();
      if (deferred) {
        deferred.prompt();
        deferred.userChoice.then(function () { deferred = null; setInstallVisible(false); }).catch(function () {});
      } else guide();
    } else if (how) { e.preventDefault(); guide(); }
  });

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); deferred = e;
    if (!standalone) setInstallVisible(true);
  });
  window.addEventListener("appinstalled", function () { deferred = null; hideAllInstallUi(); });

  /* ----- internet status ----- */
  var net = null, hideT = null;
  function netEl() {
    if (!net) { net = document.createElement("div"); net.className = "dpw-net"; net.setAttribute("role", "status"); document.body.appendChild(net); }
    return net;
  }
  function showNet(online) {
    var el = netEl(); clearTimeout(hideT);
    if (online) { el.className = "dpw-net on"; el.textContent = "Internet wapas aa gaya"; hideT = setTimeout(function () { el.className = "dpw-net"; }, 3000); }
    else { el.className = "dpw-net off"; el.textContent = "Internet nahi hai. Delivery ya scan tabhi hoga jab internet chalu ho."; }
  }
  window.addEventListener("offline", function () { showNet(false); });
  window.addEventListener("online", function () { showNet(true); });
  window.dpOnline = function () { return navigator.onLine !== false; };

  document.addEventListener("DOMContentLoaded", function () {
    if (standalone) hideAllInstallUi();
    if (navigator.onLine === false) showNet(false);
  });
})();
