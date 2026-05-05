let cart = JSON.parse(localStorage.getItem("cart")) || [];
let selectedProduct = {}, currentStock = 0, rating = 0, avatarDataURL = null, selectedGender = '';

// ========================
// AUTO SCROLL REVIEWS
// ========================
let autoScrollInterval = null;
let isHoveringReview = false;
let isManualScrolling = false;
let manualScrollTimeout = null;
let isResetting = false;

function startAutoScroll() {
  if (autoScrollInterval) clearInterval(autoScrollInterval);

  const el = document.getElementById('review-list');
  if (!el) return;

  autoScrollInterval = setInterval(() => {
    if (isHoveringReview || isManualScrolling || isResetting) return;

    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;

    if (atBottom) {
      // Set flag dulu biar interval berhenti ganggu
      isResetting = true;
      // Langsung lompat ke atas tanpa animasi, biar ga kedut
      el.scrollTop = 0;
      // Kasih jeda sebentar baru lanjut scroll lagi
      setTimeout(() => {
        isResetting = false;
      }, 600);
    } else {
      el.scrollBy({ top: 1, behavior: 'auto' });
    }
  }, 20);
}

function stopAutoScroll() {
  if (autoScrollInterval) {
    clearInterval(autoScrollInterval);
    autoScrollInterval = null;
  }
}

function setupReviewScrollListeners() {
  const el = document.getElementById('review-list');
  if (!el) return;

  // Pause saat kursor masuk ke area review
  el.addEventListener('mouseenter', () => {
    isHoveringReview = true;
  });

  // Lanjut saat kursor keluar
  el.addEventListener('mouseleave', () => {
    isHoveringReview = false;
  });

  // Deteksi scroll manual (touch atau mouse wheel)
  el.addEventListener('wheel', () => {
    isManualScrolling = true;
    clearTimeout(manualScrollTimeout);
    manualScrollTimeout = setTimeout(() => {
      isManualScrolling = false;
    }, 2000); // Setelah 2 detik berhenti scroll manual, auto scroll lanjut lagi
  });

  el.addEventListener('touchmove', () => {
    isManualScrolling = true;
    clearTimeout(manualScrollTimeout);
    manualScrollTimeout = setTimeout(() => {
      isManualScrolling = false;
    }, 2000);
  });
}

// ========================
// LIVE REVIEW POLLING
// ========================
let lastReviewCount = 0;
let reviewPollingInterval = null;

function startLiveReviewPolling() {
  if (reviewPollingInterval) clearInterval(reviewPollingInterval);
  reviewPollingInterval = setInterval(() => {
    const list = loadReviews();
    if (list.length !== lastReviewCount) {
      lastReviewCount = list.length;
      renderAllReviews();
    }
  }, 3000);
}

function stopLiveReviewPolling() {
  if (reviewPollingInterval) {
    clearInterval(reviewPollingInterval);
    reviewPollingInterval = null;
  }
}

// PAGE
function showPage(id) {
  document.querySelectorAll('.page, #reviews-section').forEach(p => p.classList.remove('active'));
  const el = id === 'comments' ? 'reviews-section' : id;
  document.getElementById(el).classList.add('active');

  if (id === 'comments') {
    renderAllReviews();
    lastReviewCount = loadReviews().length;
    startLiveReviewPolling();
    // Setup listener scroll dan mulai auto scroll setelah render
    setTimeout(() => {
      setupReviewScrollListeners();
      startAutoScroll();
    }, 100);
  } else {
    stopLiveReviewPolling();
    stopAutoScroll();
  }
}

function goToProduct(id) {
  showPage('products');
  setTimeout(() => document.getElementById(id).scrollIntoView({behavior:"smooth", block:"center"}), 200);
}

window.onload = () => { showPage('home'); renderCart(); };

// MODAL
function openProduct(name, price, stock) {
  currentStock = stock;
  selectedProduct = { name, price, image: event.target.src };
  document.getElementById('pName').innerText = name;
  document.getElementById('pPrice').innerText = "IDR " + price.toLocaleString();
  document.getElementById('pStock').innerText = "Stock: " + stock;
  document.getElementById('qty').value = 1;
  document.getElementById('modal').style.display = "block";
}

function closeModal() { document.getElementById('modal').style.display = "none"; }

// TOAST
function showToast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg; t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
}

// CART
function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); }

