/* =====================================================
   PS Mart - Flipkart style UI  (flipkart-ui.js)
   Ye file app.js ke BAAD load hoti hai aur
   card() aur detail() ko Flipkart jaisa bana deti hai.
===================================================== */

/* ---------- CSS (khud inject hota hai) ---------- */
(function () {
  var css = `
/* ===== PRODUCT CARD (Flipkart jaisa) ===== */
.home-product-grid .product,#products .product{padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;border-radius:0!important;position:relative}
.home-product-grid .product:hover,#products .product:hover{transform:none!important;box-shadow:none!important}
.product .pc-link{display:block;text-decoration:none;color:inherit}
.product .pic{height:auto!important;aspect-ratio:4/5;padding:0!important;background:#f1f1f1!important;border-radius:12px!important;position:relative;overflow:hidden;display:block!important}
.product .pic img{width:100%!important;height:100%!important;object-fit:cover!important;display:block}
.product .pc-emoji{display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:54px}
.product .pc-rate{position:absolute;left:8px;bottom:8px;background:rgba(255,255,255,.92);border-radius:6px;padding:3px 7px;font-size:12px;font-weight:700;color:#222;display:flex;align-items:center;gap:4px}
.product .pc-rate i{color:#188038;font-style:normal}
.product .pc-rate span{color:#666;font-weight:500}
.product .pc-heart{position:absolute;top:8px;right:8px;width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.85);color:#b8860b;font-size:20px;cursor:pointer;z-index:3;display:flex;align-items:center;justify-content:center;padding:0}
.product .pc-body{padding:8px 2px 4px}
.product .pc-body h3{margin:0!important;font-size:14px!important;font-weight:500!important;color:#555;min-height:0!important;-webkit-line-clamp:1!important}
.product .pc-price{display:flex;align-items:baseline;gap:7px;margin-top:4px;flex-wrap:wrap}
.product .pc-price del{color:#888;font-size:13px}
.product .pc-price b{font-size:17px;color:#111}
@media(max-width:700px){
  .home-product-grid .product{min-width:44vw!important;max-width:44vw!important}
}

/* ===== PRODUCT DETAIL (Flipkart jaisa) ===== */
#detail .ps-gal{position:relative}
#detail .ps-slider{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch;background:#f1f1f1;border-radius:12px}
#detail .ps-slider::-webkit-scrollbar{display:none}
#detail .ps-slide{flex:0 0 100%;scroll-snap-align:center;aspect-ratio:1/1.1;display:flex;align-items:center;justify-content:center}
#detail .ps-slide img{width:100%;height:100%;object-fit:contain;display:block;user-select:none;-webkit-user-drag:none}
#detail .ps-dots{display:flex;justify-content:center;gap:7px;padding:12px 0 4px}
#detail .ps-dots span{width:7px;height:7px;border-radius:50%;background:#d0d0d0;transition:.2s;cursor:pointer}
#detail .ps-dots span.on{width:9px;height:9px;background:#1a56db;margin-top:-1px}
#detail .ps-arrow{position:absolute;top:45%;width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.9);box-shadow:0 2px 8px rgba(0,0,0,.2);font-size:22px;cursor:pointer;display:none;z-index:3}
#detail .ps-arrow.l{left:8px}#detail .ps-arrow.r{right:8px}
#detail .ps-heart{position:absolute;top:10px;right:10px;width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.9);color:#b8860b;font-size:22px;cursor:pointer;z-index:3;display:flex;align-items:center;justify-content:center;padding:0}
#detail .ps-count{position:absolute;right:10px;bottom:34px;background:rgba(0,0,0,.55);color:#fff;font-size:12px;padding:3px 9px;border-radius:12px;z-index:3}
#detail .ps-title{font:500 18px/1.35 Inter,Arial,sans-serif;margin:4px 0 8px;color:#222}
#detail .ps-priceline{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:10px 0 2px}
#detail .ps-off{color:#188038;font-weight:700;font-size:22px}
#detail .ps-old{color:#777;text-decoration:line-through;font-size:20px}
#detail .ps-now{font-size:28px;font-weight:700;color:#111}
#detail .ps-tax{color:#777;font-size:12px;margin:0 0 12px}
#detail .ps-rate{display:inline-flex;align-items:center;gap:4px;background:#188038;color:#fff;font-weight:700;font-size:13px;padding:3px 8px;border-radius:6px}
#detail .ps-offers{background:#e3f1fd;border-radius:14px;padding:14px;margin:14px 0}
#detail .ps-offers h3{margin:0 0 8px;font:700 17px Inter,Arial,sans-serif;color:#0d3b66}
#detail .ps-offers .offer{background:#fff;border-radius:10px;padding:10px 12px;margin-top:8px;font-size:14px}
#detail .ps-row{background:#f4f4f4;border-radius:12px;padding:13px 14px;margin:10px 0;font-size:14px;display:flex;align-items:center;justify-content:space-between;gap:10px;color:#222}
#detail .ps-row a{color:#1a56db;font-weight:700;text-decoration:none;white-space:nowrap}
#detail .ps-row.addr{background:#eef5ff;cursor:pointer}
#detail .ps-stock{font-size:14px;margin:8px 0}
#detail .ps-sec{margin-top:22px;border-top:1px solid #eee;padding-top:16px}
#detail .ps-sec h2{margin:0 0 10px;font:700 20px Inter,Arial,sans-serif;color:#222}
#detail .ps-sec ul{margin:0;padding-left:20px;line-height:1.8;font-size:14px}
#detail .ps-sec .spec-table{width:100%;max-width:none}
#detail .action-buttons{display:flex;gap:10px;margin:18px 0}
#detail .action-buttons button{flex:1;padding:14px;border:1px solid #ccc;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;background:#fff;color:#111}
#detail .action-buttons button.ps-buy{background:#ffe11b;border-color:#ffe11b}
#detail .action-buttons button:disabled{opacity:.5}
@media(min-width:801px){
  #detail .ps-arrow{display:block}
  #detail .detail-top{align-items:start}
  #detail .ps-gal{position:sticky;top:90px}
}
@media(max-width:800px){
  body.ps-pd{padding-bottom:84px}
  body.ps-pd .pm-wrap{padding:0}
  body.ps-pd #detail.pm-card{border:0;border-radius:0;padding:0;background:#fff}
  body.ps-pd #detail .ps-slider{border-radius:0}
  body.ps-pd #detail .detail-info{padding:0 14px}
  body.ps-pd #detail .ps-sec,body.ps-pd #detail .ps-wide{padding-left:14px;padding-right:14px}
  body.ps-pd .pm-mnav,body.ps-pd .pm-foot,body.ps-pd .location-bar{display:none!important}
  body.ps-pd #detail .action-buttons{position:fixed;left:0;right:0;bottom:0;margin:0;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px));background:#fff;border-top:1px solid #e5e5e5;z-index:3000;flex-direction:row}
}
`;
  var s = document.createElement("style");
  s.id = "ps-flipkart-css";
  s.textContent = css;
  document.head.appendChild(s);
})();


