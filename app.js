const WHATSAPP_NUMBER = "27769126465";

const products = [
  {id:1,name:"Goat Meat",price:180,img:"assets/goat-meat.jpg",unit:"kg"},
  {id:2,name:"Prepared Chicken",price:85,img:"assets/prepared-chicken.jpg",unit:"kg"},
  {id:3,name:"Free Range Eggs",price:45,img:"assets/free-range-eggs.jpg",unit:"unit"},
  {id:4,name:"Tilapia Fillets",price:120,img:"assets/tilapia-fillets.jpg",unit:"kg"},
  {id:5,name:"Goat Tripe",price:95,img:"assets/goat-tripe.jpg",unit:"kg"},
  {id:6,name:"Rozvy Raw Honey",price:120,img:"assets/rozvy-raw-honey.jpg",unit:"jar"},
  {id:7,name:"Tilapia Kariba Breams",price:110,img:"assets/tilapia-kariba-breams.jpg",unit:"kg"}
];

let cart=[];

const productsEl=document.getElementById("products");

products.forEach(p=>{
  productsEl.innerHTML+=`
    <div class="product-card">
      <img src="${p.img}">
      <h3>${p.name}</h3>
      <p>R${p.price}.00 per ${p.unit}</p>
      <div class="product-actions">
        <select id="qty-${p.id}">
          ${p.unit==="unit"?`<option>1</option>`:`<option>0.5</option><option>1</option><option>1.5</option>`}
        </select>
        <button onclick="addToCart(${p.id})">Add to cart</button>
      </div>
    </div>
  `;
});

function addToCart(id){
  const p=products.find(x=>x.id===id);
  const qty=document.getElementById(`qty-${id}`).value;
  cart.push({...p,qty});
  updateCart();
}

function updateCart(){
  document.getElementById("cartCount").innerText=cart.length;
  document.getElementById("cartItems").innerHTML=cart.map(i=>`
    <div>${i.name} – ${i.qty}</div>
  `).join("");
  document.getElementById("cartTotal").innerText=
    "R"+cart.reduce((s,i)=>s+i.price*parseFloat(i.qty),0).toFixed(2);
}

function toggleCart(){
  document.getElementById("cartPanel").classList.toggle("open");
  document.getElementById("cartOverlay").classList.toggle("show");
}

function clearCart(){
  cart=[];
  updateCart();
}

function checkout(){
  let msg="Order from Rozvy Estates:%0A";
  cart.forEach(i=>msg+=`${i.name} - ${i.qty}%0A`);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`);
}
