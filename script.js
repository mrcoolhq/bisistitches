/* =========================================================
   Bisistitches: header behaviour
   1. Mobile menu (hamburger) open/close
   2. Shop dropdown open/close
   3. Like count badge
   ========================================================= */

/* =========================================================
   0. SETTINGS
   The owner's WhatsApp number lives here, and ONLY here.
   Digits only, international format: 234 then the number without its leading 0.
   ========================================================= */
const WHATSAPP_NUMBER = '2340000000000';   // <-- REPLACE with the real number
const WHATSAPP_ENQUIRY = 'Hello Bisistitches, I would like to make an enquiry.';

/* Builds a WhatsApp "click to chat" link with the message already typed in.
   encodeURIComponent turns spaces, line breaks and symbols into URL-safe text. */
function whatsappLink(message) {
  const number = WHATSAPP_NUMBER.replace(/\D/g, '');   // strips any + or spaces
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/* Every link marked data-whatsapp in the HTML becomes a "chat with us" link */
document.querySelectorAll('[data-whatsapp]').forEach((link) => {
  link.href = whatsappLink(WHATSAPP_ENQUIRY);
  link.target = '_blank';
  link.rel = 'noopener';
});

const menuToggle = document.getElementById('menuToggle');
const nav        = document.getElementById('primaryNav');
const shopItem   = document.querySelector('.nav__item--dropdown');
const shopToggle = document.getElementById('shopToggle');
const likeBtn    = document.getElementById('likeBtn');
const likeCount  = document.getElementById('likeCount');

/* ---------- 1. Mobile menu ----------
   Clicking the hamburger adds/removes the "is-open" class on the nav.
   The CSS does the actual showing/hiding; JS only flips the class and
   keeps aria-expanded in sync so screen readers know the state. */
function setMenu(open) {
  nav.classList.toggle('is-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

menuToggle.addEventListener('click', () => {
  setMenu(!nav.classList.contains('is-open'));
});

/* Links that scroll within the page (like Contact) should close the mobile menu,
   otherwise it stays open and covers the part you just scrolled to. */
nav.addEventListener('click', (e) => {
  if (e.target.closest('a[href^="#"]')) setMenu(false);
});

/* ---------- 2. Shop dropdown ----------
   Same idea: toggle "is-open" on the Shop list item.
   On mobile it works like an accordion; on desktop it also opens on hover (CSS). */
function setShop(open) {
  shopItem.classList.toggle('is-open', open);
  shopToggle.setAttribute('aria-expanded', String(open));
}

shopToggle.addEventListener('click', () => {
  setShop(!shopItem.classList.contains('is-open'));
});

/* Close things when you click elsewhere or press Escape */
document.addEventListener('click', (e) => {
  if (!shopItem.contains(e.target)) setShop(false);
  if (!nav.contains(e.target) && !menuToggle.contains(e.target)) setMenu(false);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    setShop(false);
    setMenu(false);
  }
});

/* If the window is resized up to desktop, reset the mobile menu state */
window.matchMedia('(min-width: 768px)').addEventListener('change', () => {
  setMenu(false);
  setShop(false);
});

/* ---------- 3. Liked items (works like a cart) ----------
   Each liked item is an object: { id, name, price, image }.
   The list lives in the "likes" array and is saved in localStorage,
   so it is still there if the visitor refreshes or comes back later. */
const CURRENCY = 'NGN'; // change this one line if you sell in another currency
const STORAGE_KEY = 'bisistitches-likes';

const drawer      = document.getElementById('likesDrawer');
const overlay     = document.getElementById('drawerOverlay');
const drawerClose = document.getElementById('drawerClose');
const drawerList  = document.getElementById('drawerList');
const drawerEmpty = document.getElementById('drawerEmpty');
const drawerFoot  = document.getElementById('drawerFoot');
const drawerTotal = document.getElementById('drawerTotal');
const orderNow    = document.getElementById('orderNow');

const money = (n) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 }).format(n);

/* Load saved items (try/catch because storage can be blocked) */
let likes = [];
try { likes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { likes = []; }

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(likes)); } catch (e) { /* ignore */ }
}

/* Writes the order message the client will send on WhatsApp.
   "ref" is the product id, so the owner can tell items apart (for example
   the men's and women's luxury outfits can share a name). */