/* ---------- discount % helper ---------- */
function psDiscount(p) {
  if (p.old_price && Number(p.old_price) > Number(p.price)) {
    return Math.round(((Number(p.old_price) - Number(p.price)) / Number(p.old_price)) * 100);
  }
  return 0;
}


/* =========================
   PRODUCT CARD  (badge + coupon button hata diye)
========================= */
function card(p) {

  var rating = Number(p.rating || 0);
  var reviews = Number(p.review_count || p.reviews_count || 0);

  var rate = p.rating
    ? '<div class="pc-rate">' + rating.toFixed(1) + ' <i>★</i>' +
      (reviews ? ' <span>(' + reviews.toLocaleString("en-IN") + ')</span>' : '') + '</div>'
    : '';

  var img = p.image_url
    ? '<img src="' + psEsc(p.image_url) + '" alt="' + psEsc(p.name) + '" loading="lazy">'
    : '<div class="pc-emoji">🛍️</div>';

  var old = (p.old_price && Number(p.old_price) > Number(p.price))
    ? '<del>' + money(p.old_price) + '</del>' : '';

  return '<article class="product">' +
    '<button class="pc-heart" onclick="event.preventDefault();event.stopPropagation();toggleWishlist(\'' + p.id + '\', this)" aria-label="Wishlist">♡</button>' +
    '<a class="pc-link" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
      '<div class="pic">' + img + rate + '</div>' +
      '<div class="pc-body">' +
        '<h3>' + psEsc(p.name) + '</h3>' +
        '<div class="pc-price">' + old + '<b>' + money(p.price) + '</b></div>' +
      '</div>' +
    '</a>' +
  '</article>';
}


