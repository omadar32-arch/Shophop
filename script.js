// ===== ShopHop Unified JavaScript =====

// ---- Store settings (change these in one place) ----
const CURRENCY = 'EGP';
const TAX_RATE = 0.10;               // 10% tax
const FREE_SHIPPING_FROM = 5000;     // free shipping at or above this subtotal
const SHIPPING_FEE = 100;            // otherwise this flat fee
const PROMO_CODES = { SAVE10: 0.10 }; // code -> discount rate

// ---- Product data (single source of truth for every page) ----

const products = [
    {id: 1,  name: 'Professional Blender', price: 8999,  category: 'kitchen',       image: 'blender.jpeg',   rating: 4.5, desc: '1000W motor with 6 speed settings',
     features: ['1000W powerful motor', '6 speed settings', 'Large BPA-free pitcher', 'Easy-clean parts']},
    {id: 2,  name: 'Standing Fan',         price: 5999,  category: 'cooling',       image: 'fan.jpeg',       rating: 4.0, desc: '3 speed settings with oscillation',
     features: ['3 speed settings', 'Oscillation', 'Adjustable height', 'Stable round base']},
    {id: 3,  name: 'Water Dispenser',      price: 12999, category: 'kitchen',       image: 'dispenser.jpeg',  rating: 5.0, desc: 'Hot and cold water with child lock',
     features: ['Hot and cold water', 'Child safety lock', 'Compact design']},
    {id: 4,  name: 'Microwave Oven',       price: 19999, category: 'kitchen',       image: 'microwave.jpeg', rating: 4.3, desc: '900W with 10 power levels',
     features: ['900W power', '10 power levels', 'Digital display', 'Dial control']},
    {id: 5,  name: 'Vacuum Cleaner',       price: 29999, category: 'cleaning',      image: 'vacuum.jpeg',    rating: 4.2, desc: 'Bagless with HEPA filter',
     features: ['HEPA filtration', 'Bagless design', 'Rotary power dial', 'Floor and crevice nozzles']},
    {id: 6,  name: 'Air Fryer',            price: 44999, category: 'kitchen',       image: 'fryer.jpeg',     rating: 4.6, desc: '5.3QT capacity with digital controls',
     features: ['5.3QT capacity', 'Digital touch controls', 'Preset cooking modes', 'Temperature display']},
    {id: 7,  name: 'Air Conditioner',      price: 89999, category: 'cooling',       image: 'ac.svg',         rating: 4.4, desc: '12000 BTU with remote control',
     features: ['12000 BTU cooling', 'Remote control', 'Sleep mode']},
    {id: 8,  name: 'Washing Machine',      price: 59999, category: 'cleaning',      image: 'washer.jpeg',    rating: 4.7, desc: '8kg capacity with 15 programs',
     features: ['8kg capacity', '15 wash programs', 'Touch control panel', 'Front-loading']},
    {id: 9,  name: 'Smart TV',             price: 79999, category: 'entertainment', image: 'tv.svg',         rating: 4.8, desc: '55" 4K UHD with built-in apps',
     features: ['55" 4K UHD screen', 'Built-in apps', 'Wi-Fi connectivity']},
    {id: 10, name: 'Coffee Maker',         price: 34999, category: 'kitchen',       image: 'coffee.svg',     rating: 4.1, desc: '12-cup programmable with timer',
     features: ['12-cup capacity', 'Programmable timer', 'Keep-warm function']},
    {id: 11, name: 'Steam Mop',            price: 17999, category: 'cleaning',      image: 'mop.svg',        rating: 4.5, desc: 'Chemical-free cleaning with 15 steam jets',
     features: ['Chemical-free cleaning', '15 steam jets', 'Lightweight design']},
    {id: 12, name: 'Sound System',         price: 24999, category: 'entertainment', image: 'speaker.svg',    rating: 4.3, desc: 'Bluetooth speaker with bass boost',
     features: ['Bluetooth connectivity', 'Bass boost', 'Portable design']}
];

// ---- Global state ----
let cartItems = [];
let wishlistItems = [];
let currentTheme = 'light-theme';
let appliedPromo = null;

// ---- Safe localStorage helpers (never crash if storage is blocked or corrupted) ----
function readStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        return fallback;
    }
}
function writeStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
}