function buildOrderMessage() {
  const lines = likes.map((item, i) => `${i + 1}. ${item.name} (ref: ${item.id}) - ${money(item.price)}`);
  const total = likes.reduce((sum, item) => sum + item.price, 0);
  return `Hello Bisistitches, I would like to order:\n\n${lines.join('\n')}\n\nTotal: ${money(total)}`;
}

/* Redraw everything that depends on the list: badge, drawer items, total */
function render() {
  // Badge: hidden at 0
  likeCount.textContent = likes.length;
  likeCount.hidden = likes.length === 0;
  likeBtn.setAttribute('aria-label', `Open liked items, ${likes.length} saved`);

  // Drawer: empty message vs list + footer
  drawerEmpty.hidden = likes.length > 0;
  drawerFoot.hidden = likes.length === 0;
  drawerTotal.textContent = money(likes.reduce((sum, item) => sum + item.price, 0));
  if (orderNow) orderNow.href = whatsappLink(buildOrderMessage());   // "Order now" opens WhatsApp with the items

  // Rebuild the list. textContent (not innerHTML) keeps product names safe.
  drawerList.replaceChildren(...likes.map((item) => {
    const li = document.createElement('li');
    li.className = 'drawer__item';

    const thumb = document.createElement(item.image ? 'img' : 'div');
    thumb.className = 'drawer__thumb';
    if (item.image) { thumb.src = item.image; thumb.alt = ''; }

    const info = document.createElement('div');
    const name = document.createElement('h3');
    name.className = 'drawer__name';
    name.textContent = item.name;
    const price = document.createElement('p');
    price.className = 'drawer__price';
    price.textContent = money(item.price);
    const remove = document.createElement('button');
    remove.className = 'drawer__remove';
    remove.textContent = 'Remove';
    remove.dataset.removeId = item.id;
    remove.setAttribute('aria-label', `Remove ${item.name}`);

    info.append(name, price, remove);
    li.append(thumb, info);
    return li;
  }));

  // Keep every product's own heart button in step (used on product cards later)
  document.querySelectorAll('[data-like]').forEach((btn) => {
    const on = likes.some((item) => item.id === btn.dataset.id);
    btn.classList.toggle('is-liked', on);
    btn.setAttribute('aria-pressed', String(on));
  });
}

/* Add / remove / toggle. These are the only places the list changes. */
function addLike(item) {
  if (!likes.some((i) => i.id === item.id)) { likes.push(item); save(); render(); }
}
function removeLike(id) {
  likes = likes.filter((i) => i.id !== id); save(); render();
}
function toggleLike(item) {
  likes.some((i) => i.id === item.id) ? removeLike(item.id) : addLike(item);
}

/* Open / close the drawer */
function setDrawer(open) {
  drawer.classList.toggle('is-open', open);
  overlay.hidden = !open;
  likeBtn.setAttribute('aria-expanded', String(open));
  if (open) drawerClose.focus(); else if (drawer.contains(document.activeElement)) likeBtn.focus();
}

likeBtn.addEventListener('click', () => setDrawer(true));
drawerClose.addEventListener('click', () => setDrawer(false));
overlay.addEventListener('click', () => setDrawer(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setDrawer(false); });

/* "Remove" buttons inside the drawer (event delegation: one listener for the whole list) */
drawerList.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-remove-id]');
  if (btn) removeLike(btn.dataset.removeId);
});

/* Product heart buttons (for when you build product cards). Any button written like
   <button data-like data-id="kaftan-1" data-name="Embroidered set" data-price="45000" data-image="img/1.jpg">
   will toggle that product in the list when clicked. */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-like]');
  if (!btn) return;
  toggleLike({
    id: btn.dataset.id,
    name: btn.dataset.name,
    price: Number(btn.dataset.price),
    image: btn.dataset.image || ''
  });
});

render();

/* =========================================================
   4. LUXURY CAROUSELS
   ========================================================= */

/* THE PRODUCT LIST. To add or change an item, edit this list only.
   image: '' shows a grey placeholder until you add a real file path.
   (Names and prices below are placeholders.) */
