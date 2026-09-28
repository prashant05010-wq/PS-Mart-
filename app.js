/* =========================
   PS MART + SUPABASE
========================= */

const SUPABASE_URL = "https://nctscffhnztscczjxhat.supabase.co";

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdHNjZmZobnp0c2Njemp4aGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDM0MjUsImV4cCI6MjEwNjAxOTQyNX0.1bR1XER2te7enAtKXaRdTqPnsigh3VJyCLXVbPjKKWw";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* =========================
   MONEY
========================= */

const money = n =>
  "₹" + Number(n || 0).toLocaleString("en-IN");


/* =========================
   LOCAL CART
========================= */

function cart() {
  return JSON.parse(
    localStorage.getItem("psmart-cart") || "[]"
  );
}


function saveCart(c) {
  localStorage.setItem(
    "psmart-cart",
    JSON.stringify(c)
  );

  updateCount();
}


function updateCount() {

  const n = cart().reduce(
    (sum, item) =>
      sum + Number(item.qty || 0),
    0
  );

  document
    .querySelectorAll("#count")
    .forEach(e => {
      e.textContent = n;
    });
}


/* =========================
   ADD TO CART
========================= */

async function add(id) {

  let c = cart();

  let item = c.find(
    x => String(x.id) === String(id)
  );

  if (item) {

    item.qty =
      Number(item.qty || 0) + 1;

  } else {

    c.push({
      id: id,
      qty: 1
    });

  }

  saveCart(c);

  alert("Added to cart ✓");
}


/* =========================
   REMOVE FROM CART
========================= */

async function remove(id) {

  let c = cart();

  c = c.filter(
    item =>
      String(item.id) !== String(id)
  );

  saveCart(c);

  await renderCart();

}


/* =========================
   SEARCH
========================= */

function search() {

  const input =
    document.querySelector("#search");

  if (!input) return;

  const q =
    input.value.trim();

  if (q) {

    location.href =
      "products.html?q=" +
      encodeURIComponent(q);

  }
}


/* =========================
   PRODUCT CARD
========================= */

/* =========================
   PRODUCT CARD
========================= */

function card(p) {

  return `
    <article class="product">

      <div style="position:relative;">

        <a href="product.html?id=${p.id}">

          <div class="pic">

            ${
              p.image_url
                ? `
                  <img
                    src="${p.image_url}"
                    alt="${p.name}"
                    style="
                      width:100%;
                      height:100%;
                      object-fit:contain;
                    "
                  >
                `
                : "🛍️"
            }

          </div>

        </a>

        <button
          onclick="event.preventDefault(); event.stopPropagation(); toggleWishlist('${p.id}', this)"
          style="
            position:absolute;
            top:8px;
            right:8px;
            width:38px;
            height:38px;
            border-radius:50%;
            border:none;
            background:white;
            color:#b8860b;
            font-size:24px;
            cursor:pointer;
            box-shadow:0 2px 8px rgba(0,0,0,.15);
          ">
          ♡
        </button>

      </div>

      <small>
        PS Mart Seller
      </small>

      <h3>
        ${p.name}
      </h3>

      <div class="rating">
        ★ 4.0
      </div>

      <b>
        ${money(p.price)}
      </b>

      ${
        p.old_price
          ? `
            <del>
              ${money(p.old_price)}
            </del>
          `
          : ""
      }

      <a
        href="product.html?id=${p.id}"
        class="goldbtn block"
        style="margin-top:12px;">
        View Product →
      </a>

    </article>
  `;
}
/* =========================
   LOAD APPROVED PRODUCTS
========================= */

async function loadProductsFromSupabase() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("products")
      .select("*")
      .eq("status", "approved");

  if (error) {

    console.log(
      "Supabase products error:",
      error.message
    );

    return [];

  }

  return data || [];
}


/* =========================
   PRODUCTS PAGE
========================= */

