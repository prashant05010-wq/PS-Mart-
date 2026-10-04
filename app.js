/* =========================
   PS MART + SUPABASE CONFIG
========================= */
const SUPABASE_URL = "https://nctscffhnztscczjxhat.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdHNjZmZobnp0c2Njemp4aGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDM0MjUsImV4cCI6MjEwNjAxOTQyNX0.1bR1XER2te7enAtKXaRdTqPnsigh3VJyCLXVbPjKKWw";

const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

/* =========================
   MONEY FORMATTER
========================= */
const money = n => "₹" + Number(n || 0).toLocaleString("en-IN");

/* =========================
   LOAD & RENDER HOME PRODUCTS (Clickable Card)
========================= */
async function renderHome() {
  const flashContainer = document.querySelector("#flashDeals");
  const trendingContainer = document.querySelector("#trendingProducts");
  const newContainer = document.querySelector("#newArrivals");
  const singleContainer = document.querySelector("#homeProducts") || document.querySelector("#products");

  if(!supabaseClient) return;

  const { data: products, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Home products fetch error:", error);
    return;
  }

  if (!products || products.length === 0) {
    if (flashContainer) flashContainer.innerHTML = `<p style="padding:15px; color:#666;">No products available.</p>`;
    return;
  }

  // Card without Add to Cart button (entire card opens details page)
  const createProductHTML = p => `
    <div class="home-product-card" onclick="openProductDetail('${p.id}')" style="cursor: pointer;">
      <div class="home-product-image">
        ${
          p.image_url 
            ? `<img src="${p.image_url}" alt="${p.name}">`
            : `<span style="font-size: 50px;">🛍️</span>`
        }
      </div>
      <div class="home-product-info">
        <div class="home-product-name">${p.name}</div>
        <div class="home-price">
          ${money(p.price)}
          ${p.old_price ? `<span class="home-old-price">${money(p.old_price)}</span>` : ''}
        </div>
      </div>
    </div>
  `;

  const allHTML = products.map(createProductHTML).join("");

  if (flashContainer) flashContainer.innerHTML = allHTML;
  if (trendingContainer) trendingContainer.innerHTML = allHTML;
  if (newContainer) newContainer.innerHTML = allHTML;
  if (singleContainer) singleContainer.innerHTML = allHTML;
}

/* =========================
   OPEN PRODUCT DETAIL
========================= */
function openProductDetail(productId) {
  if (productId) {
    window.location.href = `product.html?id=${productId}`;
  }
}

/* =========================
   RENDER PRODUCT DETAIL PAGE
========================= */
async function renderProductDetail(id) {
  const container = document.getElementById("detail");
  if (!container || !supabaseClient) return;

  const { data: p, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !p) {
    container.innerHTML = "<p style='padding:20px; text-align:center;'>Product ki details nahi mil sakin.</p>";
    return;
  }

  container.innerHTML = `
    <div class="detail-top">
      <div class="detail-image-box">
        ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}">` : `<span style="font-size:80px;">🛍️</span>`}
      </div>
      <div class="detail-info">
        <h1>${p.name}</h1>
        <div class="detail-rating">★ 4.5 Rating</div>
        <div class="detail-price">
          ${money(p.price)}
          ${p.old_price ? `<del>${money(p.old_price)}</del>` : ''}
          <span class="discount">Special Price</span>
        </div>
        
        <div class="offer-box">
          <h3>Available Offers</h3>
          <div class="offer">🏷️ Get Flat ₹100 Off on First Order</div>
          <div class="offer">🚚 Free Delivery across India</div>
        </div>

        <div class="action-buttons">
          <button class="cart-btn" onclick="add('${p.id}')">Add to Cart 🛒</button>
          <button class="buy-btn" onclick="add('${p.id}'); window.location.href='cart.html';">Buy Now ⚡</button>
        </div>

        <div class="info-section">
          <h2>Product Description</h2>
          <p>${p.description || "No additional description available."}</p>
        </div>
      </div>
    </div>
  `;
}

/* =========================
   COUPON 1-TIME CHECK LOGIC
========================= */
async function validateAndApplyCoupon(couponCode, userPhone) {
  if (!userPhone) {
    alert("Kripya pehle apna Mobile Number dalein!");
    return false;
  }

  const { data: existingUsage, error } = await supabaseClient
    .from("used_coupons")
    .select("*")
    .eq("user_phone", userPhone)
    .eq("coupon_code", couponCode);

  if (error) {
    console.error("Coupon check error:", error);
    return false;
  }

  if (existingUsage && existingUsage.length > 0) {
    alert("❌ Aap yeh Gift Card / Coupon pehle hi ek baar use kar chuke hain!");
    return false;
  }

  alert("🎉 Coupon successfully apply ho gaya hai!");
  return true;
}

async function markCouponAsUsed(couponCode, userPhone) {
  if (!couponCode || !userPhone || !supabaseClient) return;
  await supabaseClient.from("used_coupons").insert([{ user_phone: userPhone, coupon_code: couponCode }]);
}

/* =========================
   AUTO LOAD HOME ON DOM READY
========================= */
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector("#flashDeals") || document.querySelector("#trendingProducts") || document.querySelector("#homeProducts") || document.querySelector("#products")) {
    renderHome();
  }
});