const luxuryProducts = {
  men: [
    { id: 'lux-m-1', name: 'Luxury outfit 1', price: 180000, image: '/images/luxury/men-1.jpg' },
    { id: 'lux-m-2', name: 'Luxury outfit 2', price: 220000, image: '/images/luxury/men-2.jpg' },
    { id: 'lux-m-3', name: 'Luxury outfit 3', price: 195000, image: '/images/luxury/men-3.jpg' },
    { id: 'lux-m-4', name: 'Luxury outfit 4', price: 250000, image: '/images/luxury/men-4.jpg' }
  ],
  women: [
    { id: 'lux-w-1', name: 'Luxury outfit 1', price: 190000, image: '/images/luxury/women-1.jpg' },
    { id: 'lux-w-2', name: 'Luxury outfit 2', price: 230000, image: '/images/luxury/women-2.jpg' },
    { id: 'lux-w-3', name: 'Luxury outfit 3', price: 210000, image: '/images/luxury/women-4.jpg' },
    { id: 'lux-w-4', name: 'Luxury outfit 4', price: 260000, image: '/images/luxury/women-3.jpg' }
  ]
};

const categoryLabel = { men: "Men's luxury", women: "Women's luxury" };

/* Builds one product card (same pieces as your reference):
   image, small category label, name, then price + like button. */
function buildCard(product, group) {
  const li = document.createElement('li');
  li.className = 'lux-card';

  const media = document.createElement('div');
  media.className = 'lux-card__media';
  if (product.image) {
    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name;
    media.append(img);
  } else {
    const ph = document.createElement('span');
    ph.className = 'lux-card__media-text';
    ph.textContent = 'Image goes here';
    media.append(ph);
  }

  const cat = document.createElement('p');
  cat.className = 'lux-card__cat';
  cat.textContent = categoryLabel[group];

  const name = document.createElement('h4');
  name.className = 'lux-card__name';
  name.textContent = product.name;

  const row = document.createElement('div');
  row.className = 'lux-card__row';

  const price = document.createElement('p');
  price.className = 'lux-card__price';
  price.textContent = money(product.price);

  /* The like button. The data-* attributes are what the click handler in
     section 3 reads, so this button adds/removes the item from the liked list. */
  const like = document.createElement('button');
  like.className = 'like-toggle';
  like.type = 'button';
  like.setAttribute('data-like', '');
  like.dataset.id = product.id;
  like.dataset.name = product.name;
  like.dataset.price = product.price;
  like.dataset.image = product.image;
  like.setAttribute('aria-label', `Save ${product.name} to liked items`);
  like.innerHTML =
    '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M12 20.5s-7.5-4.7-9.4-9.2C1.2 8 3 4.8 6.2 4.5c1.9-.2 3.6.8 4.6 2.3l1.2 1.7 1.2-1.7c1-1.5 2.7-2.5 4.6-2.3 3.2.3 5 3.5 3.6 6.8-1.9 4.5-9.4 9.2-9.4 9.2z" ' +
    'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  row.append(price, like);
  li.append(media, cat, name, row);
  return li;
}

/* Fill each carousel track with its cards */
document.querySelectorAll('[data-products]').forEach((track) => {
  const group = track.dataset.products; // "men" or "women"
  track.replaceChildren(...luxuryProducts[group].map((p) => buildCard(p, group)));
});

/* Arrow buttons: scroll the track by one card. Disable an arrow at either end. */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll('[data-carousel]').forEach((root) => {
  const track = root.querySelector('.carousel__track');
  const prev  = root.querySelector('[data-dir="prev"]');
  const next  = root.querySelector('[data-dir="next"]');

  // One step = width of a card + the gap between cards
  const step = () => {
    const card = track.firstElementChild;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card.getBoundingClientRect().width + gap;
  };
  const scrollByCard = (dir) =>
    track.scrollBy({ left: dir * step(), behavior: reduceMotion ? 'auto' : 'smooth' });

  prev.addEventListener('click', () => scrollByCard(-1));
  next.addEventListener('click', () => scrollByCard(1));

  const updateArrows = () => {
    prev.disabled = track.scrollLeft <= 4;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  };
  track.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  updateArrows();
});

/* The cards were added after the first render(), so run it again.
   This marks any already-liked items on the new buttons. */
render();

/* =========================================================
   5. TESTIMONIALS
   ========================================================= */

