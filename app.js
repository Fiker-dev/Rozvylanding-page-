// =======================
// CONFIG (edit these)
// =======================
const CONFIG = {
  currency: "ZAR",
  whatsappNumberE164: "27769126465", // change to your number (no +)
  delivery: {
    flatFee: 0, // set to e.g. 60 if you want
    freeOver: 0 // set to e.g. 500 if you want
  },
  checkout: {
    // This is the secure endpoint you will deploy (Vercel/Netlify).
    // For now it can be blank and checkout will show an instruction.
    createSessionUrl: "" // e.g. "https://your-domain.vercel.app/api/checkout"
  },
  products: [
    {
      id: "goat-1",
      name: "Goat Meat (Mixed Cut)",
      desc: "Fresh mixed cut. Perfect for stew and curry.",
      pricePerKg: 140, // edit your price
      image:
        "https://images.unsplash.com/photo-1604908554162-12f2e7b8c1a2?auto=format&fit=crop&w=1400&q=70",
      kgMin: 1,
      kgMax: 10,
      kgStep: 1
    },
    {
      id: "goat-2",
      name: "Goat Ribs",
      desc: "Tender ribs for braai or slow-cook.",
      pricePerKg: 160,
      image:
        "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1400&q=70",
      kgMin: 1,
      kgMax: 10,
      kgStep: 1
    },
    {
      id: "goat-3",
      name: "Goat Leg",
      desc: "Great for roasting and special occasions.",
      pricePerKg: 180,
      image:
        "https://images.unsplash.com/photo-1603046891745-3d844f5d2b95?auto=format&fit=crop&w=1400&q=70",
      kgMin: 1,
      kgMax: 8,
      kgStep: 1
    },
    {
      id: "goat-4",
      name: "Goat Offal",
      desc: "Cleaned and prepared. Traditional favorite.",
      pricePerKg: 120,
      image:
        "https://images.unsplash.com/photo-1606851091851-7d2f0cb6d9a0?auto=format&fit=crop&w=1400&q=70",
      kgMin: 1,
      kgMax: 10,
      kgStep: 1
    }
  ]
};

// =======================
// Helpers
// =======================
const fmt = (n) => {
  try {
    return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n);
  } catch {
    return `R ${Number(n).toFixed(2)}`;
  }
};

const state = {
  cart: loadCart() // {key: {productId, kg, qty}}
};

function saveCart() {
  localStorage.setItem("cart_v1", JSON.stringify(state.cart));
}
function loadCart() {
  try { return JSON.parse(localStorage.getItem("cart_v1")) || {}; }
  catch { return {}; }
}
function cartCount() {
  return Object.values(state.cart).reduce((sum, it) => sum + it.qty, 0);
}
function subtotal() {
  return Object.values(state.cart).reduce((sum, it) => {
    const p = CONFIG.products.find(x => x.id === it.productId);
    if (!p) return sum;
    return sum + (p.pricePerKg * it.kg * it.qty);
  }, 0);
}
function deliveryFeeCalc(sub) {
  const { flatFee, freeOver } = CONFIG.delivery;
  if (freeOver && sub >= freeOver) return 0;
  return flatFee || 0;
}
function cartMeta() {
  const items = cartCount();
  return `${items} item${items === 1 ? "" : "s"}`;
}

// =======================
// Render Products
// =======================
const grid = document.getElementById("productGrid");
const cartCountEl = document.getElementById("cartCount");
const startingPriceEl = document.getElementById("startingPrice");

