// app.js
// Checkout: if no gateway URL yet, we send the order to WhatsApp as checkout fallback.
const CHECKOUT_URL = "";
const WHATSAPP_NUMBER = "27827649996";

// Products
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
const toastEl = document.getElementById("toast");

const cartToggleBtn = document.querySelector(".cart-toggle");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".btn-clear");
const checkoutBtn = document.querySelector(".btn-checkout");

// Cart
let cart = JSON.parse(localStorage.getItem("rozvy_cart") || "[]");

// ---------- Helpers ----------
function money(n){ return `R${Number(n).toFixed(2)}`; }

function showToast(msg="Added to cart ✅"){
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(()=> toastEl.classList.remove("show"), 1200);
}

// ---------- Events ----------
cartToggleBtn.addEventListener("click", () => {
  cartOverlayEl.classList.remove("hidden");
});

closeCartBtn.addEventListener("click", () => {
  cartOverlayEl.classList.add("hidden");
});

cartOverlayEl.addEventListener("click", (e) => {
  if (e.target === cartOverlayEl) cartOverlayEl.classList.add("hidden");
});

clearCartBtn.addEventListener("click", () => {
  cart = [];
  saveCart();
  renderCart();
  showToast("Cart cleared");
});

checkoutBtn.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  const summary = buildOrderSummary();
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(summary)}`;

  if (!CHECKOUT_URL) {
    window.open(waUrl, "_blank", "noopener,noreferrer");
    return;
  }

  window.location.href = CHECKOUT_URL;
});

// ---------- Products ----------
function renderProducts(){
  productListEl.innerHTML = "";

  PRODUCTS.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";

    const optionsHTML = p.qtyOptions.map((q) => {
      const label = p.unit === "kg" ? `${q} kg` : `${q}`;
      return `<option value="${q}">${label}</option>`;
    }).join("");

    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <div class="price">${money(p.price)} ${p.unit === "kg" ? "per kg" : "per unit"}</div>

      <div class="product-actions">
        <select aria-label="Select quantity">${optionsHTML}</select>
        <button type="button" class="add-btn">Add to cart</button>
      </div>
    `;

    const qtySelect = card.querySelector("select");
    const addBtn = card.querySelector(".add-btn");

    addBtn.addEventListener("click", () => {
      const qty = Number(qtySelect.value);
      addToCart(p, qty);

      // Button micro-animation
      addBtn.textContent = "Added ✅";
      addBtn.style.filter = "brightness(1.05)";
      setTimeout(() => {
        addBtn.textContent = "Add to cart";
        addBtn.style.filter = "none";
      }, 850);

      showToast(`${p.name} added ✅`);
    });

    productListEl.appendChild(card);
  });

  // Animate cards in-view
  setupCardAnimations();
}

function setupCardAnimations(){
  const cards = document.querySelectorAll(".product-card");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting){
        entry.target.classList.add("in-view");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  cards.forEach(c => io.observe(c));
}

// ---------- Cart ----------
function addToCart(product, qty){
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

function removeCartItem(lineId){
  cart = cart.filter(i => i.lineId !== lineId);
  saveCart();
  renderCart();
}

function calcCartTotal(){
  return cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
}

function saveCart(){
  localStorage.setItem("rozvy_cart", JSON.stringify(cart));
}

function renderCart(){
  cartItemsEl.innerHTML = "";

  if (cart.length === 0){
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
          <div class="line">${money(item.price)} ${item.unit === "kg" ? "/ kg" : ""} • ${qtyLabel}</div>
          <div class="line-total">${money(lineTotal)}</div>
        </div>
        <button class="btn-remove" type="button">Remove</button>
      `;

      row.querySelector(".btn-remove").addEventListener("click", () => {
        removeCartItem(item.lineId);
        showToast("Removed");
      });

      cartItemsEl.appendChild(row);
    });
  }

  cartCountEl.textContent = cart.length;
  cartTotalEl.textContent = money(calcCartTotal());
}

function buildOrderSummary(){
  const lines = cart.map((item) => {
    const qtyLabel = item.unit === "kg" ? `${item.qty} kg` : `${item.qty}`;
    const lineTotal = item.price * item.qty;
    return `- ${item.name} (${qtyLabel}) = ${money(lineTotal)}`;
  });

  return `Hi Rozvy Estates, I'd like to place an order:\n\n${lines.join("\n")}\n\nSubtotal: ${money(calcCartTotal())}\n\nPlease confirm availability and delivery.`;
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  renderCart();
});