// ---- Init (runs once the HTML is ready, then starts the right page logic) ----
document.addEventListener('DOMContentLoaded', function () {
    loadTheme();
    loadCart();
    loadWishlist();
    appliedPromo = readStorage('appliedPromo', null);
    updateCartCount();

    if (document.getElementById('featured-products')) renderFeatured();
    if (document.getElementById('products-container')) initProductsPage();
    if (document.getElementById('product-detail-root')) initProductDetail();
    if (document.getElementById('cart-items-list')) renderCartPage();
    if (document.getElementById('checkout-items')) renderCheckoutSummary();
});

// ===== HELPERS =====
function formatPrice(price) {
    return CURRENCY + ' ' + Math.round(price).toLocaleString('en-US');
}
function getProduct(id) {
    return products.find(p => p.id === Number(id));
}
function starsHTML(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (rating >= i) html += '<i class="fas fa-star"></i>';
        else if (rating >= i - 0.5) html += '<i class="fas fa-star-half-alt"></i>';
        else html += '<i class="far fa-star"></i>';
    }
    return html;
}

// ===== THEME SWITCHING =====
function loadTheme() {
    let saved = null;
    try { saved = localStorage.getItem('selectedTheme'); } catch (e) { /* ignore */ }
    if (saved === 'light-theme' || saved === 'dark-theme') currentTheme = saved;
    document.body.className = currentTheme;
    updateThemeButton();
}

function switchTheme() {
    currentTheme = currentTheme === 'light-theme' ? 'dark-theme' : 'light-theme';
    document.body.className = currentTheme;
    try { localStorage.setItem('selectedTheme', currentTheme); } catch (e) { /* ignore */ }
    updateThemeButton();
}

function updateThemeButton() {
    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');
    if (!icon || !text) return;
    if (currentTheme === 'light-theme') {
        icon.className = 'fas fa-moon';
        text.textContent = 'Dark Mode';
    } else {
        icon.className = 'fas fa-sun';
        text.textContent = 'Light Mode';
    }
}

// ===== CART FUNCTIONS =====
function loadCart() {
    const saved = readStorage('cartItems', []);
    // Rebuild from the product list so old saved items get current name/price/image
    cartItems = saved
        .map(item => {
            const p = getProduct(item.id);
            return p ? {...p, quantity: Math.max(1, Math.min(10, Number(item.quantity) || 1))} : null;
        })
        .filter(Boolean);
}

function saveCart() {
    writeStorage('cartItems', cartItems.map(i => ({id: i.id, quantity: i.quantity})));
}

function addToCart(productId, quantity) {
    const product = getProduct(productId);
    if (!product) return;
    const qty = Math.max(1, Number(quantity) || 1);
    const existing = cartItems.find(item => item.id === product.id);
    if (existing) {
        existing.quantity = Math.min(10, existing.quantity + qty);
    } else {
        cartItems.push({...product, quantity: Math.min(10, qty)});
    }
    saveCart();
    updateCartCount();
    showNotification(product.name + ' added to cart!');
}

function removeFromCart(productId) {
    cartItems = cartItems.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    updateCartDisplay();
    showNotification('Item removed from cart');
}

function updateCartCount() {
    const count = cartItems.reduce((total, item) => total + item.quantity, 0);
    const el = document.getElementById('cart-count');
    if (el) el.textContent = count;
}