/* THE TESTIMONIAL LIST. Edit this to add, change or remove testimonials.
   image: '' shows a grey placeholder until you add a real file path.
   (All of the text below is placeholder.) */
const testimonials = [
  { name: 'Customer 1', detail: 'Outfit stitched', image: '/images/test1.jpg', quote: 'Replace this with what your customer said about the fitting, the fabric and the service.' },
  { name: 'Customer 2', detail: 'Outfit stitched', image: '/images/test2.jpg', quote: 'Replace this with what your customer said about the fitting, the fabric and the service.' },
  { name: 'Customer 3', detail: 'Outfit stitched', image: '/images/test3.jpg', quote: 'Replace this with what your customer said about the fitting, the fabric and the service.' },
  { name: 'Customer 4', detail: 'Outfit stitched', image: '/images/test4.jpg', quote: 'Replace this with what your customer said about the fitting, the fabric and the service.' }
];

const testiRoot = document.querySelector('[data-testi]');

if (testiRoot) {
  const viewport = testiRoot.querySelector('.testi__viewport');
  const track    = testiRoot.querySelector('.testi__track');
  const prevBtn  = testiRoot.querySelector('[data-dir="prev"]');
  const nextBtn  = testiRoot.querySelector('[data-dir="next"]');

  /* Build one card per testimonial: image, quote mark, quote, name, detail */
  const slides = testimonials.map((t) => {
    const li = document.createElement('li');
    li.className = 'testi__slide';

    const card = document.createElement('article');
    card.className = 'testi__card';

    const media = document.createElement('div');
    media.className = 'testi__media';
    if (t.image) {
      const img = document.createElement('img');
      img.src = t.image;
      img.alt = '';
      media.append(img);
    } else {
      const ph = document.createElement('span');
      ph.className = 'testi__media-text';
      ph.textContent = 'Customer photo goes here';
      media.append(ph);
    }

    const body = document.createElement('div');
    body.className = 'testi__body';

    const mark = document.createElement('span');
    mark.className = 'testi__mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = '\u201C';

    const quote = document.createElement('p');
    quote.className = 'testi__quote';
    quote.textContent = t.quote;

    const name = document.createElement('p');
    name.className = 'testi__name';
    name.textContent = t.name;

    const detail = document.createElement('p');
    detail.className = 'testi__detail';
    detail.textContent = t.detail;

    body.append(mark, quote, name, detail);
    card.append(media, body);
    li.append(card);
    return li;
  });
  track.replaceChildren(...slides);

  let index = 0;

  /* Slide the track so the active card sits in the middle of the viewport.
     offset = (half the viewport) - (the card's own centre point) */
  function position() {
    const slide = slides[index];
    const offset = viewport.clientWidth / 2 - (slide.offsetLeft + slide.offsetWidth / 2);
    track.style.transform = `translateX(${offset}px)`;
  }

  /* Go to card i: clear the active one, fade the rest, update arrows */
  function go(i) {
    index = Math.min(Math.max(i, 0), slides.length - 1);
    slides.forEach((slide, n) => {
      slide.classList.toggle('is-active', n === index);
      slide.setAttribute('aria-hidden', String(n !== index));
    });
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === slides.length - 1;
    position();
  }

  prevBtn.addEventListener('click', () => go(index - 1));
  nextBtn.addEventListener('click', () => go(index + 1));

  /* Clicking a faded card brings it into focus */
  slides.forEach((slide, n) => slide.addEventListener('click', () => go(n)));

  /* Keyboard: left/right arrow keys while focus is inside the carousel */
  testiRoot.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(index - 1);
    if (e.key === 'ArrowRight') go(index + 1);
  });

  /* Swipe on touch screens: a drag of more than 50px changes the card */
  let startX = null;
  viewport.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  viewport.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
    startX = null;
  }, { passive: true });

  /* Re-centre if the window changes size */
  window.addEventListener('resize', position);

  /* First position: switch the slide animation off for a moment so the
     carousel doesn't visibly glide into place when the page loads. */
  track.style.transition = 'none';
  go(0);
  track.offsetWidth;            // forces the browser to apply the position now
  track.style.transition = '';
}

