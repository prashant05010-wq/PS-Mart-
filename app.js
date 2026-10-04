/* =========================
   PS MART + SUPABASE CONFIG
========================= */

const SUPABASE_URL = "https://nctscffhnztscczjxhat.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdHNjZmZobnp0c2Njemp4aGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDM0MjUsImV4cCI6MjEwNjAxOTQyNX0.1bR1XER2te7enAtKXaRdTqPnsigh3VJyCLXVbPjKKWw";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

/* =========================
   MONEY FORMATTER
========================= */
const money = n => "₹" + Number(n || 0).toLocaleString("en-IN");

/* =========================
   LOCAL CART MANAGEMENT
========================= */
function cart() {
  return JSON.parse(localStorage.getItem("psmart-cart") || "[]");
}

function saveCart(c) {
  localStorage.setItem("psmart-cart", JSON.stringify(c));
  updateCount();
}

function updateCount() {
  const n = cart().reduce((sum, item) => sum + Number(item.qty || 0), 0);
  document.querySelectorAll("#count").forEach(e => {
    e.textContent = n;
  });
}

/* =========================
   ADD TO CART
========================= */
async function add(id) {
  let c = cart();
  let item = c.find(x => String(x.id) === String(id));

  if (item) {
    item.qty = Number(item.qty || 0) + 1;
  } else {
    c.push({ id: id, qty: 1 });
  }

  saveCart(c);
  alert("Product added to Cart ✓");
  if (document.querySelector("#cart")) {
    renderCart();
  }
}

/* =========================
   REMOVE FROM CART
========================= */
async function remove(id) {
  let c = cart();
  c = c.filter(item => String(item.id) !== String(id));
  saveCart(c);
  await renderCart();
}

/* =========================
   INCREASE / DECREASE QTY
========================= */
async function increaseQty(id) {
  let c = cart();
  const item = c.find(x => String(x.id) === String(id));
  if (item) {
    item.qty = Number(item.qty || 0) + 1;
  }
  saveCart(c);
  await renderCart();
}

async function decreaseQty(id) {
  let c = cart();
  const item = c.find(x => String(x.id) === String(id));
  if (!item) return;

  item.qty = Number(item.qty || 1) - 1;
  if (item.qty <= 0) {
    c = c.filter(x => String(x.id) !== String(id));
  }
  saveCart(c);
  await renderCart();
}

