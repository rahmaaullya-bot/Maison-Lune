
// ===== GLOBAL =====
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let selectedProduct = {};
let currentStock = 0;

// ===== PAGE =====
function showPage(id) {
  document.querySelectorAll('.page, #reviews-section').forEach(p => p.classList.remove('active'));

  if (id === 'comments') {
    document.getElementById('reviews-section').classList.add('active');
    renderAllReviews();
    startAutoScroll();
  } else {
    document.getElementById(id).classList.add('active');
  }
}

function goToProduct(id){
    showPage('products');

    setTimeout(()=>{
        document.getElementById(id)
        .scrollIntoView({behavior:"smooth", block:"center"});
    },200);
}

// ===== ON LOAD =====
window.onload = function(){
    showPage('home');
    renderCart();
}

// ===== MODAL PRODUCT =====
function openProduct(name, price, stock){
    currentStock = stock;

    // ambil src gambar yang diklik
    const image = event.target.src;

    selectedProduct = {
        name: name,
        price: price,
        image: image
    };

    document.getElementById('pName').innerText = name;
    document.getElementById('pPrice').innerText = "IDR " + price.toLocaleString();
    document.getElementById('pStock').innerText = "Stock: " + stock;

    document.getElementById('qty').value = 1;
    document.getElementById('modal').style.display = "block";
}

function closeModal(){
    document.getElementById('modal').style.display = "none";
}

// ===== TOAST =====
function showToast(msg){
    let t=document.getElementById("toast");
    t.innerText=msg;
    t.classList.add("show");
    setTimeout(()=>{t.classList.remove("show");},2000);
}

// ===== CART =====
function saveCart(){
    localStorage.setItem("cart", JSON.stringify(cart));
}

function addSelectedToCart(){
    let size = document.querySelector("#modal select").value;
    let qty = parseInt(document.getElementById("qty").value);

    if(qty > currentStock){
        showToast("Stock tidak cukup 😭");
        return;
    }

    let existing = cart.find(item => 
        item.name === selectedProduct.name && 
        item.size === size
    );

    if(existing){
        if(existing.qty + qty > currentStock){
            showToast("Stock tidak cukup 😭");
            return;
        }
        existing.qty += qty;
    }else{
        cart.push({
            name: selectedProduct.name,
            price: selectedProduct.price,
            size: size,
            qty: qty,
            image: selectedProduct.image,
            checked:true
        });
    }

    saveCart();
    renderCart();
    showToast("Added to cart 🛒");
    closeModal();
}

function buySelectedNow(){
    let size = document.querySelector("#modal select").value;
    let qty = parseInt(document.getElementById("qty").value);

    if(qty > currentStock){
        showToast("Stock tidak cukup 😭");
        return;
    }

    cart = [{
        name: selectedProduct.name,
        price: selectedProduct.price,
        size: size,
        qty: qty,
        image: selectedProduct.image,
        checked:true
    }];

    saveCart();
    renderCart();
    showPage('cart');
    closeModal();
}

// ===== RENDER CART =====
function renderCart(){
    let container = document.getElementById("cartItems");
    if(!container) return;

    container.innerHTML = "";
    let total = 0;

    cart.forEach((item, index)=>{
        if(item.checked){
            total += item.price * item.qty;
        }

        container.innerHTML += `
<div class="cart-item">

<input type="checkbox" ${item.checked ? "checked" : ""} 
onchange="toggleItem(${index})">

<img src="${item.image}" class="cart-img">

<div class="cart-info">
    <p><b>${item.name}</b></p>
    <p>Size: ${item.size}</p>
    <p>IDR ${item.price.toLocaleString()}</p>
</div>

<div class="cart-actions">
    <div class="qty">
        <button onclick="changeQty(${index}, -1)">-</button>
        <span>${item.qty}</span>
        <button onclick="changeQty(${index}, 1)">+</button>
    </div>

    <button onclick="removeItem(${index})">🗑️</button>
</div>

</div>
`;
    });

    document.getElementById("totalPrice").innerText =
        "Total: IDR " + total.toLocaleString();

let totalQty = 0;

cart.forEach(item=>{
    totalQty += item.qty;
});

document.getElementById("cartCount").innerText = totalQty;

    saveCart();
}