function updateCartDisplay() {
    if (document.getElementById('cart-items-list')) renderCartPage();
    if (document.getElementById('checkout-items')) renderCheckoutSummary();
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.setAttribute('role', 'status');
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// ===== TOTALS (used by cart + checkout so numbers always match) =====
function calculateSubtotal() {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
}
function calculateDiscount(subtotal) {
    return appliedPromo && PROMO_CODES[appliedPromo] ? subtotal * PROMO_CODES[appliedPromo] : 0;
}
function calculateTax(amount) {
    return amount * TAX_RATE;
}
function calculateShipping(subtotal) {
    if (subtotal === 0) return 0;
    return subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
}
function getCartTotals() {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount(subtotal);
    const taxable = subtotal - discount;
    const tax = calculateTax(taxable);
    const shipping = calculateShipping(subtotal);
    return {subtotal, discount, tax, shipping, total: taxable + tax + shipping};
}
function calculateTotal() {
    return getCartTotals().total;
}

// ===== WISHLIST FUNCTIONS =====
function loadWishlist() {
    const savedIds = readStorage('wishlistItems', []).map(i => (typeof i === 'object' ? i.id : i));
    wishlistItems = savedIds.map(getProduct).filter(Boolean);
}
function saveWishlist() {
    writeStorage('wishlistItems', wishlistItems.map(i => i.id));
}
function addToWishlist(productId) {
    const product = getProduct(productId);
    if (!product) return;
    if (wishlistItems.find(item => item.id === product.id)) {
        showNotification(product.name + ' is already in your wishlist');
        return;
    }
    wishlistItems.push(product);
    saveWishlist();
    showNotification(product.name + ' added to wishlist!');
}
function removeFromWishlist(productId) {
    wishlistItems = wishlistItems.filter(item => item.id !== productId);
    saveWishlist();
    showNotification('Item removed from wishlist');
}

// ===== HOME PAGE =====
function renderFeatured() {
    const grid = document.getElementById('featured-products');
    grid.innerHTML = [1, 2, 6, 4].map(getProduct).map(p => `
        <div class="product-card" data-id="${p.id}">
            <img src="${p.image}" alt="${p.name}" onclick="viewProduct(${p.id})">
            <h3>${p.name}</h3>
            <p class="price">${formatPrice(p.price)}</p>
            <button class="add-to-cart-btn" onclick="addToCart(${p.id})">Add to Cart</button>
        </div>`).join('');
}

// ===== PRODUCTS PAGE =====
function initProductsPage() {
    const category = new URLSearchParams(window.location.search).get('category');
    const select = document.getElementById('category-filter');
    if (category && select && [...select.options].some(o => o.value === category)) {
        select.value = category;
    }
    renderProducts();
}

function productCardHTML(p) {
    return `
        <div class="product-card" data-id="${p.id}">
            <img src="${p.image}" alt="${p.name}" onclick="viewProduct(${p.id})">
            <div class="product-info">
                <h3>${p.name}</h3>
                <p class="product-desc">${p.desc}</p>
                <div class="product-rating">${starsHTML(p.rating)}<span>(${p.rating.toFixed(1)})</span></div>
                <p class="product-price">${formatPrice(p.price)}</p>
                <div class="product-actions">
                    <button class="btn-primary" onclick="addToCart(${p.id})">Add to Cart</button>
                    <button class="btn-secondary" onclick="viewProduct(${p.id})">View Details</button>
                </div>
            </div>
        </div>`;
}

// Filters + sort together, then redraw (so changing one never undoes the other)
function renderProducts() {
    const container = document.getElementById('products-container');
    const category = document.getElementById('category-filter').value;
    const priceRange = document.getElementById('price-filter').value;
    const sortBy = document.getElementById('sort-filter').value;

    let list = products.filter(p => category === 'all' || p.category === category);

    if (priceRange !== 'all') {
        // "5000-10000" -> min 5000, max 10000;  "50000+" -> min 50000, no max
        let min, max;
        if (priceRange.endsWith('+')) {
            min = parseFloat(priceRange);
            max = Infinity;
        } else {
            [min, max] = priceRange.split('-').map(parseFloat);
        }
        list = list.filter(p => p.price >= min && p.price <= max);
    }

    list = [...list].sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        return a.name.localeCompare(b.name);
    });

    container.innerHTML = list.length
        ? list.map(productCardHTML).join('')
        : '<p class="empty-state">No products match these filters. Try a different category or price range.</p>';
}
function filterProducts() { renderProducts(); }
function sortProducts() { renderProducts(); }

function viewProduct(productId) {
    window.location.href = 'product-detail-new.html?id=' + productId;
}
function viewRelatedProduct(productId) { viewProduct(productId); }
function goToCategory(category) {
    window.location.href = 'products.html?category=' + category;
}

// ===== PRODUCT DETAIL PAGE =====
let currentProduct = null;

