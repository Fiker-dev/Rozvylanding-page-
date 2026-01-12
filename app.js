console.log("APP JS LOADED");
// ✅ IMPORTANT: Your images now live in /assets/ (folder)
// So each product image uses: "assets/<filename>.jpg"

const CHECKOUT_URL = ""; 
// Put your payment/checkout URL here (PayFast link / checkout page / WhatsApp order link).
// Example WhatsApp order link: "https://wa.me/27769126465?text=Hi%20I%20want%20to%20order%20from%20Rozvy%20Estates"

const PRODUCTS = [
  {
    id: "goat-meat",
    name: "Goat Meat",
    pricePerKg: 180, // change if needed
    unitLabel: "per kg",
    image: "assets/goat-meat.jpg",
    desc: "Fresh goat meat cuts, cleaned and ready.",
    type: "weight"
  },
  {
    id: "prepared-chicken",
    name: "Prepared Chicken",
    pricePerKg: 85, // change if needed
    unitLabel: "per kg",
    image: "assets/prepared-chicken.jpg",
    desc: "Prepared chicken, cleaned and ready to cook.",
    type: "weight"
  },
  {
    id: "free-range-eggs",
    name: "Free Range Eggs",
    priceEach: 45, // per tray/unit (change if needed)
    unitLabel: "per unit",
    image: "assets/free-range-eggs.jpg",
    desc: "Farm fresh free-range eggs.",
    type: "unit"
  },
  {
    id: "tilapia-fillets",
    name: "Tilapia Fillets",
    pricePerKg: 120, // change if needed
    unitLabel: "per kg",
    image: "assets/tilapia-fillets.jpg",
    desc: "Fresh tilapia fillets, clean and ready.",
    type: "weight"
  },
  {
    id: "goat-tripe",
    name: "Goat Tripe",
    pricePerKg: 95, // change if needed
    unitLabel: "per kg",
    image: "assets/goat-tripe.jpg",
    desc: "Cleaned goat tripe (honeycomb/blanket).",
    type: "weight"
  },
  {
    id: "rozvy-raw-honey",
    name: "Rozvy Raw Honey",
    priceEach: 120, // per jar (change if needed)
    unitLabel: "per jar",
    image: "assets/rozvy-raw-honey.jpg",
    desc: "Raw honey in a sealed container.",
    type: "unit"
  },
  {
    id: "tilapia-kariba-breams",
    name: "Tilapia Kariba Breams",
    pricePerKg: 110, // change if needed
    unitLabel: "per kg",
    image: "assets/tilapia-kariba-breams.jpg",
    desc: "Whole tilapia (Kariba breams), fresh.",
    type: "weight"
  }
];

// Weight options for "supermarket style" kg selector
const KG_OPTIONS = [
  { label: "0.5 kg", value: 0.5 },
  { label: "1 kg", value: 1 },
  { label: "1.5 kg", value: 1.5 },
  { label: "2 kg", value: 2 },
  { label: "3 kg", value: 3 },
  { label: "5 kg", value: 5 },
];

const els = {
  grid: document.getElementById("productGrid"),
  cartCount: document.getElementById("cartCount"),
  cartDrawer: document.getElementById("cartDrawer"),
  cartItems: document.getElementById("cartItems"),
  cartSubtotal: document.getElementById("cartSubtotal"),
  openCartBtn: document.getElementById("openCartBtn"),
  closeCartBtn: document.getElementById("closeCartBtn"),
  drawerBackdrop: document.getElementById("drawerBackdrop"),
  checkoutBtn: document.getElementById("checkoutBtn"),
  clearCartBtn: document.getElementById("clearCartBtn"),
};

let cart = loadCart(); // { key: {productId, qtyOrKg, type, optionLabel} }

function moneyZAR(num) {
  return `R${num.toFixed(2)}`;
}

function productPrice(p, amount) {
  if (p.type === "weight") return p.pricePerKg * amount;
  return p.priceEach * amount;
}

