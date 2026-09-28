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

  const e =
    document.querySelector("#detail");

  if (!e) return;

  const id =
    new URLSearchParams(
      location.search
    ).get("id");

  if (!id) {

    e.innerHTML =
      "<div class='empty'>Product not found.</div>";

    return;

  }


  const {
    data: p,
    error
  } =
    await supabaseClient
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


  e.innerHTML = `

    <div class="bigpic">

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

      <small>
        PS Mart Seller
      </small>

      <h1>
        ${p.name}
      </h1>

      <div class="rating">
        ★ 4.0 / 5
      </div>

      <h2>
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

      </h2>

      <p class="green">
        ✓ Available
        &nbsp;
        ✓ Secure Payment
        &nbsp;
        ✓ Easy Returns
      </p>

      <p>
        ${
          p.description ||
          "Premium quality product available on PS Mart."
        }
      </p>

      <button
        class="goldbtn"
        onclick="add('${p.id}')">
        🛒 Add to Cart
      </button>

      <a
        class="buy"
        href="cart.html">
        Buy Now
      </a>

      <hr>

      <h3>
        Description
      </h3>

      <p>
        ${
          p.description ||
          "Product details will appear here."
        }
      </p>

    </div>

  `;
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