function initProductDetail() {
    const id = new URLSearchParams(window.location.search).get('id');
    currentProduct = getProduct(id);
    const root = document.getElementById('product-detail-root');

    if (!currentProduct) {
        root.innerHTML = `
            <div class="empty-state">
                <h2>Product not found</h2>
                <p>This product doesn't exist or was removed.</p>
                <a href="products.html" class="btn-primary">Back to products</a>
            </div>`;
        return;
    }

    const p = currentProduct;
    document.title = p.name + ' - ShopHop';
    document.getElementById('breadcrumb-product').textContent = p.name;

    document.getElementById('main-product-image').src = p.image;
    document.getElementById('main-product-image').alt = p.name;
    const thumbs = document.getElementById('thumbnail-images');
    thumbs.innerHTML = `<img src="${p.image}" alt="${p.name}" class="active" onclick="changeMainImage(this)">`;

    document.getElementById('product-name').textContent = p.name;
    document.getElementById('product-rating').innerHTML = starsHTML(p.rating) + `<span>(${p.rating.toFixed(1)})</span>`;
    document.getElementById('product-description').textContent =
        p.desc + '. Delivered to your door with ShopHop\'s fast and reliable shipping.';
    document.getElementById('product-features').innerHTML =
        p.features.map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('');
    document.getElementById('spec-name').textContent = p.name;
    document.getElementById('spec-category').textContent = p.category.charAt(0).toUpperCase() + p.category.slice(1);
    document.getElementById('spec-summary').textContent = p.desc;

    updatePrice();
    renderRelated();
}

function updatePrice() {
    if (!currentProduct) return;
    const qty = Math.max(1, Math.min(10, parseInt(document.getElementById('quantity').value) || 1));
    const priceEl = document.getElementById('product-price');
    priceEl.textContent = formatPrice(currentProduct.price);
    const totalEl = document.getElementById('product-total');
    if (totalEl) totalEl.textContent = qty > 1 ? 'Total for ' + qty + ': ' + formatPrice(currentProduct.price * qty) : '';
}

function renderRelated() {
    const grid = document.getElementById('related-products');
    if (!grid) return;
    const related = products
        .filter(p => p.id !== currentProduct.id && p.category === currentProduct.category)
        .concat(products.filter(p => p.id !== currentProduct.id && p.category !== currentProduct.category))
        .slice(0, 4);
    grid.innerHTML = related.map(p => `
        <div class="product-card">
            <img src="${p.image}" alt="${p.name}" onclick="viewProduct(${p.id})">
            <h3>${p.name}</h3>
            <p class="price">${formatPrice(p.price)}</p>
            <button class="btn-secondary" onclick="viewProduct(${p.id})">View Details</button>
        </div>`).join('');
}

function changeMainImage(thumbnail) {
    const mainImage = document.getElementById('main-product-image');
    if (mainImage && thumbnail.src) {
        mainImage.src = thumbnail.src;
        document.querySelectorAll('.thumbnail-images img').forEach(img => img.classList.remove('active'));
        thumbnail.classList.add('active');
    }
}

function showTab(tabName, btn) {
    document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const target = document.getElementById(tabName + '-tab');
    if (target) target.classList.add('active');
    if (btn) btn.classList.add('active');
}

function addToCartFromDetail() {
    if (!currentProduct) return;
    const qty = Math.max(1, Math.min(10, parseInt(document.getElementById('quantity').value) || 1));
    addToCart(currentProduct.id, qty);
}

function buyNow() {
    if (!currentProduct) return;
    addToCartFromDetail();
    window.location.href = 'checkout-new.html';
}

function addCurrentToWishlist() {
    if (currentProduct) addToWishlist(currentProduct.id);
}

