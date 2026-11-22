/* PS Mart - ps-auth.js : login, signup, forgot/reset password ke liye shared helpers.
   Supabase ki PUBLIC (anon) key hi use hoti hai. Service role key kahin nahi. Password kahin save nahi hota.
   Session wahi purani Supabase session hai (app.js ke saath share hoti hai). */
(function () {
  var SB_URL = "https://nctscffhnztscczjxhat.supabase.co";
  var SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdHNjZmZobnp0c2Njemp4aGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDM0MjUsImV4cCI6MjEwNjAxOTQyNX0.1bR1XER2te7enAtKXaRdTqPnsigh3VJyCLXVbPjKKWw";
  var client = window.supabase.createClient(SB_URL, SB_KEY);

  var EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.600-7 10-7 10 7 10 7-3.600 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.600 6.100A10.500 10.500 0 0 1 12 5c6.400 0 10 7 10 7a17 17 0 0 1-3.200 4.100M6.300 6.300A16.500 16.500 0 0 0 2 12s3.600 7 10 7a10 10 0 0 0 4.200-.9"/><path d="M9.900 9.900a3 3 0 0 0 4.200 4.200"/></svg>';

  function $(id) { return document.getElementById(id); }

  function msg(id, text, kind) {
    var el = $(id); if (!el) return;
    el.className = "au-msg" + (text ? " show " + (kind || "info") : "");
    el.textContent = text || "";
  }

  function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || "")); }

  function passwordProblem(pw) {
    pw = String(pw || "");
    if (pw.length < 8) return "Password kam se kam 8 akshar ka rakhein.";
    if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return "Password me kam se kam ek letter aur ek number hona chahiye.";
    if (pw.length > 72) return "Password bahut lamba hai (72 akshar tak).";
    return "";
  }

  function wireEye(inputId, btnId) {
    var i = $(inputId), b = $(btnId);
    if (!i || !b) return;
    b.innerHTML = EYE;
    b.addEventListener("click", function () {
      var show = i.type === "password";
      i.type = show ? "text" : "password";
      b.innerHTML = show ? EYE_OFF : EYE;
      b.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  }

  /* Error messages: kaam ki baat, par koi andar ki jaankari nahi */
  function friendly(err, ctx) {
    var m = String((err && err.message) || err || "");
    if (/invalid login credentials/i.test(m))
      return "Email ya password galat hai. Agar aap pehle OTP se login karte the, to 'Login with Email OTP' use karein ya 'Forgot password' se naya password set karein.";
    if (/not confirmed/i.test(m)) return "Email abhi confirm nahi hua. Aapko bheja gaya confirm link kholein.";
    if (/rate limit|too many|over_.*limit|security purposes/i.test(m)) return "Bahut zyada koshish ho gayi. Thodi der baad dobara try karein.";
    if (/expired|invalid.*token|otp.*invalid|token has expired/i.test(m)) return "OTP galat ya expire ho gaya hai. Naya OTP mangwayein.";
    if (/network|failed to fetch/i.test(m)) return "Internet check karein aur dobara try karein.";
    if (/password.*(weak|short|least)/i.test(m)) return "Password kamzor hai. Zyada lamba aur mushkil password rakhein.";
    if (/same.*password|different from the old/i.test(m)) return "Naya password purane se alag hona chahiye.";
    return "Kuch gadbad ho gayi. Dobara try karein.";
  }

  /* Profile na ho to hi banao (id par upsert, role kabhi nahi bhejte, duplicate nahi banta) */
  async function ensureProfile(user) {
    try {
      var p = await client.from("profiles").select("id").eq("id", user.id).maybeSingle();
      if (p.error || p.data) return;
      var name = (user.user_metadata && user.user_metadata.full_name) || null;
      await client.from("profiles").upsert({ id: user.id, full_name: name }, { onConflict: "id", ignoreDuplicates: true });
    } catch (e) { /* purana flow chalta rahe */ }
  }

  function safeNext() {
    var n = new URLSearchParams(location.search).get("next") || "";
    return /^[a-z0-9_\-]+\.html(\?[a-z0-9_=&\-]*)?$/i.test(n) ? n : "";
  }

  /* Role ke hisaab se sahi dashboard. Server ka role (profiles.role) hi maana jata hai. */
  async function routeFor(user) {
    var role = null;
    try {
      var p = await client.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (p && p.data) role = p.data.role;
    } catch (e) {}
    if (role === "admin") return { url: "admin-dashboard.html" };
    if (role === "seller") return { url: "seller-dashboard.html" };
    try {
      var m = await client.rpc("dp_me");
      var d = m && m.data;
      if (m && !m.error && d && d.exists) {
        if (d.status === "approved") return { url: "delivery-dashboard.html" };
        var t = { pending: "Aapka delivery partner registration abhi approval ke liye pending hai.",
                  rejected: "Aapka delivery partner registration reject ho gaya hai.",
                  suspended: "Aapka delivery partner account suspend hai. Support se sampark karein." };
        return { blocked: t[d.status] || "Delivery partner login abhi allowed nahi hai." };
      }
    } catch (e) {}
    return { url: safeNext() || "index.html" };
  }

  async function finishLogin(session, msgId) {
    var user = session.user;
    await ensureProfile(user);
    var r = await routeFor(user);
    if (r.blocked) { await client.auth.signOut(); msg(msgId, r.blocked, "bad"); return false; }
    msg(msgId, "Login ho gaya. Aapko le ja rahe hain...", "ok");
    setTimeout(function () { location.replace(r.url); }, 500);
    return true;
  }

  function baseUrl() { return location.href.replace(/[?#].*$/, "").replace(/[^\/]*$/, ""); }

  /* Resend ke liye cooldown button */
  function cooldown(btn, secs, label) {
    var n = secs; btn.disabled = true;
    var t = setInterval(function () {
      n--; btn.textContent = n > 0 ? label + " (" + n + "s)" : label;
      if (n <= 0) { clearInterval(t); btn.disabled = false; }
    }, 1000);
    btn.textContent = label + " (" + n + "s)";
  }

  window.PSAuth = { client: client, $: $, msg: msg, isEmail: isEmail, passwordProblem: passwordProblem, wireEye: wireEye,
    friendly: friendly, ensureProfile: ensureProfile, routeFor: routeFor, finishLogin: finishLogin, baseUrl: baseUrl, cooldown: cooldown };
})();