function addSelectedToCart() {
  const size = document.querySelector("#modal select").value;
  const qty = parseInt(document.getElementById("qty").value);
  if (qty > currentStock) return showToast("Stock tidak cukup 😭");
  const existing = cart.find(i => i.name === selectedProduct.name && i.size === size);
  if (existing) existing.qty += qty;
  else cart.push({ ...selectedProduct, size, qty, checked: true });
  saveCart(); renderCart(); showToast("Added to cart 🛒"); closeModal();
}

function buySelectedNow() {
  const size = document.querySelector("#modal select").value;
  const qty = parseInt(document.getElementById("qty").value);
  if (qty > currentStock) return showToast("Stock tidak cukup 😭");
  cart = [{ ...selectedProduct, size, qty, checked: true }];
  saveCart(); renderCart(); showPage('cart'); closeModal();
}

function renderCart() {
  const container = document.getElementById("cartItems");
  if (!container) return;
  let total = 0, totalQty = 0, html = "";
  cart.forEach((item, i) => {
    if (item.checked) total += item.price * item.qty;
    totalQty += item.qty;
    html += `
      <div class="cart-item">
        <input type="checkbox" ${item.checked ? "checked" : ""} onchange="toggleItem(${i})">
        <img src="${item.image}" class="cart-img">
        <div class="cart-info"><p><b>${item.name}</b></p><p>Size: ${item.size}</p><p>IDR ${item.price.toLocaleString()}</p></div>
        <div class="cart-actions">
          <div class="qty">
            <button onclick="changeQty(${i},-1)">-</button><span>${item.qty}</span><button onclick="changeQty(${i},1)">+</button>
          </div>
          <button onclick="removeItem(${i})">🗑️</button>
        </div>
      </div>`;
  });
  container.innerHTML = html;
  document.getElementById("totalPrice").innerText = "Total: IDR " + total.toLocaleString();
  document.getElementById("cartCount").innerText = totalQty;
  saveCart();
}

function changeQty(i, d) { cart[i].qty = Math.max(1, cart[i].qty + d); renderCart(); }
function removeItem(i) { cart.splice(i, 1); renderCart(); }
function toggleItem(i) { cart[i].checked = !cart[i].checked; renderCart(); }

// FILTER
function filterProduct(category) {
  document.querySelectorAll('.product-container .card').forEach(card => {
    card.style.display = (category === 'all' || card.dataset.category === category) ? "block" : "none";
  });
}

// CHECKOUT
function checkoutCart() {
  if (!cart.length) return showToast("Cart kosong 😭");
  showPage('checkoutForm');
}

function processCheckout(e) {
  e.preventDefault();
  const name = document.getElementById("custName").value;
  const address = document.getElementById("custAddress").value;
  const phone = document.getElementById("custNumber").value;
  const payment = document.getElementById("custPayment").value;
  let total = 0, itemsHTML = "", remainingCart = [];
  cart.forEach(item => {
    if (item.checked) {
      total += item.price * item.qty;
      itemsHTML += `<p>${item.name} - Size ${item.size} (${item.qty}x) — IDR ${(item.price * item.qty).toLocaleString()}</p>`;
    } else remainingCart.push(item);
  });
  const orderId = "ML" + Date.now().toString().slice(-6);
  const orderDate = new Date().toLocaleDateString("id-ID", {day:"2-digit", month:"long", year:"numeric"});
  document.getElementById("receiptBox").innerHTML = `
    <h3>Maison Lune 💗</h3><img src="store.jpeg" class="receipt-banner">
    <div class="receipt-meta"><p>Order ID: ${orderId}</p><p>Date: ${orderDate}</p></div>
    <p><b>Name:</b> ${name}</p><p><b>Address:</b> ${address}</p>
    <p><b>Phone:</b> ${phone}</p><p><b>Payment:</b> ${payment}</p>
    <hr>${itemsHTML}<hr><h3>Total: IDR ${total.toLocaleString()}</h3>`;
  showPage('receiptPage');
  cart = remainingCart; saveCart(); renderCart();
}

// DOWNLOAD PDF
async function downloadReceipt() {
  const { jsPDF } = window.jspdf;
  const canvas = await html2canvas(document.getElementById("receiptBox"), { scale: 2 });
  const pdf = new jsPDF("p","mm","a4");
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 10, 10, 190, canvas.height * 190 / canvas.width);
  pdf.save("MaisonLune_Receipt.pdf");
}