/* =========================================================
   6. NEWSLETTER + AUTO-MOVING IMAGE STRIP
   ========================================================= */

/* ---------- Newsletter form ---------- */
const newsletterForm = document.getElementById('newsletterForm');
const newsEmail      = document.getElementById('newsEmail');
const newsletterMsg  = document.getElementById('newsletterMsg');

/* TODO: this is the ONE place to connect a real email service
   (Mailchimp, Formspree, your own backend, etc.).
   Right now it does nothing, so NO emails are saved yet.
   When you connect a service, send `email` to it here and
   throw an error if it fails so the visitor sees the error message. */
async function sendToService(email) {
  return true;
}

if (newsletterForm) newsletterForm.addEventListener('submit', async (e) => {
  e.preventDefault();                       // stop the page from reloading

  // type="email" lets the browser check the format for us
  if (!newsEmail.checkValidity()) {
    newsletterMsg.textContent = 'Enter a valid email address, like name@example.com.';
    newsEmail.focus();
    return;
  }

  const button = newsletterForm.querySelector('button');
  button.disabled = true;                   // prevents double clicks while sending
  try {
    await sendToService(newsEmail.value.trim());
    newsletterMsg.textContent = 'Thank you. You are on the list.';
    newsletterForm.reset();
  } catch (err) {
    newsletterMsg.textContent = 'Something went wrong. Please try again.';
  } finally {
    button.disabled = false;
  }
});

/* ---------- Image strip ----------
   Edit this list to change the images. src: '' shows a grey placeholder.
   Keep at least 8 so the strip is long enough for wide screens. */
const showcaseImages = [
  { src: '/images/show1.jpeg', alt: '' }, { src: '/images/show2.jpeg', alt: '' }, { src: '/images/show3.jpeg', alt: '' }, { src: '/images/show4.jpeg', alt: '' },
  { src: '/images/show5.jpeg', alt: '' }, { src: '/images/show6.jpeg', alt: '' }, { src: '/images/show7.jpg', alt: '' }, { src: '/images/show8.jpg', alt: '' }
];

const marqueeTrack = document.getElementById('marqueeTrack');

function buildMarqueeSet(hidden) {
  return showcaseImages.map((item) => {
    const div = document.createElement('div');
    div.className = 'marquee__item';
    if (hidden) div.setAttribute('aria-hidden', 'true');   // the copy is for looks only
    if (item.src) {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = hidden ? '' : item.alt;
      img.draggable = false;
      div.append(img);
    } else {
      const ph = document.createElement('span');
      ph.className = 'marquee__item-text';
      ph.textContent = 'Image';
      div.append(ph);
    }
    return div;
  });
}

/* Put the set in twice. The CSS animation then slides by exactly one set. */
if (marqueeTrack) marqueeTrack.replaceChildren(...buildMarqueeSet(false), ...buildMarqueeSet(true));

/* =========================================================
   7. FOOTER
   ========================================================= */

/* Keeps the copyright year correct without you editing it every January */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();


/* =========================================================
   8. SHOP PAGES (shop-men.html and shop-women.html)
   Both pages use this same code. The <main data-shop="men"> or
   data-shop="women" attribute tells it which list to show.
   ========================================================= */

/* THE SHOP LISTS. Edit these to add, change or remove categories and products.
   cat: which category tile the product belongs to.
   image: '' shows a grey placeholder until you add a real file path.
   (Names and prices are placeholders. The order here is the "New in" order.) */