function changeQty(index, change){
    let newQty = cart[index].qty + change;

    if(newQty < 1) newQty = 1;

    if(newQty > currentStock){
        showToast("Stock tidak cukup 😭");
        return;
    }

    cart[index].qty = newQty;
    renderCart();
}

function removeItem(index){
    cart.splice(index,1);
    renderCart();
}

function toggleItem(index){
    cart[index].checked = !cart[index].checked;
    renderCart();
}

// ===== FILTER PRODUCTS =====
function filterProduct(category){
    document.querySelectorAll('.product-container .card').forEach(card=>{
        if(category === 'all' || card.dataset.category === category){
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

// ===== CHECKOUT =====
function checkoutCart(){
    if(cart.length === 0){
        showToast("Cart kosong 😭");
        return;
    }
    showPage('checkoutForm');
}

// ===== PROCESS CHECKOUT =====
function processCheckout(e){
    e.preventDefault();

    let name = document.getElementById("custName").value;
    let address = document.getElementById("custAddress").value;
    let phone = document.getElementById("custNumber").value;
    let payment = document.getElementById("custPayment").value;

    let total = 0;
    let itemsHTML = "";

    let remainingCart = [];

    cart.forEach(item=>{
        if(item.checked){
            total += item.price * item.qty;

            itemsHTML += `
            <p>${item.name} - Size ${item.size} (${item.qty}x)</p>
            <p>IDR ${(item.price * item.qty).toLocaleString()}</p>
            `;
        }else{
            remainingCart.push(item);
        }
    });

    let orderId = "ML" + Date.now().toString().slice(-6);

let date = new Date();
let orderDate = date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
});

    document.getElementById("receiptBox").innerHTML = `
        <h3>Maison Lune 💗</h3>
<img src="store.jpeg" class="receipt-banner">

<div class="receipt-meta">
    <p>Order ID : ${orderId}</p>
    <p>Date : ${orderDate}</p>
</div>


        <p><b>Name:</b> ${name}</p>
        <p><b>Address:</b> ${address}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Payment:</b> ${payment}</p>

        <hr>
        ${itemsHTML}
        <hr>

        <h3>Total: IDR ${total.toLocaleString()}</h3>
    `;

showPage('orderProcess');

document.getElementById("orderStatus").innerText =
"Processing order...";
setTimeout(()=>{
    showPage('receiptPage');
},1200);

    cart = remainingCart; // ← cuma sisa yg ga dicentang
    saveCart();
    renderCart();
}
// ===== DOWNLOAD PDF =====
async function downloadReceipt(){
    const { jsPDF } = window.jspdf;

    let element = document.getElementById("receiptBox");

    let canvas = await html2canvas(element, { scale: 2 });
    let imgData = canvas.toDataURL("image/png");

    let pdf = new jsPDF("p","mm","a4");

    let imgWidth = 190;
    let imgHeight = canvas.height * imgWidth / canvas.width;

    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save("MaisonLune_Receipt.pdf");
}

function slide(btn, dir){
const slider = btn.parentElement;
const imgs = slider.querySelectorAll("img");

let index = 0;

imgs.forEach((img,i)=>{
if(img.classList.contains("active")) index = i;
img.classList.remove("active");
});

index += dir;

if(index < 0) index = imgs.length-1;
if(index >= imgs.length) index = 0;

imgs[index].classList.add("active");
}

let rating = 0;
let userScrolling = false;
let scrollTimer = null;

// ── Storage ──
function saveReviews(list) {
  localStorage.setItem('reviews', JSON.stringify(list));
}

function loadReviews() {
  try {
    const data = JSON.parse(localStorage.getItem('reviews') || '[]');
    // Buang data lama yang rusak/undefined
    return data.filter(r => r && r.name && r.text && r.time && r.emo && r.rating);
  } catch(e) {
    localStorage.removeItem('reviews');
    return [];
  }
}

// ── Render ──
function starHTML(n) {
  return Array.from({length:5}, (_,i) =>
    `<span class="s ${i < n ? 'filled' : 'empty'}">★</span>`
  ).join('');
}

function reviewItemHTML(r, index) {
  let avatarContent;

  if (r.emo && r.emo.startsWith('data:image')) {
    avatarContent = `<img src="${r.emo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  } else {
    avatarContent = r.name.charAt(0).toUpperCase();
  }

  return `
    <div class="review-item">
      <div class="avatar">${avatarContent}</div>
      <div class="review-content">
        <div class="review-meta">
          <span class="reviewer-name">${r.name}</span>
          <div class="stars-display">${starHTML(r.rating)}</div>
          <span class="review-time">${r.time}</span>
        </div>
        <div class="review-text">${r.text}</div>
      </div>
      <button class="delete-btn" onclick="deleteReview(${index})">🗑️</button>
    </div>`;
}

function deleteReview(index) {
  const list = loadReviews();
  list.splice(index, 1);
  saveReviews(list);
  renderAllReviews();
}

function renderAllReviews() {
  const list = loadReviews();
  saveReviews(list);
  const el = document.getElementById('review-list');
  if (el) el.innerHTML = list.map((r, i) => reviewItemHTML(r, i)).join('');
}

function startAutoScroll() {
  const el = document.getElementById('review-list');
  let pos = 0;
  let animId = null;

  el.addEventListener('mouseenter', () => {
    userScrolling = true;
    cancelAnimationFrame(animId);
  });

  el.addEventListener('mouseleave', () => {
    userScrolling = false;
    animate();
  });

  el.addEventListener('touchstart', () => { userScrolling = true; cancelAnimationFrame(animId); });
  el.addEventListener('touchend', () => {
    setTimeout(() => { userScrolling = false; animate(); }, 2000);
  });

  function animate() {
    if (userScrolling) return;

    pos += 0.5; // makin kecil = makin lambat, makin besar = makin cepat

    if (pos >= el.scrollHeight - el.clientHeight) {
      pos = 0;
    }

    el.scrollTop = pos;
    animId = requestAnimationFrame(animate);
  }

  animate();
}

  setInterval(() => {
    if (userScrolling) return;

    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 1;

    if (atBottom) {
      // Udah di bawah, balik ke atas pelan-pelan
      el.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      el.scrollBy({ top: 1, behavior: 'instant' });
    }
  }, 30);


// ── Star rating ──
function hov(v) {
  document.querySelectorAll('.sp').forEach((b, i) => {
    b.classList.remove('active');
    b.classList.toggle('hover', i < v);
  });
}

function unhov() {
  document.querySelectorAll('.sp').forEach((b, i) => {
    b.classList.remove('hover');
    b.classList.toggle('active', i < rating);
  });
}

function setRating(v) {
  rating = v;
  document.querySelectorAll('.sp').forEach((b, i) => {
    b.classList.toggle('active', i < v);
    b.classList.remove('hover');
  });
}

// ── Char counter ──
function updChar() {
  document.getElementById('cc').textContent =
    document.getElementById('inp-comment').value.length;
}

// ── Submit ──
function submitReview() {
  const name = document.getElementById('inp-name').value.trim();
  const txt  = document.getElementById('inp-comment').value.trim();

  if (!name)   { alert('Tulis nama kamu dulu ya! 😊'); return; }
  if (!rating) { alert('Pilih rating bintangnya dulu! ⭐'); return; }
  if (!txt)    { alert('Tulis komentarnya dulu ya! 💬'); return; }

  const now = new Date();
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map(n => String(n).padStart(2, '0')).join(':');

  const r = {
  name, rating, text: txt, time,
  emo: avatarDataURL ? avatarDataURL : null
};

  // Simpan ke localStorage
  const list = loadReviews();
  list.unshift(r); // taruh paling atas
  saveReviews(list);

  // Tampilin langsung tanpa render ulang semua
  document.getElementById('review-list')
    .insertAdjacentHTML('afterbegin', reviewItemHTML(r));

  // Reset form
  document.getElementById('inp-name').value    = '';
  document.getElementById('inp-comment').value = '';
  document.getElementById('cc').textContent    = '0';
  rating = 0;
  document.querySelectorAll('.sp').forEach(b => b.classList.remove('active', 'hover'));

  // Toast
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Init ──
renderAllReviews();
startAutoScroll();

let avatarDataURL = null;

function previewAvatar(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    avatarDataURL = e.target.result; // ini yang penting
    document.getElementById('avatar-preview').innerHTML =
      `<img src="${avatarDataURL}">`;
  };
  reader.readAsDataURL(file);
}

// Biar bisa klik div-nya buat trigger input file
document.getElementById('avatar-preview').addEventListener('click', () => {
  document.getElementById('avatar-input').click();
});