async function renderProducts() {

  const el =
    document.querySelector("#products");

  if (!el) return;

  const params =
    new URLSearchParams(
      location.search
    );

  const cat =
    params.get("cat");

  const q =
    (params.get("q") || "")
      .toLowerCase()
      .trim();

  let products =
    await loadProductsFromSupabase();


  /* =========================
     SEARCH / CATEGORY FILTER
  ========================= */

  let filtered =
    products.filter(p => {

      const name =
        String(p.name || "")
          .toLowerCase();

      const description =
        String(p.description || "")
          .toLowerCase();

      return (
        !q ||
        name.includes(q) ||
        description.includes(q)
      );

    });


  /* =========================
     SORT
  ========================= */

  const sort =
    document.querySelector("#sort")
      ?.value;


  if (sort === "low") {

    filtered.sort(
      (a, b) =>
        Number(a.price) -
        Number(b.price)
    );

  }


  if (sort === "high") {

    filtered.sort(
      (a, b) =>
        Number(b.price) -
        Number(a.price)
    );

  }


  /* =========================
     TITLE
  ========================= */

  const title =
    document.querySelector("#title");

  if (title) {

    if (q) {

      title.textContent =
        `Search: ${q}`;

    } else if (cat) {

      title.textContent =
        `${cat} Products`;

    } else {

      title.textContent =
        "All Products";

    }

  }


  /* =========================
     SHOW PRODUCTS
  ========================= */

  el.innerHTML =
    filtered.length
      ? filtered
          .map(card)
          .join("")
      : `
        <div class="empty">
          No products found.
        </div>
      `;
}


/* =========================
   HOME PRODUCTS
========================= */

async function renderHome() {

  const e =
    document.querySelector(
      "#homeProducts"
    );

  if (!e) return;

  const products =
    await loadProductsFromSupabase();

  e.innerHTML =
    products
      .slice(0, 5)
      .map(card)
      .join("");


  if (!products.length) {

    e.innerHTML = `
      <div class="empty">
        No products available yet.
      </div>
    `;

  }
}


/* =========================
   PRODUCT DETAIL
========================= */