const shopData = {
  men: {
    label: "Men's",
    categories: [
      { id: 'shirts', label: 'Native', image: '/images/native.jpg' },
      { id: 'suits', label: 'Kaftans', image: '/images/kaftan.jpg' },
      { id: 'bottoms', label: 'Agbada', image: '/images/agbada.jpg' }
    ],
    products: [
      { id: 'm-1', name: 'Shirt 1', cat: 'shirts', price: 32500, image: '/images/men-1.jpg' },
      { id: 'm-2', name: 'Suit 1', cat: 'suits', price: 115000, image: '/images/men-2.jpg' },
      { id: 'm-3', name: 'Trousers 1', cat: 'bottoms', price: 40000, image: '/images/men-3.jpg' },
      { id: 'm-4', name: 'Shirt 2', cat: 'shirts', price: 40000, image: '/images/men-4.jpg' },
      { id: 'm-5', name: 'Suit 2', cat: 'suits', price: 122500, image: '/images/men-5.jpg' },
      { id: 'm-6', name: 'Trousers 2', cat: 'bottoms', price: 47500, image: '/images/men-6.jpg' },
      { id: 'm-7', name: 'Shirt 3', cat: 'shirts', price: 47500, image: '/images/men-7.jpg' },
      { id: 'm-8', name: 'Suit 3', cat: 'suits', price: 130000, image: '/images/men-8.jpg' },
      { id: 'm-9', name: 'Trousers 3', cat: 'bottoms', price: 55000, image: '/images/men-2.jpg' },
      { id: 'm-10', name: 'Shirt 4', cat: 'shirts', price: 55000, image: '/images/men-3.jpg' },
      { id: 'm-11', name: 'Suit 4', cat: 'suits', price: 137500, image: '/images/men-1.jpg' },
      { id: 'm-12', name: 'Trousers 4', cat: 'bottoms', price: 62500, image: '/images/men-5.jpg' }
    ]
  },
  women: {
    label: "Women's",
    categories: [
      { id: 'dresses', label: 'Lace', image: '/images/women5.jpg' },
      { id: 'tops', label: 'Gown', image: '/images/women12.jpg' },
      { id: 'skirts', label: 'Blouse', image: '/images/women11.jpg' }
    ],
    products: [
      { id: 'w-1', name: 'Dress 1', cat: 'dresses', price: 72500, image: '/images/women1.jpg' },
      { id: 'w-2', name: 'Top 1', cat: 'tops', price: 35000, image: '/images/women2.jpg' },
      { id: 'w-3', name: 'Skirt 1', cat: 'skirts', price: 40000, image: '/images/women3.jpg' },
      { id: 'w-4', name: 'Dress 2', cat: 'dresses', price: 80000, image: '/images/women4.jpg' },
      { id: 'w-5', name: 'Top 2', cat: 'tops', price: 42500, image: '/images/women5.jpg' },
      { id: 'w-6', name: 'Skirt 2', cat: 'skirts', price: 47500, image: '/images/women6.jpg' },
      { id: 'w-7', name: 'Dress 3', cat: 'dresses', price: 87500, image: '/images/women7.jpg' },
      { id: 'w-8', name: 'Top 3', cat: 'tops', price: 50000, image: '/images/women8.jpg' },
      { id: 'w-9', name: 'Skirt 3', cat: 'skirts', price: 55000, image: '/images/women9.jpg' },
      { id: 'w-10', name: 'Dress 4', cat: 'dresses', price: 95000, image: '/images/women10.jpg' },
      { id: 'w-11', name: 'Top 4', cat: 'tops', price: 57500, image: '/images/women11.jpg' },
      { id: 'w-12', name: 'Skirt 4', cat: 'skirts', price: 62500, image: '/images/women12.jpg' }
    ]
  }
};

const shopRoot = document.querySelector('[data-shop]');