// ===== CART PAGE =====
function renderCartPage() {
    const list = document.getElementById('cart-items-list');
    const layout = document.getElementById('cart-layout');
    const empty = document.getElementById('cart-empty');

    if (cartItems.length === 0) {
        layout.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    layout.style.display = '';
    empty.style.display = 'none';

    list.innerHTML = cartItems.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="item-details">
                <h3>${item.name}</h3>
                <p class="item-description">${item.desc}</p>
                <p class="item-price">${formatPrice(item.price)}</p>
                <button class="btn-remove" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i> Remove</button>
            </div>
            <div class="item-quantity">
                <input type="number" id="qty-${item.id}" value="${item.quantity}" min="1" max="10"
                       aria-label="Quantity for ${item.name}" onchange="updateCartItem(${item.id})">
            </div>
            <div class="item-subtotal">${formatPrice(item.price * item.quantity)}</div>
        </div>`).join('');

    updateCartTotals();
    const promoInput = document.getElementById('promo-code');
    if (promoInput && appliedPromo) promoInput.value = appliedPromo;
}

function updateCartItem(productId) {
    const input = document.getElementById('qty-' + productId);
    const qty = parseInt(input.value);
    const item = cartItems.find(i => i.id === productId);
    if (!item) return;
    if (qty > 0 && qty <= 10) {
        item.quantity = qty;
        saveCart();
        updateCartCount();
        renderCartPage();
    } else {
        input.value = item.quantity;
        showNotification('Quantity must be between 1 and 10');
    }
}

function updateCartTotals() {
    const t = getCartTotals();
    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    set('cart-subtotal', formatPrice(t.subtotal));
    set('cart-discount', t.discount > 0 ? '-' + formatPrice(t.discount) : formatPrice(0));
    set('cart-tax', formatPrice(t.tax));
    set('cart-shipping', t.shipping === 0 ? 'Free' : formatPrice(t.shipping));
    set('cart-total', formatPrice(t.total));
    const note = document.getElementById('shipping-note');
    if (note) {
        note.textContent = t.subtotal >= FREE_SHIPPING_FROM
            ? 'You get free shipping on this order.'
            : 'Add ' + formatPrice(FREE_SHIPPING_FROM - t.subtotal) + ' more for free shipping.';
    }
}

function proceedToCheckout() {
    if (cartItems.length === 0) {
        showNotification('Your cart is empty');
        return;
    }
    window.location.href = 'checkout-new.html';
}

function continueShopping() {
    window.location.href = 'products.html';
}

function applyPromo() {
    const code = document.getElementById('promo-code').value.trim().toUpperCase();
    const message = document.getElementById('promo-message');
    if (code === '') {
        message.textContent = 'Enter a promo code first';
        message.style.color = '#ff523b';
        return;
    }
    if (PROMO_CODES[code]) {
        appliedPromo = code;
        writeStorage('appliedPromo', code);
        message.textContent = Math.round(PROMO_CODES[code] * 100) + '% discount applied';
        message.style.color = '#4CAF50';
        updateCartTotals();
    } else {
        appliedPromo = null;
        writeStorage('appliedPromo', null);
        message.textContent = 'Invalid promo code';
        message.style.color = '#ff523b';
        updateCartTotals();
    }
}

// ===== CHECKOUT PAGE =====
function renderCheckoutSummary() {
    const box = document.getElementById('checkout-items');
    if (cartItems.length === 0) {
        box.innerHTML = '<p>Your cart is empty. <a href="products.html">Browse products</a></p>';
    } else {
        box.innerHTML = cartItems.map(item => `
            <div class="summary-row">
                <span>${item.name} × ${item.quantity}</span>
                <span>${formatPrice(item.price * item.quantity)}</span>
            </div>`).join('');
    }
    const t = getCartTotals();
    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    set('cart-subtotal', formatPrice(t.subtotal));
    set('cart-discount', t.discount > 0 ? '-' + formatPrice(t.discount) : formatPrice(0));
    set('cart-tax', formatPrice(t.tax));
    set('cart-shipping', t.shipping === 0 ? 'Free' : formatPrice(t.shipping));
    set('cart-total', formatPrice(t.total));
}

// ===== FORM VALIDATION =====
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactForm(event) {
    event.preventDefault();
    clearErrors();

    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const subject = document.getElementById('contact-subject').value;
    const message = document.getElementById('contact-message').value.trim();
    let hasError = false;

    if (name === '') { showError('contact-name-error', 'Name is required'); hasError = true; }
    else if (name.length < 3) { showError('contact-name-error', 'Name must be at least 3 characters'); hasError = true; }

    if (email === '') { showError('contact-email-error', 'Email is required'); hasError = true; }
    else if (!EMAIL_PATTERN.test(email)) { showError('contact-email-error', 'Please enter a valid email'); hasError = true; }

    if (subject === '') { showError('contact-subject-error', 'Please select a subject'); hasError = true; }

    if (message === '') { showError('contact-message-error', 'Message is required'); hasError = true; }
    else if (message.length < 10) { showError('contact-message-error', 'Message must be at least 10 characters'); hasError = true; }

    if (hasError) return;

    try {
        sessionStorage.setItem('lastContactName', name);
        sessionStorage.setItem('lastContactEmail', email);
    } catch (e) { /* ignore */ }

    const successMsg = document.getElementById('contact-success');
    if (successMsg) successMsg.style.display = 'block';
    document.getElementById('contact-form').reset();
    setTimeout(() => { if (successMsg) successMsg.style.display = 'none'; }, 5000);
}

function validateCheckoutForm(event) {
    event.preventDefault();
    clearErrors();

    if (cartItems.length === 0) {
        showNotification('Your cart is empty');
        return;
    }

    const get = id => document.getElementById(id).value.trim();
    const firstName = get('first-name');
    const lastName = get('last-name');
    const email = get('email');
    const phone = get('phone');
    const address = get('address');
    const city = get('city');
    const state = get('state');
    const zip = get('zip');
    const country = document.getElementById('country').value;
    let hasError = false;

    if (firstName === '') { showError('first-name-error', 'First name is required'); hasError = true; }
    if (lastName === '') { showError('last-name-error', 'Last name is required'); hasError = true; }

    if (email === '') { showError('email-error', 'Email is required'); hasError = true; }
    else if (!EMAIL_PATTERN.test(email)) { showError('email-error', 'Please enter a valid email'); hasError = true; }

    if (phone === '') { showError('phone-error', 'Phone number is required'); hasError = true; }
    else if (!/^\+?[0-9]{10,15}$/.test(phone.replace(/[\s\-()]/g, ''))) {
        showError('phone-error', 'Please enter a valid phone number'); hasError = true;
    }

    if (address === '') { showError('address-error', 'Address is required'); hasError = true; }
    if (city === '') { showError('city-error', 'City is required'); hasError = true; }
    if (state === '') { showError('state-error', 'Governorate is required'); hasError = true; }
    if (zip === '') { showError('zip-error', 'Postal code is required'); hasError = true; }
    if (country === '') { showError('country-error', 'Please select a country'); hasError = true; }

    if (hasError) return;

    const totals = getCartTotals();
    writeStorage('lastOrder', {
        firstName, lastName, email, phone, address, city, state, zip, country,
        items: cartItems.map(i => ({id: i.id, name: i.name, price: i.price, quantity: i.quantity})),
        promo: appliedPromo,
        totals,
        date: new Date().toISOString()
    });

    const successMsg = document.getElementById('success-message');
    if (successMsg) successMsg.style.display = 'block';

    cartItems = [];
    appliedPromo = null;
    writeStorage('appliedPromo', null);
    saveCart();
    updateCartCount();
    renderCheckoutSummary();

    const btn = document.querySelector('#checkout-form button[type="submit"]');
    if (btn) btn.disabled = true;

    setTimeout(() => { window.location.href = 'index.html'; }, 5000);
}

function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
    }
}

function clearErrors() {
    document.querySelectorAll('.error-msg').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
}

// ===== PROFILE PAGE =====
function showProfileSection(sectionName, btn) {
    document.querySelectorAll('.profile-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    const target = document.getElementById(sectionName + '-section');
    if (target) target.classList.add('active');
    if (btn) btn.classList.add('active');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        try { localStorage.removeItem('userToken'); } catch (e) { /* ignore */ }
        window.location.href = 'index.html';
    }
}

// These profile buttons had no handlers before; for now they show a message
function showAddAddressForm() { showNotification('Adding addresses will be available soon'); }
function showChangePassword() { showNotification('Password change will be available soon'); }
function enableTwoFactor() { showNotification('Two-factor authentication will be available soon'); }
function cancelSettings() { showNotification('Changes discarded'); }

// ===== NEWSLETTER =====
function subscribeNewsletter(event) {
    event.preventDefault();
    const emailInput = document.getElementById('newsletter-email');
    const email = emailInput.value.trim();

    if (email === '') { showNotification('Please enter your email address'); return; }
    if (!EMAIL_PATTERN.test(email)) { showNotification('Please enter a valid email address'); return; }

    const subscribers = readStorage('newsletterSubscribers', []);
    if (!subscribers.includes(email)) {
        subscribers.push(email);
        writeStorage('newsletterSubscribers', subscribers);
        showNotification('Thank you for subscribing!');
        emailInput.value = '';
    } else {
        showNotification('You are already subscribed!');
    }
}

// ===== CONTACT PAGE =====
function toggleFAQ(faqId) {
    const answer = document.getElementById('faq-answer-' + faqId);
    const icon = document.getElementById('faq-icon-' + faqId);
    if (!answer) return;
    const open = answer.style.display === 'block';
    answer.style.display = open ? 'none' : 'block';
    if (icon) icon.className = open ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
}

function resetContactForm() {
    document.getElementById('contact-form').reset();
    clearErrors();
}
