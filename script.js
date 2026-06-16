// ===== State =====
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

// ===== DOM Elements =====
const productGrid = document.getElementById('productGrid');
const loadingText = document.getElementById('loadingText');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');

const cartBtn = document.getElementById('cartBtn');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const closeCart = document.getElementById('closeCart');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const cartCountEl = document.getElementById('cartCount');

const wishlistBtn = document.getElementById('wishlistBtn');
const wishlistSidebar = document.getElementById('wishlistSidebar');
const wishlistOverlay = document.getElementById('wishlistOverlay');
const closeWishlist = document.getElementById('closeWishlist');
const wishlistItemsContainer = document.getElementById('wishlistItems');
const wishlistCountEl = document.getElementById('wishlistCount');

const darkModeBtn = document.getElementById('darkModeBtn');

const checkoutBtn = document.getElementById('checkoutBtn');
const checkoutOverlay = document.getElementById('checkoutOverlay');
const checkoutModal = document.getElementById('checkoutModal');
const closeCheckout = document.getElementById('closeCheckout');
const checkoutForm = document.getElementById('checkoutForm');

const toast = document.getElementById('toast');

// ===== Fetch Products =====
async function fetchProducts() {
  try {
    const res = await fetch('https://fakestoreapi.com/products');
    const data = await res.json();
    products = data;
    loadingText.style.display = 'none';
    renderProducts(products);
  } catch (err) {
    loadingText.textContent = 'Failed to load products. Please refresh.';
    console.error(err);
  }
}

// ===== Render Products =====
function renderProducts(list) {
  productGrid.innerHTML = '';

  if (list.length === 0) {
    productGrid.innerHTML = '<p class="empty-msg">No products found.</p>';
    return;
  }

  list.forEach(product => {
    const isWishlisted = wishlist.some(item => item.id === product.id);

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.title}">
      <h4>${product.title}</h4>
      <div class="price">₹${(product.price * 80).toFixed(0)}</div>
      <div class="rating">⭐ ${product.rating.rate} (${product.rating.count})</div>
      <div class="product-actions">
        <button class="add-cart-btn" data-id="${product.id}">Add to Cart</button>
        <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" data-id="${product.id}">❤️</button>
      </div>
    `;
    productGrid.appendChild(card);
  });
}

// ===== Search / Filter / Sort =====
function applyFilters() {
  let filtered = [...products];

  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(p => p.title.toLowerCase().includes(searchTerm));
  }

  const category = categoryFilter.value;
  if (category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }

  const sortVal = sortFilter.value;
  if (sortVal === 'lowToHigh') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortVal === 'highToLow') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortVal === 'rating') {
    filtered.sort((a, b) => b.rating.rate - a.rating.rate);
  }

  renderProducts(filtered);
}

searchInput.addEventListener('input', applyFilters);
categoryFilter.addEventListener('change', applyFilters);
sortFilter.addEventListener('change', applyFilters);

// ===== Cart Logic =====
function addToCart(id) {
  const product = products.find(p => p.id === id);
  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  saveCart();
  renderCart();
  showToast('Added to cart ✅');
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  renderCart();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(id);
  } else {
    saveCart();
    renderCart();
  }
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function renderCart() {
  cartItemsContainer.innerHTML = '';

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="empty-msg">Your cart is empty.</p>';
  } else {
    cart.forEach(item => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <img src="${item.image}" alt="${item.title}">
        <div class="cart-item-info">
          <h5>${item.title.substring(0, 30)}...</h5>
          <div>₹${(item.price * 80).toFixed(0)} x ${item.qty}</div>
          <div class="qty-controls">
            <button class="decrease" data-id="${item.id}">-</button>
            <span>${item.qty}</span>
            <button class="increase" data-id="${item.id}">+</button>
          </div>
        </div>
        <button class="remove-item" data-id="${item.id}">✕</button>
      `;
      cartItemsContainer.appendChild(div);
    });
  }

  const total = cart.reduce((sum, item) => sum + item.price * 80 * item.qty, 0);
  cartTotalEl.textContent = total.toFixed(0);

  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCountEl.textContent = count;
}