function cartItemKey(productId, optionValue) {
  return `${productId}::${optionValue ?? "unit"}`;
}

function renderProducts() {
  els.grid.innerHTML = "";

  PRODUCTS.forEach((p) => {
    const card = document.createElement("article");
    card.className = "card";

    const left = document.createElement("div");
    left.className = "thumb";
    left.innerHTML = `<img src="${p.image}" alt="${p.name}">`;

    const right = document.createElement("div");

    const title = document.createElement("h3");
    title.className = "card__title";
    title.textContent = p.name;

    const desc = document.createElement("p");
    desc.className = "card__desc";
    desc.textContent = p.desc;

    const price = document.createElement("div");
    price.className = "price";

    if (p.type === "weight") {
      price.innerHTML = `<strong>${moneyZAR(p.pricePerKg)}</strong><span>${p.unitLabel}</span>`;
    } else {
      price.innerHTML = `<strong>${moneyZAR(p.priceEach)}</strong><span>${p.unitLabel}</span>`;
    }

    const controls = document.createElement("div");
    controls.className = "controls";

    if (p.type === "weight") {
      const select = document.createElement("select");
      select.className = "select";
      KG_OPTIONS.forEach(opt => {
        const o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.label;
        select.appendChild(o);
      });

      const btn = document.createElement("button");
      btn.className = "btn btn--primary";
      btn.textContent = "Add to cart";
      btn.addEventListener("click", () => {
        const kg = Number(select.value);
        addToCart(p.id, kg, `${kg} kg`);
      });

      controls.appendChild(select);
      controls.appendChild(btn);
    } else {
      const qty = document.createElement("input");
      qty.className = "qty";
      qty.type = "number";
      qty.min = "1";
      qty.value = "1";

      const btn = document.createElement("button");
      btn.className = "btn btn--primary";
      btn.textContent = "Add to cart";
      btn.addEventListener("click", () => {
        const q = Math.max(1, Number(qty.value || 1));
        addToCart(p.id, q, `${q} unit`);
      });

      controls.appendChild(qty);
      controls.appendChild(btn);
    }

    right.appendChild(title);
    right.appendChild(desc);
    right.appendChild(price);
    right.appendChild(controls);

    card.appendChild(left);
    card.appendChild(right);
    els.grid.appendChild(card);
  });
}

function addToCart(productId, amount, label) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;

  const key = cartItemKey(productId, p.type === "weight" ? amount : "unit");

  if (!cart[key]) {
    cart[key] = {
      productId,
      type: p.type,
      amount,
      label: p.type === "weight" ? `${amount} kg` : `Qty: ${amount}`,
    };
  } else {
    // For unit items, increment qty; for weight items keep separate (key includes kg)
    if (p.type === "unit") {
      cart[key].amount += amount;
      cart[key].label = `Qty: ${cart[key].amount}`;
    }
  }

  saveCart();
  updateCartUI(true);
}

function removeFromCart(key) {
  delete cart[key];
  saveCart();
  updateCartUI(false);
}

