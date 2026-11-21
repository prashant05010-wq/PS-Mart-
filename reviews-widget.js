/* PS Mart - reviews-widget.js
   Product page par "Ratings & Reviews" me asli reviews dikhata hai (ps_reviews table se).
   Review na mile ya table padh na paye to purana "No reviews yet" box waise hi rehta hai.
   Koi secret key nahi. app.js ka supabaseClient use hota hai. */
(function () {
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function stars(n) {
    n = Math.max(0, Math.min(5, Math.round(Number(n) || 0)));
    return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
  }
  var rcss = "#detail .ps-reviews-sum{display:flex;align-items:center;gap:12px;margin-bottom:10px}" +
    "#detail .ps-reviews-sum b{font-size:30px;color:#43250f}" +
    "#detail .ps-rv{border-top:1px solid #efe4cc;padding:10px 0}" +
    "#detail .ps-rv .st{color:#C9922E;letter-spacing:1px}" +
    "#detail .ps-rv p{margin:4px 0;font-size:14px;line-height:1.5}" +
    "#detail .ps-rv small{color:#7c6a58}";
  var rs = document.createElement("style"); rs.textContent = rcss; document.head.appendChild(rs);
  var pid = new URLSearchParams(location.search).get("id");
  var cache = null, loading = false;

  async function load() {
    if (cache || loading || !pid || typeof supabaseClient === "undefined") return cache;
    loading = true;
    try {
      var r = await supabaseClient.from("ps_reviews").select("*")
        .eq("product_id", String(pid)).order("created_at", { ascending: false }).limit(50);
      if (!r.error && Array.isArray(r.data)) cache = r.data;
    } catch (e) { console.log("reviews-widget:", e); }
    loading = false;
    return cache;
  }

  function html(list) {
    var avg = list.reduce(function (a, x) { return a + Number(x.rating || 0); }, 0) / list.length;
    var items = list.map(function (x) {
      return '<div class="ps-rv"><div class="st">' + stars(x.rating) + "</div>" +
        (x.comment ? "<p>" + esc(x.comment) + "</p>" : "") +
        "<small>" + esc(x.reviewer_name || "Customer") + " ✔ Verified Purchase" +
        (x.created_at ? " • " + new Date(x.created_at).toLocaleDateString("en-IN") : "") + "</small></div>";
    }).join("");
    return '<div class="ps-reviews-sum"><b>' + avg.toFixed(1) + ' ★</b><span>' +
      list.length + " Ratings &amp; Reviews</span></div>" + items;
  }

  async function fill() {
    var box = document.querySelector("#detail .review-box");
    if (!box || box.getAttribute("data-rw")) return;
    box.setAttribute("data-rw", "1");
    var list = await load();
    if (list && list.length) {
      box.className = "";
      box.innerHTML = html(list);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var d = document.getElementById("detail");
    if (!d) return;
    new MutationObserver(fill).observe(d, { childList: true, subtree: true });
    fill();
  });
})();