/* =========================
   SWIPE SLIDER (dots ke saath)
========================= */
function psSliderHtml(p) {

  var imgs = psImages(p);

  var wish = '<button class="ps-heart" onclick="toggleWishlist(\'' + p.id + '\', this)" aria-label="Wishlist">♡</button>';

  if (!imgs.length) {
    return '<div class="ps-gal">' + wish +
      '<div class="ps-slider"><div class="ps-slide"><span style="font-size:120px">🛍️</span></div></div></div>';
  }

  var slides = imgs.map(function (u, i) {
    return '<div class="ps-slide"><img src="' + psEsc(u) + '" alt="Photo ' + (i + 1) + '" draggable="false"></div>';
  }).join("");

  var multi = imgs.length > 1;

  var dots = multi
    ? '<div class="ps-dots">' + imgs.map(function (u, i) {
        return '<span class="' + (i === 0 ? 'on' : '') + '" data-i="' + i + '"></span>';
      }).join("") + '</div>'
    : '';

  var arrows = multi
    ? '<button class="ps-arrow l" data-dir="-1" aria-label="Previous">‹</button><button class="ps-arrow r" data-dir="1" aria-label="Next">›</button>'
    : '';

  var count = multi ? '<div class="ps-count" id="psCount">1/' + imgs.length + '</div>' : '';

  return '<div class="ps-gal">' + wish + arrows +
    '<div class="ps-slider" id="psSlider">' + slides + '</div>' + count + dots + '</div>';
}

function psInitSlider() {

  var sl = document.getElementById("psSlider");
  if (!sl) return;

  var dots = document.querySelectorAll("#detail .ps-dots span");
  var cnt = document.getElementById("psCount");

  function idx() { return Math.round(sl.scrollLeft / sl.clientWidth); }

  function go(i) {
    var n = sl.children.length;
    i = Math.max(0, Math.min(n - 1, i));
    sl.scrollTo({ left: i * sl.clientWidth, behavior: "smooth" });
  }

  sl.addEventListener("scroll", function () {
    var i = idx();
    dots.forEach(function (d, k) { d.classList.toggle("on", k === i); });
    if (cnt) cnt.textContent = (i + 1) + "/" + sl.children.length;
  }, { passive: true });

  dots.forEach(function (d) {
    d.addEventListener("click", function () { go(Number(d.getAttribute("data-i"))); });
  });

  document.querySelectorAll("#detail .ps-arrow").forEach(function (b) {
    b.addEventListener("click", function () { go(idx() + Number(b.getAttribute("data-dir"))); });
  });

  /* mouse se drag karke bhi slide ho (desktop) */
  var down = false, sx = 0, sl0 = 0;
  sl.addEventListener("mousedown", function (e) { down = true; sx = e.pageX; sl0 = sl.scrollLeft; sl.style.scrollSnapType = "none"; });
  window.addEventListener("mouseup", function () {
    if (!down) return; down = false; sl.style.scrollSnapType = "x mandatory"; go(idx());
  });
  window.addEventListener("mousemove", function (e) { if (down) sl.scrollLeft = sl0 - (e.pageX - sx); });
}


