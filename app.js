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
  return JSON.parse(localStorage.getItem("psmart-cart") || "[]");
}

function saveCart(c) {
  localStorage.setItem("psmart-cart", JSON.stringify(c));
  updateCount();
}

function updateCount() {
  let n = cart().reduce((s, x) => s + x.qty, 0);

  document
    .querySelectorAll("#count")
    .forEach(e => e.textContent = n);
}

async function add(id) {

  let c = cart();

  let x = c.find(a => String(a.id) === String(id));

  if (x) {
    x.qty++;
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
   SEARCH
========================= */

function search() {

  let input = document.querySelector("#search");

  if (!input) return;

  let q = input.value.trim();

  if (q) {
    location.href =
      "products.html?q=" +
      encodeURIComponent(q);
  }
}


/* =========================
   PRODUCT CARD
========================= */

function card(p) {

  return `
    <article class="product">

      <a href="product.html?id=${p.id}">

        <div class="pic">

          ${
            p.image_url
            ? `<img
                src="${p.image_url}"
                alt="${p.name}"
                style="width:100%;height:100%;object-fit:contain;"
              >`
            : (p.icon || "🛍️")
          }

        </div>

      </a>

      <small>${p.brand || "PS Mart Seller"}</small>

      <h3>${p.name}</h3>

      <div class="rating">
        ★ ${p.rating || "4.0"}
      </div>

      <b>${money(p.price)}</b>

      ${
        p.old_price
        ? `<del>${money(p.old_price)}</del>`
        : ""
      }

      <button onclick="add(${p.id})">
        🛒 Add to Cart
      </button>

    </article>
  `;
}


/* =========================
   PRODUCTS
========================= */

async function loadProductsFromSupabase() {

  const { data, error } =
    await supabaseClient
      .from("products")
      .select("*")
      .eq("status", "approved")
      .order("created_at", {
        ascending: false
      });

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

  let el = document.querySelector("#products");

  if (!el) return;

  let u =
    new URLSearchParams(location.search);

  let cat = u.get("cat");

  let q =
    (u.get("q") || "").toLowerCase();

  let products =
    await loadProductsFromSupabase();

  /* If Supabase has no products yet,
     use existing demo products */

  if (!products.length &&
      typeof PRODUCTS !== "undefined") {

    products = PRODUCTS;
  }

  let a = products.filter(p => {

    let category =
      p.cat ||
      p.category ||
      "";

    let name =
      p.name ||
      "";

    let brand =
      p.brand ||
      "";

    return (
      (!cat || category == cat) &&
      (
        !q ||
        (
          name +
          " " +
          brand +
          " " +
          category
        )
        .toLowerCase()
        .includes(q)
      )
    );

  });


  let s =
    document.querySelector("#sort")?.value;

  if (s == "low") {

    a.sort(
      (x, y) =>
        Number(x.price) -
        Number(y.price)
    );

  }

  if (s == "high") {

    a.sort(
      (x, y) =>
        Number(y.price) -
        Number(x.price)
    );

  }


  let title =
    document.querySelector("#title");

  if (title) {

    title.textContent =
      cat
      ? cat + " Products"
      : q
      ? `Search: ${q}`
      : "All Products";

  }


  el.innerHTML =
    a.length
    ? a.map(card).join("")
    : "<div class='empty'>No products found.</div>";
}


/* =========================
   HOME
========================= */

async function renderHome() {

  let e =
    document.querySelector("#homeProducts");

  if (!e) return;

  let products =
    await loadProductsFromSupabase();

  if (!products.length &&
      typeof PRODUCTS !== "undefined") {

    products = PRODUCTS;

  }

  e.innerHTML =
    products
      .slice(0, 5)
      .map(card)
      .join("");
}


/* =========================
   PRODUCT DETAIL
========================= */

async function detail() {

  let e =
    document.querySelector("#detail");

  if (!e) return;

  let id =
    new URLSearchParams(location.search)
      .get("id");

  let products =
    await loadProductsFromSupabase();

  if (!products.length &&
      typeof PRODUCTS !== "undefined") {

    products = PRODUCTS;

  }

  let p =
    products.find(x => x.id == id) ||
    products[0];

  if (!p) {

    e.innerHTML =
      "<div class='empty'>Product not found.</div>";

    return;
  }


  e.innerHTML = `

    <div class="bigpic">
      ${p.icon || "🛍️"}
    </div>

    <div>

      <small>
        ${p.brand || "PS Mart Seller"}
      </small>

      <h1>
        ${p.name}
      </h1>

      <div class="rating">
        ★ ${p.rating || "4.0"} / 5
      </div>

      <h2>
        ${money(p.price)}
        ${
          p.old
          ? `<del>${money(p.old)}</del>`
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
        onclick="add(${p.id})">
        🛒 Add to Cart
      </button>

      <a
        class="buy"
        href="cart.html">
        Buy Now
      </a>

      <hr>

      <h3>Description</h3>

      <p>
        ${
          p.description ||
          "Product details, specifications and customer reviews will appear here."
        }
      </p>

    </div>
  `;
}


/* =========================
   CART
========================= */
async function renderCart() {

  const e = document.querySelector("#cart");

  if (!e) return;

  const c = cart();

  if (!c.length) {

    e.innerHTML = `
      <div class="empty">
        Your cart is empty 🛒
        <br>
        <a href="products.html">
          Continue Shopping
        </a>
      </div>
    `;

    return;
  }

  const ids = c.map(x => x.id);

  const { data: products, error } =
    await supabaseClient
      .from("products")
      .select("*")
      .in("id", ids)
      .eq("status", "approved");

  if (error) {

    console.log("Cart products error:", error);

    e.innerHTML =
      "<div class='empty'>Unable to load cart.</div>";

    return;
  }

  let total = 0;

  e.innerHTML = `

    <div>

      ${c.map(item => {

        const p =
          products.find(
            product =>
              String(product.id) === String(item.id)
          );

        if (!p) return "";

        const amount =
          Number(p.price) * item.qty;

        total += amount;

        return `

          <div class="cartrow">

            <div class="pic mini">

              ${
                p.image_url
                ? `<img
                    src="${p.image_url}"
                    alt="${p.name}"
                    style="width:100%;height:100%;object-fit:contain;"
                  >`
                : "🛍️"
              }

            </div>

            <div>

              <b>${p.name}</b>

              <p>
                ${money(p.price)} × ${item.qty}
              </p>

              <p>
                Subtotal:
                <b>${money(amount)}</b>
              </p>

            </div>

            <button
              onclick="remove('${p.id}')">
              Remove
            </button>

          </div>

        `;

      }).join("")}

    </div>

    <div class="summary">

      <h2>Price Details</h2>

      <p>
        Total
        <b>${money(total)}</b>
      </p>

      <p>
        Delivery
        <b class="green">FREE</b>
      </p>

      <hr>

      <h2>${money(total)}</h2>

      <a
        class="goldbtn block"
        href="checkout.html">
        Proceed to Checkout →
      </a>

    </div>

  `;
}
/* =========================
   CHECKOUT SUMMARY
========================= */

function summary() {

  let e =
    document.querySelector("#summary");

  if (!e) return;

  let total =
    cart().reduce(
      (s, x) => {

        let p =
          typeof PRODUCTS !== "undefined"
          ? PRODUCTS.find(
              p => p.id == x.id
            )
          : null;

        return s +
          (p?.price || 0) *
          x.qty;

      },
      0
    );


  e.innerHTML = `

    <h2>
      Order Summary
    </h2>

    <p>
      Items:
      ${
        cart().reduce(
          (s, x) =>
            s + x.qty,
          0
        )
      }
    </p>

    <h2>
      Total:
      ${money(total)}
    </h2>

    <button
      class="goldbtn block"
      onclick="alert('Order system will be connected next.')">
      Place Order
    </button>

  `;
}


/* =========================
   SUPABASE AUTH FUNCTIONS
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
          full_name: fullName
        }
      }

    });


  if (error) {

    alert(error.message);
    return null;

  }

  return data;

}


async function loginUser(
  email,
  password
) {

  const {
    data,
    error
  } =
    await supabaseClient.auth.signInWithPassword({

      email,
      password

    });


  if (error) {

    alert(error.message);
    return null;

  }

  alert("Login successful ✓");

  return data;

}


async function logoutUser() {

  const {
    error
  } =
    await supabaseClient.auth.signOut();

  if (error) {

    alert(error.message);
    return;

  }

  location.href = "index.html";
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
    await supabaseClient.auth.getUser();

  return user;

}


/* =========================
   START
========================= */

updateCount();

renderHome();

renderProducts();

detail();

renderCart();

summary();
/* =========================
   LOGIN STATE
========================= */

async function updateLoginState() {

  const {
    data: {
      user
    }
  } = await supabaseClient.auth.getUser();

  const loginLinks =
    document.querySelectorAll(
      'a[href="login.html"]'
    );

  if (user) {

    loginLinks.forEach(link => {

      link.textContent = "👤 Profile";

      link.href = "profile.html";

    });

  }

}


/* WATCH LOGIN / LOGOUT */

supabaseClient.auth.onAuthStateChange(
  (event, session) => {

    updateLoginState();

  }
);


/* CHECK CURRENT SESSION */

updateLoginState();