function updateCartUI(openDrawer = false) {
  const items = Object.entries(cart);

  // Count: total unique lines or total qty (we'll show total lines)
  els.cartCount.textContent = items.length.toString();

  // Render items
  els.cartItems.innerHTML = "";

  if (items.length === 0) {
    els.cartItems.innerHTML = `<p style="color: var(--muted); margin: 8px 0;">Your cart is empty.</p>`;
    els.cartSubtotal.textContent = moneyZAR(0);
    if (openDrawer) openCart();
    return;
  }

  let subtotal = 0;

  items.forEach(([key, item]) => {
    const p = PRODUCTS.find(x => x.id === item.productId);
    if (!p) return;

    const lineTotal = productPrice(p, item.amount);
    subtotal += lineTotal;

    const row = document.createElement("div");
    row.className = "cart-item";

    row.innerHTML = `
      <div class="cart-item__img"><img src="${p.image}" alt="${p.name}"></div>
      <div>
        <div class="cart-item__name">${p.name}</div>
        <div class="cart-item__meta">${item.type === "weight" ? `${moneyZAR(p.pricePerKg)} / kg` : `${moneyZAR(p.priceEach)} each`} • <strong>${moneyZAR(lineTotal)}</strong></div>
        <div class="cart-item__row">
          ${
            item.type === "unit"
              ? `<input type="number" min="1" value="${item.amount}" data-key="${key}" class="qtyInput" />`
              : `<span style="color: var(--muted); font-size: 12px;">${item.label}</span>`
          }
          <button class="btn btn--danger" data-remove="${key}">Remove</button>
        </div>
      </div>
    `;

    els.cartItems.appendChild(row);
  });

  els.cartSubtotal.textContent = moneyZAR(subtotal);

  // Wire remove buttons
  els.cartItems.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => removeFromCart(btn.getAttribute("data-remove")));
  });

  // Wire qty inputs (unit items)
  els.cartItems.querySelectorAll(".qtyInput").forEach(input => {
    input.addEventListener("change", () => {
      const key = input.getAttribute("data-key");
      const val = Math.max(1, Number(input.value || 1));
      if (cart[key]) {
        cart[key].amount = val;
        cart[key].label = `Qty: ${val}`;
        saveCart();
        updateCartUI(false);
      }
    });
  });

  if (openDrawer) openCart();
}

function openCart() {
  els.cartDrawer.classList.add("is-open");
  els.cartDrawer.setAttribute("aria-hidden", "false");
}
function closeCart() {
  els.cartDrawer.classList.remove("is-open");
  els.cartDrawer.setAttribute("aria-hidden", "true");
}

function buildOrderSummaryText() {
  const lines = Object.values(cart).map(item => {
    const p = PRODUCTS.find(x => x.id === item.productId);
    if (!p) return "";
    const lineTotal = productPrice(p, item.amount);
    const qtyText = item.type === "weight" ? `${item.amount} kg` : `Qty ${item.amount}`;
    return `- ${p.name} (${qtyText}) = ${moneyZAR(lineTotal)}`;
  }).filter(Boolean);

  const subtotal = Object.values(cart).reduce((sum, item) => {
    const p = PRODUCTS.find(x => x.id === item.productId);
    return p ? sum + productPrice(p, item.amount) : sum;
  }, 0);

  lines.push(`Subtotal: ${moneyZAR(subtotal)}`);
  return lines.join("\n");
}

function checkout() {
  if (Object.keys(cart).length === 0) {
    alert("Your cart is empty.");
    return;
  }

  // If you have a checkout URL, send user there with a simple query string
  if (CHECKOUT_URL && CHECKOUT_URL.trim().length > 0) {
    const summary = encodeURIComponent(buildOrderSummaryText());
    const url = `${CHECKOUT_URL}${CHECKOUT_URL.includes("?") ? "&" : "?"}order=${summary}`;
    window.location.href = url;
    return;
  }

  // Fallback: copy order summary so you can paste into WhatsApp/DM manually
  const summary = buildOrderSummaryText();
  navigator.clipboard?.writeText(summary).catch(() => {});
  alert("Checkout link not set yet. Order summary copied to clipboard:\n\n" + summary);
}

function clearCart() {
  cart = {};
  saveCart();
  updateCartUI(false);
}

function saveCart() {
  localStorage.setItem("rozvy_cart_v1", JSON.stringify(cart));
}
function loadCart() {
  try {
    const raw = localStorage.getItem("rozvy_cart_v1");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

els.openCartBtn.addEventListener("click", () => openCart());
els.closeCartBtn.addEventListener("click", () => closeCart());
els.drawerBackdrop.addEventListener("click", () => closeCart());
els.checkoutBtn.addEventListener("click", () => checkout());
els.clearCartBtn.addEventListener("click", () => clearCart());

renderProducts();
updateCartUI(false);