async function detail() {

  const e = document.querySelector("#detail");

  if (!e) return;

  const id =
    new URLSearchParams(location.search).get("id");

  if (!id) {

    e.innerHTML =
      "<div class='empty'>Product not found.</div>";

    return;
  }


  /* =========================
     GET PRODUCT
  ========================= */

  const {
    data: p,
    error
  } = await supabaseClient
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();


  if (error || !p) {

    console.log(
      "Product detail error:",
      error
    );

    e.innerHTML =
      "<div class='empty'>Product not found.</div>";

    return;
  }


  /* =========================
     DISCOUNT
  ========================= */

  let discount = 0;

  if (
    p.old_price &&
    Number(p.old_price) > Number(p.price)
  ) {

    discount = Math.round(
      (
        (Number(p.old_price) - Number(p.price)) /
        Number(p.old_price)
      ) * 100
    );

  }


  /* =========================
     PRODUCT DETAIL UI
  ========================= */

  e.innerHTML = `

    <div class="detail-top">


      <!-- PRODUCT IMAGE -->

      <div>

        <div class="detail-image-box">

          ${
            p.image_url
              ? `
                <img
                  src="${p.image_url}"
                  alt="${p.name}"
                >
              `
              : `
                <div style="
                  font-size:120px;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  width:100%;
                  height:100%;
                ">
                  🛍️
                </div>
              `
          }

        </div>

      </div>


      <!-- PRODUCT INFORMATION -->

      <div class="detail-info">

        <small>
          PS Mart Seller
        </small>


        <h1>
          ${p.name}
        </h1>


        <div class="detail-rating">
          ★ 4.0
        </div>

        <span style="color:#777;font-size:13px;">
          100+ Ratings & Reviews
        </span>


        <!-- PRICE -->

        <div class="detail-price">

          ${money(p.price)}

          ${
            p.old_price
              ? `
                <del>
                  ${money(p.old_price)}
                </del>
              `
              : ""
          }

          ${
            discount > 0
              ? `
                <span class="discount">
                  ${discount}% off
                </span>
              `
              : ""
          }

        </div>


        <p style="color:#777;">
          Inclusive of all taxes
        </p>


        <!-- OFFERS -->

        <div class="offer-box">

          <h3>
            🎁 Available Offers
          </h3>

          <div class="offer">
            🏷️ Special price available on PS Mart
          </div>

          <div class="offer">
            💳 Secure payment on all orders
          </div>

          <div class="offer">
            🚚 Free delivery available
          </div>

          <div class="offer">
            🔄 Easy return available
          </div>

        </div>


        <!-- DELIVERY -->

        <div class="delivery-box">

          <h3>
            🚚 Delivery
          </h3>

          <p>
            Enter your location to check delivery availability.
          </p>

          <a
            href="profile.html"
            style="
              color:#9b681b;
              font-weight:bold;
              text-decoration:none;
            "
          >
            Select Delivery Location →
          </a>

        </div>


        <!-- STOCK -->

        <p>

          ${
            Number(p.stock || 0) > 0
              ? `
                <span class="green">
                  ✓ In Stock
                </span>

                ${
                  Number(p.stock) <= 5
                    ? `
                      <span style="color:#d28a00;">
                        Only ${p.stock} left
                      </span>
                    `
                    : ""
                }
              `
              : `
                <span style="color:#d32f2f;">
                  ✕ Out of Stock
                </span>
              `
          }

        </p>


        <!-- DESCRIPTION -->

        <p>

          ${
            p.description ||
            "Premium quality product available on PS Mart."
          }

        </p>


        <!-- BUTTONS -->

        <div class="action-buttons">

          <button
            class="cart-btn"
            onclick="add('${p.id}')"
            ${
              Number(p.stock || 0) <= 0
                ? "disabled"
                : ""
            }
          >
            🛒 Add to Cart
          </button>


          <button
            class="buy-btn"
            onclick="buyNow('${p.id}')"
            ${
              Number(p.stock || 0) <= 0
                ? "disabled"
                : ""
            }
          >
            ⚡ Buy Now
          </button>

        </div>


        <!-- PRODUCT DESCRIPTION -->

        <div class="info-section">

          <h2>
            Product Description
          </h2>

          <p>
            ${
              p.description ||
              "Product details will appear here."
            }
          </p>

        </div>

      </div>

    </div>


    <!-- =========================
         SPECIFICATIONS
    ========================= -->

    <div class="info-section">

      <h2>
        Specifications
      </h2>

      <table class="spec-table">

        <tr>
          <td>Product Name</td>
          <td>${p.name}</td>
        </tr>

        <tr>
          <td>Category</td>
          <td>${p.category_id || "General"}</td>
        </tr>

        <tr>
          <td>Availability</td>
          <td>
            ${
              Number(p.stock || 0) > 0
                ? "In Stock"
                : "Out of Stock"
            }
          </td>
        </tr>

        <tr>
          <td>Seller</td>
          <td>PS Mart Seller</td>
        </tr>

      </table>

    </div>


    <!-- =========================
         SELLER
    ========================= -->

    <div class="info-section">

      <h2>
        Seller Information
      </h2>

      <div class="seller-box">

        <h3>
          🏪 PS Mart Seller
        </h3>

        <p>
          ✓ Verified product seller
        </p>

        <p>
          ✓ Secure packaging
        </p>

        <p>
          ✓ Reliable delivery
        </p>

      </div>

    </div>


    <!-- =========================
         REVIEWS
    ========================= -->

    <div class="info-section">

      <h2>
        Ratings & Reviews
      </h2>

      <div class="review-box">

        <b>
          ★ 4.0 / 5
        </b>

        <p>
          Customer reviews will appear here.
        </p>

      </div>

      <div class="review-box">

        <b>
          No reviews yet
        </b>

        <p>
          Be the first customer to review this product.
        </p>

      </div>

    </div>

  `;

}


/* =========================
   BUY NOW
========================= */