if (shopRoot) {
  const data     = shopData[shopRoot.dataset.shop];
  const catsBox  = document.getElementById('shopCats');
  const grid     = document.getElementById('shopGrid');
  const countEl  = document.getElementById('shopCount');
  const sortEl   = document.getElementById('shopSort');

  let activeCat = null;   // null = show everything

  /* ----- Back button -----
     If the visitor came from another page on this site, go back to it.
     Otherwise the link's normal destination (home page shop section) is used. */
  const backLink = document.querySelector('[data-back]');
  if (backLink) {
    backLink.addEventListener('click', (e) => {
      let sameSite = false;
      try { sameSite = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (err) {}
      if (sameSite && history.length > 1) {
        e.preventDefault();
        history.back();
      }
    });
  }

  /* ----- Category tiles ----- */
  function buildTiles() {
    catsBox.replaceChildren(...data.categories.map((cat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cat-tile';
      btn.dataset.cat = cat.id;
      btn.setAttribute('aria-pressed', 'false');

      const media = document.createElement('span');
      media.className = 'cat-tile__media';
      if (cat.image) {
        const img = document.createElement('img');
        img.src = cat.image;
        img.alt = '';
        media.append(img);
      } else {
        media.textContent = 'Image';
      }

      const label = document.createElement('span');
      label.className = 'cat-tile__label';
      label.textContent = cat.label;

      btn.append(media, label);
      return btn;
    }));
  }

  /* Click a tile to filter. Click the same tile again to show everything. */
  catsBox.addEventListener('click', (e) => {
    const tile = e.target.closest('.cat-tile');
    if (!tile) return;
    activeCat = activeCat === tile.dataset.cat ? null : tile.dataset.cat;
    catsBox.querySelectorAll('.cat-tile').forEach((t) =>
      t.setAttribute('aria-pressed', String(t.dataset.cat === activeCat)));
    renderShop();
  });

  sortEl.addEventListener('change', renderShop);

  /* ----- Product card (image, category label, name, price + like button) ----- */
  const heartIcon =
    '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M12 20.5s-7.5-4.7-9.4-9.2C1.2 8 3 4.8 6.2 4.5c1.9-.2 3.6.8 4.6 2.3l1.2 1.7 1.2-1.7c1-1.5 2.7-2.5 4.6-2.3 3.2.3 5 3.5 3.6 6.8-1.9 4.5-9.4 9.2-9.4 9.2z" ' +
    'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  function buildShopCard(product) {
    const cat = data.categories.find((c) => c.id === product.cat);

    const li = document.createElement('li');
    li.className = 'shop-card';

    const media = document.createElement('div');
    media.className = 'shop-card__media';
    if (product.image) {
      const img = document.createElement('img');
      img.src = product.image;
      img.alt = product.name;
      media.append(img);
    } else {
      media.textContent = 'Image';
    }

    const catLabel = document.createElement('p');
    catLabel.className = 'shop-card__cat';
    catLabel.textContent = `${data.label} ${cat.label.toLowerCase()}`;

    const name = document.createElement('h2');
    name.className = 'shop-card__name';
    name.textContent = product.name;

    const row = document.createElement('div');
    row.className = 'shop-card__row';

    const price = document.createElement('p');
    price.className = 'shop-card__price';
    price.textContent = money(product.price);

    /* Same like button as the luxury cards: the data-* attributes are what
       the click handler in section 3 reads to add it to the liked items. */
    const like = document.createElement('button');
    like.className = 'like-toggle';
    like.type = 'button';
    like.setAttribute('data-like', '');
    like.dataset.id = product.id;
    like.dataset.name = product.name;
    like.dataset.price = product.price;
    like.dataset.image = product.image;
    like.setAttribute('aria-label', `Save ${product.name} to liked items`);
    like.innerHTML = heartIcon;

    row.append(price, like);
    li.append(media, catLabel, name, row);
    return li;
  }

  /* ----- Filter + sort + draw ----- */
  function renderShop() {
    let list = data.products.filter((p) => !activeCat || p.cat === activeCat);

    if (sortEl.value === 'low')  list = [...list].sort((a, b) => a.price - b.price);
    if (sortEl.value === 'high') list = [...list].sort((a, b) => b.price - a.price);

    grid.replaceChildren(...list.map(buildShopCard));
    countEl.textContent = `${list.length} ${list.length === 1 ? 'result' : 'results'}`;
    render();   // re-mark any already-liked items on the new buttons
  }

  buildTiles();
  renderShop();
}

/* =========================================================
   9. FAQ ACCORDION (faq.html)
   Only one answer can be open at a time.
   ========================================================= */
const faqRoot = document.querySelector('[data-faq]');

if (faqRoot) {
  const faqItems = [...faqRoot.querySelectorAll('.faq__item')];

  /* Opening/closing = adding/removing the "is-open" class (the CSS animates it)
     and keeping aria-expanded in sync for screen readers. */
  function setFaq(item, open) {
    item.classList.toggle('is-open', open);
    item.querySelector('.faq__btn').setAttribute('aria-expanded', String(open));
  }

  /* One listener for the whole list (event delegation) */
  faqRoot.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq__btn');
    if (!btn) return;

    const item = btn.closest('.faq__item');
    const willOpen = !item.classList.contains('is-open');  // was it closed before this click?

    faqItems.forEach((i) => setFaq(i, false));  // close everything first...
    if (willOpen) setFaq(item, true);           // ...then open the one that was clicked
  });
}
