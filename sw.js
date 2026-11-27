/* PS Mart service worker (v2)
   Sirf SAFE static files (css, js, images, fonts, manifest) cache hoti hain, wo bhi network-first.
   Pages (HTML), Supabase ka data, login/session, parcel ya customer ki koi jaankari cache NAHI hoti.
   Offline hone par sirf offline.html dikhta hai. Doosri site (Supabase / CDN) ki requests ko ye chhuta nahi. */
var CACHE = "psmart-v3";
var OFFLINE = "offline.html";
var STATIC = ["style", "script", "image", "font", "manifest"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll([OFFLINE, "icon-192.png"]); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  /* Pages: hamesha network se. Offline ho to sirf offline.html. Kuch cache nahi hota. */
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(function () { return caches.match(OFFLINE); }));
    return;
  }

  if (STATIC.indexOf(req.destination) === -1) return;
  /* kisi token ya parcel code wale url ko cache nahi karte */
  if (/[?&](scan|c|token|access_token|code)=/i.test(url.search)) return;

  e.respondWith(
    fetch(req)
      .then(function (res) {
        if (res && res.status === 200 && res.type === "basic") {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
        }
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) { return hit || Response.error(); });
      })
  );
});