function buyNow(id) {

  let c = cart();

  const existing =
    c.find(
      item =>
        String(item.id) === String(id)
    );


  if (existing) {

    existing.qty =
      Number(existing.qty || 0) + 1;

  } else {

    c.push({
      id: id,
      qty: 1
    });

  }


  saveCart(c);

  window.location.href =
    "checkout.html";
}
/* =========================
   CART PAGE
========================= */

async function renderCart() {

  const e =
    document.querySelector("#cart");

  if (!e) return;


  const c = cart();


  /* EMPTY CART */

  if (!c.length) {

    e.innerHTML = `

      <div class="empty">

        Your cart is empty 🛒

        <br><br>

        <a href="products.html">
          Continue Shopping
        </a>

      </div>

    `;

    return;

  }


  /* PRODUCT IDS */

  const ids =
    c.map(
      item => item.id
    );


  /* FETCH PRODUCTS */

  const {
    data: products,
    error
  } =
    await supabaseClient
      .from("products")
      .select("*")
      .in("id", ids)
      .eq("status", "approved");


  if (error) {

    console.log(
      "Cart products error:",
      error
    );

    e.innerHTML = `
      <div class="empty">
        Unable to load cart.
      </div>
    `;

    return;

  }


  let total = 0;


  const rows =
    c.map(item => {

      const p =
        products.find(
          product =>
            String(product.id) ===
            String(item.id)
        );


      if (!p) return "";


      const qty =
        Number(item.qty || 1);


      const amount =
        Number(p.price) * qty;


      total += amount;


      return `

        <div class="cartrow">

          <div class="pic mini">

            ${
              p.image_url
                ? `
                  <img
                    src="${p.image_url}"
                    alt="${p.name}"
                    style="
                      width:100%;
                      height:100%;
                      object-fit:contain;
                    "
                  >
                `
                : "🛍️"
            }

          </div>


          <div>

            <b>
              ${p.name}
            </b>

            <p>
              ${money(p.price)} × ${qty}
            </p>

            <p>
              Subtotal:
              <b>
                ${money(amount)}
              </b>
            </p>

            <div>

              <button
                onclick="decreaseQty('${p.id}')">
                −
              </button>

              <b style="margin:0 10px;">
                ${qty}
              </b>

              <button
                onclick="increaseQty('${p.id}')">
                +
              </button>

            </div>

          </div>


          <button
            onclick="remove('${p.id}')">
            ❌ Remove
          </button>

        </div>

      `;

    })
    .join("");


  /* CART HTML */

  e.innerHTML = `

    <div>

      ${rows}

    </div>


    <div class="summary">

      <h2>
        Price Details
      </h2>

      <p>
        Total
        <b>
          ${money(total)}
        </b>
      </p>

      <p>
        Delivery
        <b class="green">
          FREE
        </b>
      </p>

      <hr>

      <h2>
        ${money(total)}
      </h2>

      <a
        class="goldbtn block"
        href="checkout.html">
        Proceed to Checkout →
      </a>

    </div>

  `;
}


/* =========================
   INCREASE QUANTITY
========================= */

async function increaseQty(id) {

  let c = cart();

  const item =
    c.find(
      x =>
        String(x.id) ===
        String(id)
    );

  if (item) {

    item.qty =
      Number(item.qty || 0) + 1;

  }

  saveCart(c);

  await renderCart();

}


/* =========================
   DECREASE QUANTITY
========================= */

async function decreaseQty(id) {

  let c = cart();

  const item =
    c.find(
      x =>
        String(x.id) ===
        String(id)
    );

  if (!item) return;


  item.qty =
    Number(item.qty || 1) - 1;


  if (item.qty <= 0) {

    c =
      c.filter(
        x =>
          String(x.id) !==
          String(id)
      );

  }


  saveCart(c);

  await renderCart();

}


/* =========================
   CHECKOUT SUMMARY
========================= */