/* =========================
   LOAD & RENDER HOME PRODUCTS
========================= */
async function renderHome() {
  // Check index.html containers
  const flashContainer = document.querySelector("#flashDeals");
  const trendingContainer = document.querySelector("#trendingProducts");
  const newContainer = document.querySelector("#newArrivals");
  const singleContainer = document.querySelector("#homeProducts") || document.querySelector("#products");

  // Fetch all products from Supabase
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

  // HTML generator for product card matching your CSS
  const createProductHTML = p => `
    <div class="home-product-card">
      <div class="home-product-image">
        ${
          p.image_url 
            ? `<img src="${p.image_url}" alt="${p.name}">`
            : `<span style="font-size: 50px;">🛍️️</span>`
        }
      </div>
      <div class="home-product-info">
        <div class="home-product-name">${p.name}</div>
        <div class="home-price">
          ${money(p.price)}
          ${p.old_price ? `<span class="home-old-price">${money(p.old_price)}</span>` : ''}
        </div>
        <button onclick="add('${p.id}')" class="home-view" style="border:none; width:100%; cursor:pointer;">
          Add to Cart 🛒
        </button>
      </div>
    </div>
  `;

  const allHTML = products.map(createProductHTML).join("");

  // Populate containers based on what exists on the page
  if (flashContainer) flashContainer.innerHTML = allHTML;
  if (trendingContainer) trendingContainer.innerHTML = allHTML;
  if (newContainer) newContainer.innerHTML = allHTML;
  if (singleContainer) singleContainer.innerHTML = allHTML;
}
/* =========================
   PREMIUM CART RENDER
========================= */
async function renderCart() {
  const e = document.querySelector("#cart");
  if (!e) return;

  const c = cart();

  if (!c.length) {
    e.innerHTML = `
      <div style="
        max-width: 500px;
        margin: 40px auto;
        padding: 40px 20px;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        text-align: center;
        border: 1px solid #f0e6d2;
      ">
        <div style="font-size: 70px; margin-bottom: 15px;">🛒</div>
        <h2 style="color: #2c2c2c; font-size: 24px; margin-bottom: 8px;">Your Cart is Empty</h2>
        <p style="color: #777; font-size: 14px; margin-bottom: 25px;">
          Looks like you haven't added anything to your cart yet.
        </p>
        <a href="index.html" style="
          display: inline-block;
          background: linear-gradient(135deg, #d8a83e, #9b681b);
          color: white;
          padding: 14px 28px;
          border-radius: 30px;
          text-decoration: none;
          font-weight: bold;
          font-size: 15px;
          box-shadow: 0 4px 15px rgba(155, 104, 27, 0.3);
        ">
          🛍️ Start Shopping Now
        </a>
      </div>
    `;
    return;
  }

  const ids = c.map(item => item.id);

  const { data: products, error } = await supabaseClient
    .from("products")
    .select("*")
    .in("id", ids);

  if (error || !products || !products.length) {
    e.innerHTML = `<div style="text-align:center; padding:40px; color:#d32f2f;"><h3>Unable to load cart products.</h3></div>`;
    return;
  }

  let subtotal = 0;

  const rows = c.map(item => {
    const p = products.find(product => String(product.id) === String(item.id));
    if (!p) return "";

    const qty = Number(item.qty || 1);
    const amount = Number(p.price || 0) * qty;
    subtotal += amount;

    return `
      <div style="
        display: flex;
        gap: 15px;
        background: #fff;
        border-radius: 12px;
        padding: 15px;
        margin-bottom: 15px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        border: 1px solid #eee;
        align-items: center;
      ">
        <div style="width: 80px; height: 80px; flex-shrink: 0; background: #fafafa; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
          ${
            p.image_url
              ? `<img src="${p.image_url}" alt="${p.name}" style="width:100%; height:100%; object-fit:contain;">`
              : `<span style="font-size:30px;">🛍️</span>`
          }
        </div>

        <div style="flex: 1;">
          <h4 style="margin: 0 0 5px 0; color: #333; font-size: 16px;">${p.name}</h4>
          <div style="font-size: 14px; color: #666;">Price: <b>${money(p.price)}</b></div>
          <div style="font-size: 14px; color: #188038; font-weight: bold; margin-top: 2px;">Subtotal: ${money(amount)}</div>

          <div style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
            <button onclick="decreaseQty('${p.id}')" style="width:28px; height:28px; border-radius:6px; border:1px solid #ccc; background:#f9f9f9; cursor:pointer; font-weight:bold;">−</button>
            <span style="font-weight:bold; font-size:14px; min-width:20px; text-align:center;">${qty}</span>
            <button onclick="increaseQty('${p.id}')" style="width:28px; height:28px; border-radius:6px; border:1px solid #ccc; background:#f9f9f9; cursor:pointer; font-weight:bold;">+</button>
          </div>
        </div>

        <button onclick="remove('${p.id}')" style="background:none; border:none; color:#d32f2f; font-size:18px; cursor:pointer; padding:5px;">
          🗑️
        </button>
      </div>
    `;
  }).join("");

  let couponDiscount = 0;
  const savedCoupon = JSON.parse(localStorage.getItem("psmart-applied-coupon") || "null");

  if (savedCoupon) {
    if (savedCoupon.minimum_order && subtotal < savedCoupon.minimum_order) {
      localStorage.removeItem("psmart-applied-coupon");
    } else {
      couponDiscount = Number(savedCoupon.discount || 0);
    }
  }

  const grandTotal = Math.max(0, subtotal - couponDiscount);

  e.innerHTML = `
    <div style="max-width: 1000px; margin: 20px auto; padding: 0 15px; display: grid; grid-template-columns: 1fr; gap: 20px;">
      <div>
        <h2 style="font-size: 20px; color: #333; margin-bottom: 15px;">Shopping Cart Items</h2>
        ${rows}
      </div>

      <div style="
        background: #ffffff;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.06);
        border: 1px solid #e0b45a;
      ">
        <h3 style="margin-top:0; color:#333; border-bottom:1px solid #eee; padding-bottom:10px;">Order Summary</h3>
        
        <div style="display:flex; justify-content:space-between; margin:10px 0; color:#555;">
          <span>Items Total</span>
          <b>${money(subtotal)}</b>
        </div>

        ${
          couponDiscount > 0
            ? `<div style="display:flex; justify-content:space-between; margin:10px 0; color:#188038;">
                <span>Coupon Discount</span>
                <b>− ${money(couponDiscount)}</b>
               </div>`
            : ""
        }

        <div style="display:flex; justify-content:space-between; margin:10px 0; color:#188038;">
          <span>Delivery Charge</span>
          <b>FREE</b>
        </div>

        <hr style="border:0; border-top:1px dashed #ccc; margin:15px 0;">

        <div style="display:flex; justify-content:space-between; font-size:18px; color:#222; margin-bottom:20px;">
          <b>Total Payable</b>
          <b style="color:#9b681b;">${money(grandTotal)}</b>
        </div>

        <div style="margin-bottom:20px; background:#fff8e7; padding:12px; border-radius:8px; border:1px dashed #d6a63c;">
          <div style="font-size:13px; font-weight:bold; color:#79520f; margin-bottom:8px;">🎟️ Apply Coupon Code</div>
          ${
            savedCoupon && couponDiscount > 0
              ? `<div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="color:#188038; font-weight:bold;">${savedCoupon.code} Applied!</span>
                  <button onclick="removeCoupon()" style="border:0; background:#f3eeee; color:#b3261e; padding:5px 10px; border-radius:5px; cursor:pointer;">Remove</button>
                </div>`
              : `<div style="display:flex; gap:8px;">
                  <input id="couponInput" type="text" placeholder="e.g. WELCOME50" style="flex:1; padding:8px; border:1px solid #ccc; border-radius:6px; text-transform:uppercase;">
                  <button onclick="applyCoupon()" style="padding:8px 14px; background:#9b681b; color:#fff; border:0; border-radius:6px; cursor:pointer; font-weight:bold;">Apply</button>
                 </div>`
          }
        </div>

        <a href="checkout.html" style="
          display: block;
          text-align: center;
          background: linear-gradient(135deg, #d8a83e, #9b681b);
          color: white;
          padding: 14px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          font-size: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        ">
          Proceed to Checkout →
        </a>
      </div>

    </div>
  `;
}

/* =========================
   APPLY / REMOVE COUPON
========================= */
async function applyCoupon() {
  const input = document.getElementById("couponInput");
  if (!input) return;
  const code = input.value.trim().toUpperCase();
  if (!code) return alert("Please enter coupon code.");

  const { data: coupon, error } = await supabaseClient
    .from("coupons")
    .select("*")
    .eq("code", code)
    .eq("active", true)
    .maybeSingle();

  if (error || !coupon) return alert("❌ Invalid Coupon Code");

  localStorage.setItem("psmart-applied-coupon", JSON.stringify({
    code: coupon.code,
    discount: coupon.discount_value || 0,
    minimum_order: coupon.minimum_order || 0
  }));

  alert("🎉 Coupon Applied!");
  renderCart();
}

function removeCoupon() {
  localStorage.removeItem("psmart-applied-coupon");
  renderCart();
}

/* =========================
   INITIAL AUTO RUN ON LOAD
========================= */
document.addEventListener("DOMContentLoaded", () => {
  updateCount();
  renderHome();
  if (document.querySelector("#cart")) renderCart();
});