// ===== Wishlist Logic =====
function toggleWishlist(id) {
  const product = products.find(p => p.id === id);
  const existingIndex = wishlist.findIndex(item => item.id === id);

  if (existingIndex > -1) {
    wishlist.splice(existingIndex, 1);
    showToast('Removed from wishlist 💔');
  } else {
    wishlist.push(product);
    showToast('Added to wishlist ❤️');
  }

  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  renderWishlist();
  applyFilters(); // re-render products to update heart icon state
}

function renderWishlist() {
  wishlistItemsContainer.innerHTML = '';

  if (wishlist.length === 0) {
    wishlistItemsContainer.innerHTML = '<p class="empty-msg">Your wishlist is empty.</p>';
  } else {
    wishlist.forEach(item => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <img src="${item.image}" alt="${item.title}">
        <div class="cart-item-info">
          <h5>${item.title.substring(0, 30)}...</h5>
          <div>₹${(item.price * 80).toFixed(0)}</div>
        </div>
        <button class="remove-item" data-id="${item.id}">✕</button>
      `;
      wishlistItemsContainer.appendChild(div);
    });
  }

  wishlistCountEl.textContent = wishlist.length;
}

// ===== Event Delegation for Product Grid =====
productGrid.addEventListener('click', (e) => {
  const id = parseInt(e.target.dataset.id);
  if (!id) return;

  if (e.target.classList.contains('add-cart-btn')) {
    addToCart(id);
  } else if (e.target.classList.contains('wishlist-btn')) {
    toggleWishlist(id);
  }
});

// ===== Event Delegation for Cart Items =====
cartItemsContainer.addEventListener('click', (e) => {
  const id = parseInt(e.target.dataset.id);
  if (!id) return;

  if (e.target.classList.contains('increase')) {
    changeQty(id, 1);
  } else if (e.target.classList.contains('decrease')) {
    changeQty(id, -1);
  } else if (e.target.classList.contains('remove-item')) {
    removeFromCart(id);
  }
});

// ===== Event Delegation for Wishlist Items =====
wishlistItemsContainer.addEventListener('click', (e) => {
  const id = parseInt(e.target.dataset.id);
  if (!id) return;

  if (e.target.classList.contains('remove-item')) {
    toggleWishlist(id);
  }
});

// ===== Cart Sidebar Toggle =====
cartBtn.addEventListener('click', () => {
  cartSidebar.classList.add('open');
  cartOverlay.classList.add('show');
});

function closeCartSidebar() {
  cartSidebar.classList.remove('open');
  cartOverlay.classList.remove('show');
}

closeCart.addEventListener('click', closeCartSidebar);
cartOverlay.addEventListener('click', closeCartSidebar);

// ===== Wishlist Sidebar Toggle =====
wishlistBtn.addEventListener('click', () => {
  wishlistSidebar.classList.add('open');
  wishlistOverlay.classList.add('show');
});

function closeWishlistSidebar() {
  wishlistSidebar.classList.remove('open');
  wishlistOverlay.classList.remove('show');
}

closeWishlist.addEventListener('click', closeWishlistSidebar);
wishlistOverlay.addEventListener('click', closeWishlistSidebar);

// ===== Dark Mode =====
function applyDarkModePreference() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) {
    document.body.classList.add('dark-mode');
    darkModeBtn.textContent = '☀️';
  }
}

darkModeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);
  darkModeBtn.textContent = isDark ? '☀️' : '🌙';
});

// ===== Checkout Modal =====
checkoutBtn.addEventListener('click', () => {
  if (cart.length === 0) {
    showToast('Your cart is empty!');
    return;
  }
  closeCartSidebar();
  checkoutModal.classList.add('show');
  checkoutOverlay.classList.add('show');
});

function closeCheckoutModal() {
  checkoutModal.classList.remove('show');
  checkoutOverlay.classList.remove('show');
}

closeCheckout.addEventListener('click', closeCheckoutModal);
checkoutOverlay.addEventListener('click', closeCheckoutModal);

checkoutForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const phone = document.getElementById('custPhone').value;
  if (!/^\d{10}$/.test(phone)) {
    showToast('Enter a valid 10-digit phone number');
    return;
  }

  // Simulate order placement
  cart = [];
  saveCart();
  renderCart();
  closeCheckoutModal();
  checkoutForm.reset();
  showToast('Order placed successfully! 🎉');
});

// ===== Toast Notification =====
let toastTimeout;
function showToast(message) {
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// ===== Init =====
applyDarkModePreference();
renderCart();
renderWishlist();
fetchProducts();