async function summary() {

  const e =
    document.querySelector("#summary");

  if (!e) return;


  const c = cart();


  if (!c.length) {

    e.innerHTML = `

      <h2>
        Order Summary
      </h2>

      <p>
        Your cart is empty.
      </p>

      <a
        class="goldbtn block"
        href="products.html">
        Continue Shopping
      </a>

    `;

    return;

  }


  const ids =
    c.map(
      item => item.id
    );


  const {
    data: products,
    error
  } =
    await supabaseClient
      .from("products")
      .select("*")
      .in("id", ids)
      .eq("status", "approved");


  if (error) {

    console.log(
      "Checkout summary error:",
      error
    );

    e.innerHTML =
      "<p>Unable to load order summary.</p>";

    return;

  }


  let total = 0;


  c.forEach(item => {

    const p =
      products.find(
        product =>
          String(product.id) ===
          String(item.id)
      );


    if (p) {

      total +=
        Number(p.price) *
        Number(item.qty || 1);

    }

  });


  const items =
    c.reduce(
      (sum, item) =>
        sum +
        Number(item.qty || 0),
      0
    );


  e.innerHTML = `

    <h2>
      Order Summary
    </h2>

    <p>
      Items:
      <b>
        ${items}
      </b>
    </p>

    <p>
      Delivery:
      <b class="green">
        FREE
      </b>
    </p>

    <hr>

    <h2>
      Total:
      ${money(total)}
    </h2>

  `;
}


/* =========================
   SIGN UP
========================= */

async function signUpUser(
  email,
  password,
  fullName
) {

  const {
    data,
    error
  } =
    await supabaseClient.auth.signUp({

      email,
      password,

      options: {
        data: {
          full_name:
            fullName
        }
      }

    });


  if (error) {

    alert(error.message);

    return null;

  }


  return data;

}


/* =========================
   PASSWORD LOGIN
========================= */

async function loginUser(
  email,
  password
) {

  const {
    data,
    error
  } =
    await supabaseClient
      .auth
      .signInWithPassword({
        email,
        password
      });


  if (error) {

    alert(error.message);

    return null;

  }


  alert(
    "Login successful ✓"
  );


  return data;

}


/* =========================
   LOGOUT
========================= */

async function logoutUser() {

  const {
    error
  } =
    await supabaseClient
      .auth
      .signOut();


  if (error) {

    alert(error.message);

    return;

  }


  location.href =
    "index.html";
}


/* =========================
   CURRENT USER
========================= */

async function getCurrentUser() {

  const {
    data: {
      user
    }
  } =
    await supabaseClient
      .auth
      .getUser();


  return user;

}


/* =========================
   LOGIN / PROFILE STATE
========================= */

async function updateLoginState() {

  const {
    data: {
      user
    }
  } =
    await supabaseClient
      .auth
      .getUser();


  const loginLinks =
    document.querySelectorAll(
      'a[href="login.html"]'
    );


  if (user) {

    loginLinks.forEach(link => {

      link.textContent =
        "👤 Profile";

      link.href =
        "profile.html";

    });

  }

}


/* =========================
   AUTH STATE CHANGE
========================= */

supabaseClient.auth.onAuthStateChange(
  (event, session) => {

    updateLoginState();

  }
);


/* =========================
   START
========================= */

updateCount();

renderHome();

renderProducts();

detail();

renderCart();

summary();

updateLoginState();
/* =========================
   WISHLIST
========================= */

