/* PS Mart - ps-realtime.js
   Order/notification badalte hi page apne aap refresh ho (bina reload). Sirf wahi data aata hai jo RLS se user ko dikhna allowed hai.
   Use: <script src="ps-realtime.js" data-tables="orders,seller_orders,notifications"></script> */
(function () {
  var sc = document.currentScript;
  var tables = ((sc && sc.getAttribute("data-tables")) || "notifications").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  var tries = 0, timer = null;

  function client() {
    try { if (typeof supabaseClient !== "undefined" && supabaseClient && supabaseClient.channel) return supabaseClient; } catch (e) {}
    try { if (window.PSAuth && PSAuth.client && PSAuth.client.channel) return PSAuth.client; } catch (e) {}
    return null;
  }

  function typing() {
    var a = document.activeElement, t = a && a.tagName;
    return t === "INPUT" || t === "TEXTAREA" || t === "SELECT";
  }

  function refresh() {
    try {
      if (typeof loadOrders === "function") return loadOrders(true);
      if (typeof refreshList === "function") return refreshList();
      if (typeof loadNotifications === "function") return loadNotifications();
    } catch (e) {}
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(function run() {
      if (document.hidden) return;                       // tab chhupa ho to ruko
      if (typing()) { timer = setTimeout(run, 4000); return; }  // user type kar raha ho to beech me page na badlo
      refresh();
    }, 700);
  }

  function start() {
    var sb = client();
    if (!sb) { if (++tries < 20) setTimeout(start, 600); return; }
    sb.auth.getSession().then(function (s) {
      var u = s && s.data && s.data.session && s.data.session.user;
      if (!u) return;
      var ch = sb.channel("ps-rt-" + Math.random().toString(36).slice(2, 8));
      tables.forEach(function (t) {
        ch = ch.on("postgres_changes", { event: "*", schema: "public", table: t }, schedule);
      });
      ch.subscribe();
      document.addEventListener("visibilitychange", function () { if (!document.hidden) schedule(); });
    }).catch(function () {});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