/* =========================
   PRODUCT DETAIL  (Flipkart layout)
========================= */
async function detail() {

  var e = document.querySelector("#detail");
  if (!e) return;

  document.body.classList.add("ps-pd");

  var id = new URLSearchParams(location.search).get("id");

  if (!id) {
    e.innerHTML = "<div class='empty'>Product not found.</div>";
    return;
  }

  var res = await supabaseClient
    .from("products").select("*")
    .eq("id", id).eq("status", "approved").maybeSingle();

  var p = res.data;

  if (res.error || !p) {
    console.log("Product detail error:", res.error);
    e.innerHTML = "<div class='empty'>Product not found.</div>";
    return;
  }

  var discount = psDiscount(p);
  var inStock = Number(p.stock || 0) > 0;

  var addr = (typeof getAddress === "function") ? getAddress() : null;
  var addrText = addr
    ? psEsc(addr.type || "HOME").toUpperCase() + " &nbsp;" + psEsc(addr.name + ", " + addr.city + " " + addr.pincode)
    : "Delivery location select karein";

  var cats = { 1: "Mobiles", 2: "Electronics", 3: "Fashion", 4: "Beauty", 5: "Home", 6: "Grocery", 7: "Accessories" };

  var rating = p.rating
    ? '<span class="ps-rate">' + Number(p.rating).toFixed(1) + ' ★</span> ' +
      '<span style="color:#777;font-size:13px">' + Number(p.review_count || 0).toLocaleString("en-IN") + ' Ratings &amp; Reviews</span>'
    : '';

  var stock = inStock
    ? '<span class="green">✓ In Stock</span>' +
      (Number(p.stock) <= 5 ? ' <span style="color:#d28a00">Only ' + Number(p.stock) + ' left</span>' : '')
    : '<span style="color:#d32f2f">✕ Out of Stock</span>';

  var dis = inStock ? '' : ' disabled';

  var highlights = psHighlightsHtml(p)
    .replace('class="info-section"', 'class="ps-sec ps-wide"')
    .replace(/<h2>Key Features<\/h2>/, '<h2>Product highlights</h2>');

  e.innerHTML =

    '<div class="detail-top">' +

      '<div>' + psSliderHtml(p) + '</div>' +

      '<div class="detail-info">' +

        '<div class="ps-title">' + psEsc(p.name) + '</div>' +
        '<div>' + rating + '</div>' +

        '<div class="ps-priceline">' +
          (discount > 0 ? '<span class="ps-off">↓' + discount + '%</span>' : '') +
          (p.old_price ? '<span class="ps-old">' + money(p.old_price) + '</span>' : '') +
          '<span class="ps-now">' + money(p.price) + '</span>' +
        '</div>' +
        '<p class="ps-tax">Inclusive of all taxes</p>' +

        '<div class="ps-offers">' +
          '<h3>Available offers</h3>' +
          '<div class="offer">🏷️ Special price available on PS Mart</div>' +
          '<div class="offer">💳 Secure payment on all orders</div>' +
          '<div class="offer">🚚 Free delivery available</div>' +
          '<div class="offer">🔄 Easy return available</div>' +
        '</div>' +

        '<h2 style="font:700 20px Inter,Arial,sans-serif;margin:18px 0 8px">Delivery details</h2>' +
        '<div class="ps-row addr" onclick="openLocation()"><span>🏠 ' + addrText + '</span><a href="#" onclick="return false">›</a></div>' +
        '<div class="ps-row"><span>🚚 Free delivery available</span></div>' +
        '<div class="ps-row"><span>🏪 Seller: PS Mart Seller</span></div>' +

        '<div class="ps-stock">' + stock + '</div>' +

        '<div class="action-buttons">' +
          '<button class="cart-btn" onclick="add(\'' + p.id + '\')"' + dis + '>🛒 Add to Cart</button>' +
          '<button class="ps-buy" onclick="buyNow(\'' + p.id + '\')"' + dis + '>Buy now at ' + money(p.price) + '</button>' +
        '</div>' +

      '</div>' +
    '</div>' +

    highlights +

    '<div class="ps-sec ps-wide"><h2>All details</h2>' +
      '<p style="font-size:14px;line-height:1.7;color:#333;margin:0">' +
      psEsc(p.description || "Premium quality product available on PS Mart.") + '</p></div>' +

    '<div class="ps-sec ps-wide"><h2>Specifications</h2>' +
      '<table class="spec-table">' +
        '<tr><td>Product Name</td><td>' + psEsc(p.name) + '</td></tr>' +
        '<tr><td>Category</td><td>' + (cats[Number(p.category_id)] || "General") + '</td></tr>' +
        '<tr><td>Availability</td><td>' + (inStock ? "In Stock" : "Out of Stock") + '</td></tr>' +
        '<tr><td>Seller</td><td>PS Mart Seller</td></tr>' +
        psExtraSpecRows(p) +
      '</table></div>' +

    '<div class="ps-sec ps-wide"><h2>Ratings &amp; Reviews</h2>' +
      '<div class="review-box"><b>No reviews yet</b><p>Be the first customer to review this product.</p></div></div>' +

    '<div class="ps-sec ps-wide"><h2>Questions &amp; Answers</h2>' +
      '<p style="color:#777;margin:0 0 10px">Have a question about this product?</p>' +
      '<a href="questions.html?id=' + encodeURIComponent(p.id) + '&name=' + encodeURIComponent(p.name) + '" ' +
      'style="display:inline-block;background:#9b681b;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">❓ Ask a Question</a></div>';

  psInitSlider();

  /* wishlist heart ki sahi state */
  if (typeof syncWishlistHearts === "function") {
    var w = (typeof getWishlist === "function") ? getWishlist() : [];
    var h = e.querySelector(".ps-heart");
    if (h && w.indexOf(String(p.id)) > -1) h.textContent = "♥";
  }

  /* address badalne par "HOME ..." line update */
  document.addEventListener("psmart:address", function () { detail(); }, { once: true });
}