async function toggleWishlist(productId, button) {

  const { data: userData } =
    await supabaseClient.auth.getUser();

  const user = userData.user;

  if (!user) {
    alert("Please login first ❤️");
    window.location.href = "login.html";
    return;
  }

  const { data: existing } =
    await supabaseClient
      .from("wishlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle();

  if (existing) {

    const { error } =
      await supabaseClient
        .from("wishlist")
        .delete()
        .eq("id", existing.id);

    if (!error) {
      button.innerHTML = "♡";
      button.classList.remove("active");
    }

  } else {

    const { error } =
      await supabaseClient
        .from("wishlist")
        .insert({
          user_id: user.id,
          product_id: productId
        });

    if (!error) {
      button.innerHTML = "♥";
      button.classList.add("active");
    }
  }
}
/* =========================
   PS MART DELIVERY LOCATION
========================= */

function openLocation() {

  const oldPopup =
    document.getElementById("locationPopup");

  if (oldPopup) {
    oldPopup.remove();
  }

  document.body.insertAdjacentHTML("beforeend", `

    <div id="locationPopup"
      style="
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.55);
        z-index:99999;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:15px;
        box-sizing:border-box;
      ">

      <div
        style="
          width:100%;
          max-width:520px;
          max-height:90vh;
          overflow:auto;
          background:#fff;
          border-radius:12px;
          box-shadow:0 10px 40px rgba(0,0,0,.3);
        ">

        <!-- HEADER -->

        <div
          style="
            padding:18px 20px;
            border-bottom:1px solid #eadfc9;
            display:flex;
            justify-content:space-between;
            align-items:center;
          ">

          <h2
            style="
              margin:0;
              color:#21170f;
              font-size:20px;
            ">
            Select Delivery Address
          </h2>

          <button
            onclick="closeLocation()"
            style="
              border:0;
              background:none;
              font-size:25px;
              cursor:pointer;
              color:#555;
            ">
            ×
          </button>

        </div>


        <!-- SEARCH -->

        <div style="padding:18px 20px 10px;">

          <div
            style="
              display:flex;
              border:1px solid #cfcfcf;
              border-radius:7px;
              overflow:hidden;
              height:46px;
            ">

            <span
              style="
                display:flex;
                align-items:center;
                padding:0 12px;
                font-size:18px;
              ">
              🔍
            </span>

            <input
              id="locationSearch"
              type="text"
              placeholder="Search area, street, city..."
              style="
                flex:1;
                border:0;
                outline:0;
                font-size:14px;
              "
            >

          </div>

        </div>


        <!-- CURRENT LOCATION -->

        <button
          onclick="useCurrentLocation()"
          style="
            width:calc(100% - 40px);
            margin:8px 20px 15px;
            padding:13px;
            border:1px solid #e2a938;
            background:#fff8e6;
            color:#8b5a16;
            border-radius:7px;
            font-weight:bold;
            cursor:pointer;
          ">

          📍 Use My Current Location

        </button>


        <!-- ADDRESS FORM -->

        <div
          style="
            padding:0 20px 20px;
          ">

          <h3
            style="
              margin:10px 0 15px;
              color:#21170f;
              font-size:16px;
            ">
            Enter Delivery Address
          </h3>


          <input
            id="addressName"
            type="text"
            placeholder="Full Name"
            class="location-input"
          >

          <input
            id="addressPhone"
            type="tel"
            placeholder="10-digit Mobile Number"
            class="location-input"
          >

          <textarea
            id="addressLine"
            placeholder="House No., Building, Street, Area"
            class="location-input"
            style="height:75px;resize:none;"
          ></textarea>


          <div
            style="
              display:grid;
              grid-template-columns:1fr 1fr;
              gap:10px;
            ">

            <input
              id="addressCity"
              type="text"
              placeholder="City"
              class="location-input"
            >

            <input
              id="addressPincode"
              type="text"
              placeholder="Pincode"
              maxlength="6"
              class="location-input"
            >

          </div>


          <input
            id="addressState"
            type="text"
            placeholder="State"
            class="location-input"
          >


          <select
            id="addressType"
            class="location-input">

            <option value="Home">
              Home
            </option>

            <option value="Work">
              Work
            </option>

            <option value="Other">
              Other
            </option>

          </select>


          <button
            onclick="saveDeliveryAddress()"
            style="
              width:100%;
              padding:14px;
              border:0;
              border-radius:7px;
              background:linear-gradient(
                135deg,
                #f0c256,
                #bb7719
              );
              color:#281507;
              font-weight:bold;
              font-size:15px;
              cursor:pointer;
              margin-top:8px;
            ">

            Save & Continue

          </button>

        </div>

      </div>

    </div>
  `);


  /* INPUT STYLE */

  document
    .querySelectorAll(".location-input")
    .forEach(input => {

      input.style.width = "100%";
      input.style.boxSizing = "border-box";
      input.style.padding = "12px";
      input.style.marginBottom = "10px";
      input.style.border = "1px solid #d5d5d5";
      input.style.borderRadius = "6px";
      input.style.outline = "none";
      input.style.fontSize = "14px";

    });


  /* LOAD SAVED ADDRESS */

  const saved =
    JSON.parse(
      localStorage.getItem("psmart-address")
    );

  if (saved) {

    document.getElementById("addressName").value =
      saved.name || "";

    document.getElementById("addressPhone").value =
      saved.phone || "";

    document.getElementById("addressLine").value =
      saved.address || "";

    document.getElementById("addressCity").value =
      saved.city || "";

    document.getElementById("addressPincode").value =
      saved.pincode || "";

    document.getElementById("addressState").value =
      saved.state || "";

    document.getElementById("addressType").value =
      saved.type || "Home";

  }

}


/* CLOSE POPUP */

function closeLocation() {

  const popup =
    document.getElementById("locationPopup");

  if (popup) {
    popup.remove();
  }

}


/* CURRENT LOCATION */
function useCurrentLocation() {

  if (!navigator.geolocation) {
    alert("Your browser does not support location.");
    return;
  }

  const button = event?.currentTarget;

  if (button) {
    button.disabled = true;
    button.textContent = "📍 Detecting location...";
  }

  navigator.geolocation.getCurrentPosition(

    async function(position) {

      try {

        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const response = await fetch(
          "https://nominatim.openstreetmap.org/reverse" +
          "?format=jsonv2" +
          "&lat=" + encodeURIComponent(lat) +
          "&lon=" + encodeURIComponent(lon) +
          "&zoom=18" +
          "&addressdetails=1",
          {
            headers: {
              "Accept": "application/json"
            }
          }
        );

        if (!response.ok) {
          throw new Error("Address service failed");
        }

        const data = await response.json();

        const a = data.address || {};

        const area =
          a.neighbourhood ||
          a.suburb ||
          a.quarter ||
          a.residential ||
          "";

        const road =
          a.road ||
          a.street ||
          "";

        const city =
          a.city ||
          a.town ||
          a.village ||
          a.municipality ||
          a.county ||
          "";

        const state =
          a.state ||
          "";

        const pincode =
          a.postcode ||
          "";


        const addressLine =
          [road, area]
            .filter(Boolean)
            .join(", ");


        const cityInput =
          document.getElementById("addressCity");

        const stateInput =
          document.getElementById("addressState");

        const pincodeInput =
          document.getElementById("addressPincode");

        const addressInput =
          document.getElementById("addressLine");


        if (addressInput) {
          addressInput.value = addressLine;
        }

        if (cityInput) {
          cityInput.value = city;
        }

        if (stateInput) {
          stateInput.value = state;
        }

        if (pincodeInput) {
          pincodeInput.value = pincode;
        }


        if (!city && !state && !pincode) {

          alert(
            "Location detected, but complete address could not be found. Please enter it manually."
          );

        } else {

          alert(
            "✓ Current location detected.\n\n" +
            "Please check the address and click Save & Continue."
          );

        }

      } catch (error) {

        console.error(
          "Current location error:",
          error
        );

        alert(
          "Location detected, but address could not be loaded. Please enter the address manually."
        );

      } finally {

        const buttons =
          document.querySelectorAll(
            "#locationPopup button"
          );

        buttons.forEach(function(btn) {

          if (
            btn.textContent.includes("Detecting")
          ) {

            btn.disabled = false;

            btn.textContent =
              "📍 Use My Current Location";

          }

        });

      }

    },

    function(error) {

      console.error(
        "Geolocation error:",
        error
      );

      if (error.code === 1) {

        alert(
          "Location permission denied.\n\n" +
          "Please click the 🔒 icon near the website address, " +
          "allow Location, and try again."
        );

      } else if (error.code === 2) {

        alert(
          "Your current location could not be detected. Please try again."
        );

      } else if (error.code === 3) {

        alert(
          "Location request timed out. Please try again."
        );

      } else {

        alert(
          "Unable to detect your location. Please enter the address manually."
        );

      }

    },

    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    }

  );

}
