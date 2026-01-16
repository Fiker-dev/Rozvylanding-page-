// app.js

// If you later add a real payment gateway page, put the URL here.
// For now, checkout will fall back to WhatsApp with an order summary.
const CHECKOUT_URL = "";

// WhatsApp number: +27 (82) 764-9996  -> 27827649996 in wa.me format
const WHATSAPP_NUMBER = "27827649996";

// Products (match your assets exactly)
const PRODUCTS = [
  {
    id: "goat-meat",
    name: "Goat Meat",
    description: "Fresh goat meat cuts, cleaned and ready.",
    price: 180,
    unit: "kg",
    image: "assets/goat-meat.jpg",
    qtyOptions: [0.5, 1, 1.5, 2]
  },
  {
    id: "prepared-chicken",
    name: "Prepared Chicken",
    description: "Prepared chicken, cleaned and ready to cook.",
    price: 85,
    unit: "kg",
    image: "assets/prepared-chicken.jpg",
    qtyOptions: [0.5, 1, 1.5, 2]
  },
  {
    id: "free-range-eggs",
    name: "Free Range Eggs",
    description: "Farm fresh free-range eggs.",
    price: 45,
    unit: "unit",
    image: "assets/free-range-eggs.jpg",
    qtyOptions: [1, 2, 3, 4, 5]
  },
  {
    id: "tilapia-fillets",
    name: "Tilapia Fillets",
    description: "Fresh tilapia fillets, clean and ready.",
    price: 120,
    unit: "kg",
    image: "assets/tilapia-fillets.jpg",
    qtyOptions: [0.5, 1, 1.5, 2]
  },
  {
    id: "goat-tripe",
    name: "Goat Tripe",
    description: "Cleaned goat tripe (honeycomb/blanket).",
    price: 95,
    unit: "kg",
    image: "assets/goat-tripe.jpg",
    qtyOptions: [0.5, 1, 1.5, 2]
  },
  {
    id: "rozvy-raw-honey",
    name: "Rozvy Raw Honey",
    description: "Raw honey in a sealed container.",
    price: 120,
    unit: "unit",
    image: "assets/rozvy-raw-honey.jpg",
    qtyOptions: [1, 2, 3, 4]
  },
  {
    id: "tilapia-kariba-breams",
    name: "Tilapia Kariba Breams",
    description: "Whole tilapia (Kariba breams), fresh.",
    price: 110,
    unit: "kg",
    image: "assets/tilapia-kariba-breams.jpg",
    qtyOptions: [0.5, 1, 1.5, 2]
  }
];

// DOM
const productListEl = document.getElementById("product-list");
const cartOverlayEl = document.getElementById("cart-overlay");
const cartItemsEl = document.getElementById("cart-items");
const cartCountEl = document.getElementById("cart-count");
const cartTotalEl = document.getElementById("cart-total");

const cartToggleBtn = document.querySelector(".cart-toggle");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".btn-clear");
const checkoutBtn = document.querySelector(".btn-checkout");

// Cart state
let cart = JSON.parse(localStorage.getItem("rozvy_cart") || "[]");

// Events
cartToggleBtn.addEventListener("click", () => {
  cartOverlayEl.classList.remove("hidden");
});

closeCartBtn.addEventListener("click", () => {
  cartOverlayEl.classList.add("hidden");
});

// Close cart when clicking outside the panel
cartOverlayEl.addEventListener("click", (e) => {
  if (e.target === cartOverlayEl) cartOverlayEl.classList.add("hidden");
});

clearCartBtn.addEventListener("click", () => {
  cart = [];
  saveCart();
  renderCart();
});

checkoutBtn.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  const orderSummary = buildOrderSummary();
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(orderSummary)}`;

  // If no gateway, default to WhatsApp checkout summary (clean UX)
  if (!CHECKOUT_URL) {
    window.open(waUrl, "_blank", "noopener,noreferrer");
    return;
  }

  // If you later set CHECKOUT_URL, you can redirect there instead
  window.location.href = CHECKOUT_URL;
});

// Render products
function renderProducts() {
  productListEl.innerHTML = "";

  PRODUCTS.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";

    const optionsHTML = p.qtyOptions
      .map((q) => {
        const label = p.unit === "kg" ? `${q} kg` : `${q}`;
        return `<option value="${q}">${label}</option>`;
      })
      .join("");

    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <div class="price">R${p.price.toFixed(2)} ${p.unit === "kg" ? "per kg" : "per unit"}</div>

      <div class="product-actions">
        <select aria-label="Select quantity">${optionsHTML}</select>
        <button type="button">Add to cart</button>
      </div>
    `;

    const qtySelect = card.querySelector("select");
    const addBtn = card.querySelector("button");

    addBtn.addEventListener("click", () => {
      const qty = Number(qtySelect.value);
      addToCart(p, qty);
    });

    productListEl.appendChild(card);
  });
}

// Cart logic
function addToCart(product, qty) {
  const item = {
    lineId: `${product.id}-${Date.now()}`,
    productId: product.id,
    name: product.name,
    unit: product.unit,
    price: product.price,
    qty,
    image: product.image
  };

  cart.push(item);
  saveCart();
  renderCart();
}

function removeCartItem(lineId) {
  cart = cart.filter((i) => i.lineId !== lineId);
  saveCart();
  renderCart();
}

function calcCartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function saveCart() {
  localStorage.setItem("rozvy_cart", JSON.stringify(cart));
}

// Render cart
function renderCart() {
  cartItemsEl.innerHTML = "";

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `<p style="color: rgba(229,231,235,0.85); margin:0;">Your cart is empty.</p>`;
  } else {
    cart.forEach((item) => {
      const qtyLabel = item.unit === "kg" ? `${item.qty} kg` : `${item.qty}`;
      const lineTotal = item.price * item.qty;

      const row = document.createElement("div");
      row.className = "cart-item";

      row.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-meta">
          <strong>${item.name}</strong>
          <div class="line">R${item.price.toFixed(2)} ${item.unit === "kg" ? "/ kg" : ""} • ${qtyLabel}</div>
          <div class="line-total">R${lineTotal.toFixed(2)}</div>
        </div>
        <button class="btn-remove" type="button">Remove</button>
      `;

      row.querySelector(".btn-remove").addEventListener("click", () => {
        removeCartItem(item.lineId);
      });

      cartItemsEl.appendChild(row);
    });
  }

  cartCountEl.textContent = cart.length;
  cartTotalEl.textContent = `R${calcCartTotal().toFixed(2)}`;
}

// WhatsApp order summary
function buildOrderSummary() {
  const lines = cart.map((item) => {
    const qtyLabel = item.unit === "kg" ? `${item.qty} kg` : `${item.qty}`;
    const lineTotal = item.price * item.qty;
    return `- ${item.name} (${qtyLabel}) = R${lineTotal.toFixed(2)}`;
  });

  const total = calcCartTotal();

  return `Hi Rozvy Estates, I'd like to place an order:%0A%0A${lines.join(
    "%0A"
  )}%0A%0ASubtotal: R${total.toFixed(2)}%0A%0APlease confirm availability and delivery.`
    // We build a URL-safe string later too, but this keeps it consistent.
    .replace(/%0A/g, "\n");
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  renderCart();
});
