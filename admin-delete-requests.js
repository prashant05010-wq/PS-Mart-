/* PS Mart Admin - Seller ki product delete requests. Faisla server function admin_decide_product_delete se hota hai
   (jo server par admin check karta hai). dp-common.js (dpEsc, dpRpc) pehle load hona chahiye. */
(function () {
  var E = window.dpEsc || function (v) { return String(v == null ? "" : v); };
  var BUSY = false;
  function fr(m) {
    m = String(m || "");
    return /does not exist|schema cache|could not find/i.test(m) ? "ps-mart-seller-delete.sql abhi run nahi hua. (" + m + ")" : m;
  }
  async function load() {
    var root = document.getElementById("delReqRoot");
    root.innerHTML = "Loading...";
    var r = await supabaseClient.from("product_delete_requests").select("*").order("created_at", { ascending: false }).limit(100);
    if (r.error) { root.innerHTML = '<div class="dp-msg bad">' + E(fr(r.error.message)) + "</div>"; return; }
    var list = r.data || [];
    if (!list.length) { root.innerHTML = '<div class="dp-msg info">Abhi koi delete request nahi hai.</div>'; return; }
    root.innerHTML = list.map(function (q) {
      var pend = q.status === "pending";
      return '<div class="as-card" data-id="' + E(q.id) + '"><div class="as-top"><div><b>' + E(q.product_name || "Product") +
        "</b><small>Product ID " + E(q.product_id) + " • Seller " + E(q.seller_id) + " • " + E(new Date(q.created_at).toLocaleString("en-IN")) +
        '</small></div><span class="' + (pend ? "as-off" : q.status === "approved" ? "as-on" : "as-off") + '">' + E(q.status) + "</span></div>" +
        "<p><b>Wajah:</b> " + E(q.reason || "-") + "</p>" +
        (pend ? '<textarea class="as-note f-note" maxlength="300" placeholder="Note (reject karte waqt wajah likhein)"></textarea>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="as-save dr-ok">Approve (product hatao)</button>' +
          '<button class="as-save dr-no" style="background:#8b1e1e;color:#fff">Reject</button></div>'
          : (q.admin_note ? "<p><b>Admin note:</b> " + E(q.admin_note) + "</p>" : "")) +
        '<div class="as-msg"></div></div>';
    }).join("");
  }
  async function decide(card, ok) {
    if (BUSY) return;
    if (ok && !confirm("Is product ko hamesha ke liye hatana hai?")) return;
    var note = card.querySelector(".f-note").value;
    if (!ok && !note.trim()) { card.querySelector(".as-msg").textContent = "Reject karne ki wajah likhein."; return; }
    BUSY = true;
    try {
      var r = await dpRpc("admin_decide_product_delete", { p_request_id: Number(card.getAttribute("data-id")), p_approve: ok, p_note: note });
      if (!r || r.success !== true) throw new Error((r && r.message) || "Nahi hua");
      alert(r.message || "Ho gaya");
      await load();
    } catch (e) { card.querySelector(".as-msg").textContent = fr(e.message); }
    BUSY = false;
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("#delReqRoot .dr-ok"), b = e.target.closest && e.target.closest("#delReqRoot .dr-no");
    if (a) decide(a.closest(".as-card"), true);
    if (b) decide(b.closest(".as-card"), false);
  });
  window.adminDelReqInit = load;
})();