function renderProducts() {
  const minPrice = Math.min(...CONFIG.products.map(p => p.pricePerKg));
  startingPriceEl.textContent = `${fmt(minPrice)}/kg`;

  grid.innerHTML = CONFIG.products.map(p => {
    const defaultKg = p.kgMin;
    return `
      <article class="card" data-id="${p.id}">
        <img class="card__img" src="${p.image}" alt="${escapeHtml(p.name)}" />
        <div class="card__body">
          <h3 class="card__title">${escapeHtml(p.name)}</h3>
          <p class="card__desc">${escapeHtml(p.desc)}</p>

          <div class="rowline">
            <span class="muted tiny">Price per KG</span>
            <span class="price">${fmt(p.pricePerKg)}/kg</span>
          </div>

          <div class="kgRow">
            <div class="kgTop">
              <span class="muted tiny">Kilograms (KG)</span>
              <span class="kgValue" id="kgVal-${p.id}">${defaultKg} kg</span>
            </div>
            <input
              class="range"
              type="range"
              min="${p.kgMin}"
              max="${p.kgMax}"
              step="${p.kgStep}"
              value="${defaultKg}"
              id="kg-${p.id}"
            />
            <div class="rowline">
              <span class="muted tiny">Item total</span>
              <span class="price" id="itemTotal-${p.id}">${fmt(p.pricePerKg * defaultKg)}</span>
            </div>
            <button class="smallBtn" data-add="${p.id}">Add to cart</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  CONFIG.products.forEach(p => {
    const slider = document.getElementById(`kg-${p.id}`);
    const kgVal = document.getElementById(`kgVal-${p.id}`);
    const itemTotal = document.getElementById(`itemTotal-${p.id}`);

    slider.addEventListener("input", () => {
      const kg = Number(slider.value);
      kgVal.textContent = `${kg} kg`;
      itemTotal.textContent = fmt(p.pricePerKg * kg);
    });
  });

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    const productId = btn.getAttribute("data-add");
    const kg = Number(document.getElementById(`kg-${productId}`).value);
    addToCart(productId, kg);
    openCart();
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[s]));
}

// =======================
// Cart UI
// =======================
const drawer = document.getElementById("cartDrawer");
const openCartBtn = document.getElementById("openCartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const closeCartOverlay = document.getElementById("closeCartOverlay");
const cartItemsEl = document.getElementById("cartItems");
const subtotalEl = document.getElementById("subtotal");
const deliveryFeeEl = document.getElementById("deliveryFee");
const totalEl = document.getElementById("total");
const cartMetaEl = document.getElementById("cartMeta");
const checkoutBtn = document.getElementById("checkoutBtn");
const clearCartBtn = document.getElementById("clearCartBtn");
const whatsappBtn = document.getElementById("whatsappBtn");

openCartBtn.addEventListener("click", openCart);
closeCartBtn.addEventListener("click", closeCart);
closeCartOverlay.addEventListener("click", closeCart);

function openCart() {
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  renderCart();
}
function closeCart() {
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
}

function addToCart(productId, kg) {
  const key = `${productId}__${kg}`;
  if (!state.cart[key]) state.cart[key] = { productId, kg, qty: 0 };
  state.cart[key].qty += 1;
  saveCart();
  updateCartBadge();
}

function updateCartBadge() {
  cartCountEl.textContent = cartCount();
}

function renderCart() {
  const items = Object.entries(state.cart);

  if (!items.length) {
    cartItemsEl.innerHTML = `<div class="muted">Your cart is empty.</div>`;
  } else {
    cartItemsEl.innerHTML = items.map(([key, it]) => {
      const p = CONFIG.products.find(x => x.id === it.productId);
      const line = (p.pricePerKg * it.kg * it.qty);
      return `
        <div class="cartItem">
          <div class="cartItem__top">
            <div>
              <div class="cartItem__name">${escapeHtml(p.name)}</div>
              <div class="cartItem__meta">${it.kg} kg • ${fmt(p.pricePerKg)}/kg</div>
            </div>
            <div class="price">${fmt(line)}</div>
          </div>
          <div class="qtyRow">
            <button class="qtyBtn" data-dec="${key}">−</button>
            <div><strong>${it.qty}</strong></div>
            <button class="qtyBtn" data-inc="${key}">+</button>
            <button class="qtyBtn" style="margin-left:auto" data-del="${key}">🗑</button>
          </div>
        </div>
      `;
    }).join("");
  }

  cartItemsEl.onclick = (e) => {
    const inc = e.target.closest("[data-inc]");
    const dec = e.target.closest("[data-dec]");
    const del = e.target.closest("[data-del]");
    if (inc) changeQty(inc.getAttribute("data-inc"), +1);
    if (dec) changeQty(dec.getAttribute("data-dec"), -1);
    if (del) removeItem(del.getAttribute("data-del"));
  };

  const sub = subtotal();
  const delFee = deliveryFeeCalc(sub);
  const tot = sub + delFee;

  subtotalEl.textContent = fmt(sub);
  deliveryFeeEl.textContent = fmt(delFee);
  totalEl.textContent = fmt(tot);
  cartMetaEl.textContent = cartMeta();
}

function changeQty(key, delta) {
  if (!state.cart[key]) return;
  state.cart[key].qty += delta;
  if (state.cart[key].qty <= 0) delete state.cart[key];
  saveCart();
  updateCartBadge();
  renderCart();
}
function removeItem(key) {
  delete state.cart[key];
  saveCart();
  updateCartBadge();
  renderCart();
}

clearCartBtn.addEventListener("click", () => {
  state.cart = {};
  saveCart();
  updateCartBadge();
  renderCart();
});

// =======================
// Checkout (serverless recommended)
// =======================
checkoutBtn.addEventListener("click", async () => {
  const items = Object.values(state.cart);
  if (!items.length) return alert("Your cart is empty.");

  if (!CONFIG.checkout.createSessionUrl) {
    return alert(
      "Checkout endpoint not set.\n\nNext step: deploy a secure serverless API (Vercel/Netlify) and paste the URL into CONFIG.checkout.createSessionUrl."
    );
  }

  try {
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "Redirecting…";

    const res = await fetch(CONFIG.checkout.createSessionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currency: CONFIG.currency,
        items,
        delivery: CONFIG.delivery
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Checkout failed");

    // server should return a redirect URL (gateway hosted checkout) or a payment link
    if (data.redirectUrl) {
      window.location.href = data.redirectUrl;
      return;
    }

    throw new Error("No redirectUrl returned from server.");
  } catch (err) {
    alert(err.message);
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = "Checkout";
  }
});

// =======================
// WhatsApp button
// =======================
function setupWhatsApp() {
  const msg = encodeURIComponent("Hi, I want to order goat meat. Please assist me with delivery.");
  whatsappBtn.href = `https://wa.me/${CONFIG.whatsappNumberE164}?text=${msg}`;
}

// Init
renderProducts();
setupWhatsApp();
updateCartBadge();