// SLIDER
function slide(btn, dir) {
  const imgs = btn.parentElement.querySelectorAll("img");
  let i = [...imgs].findIndex(img => img.classList.contains("active"));
  imgs[i].classList.remove("active");
  imgs[(i + dir + imgs.length) % imgs.length].classList.add("active");
}

// REVIEWS
function saveReviews(list) { localStorage.setItem('reviews', JSON.stringify(list)); }
function loadReviews() {
  try { return JSON.parse(localStorage.getItem('reviews') || '[]').filter(r => r?.name && r?.text); }
  catch(e) { return []; }
}

function reviewHTML(r, i) {
  const avatar = (r.emo?.startsWith('data:image'))
    ? `<img src="${r.emo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
    : r.name.charAt(0).toUpperCase();
  const stars = Array.from({length:5}, (_,j) => `<span class="s ${j < r.rating ? 'filled' : 'empty'}">★</span>`).join('');
  return `
    <div class="review-item">
      <div class="avatar">${avatar}</div>
      <div class="review-content">
        <div class="review-meta">
          <span class="reviewer-name">${r.name}</span>
          ${r.kelamin ? `<span class="reviewer-kelamin">${r.kelamin}</span>` : ''}
          <div class="stars-display">${stars}</div>
          <span class="review-time">${r.time}</span>
        </div>
        <div class="review-text">${r.text}</div>
      </div>
      <button class="delete-btn" onclick="deleteReview(${i})">🗑️</button>
    </div>`;
}

function renderAllReviews() {
  const el = document.getElementById('review-list');
  if (!el) return;
  el.innerHTML = loadReviews().map(reviewHTML).join('');
}

function deleteReview(i) {
  const list = loadReviews();
  list.splice(i, 1);
  saveReviews(list);
  lastReviewCount = list.length;
  renderAllReviews();
}

// GENDER SELECTION
function selectGender(gender, btn) {
  selectedGender = gender;
  document.getElementById('inp-kelamin').value = gender;
  document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

// STAR RATING
function hov(v) { document.querySelectorAll('.sp').forEach((b,i) => b.classList.toggle('hover', i < v)); }
function unhov() { document.querySelectorAll('.sp').forEach((b,i) => { b.classList.remove('hover'); b.classList.toggle('active', i < rating); }); }
function setRating(v) { rating = v; document.querySelectorAll('.sp').forEach((b,i) => b.classList.toggle('active', i < v)); }

function updChar() { document.getElementById('cc').textContent = document.getElementById('inp-comment').value.length; }

function submitReview() {
  const name = document.getElementById('inp-name').value.trim();
  const kelamin = document.getElementById('inp-kelamin').value.trim();
  const txt = document.getElementById('inp-comment').value.trim();
  if (!name) return alert('Tulis nama kamu dulu! 😊');
  if (!kelamin) return alert('Pilih gender dulu! 😊');
  if (!rating) return alert('Pilih rating bintang dulu! ⭐');
  if (!txt) return alert('Tulis komentarnya dulu! 💬');

  const now = new Date();
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2,'0')).join(':');

  const list = loadReviews();
  list.push({ name, kelamin, rating, text: txt, time, emo: avatarDataURL });
  saveReviews(list);
  lastReviewCount = list.length;

  // Render ulang dan scroll ke bawah ke review terbaru
  renderAllReviews();
  const el = document.getElementById('review-list');
  if (el) {
    isManualScrolling = false;
    setTimeout(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, 50);
  }

  document.getElementById('inp-name').value = '';
  document.getElementById('inp-kelamin').value = '';
  document.getElementById('inp-comment').value = '';
  document.getElementById('cc').textContent = '0';
  rating = 0;
  selectedGender = '';
  avatarDataURL = null;
  document.getElementById('avatar-preview').innerHTML = '+';
  document.querySelectorAll('.sp').forEach(b => b.classList.remove('active','hover'));
  document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('selected'));
  showToast('Review terkirim! 💕');
}

// AVATAR
function previewAvatar(input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    avatarDataURL = e.target.result;
    document.getElementById('avatar-preview').innerHTML = `<img src="${avatarDataURL}">`;
  };
  reader.readAsDataURL(input.files[0]);
}

document.getElementById('avatar-preview').addEventListener('click', () => document.getElementById('avatar-input').click());

renderAllReviews();

window.addEventListener('storage', () => {
  const list = loadReviews();
  lastReviewCount = list.length;
  renderAllReviews();
});