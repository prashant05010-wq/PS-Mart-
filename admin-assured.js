/* PS Mart Admin - PS MART ASSURED control.
   Har save server function admin_set_assured se hota hai, jo SERVER par admin check karta hai.
   Is file me koi secret key nahi. dp-common.js (dpEsc, dpRpc) pehle load hona chahiye. */
(function () {
  var E = window.dpEsc || function (v) { return String(v == null ? "" : v); };
  var PRODUCTS = [], MAP = {}, Q = "", ONLY = false, BUSY = false;

  var css = ".as-card{background:#fff;border:1px solid #e6dac3;border-radius:12px;padding:14px;margin:10px 0}" +
    ".as-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}" +
    ".as-top b{font-size:15px;color:#3B2416}.as-top small{color:#7c6a58;display:block}" +
    ".as-on{background:#e9f7ee;color:#1b7a3c;border-radius:99px;padding:3px 10px;font-size:12px;font-weight:700}" +
    ".as-off{background:#f3eee4;color:#7c6a58;border-radius:99px;padding:3px 10px;font-size:12px;font-weight:700}" +
    ".as-checks{display:grid;gap:8px;margin:10px 0}.as-checks label{display:flex;gap:8px;align-items:flex-start;font-size:14px}" +
    ".as-checks input{margin-top:3px;width:18px;height:18px;flex:0 0 18px}" +
    ".as-checks small{display:block;color:#7c6a58;font-size:12px}" +
    ".as-note{width:100%;min-height:60px;padding:10px;border:1.5px solid #C9922E;border-radius:10px;font:inherit;font-size:14px;box-sizing:border-box}" +
    ".as-save{margin-top:10px;padding:11px 18px;border:0;border-radius:10px;background:#3B2416;color:#f7dd9b;font-weight:700;cursor:pointer}" +
    ".as-save[disabled]{opacity:.6}.as-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:10px 0}" +
    ".as-bar input[type=text]{flex:1;min-width:180px;padding:11px;border:1.5px solid #C9922E;border-radius:10px;font-size:15px}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  function friendly(m) {
    m = String(m || "");
    if (/could not find the function|does not exist|schema cache|relation .* does not exist/i.test(m))
      return "PS Mart Assured ka SQL abhi run nahi hua. ps-mart-assured.sql Supabase SQL Editor me run karein. (" + m + ")";
    return m;
  }

  async function loadData() {
    var root = document.getElementById("assuredRoot");
    root.innerHTML = "Loading...";
    try {
      var p = await supabaseClient.from("products").select("id,name,status").order("id", { ascending: false }).limit(300);
      if (p.error) throw new Error(p.error.message);
      PRODUCTS = p.data || [];
      var a = await supabaseClient.from("ps_assured").select("*");
      if (a.error) throw new Error(a.error.message);
      MAP = {}; (a.data || []).forEach(function (x) { MAP[String(x.product_id)] = x; });
      draw();
    } catch (e) {
      root.innerHTML = '<div class="dp-msg bad">' + E(friendly(e.message)) + "</div>";
    }
  }

  function row(p) {
    var id = String(p.id), a = MAP[id] || {};
    var on = a.assured === true;
    var ok = String(p.status || "approved") === "approved";
    return '<div class="as-card" data-id="' + E(id) + '">' +
      '<div class="as-top"><div><b>' + E(p.name || "Product") + "</b><small>ID " + E(id) + " • status: " + E(p.status || "-") + "</small></div>" +
      '<span class="' + (on ? "as-on" : "as-off") + '">' + (on ? "ASSURED ON" : "Not assured") + "</span></div>" +
      '<div class="as-checks">' +
      '<label><input type="checkbox" class="f-assured"' + (on ? " checked" : "") + (ok || on ? "" : " disabled") + ">" +
        "<span>PS MART ASSURED chalu karein" + (ok ? "" : "<small>Pehle product approve karein</small>") + "</span></label>" +
      '<label><input type="checkbox" class="f-ver"' + (a.verified_seller ? " checked" : "") + ">" +
        "<span>Verified Seller dikhayein<small>Tabhi tick karein jab seller ki verification sach me poori ho chuki ho.</small></span></label>" +
      '<label><input type="checkbox" class="f-ret"' + (a.return_eligible === false ? "" : " checked") + ">" +
        "<span>7 din return allowed<small>Untick karne par customer ko \"Return not available\" dikhega.</small></span></label>" +
      "</div>" +
      '<textarea class="as-note f-note" maxlength="300" placeholder="Product ka khaas return exception (optional, customer ko dikhega)">' + E(a.return_note || "") + "</textarea>" +
      '<button class="as-save">Save</button> <span class="as-msg"></span></div>';
  }

  function draw() {
    var root = document.getElementById("assuredRoot");
    var q = Q.trim().toLowerCase();
    var list = PRODUCTS.filter(function (p) {
      if (ONLY && !(MAP[String(p.id)] && MAP[String(p.id)].assured)) return false;
      return !q || String(p.name || "").toLowerCase().indexOf(q) > -1 || String(p.id).indexOf(q) > -1;
    }).slice(0, 80);
    var onCount = Object.keys(MAP).filter(function (k) { return MAP[k].assured; }).length;
    root.innerHTML = '<div class="dp-hint">Badge sirf wahi products par dikhta hai jo yahan se chalu kiye jayein. Kuch bhi apne aap chalu nahi hota. Abhi Assured products: <b>' + onCount + "</b></div>" +
      '<div class="as-bar"><input type="text" id="asQ" placeholder="Product ka naam ya ID" value="' + E(Q) + '">' +
      '<label style="font-size:14px"><input type="checkbox" id="asOnly"' + (ONLY ? " checked" : "") + "> Sirf Assured</label></div>" +
      (list.length ? list.map(row).join("") : '<div class="dp-msg info">Koi product nahi mila.</div>') +
      (PRODUCTS.length > 80 ? '<div class="dp-hint">Zyada products ke liye search use karein (ek baar me 80 dikhte hain).</div>' : "");
  }

  async function save(card) {
    if (BUSY) return;
    var btn = card.querySelector(".as-save"), msg = card.querySelector(".as-msg");
    BUSY = true; btn.disabled = true; msg.textContent = "Save ho raha hai...";
    try {
      var args = {
        p_product_id: card.getAttribute("data-id"),
        p_assured: card.querySelector(".f-assured").checked,
        p_verified_seller: card.querySelector(".f-ver").checked,
        p_return_eligible: card.querySelector(".f-ret").checked,
        p_return_note: card.querySelector(".f-note").value
      };
      var r = await dpRpc("admin_set_assured", args);
      if (!r || r.success !== true) throw new Error((r && r.message) || "Save nahi hua");
      MAP[args.p_product_id] = { product_id: args.p_product_id, assured: args.p_assured, verified_seller: args.p_verified_seller,
        return_eligible: args.p_return_eligible, return_note: args.p_return_note || null };
      draw();
    } catch (e) {
      msg.style.color = "#b00020"; msg.textContent = friendly(e.message);
      btn.disabled = false;
    }
    BUSY = false;
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#assuredRoot .as-save");
    if (b) save(b.closest(".as-card"));
  });
  document.addEventListener("input", function (e) {
    if (e.target && e.target.id === "asQ") { Q = e.target.value; var pos = Q.length; draw(); var i = document.getElementById("asQ"); i.focus(); i.setSelectionRange(pos, pos); }
  });
  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "asOnly") { ONLY = e.target.checked; draw(); }
  });

  window.adminAssuredInit = loadData;
})();
