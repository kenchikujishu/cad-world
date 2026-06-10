const STORAGE_KEY = "dropworld_catalog_state";

const defaultCatalog = {
  store: { name: "DROP WORLD" },
  settings: { watermarkImage: "" },
  categories: [],
  genres: [
    { id: "plan", en: "Plan", ja: "平面" },
    { id: "section", en: "Section", ja: "断面" },
    { id: "elevation", en: "Elevation", ja: "立面" },
    { id: "axonometric", en: "Axonometric", ja: "アクソメ" },
  ],
  tags: [],
  products: [],
  sortOrders: { all: [], categories: {}, genres: {}, tags: {} },
};

let catalog = loadCatalog();
let activeImageIndex = 0;
let cartItems = 0;

const detail = document.querySelector("#product-detail");
const relatedGrid = document.querySelector("#related-grid");
const cartCount = document.querySelector("#cart-count");
const siteHeader = document.querySelector(".site-header");

function loadCatalog() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return normalizeCatalog(defaultCatalog);
    return normalizeCatalog({ ...defaultCatalog, ...JSON.parse(stored) });
  } catch {
    return normalizeCatalog(defaultCatalog);
  }
}

function normalizeCatalog(value) {
  const next = { ...defaultCatalog, ...value };
  next.store = { ...defaultCatalog.store, ...(value.store || {}) };
  next.settings = { ...defaultCatalog.settings, ...(value.settings || {}) };
  next.categories = Array.isArray(value.categories) ? value.categories : [];
  next.genres = Array.isArray(value.genres) && value.genres.length ? value.genres : defaultCatalog.genres;
  next.tags = Array.isArray(value.tags) ? value.tags : [];
  next.products = Array.isArray(value.products)
    ? value.products.map(normalizeProduct).filter((product) => product.status === "Published")
    : [];
  next.sortOrders = {
    all: Array.isArray(value.sortOrders?.all) ? value.sortOrders.all : next.products.map((product) => product.id),
    categories: value.sortOrders?.categories || {},
    genres: value.sortOrders?.genres || {},
    tags: value.sortOrders?.tags || {},
  };
  return next;
}

function normalizeProduct(product) {
  const primaryImage = product.primaryImage || product.thumbnail || "";
  return {
    id: product.id || product.slug || `product-${Math.random().toString(36).slice(2)}`,
    title: product.titleEn || product.title || "Untitled CAD",
    titleJa: product.titleJa || product.titleEn || product.title || "無題のCAD",
    description: product.descriptionEn || "",
    descriptionJa: product.descriptionJa || "",
    categoryId: product.categoryId || "",
    genreId: product.genreId || product.category || "plan",
    type: product.type || "CAD",
    status: product.status || "Draft",
    price: `$${Number(product.price || 0).toFixed(2)}`,
    priceValue: Number(product.price || 0),
    fileName: product.fileName || "",
    primaryImage,
    secondaryImage: product.secondaryImage || "",
    thumbnail: primaryImage,
    tags: Array.isArray(product.tags) ? product.tags : [],
    slug: product.slug || "",
    order: Number(product.order || 0),
  };
}

function getProduct() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || "";
  const slug = params.get("slug") || "";
  return catalog.products.find((product) => product.id === id || product.slug === slug);
}

function render() {
  const product = getProduct();
  renderBrand();
  updateHeaderState();

  if (!product) {
    detail.innerHTML = `
      <article class="product-missing">
        <p class="section-kicker">CAD</p>
        <h1>Product not found</h1>
        <p>This item is not published in the current browser catalog yet.</p>
        <a class="hero-link" href="index.html#products">Back to collection</a>
      </article>
    `;
    relatedGrid.innerHTML = "";
    return;
  }

  document.title = `${product.title} | ${catalog.store.name || "DROP WORLD"}`;
  detail.innerHTML = productDetailMarkup(product);
  renderRelated(product);
  bindDetailEvents(product);
}

function renderBrand() {
  const first = document.querySelector(".brand span:first-child");
  const second = document.querySelector(".brand span:last-child");
  const nameParts = (catalog.store.name || "DROP WORLD").split(/\s+/);
  first.textContent = nameParts[0] || "DROP";
  second.textContent = nameParts.slice(1).join(" ") || "WORLD";
}

function productDetailMarkup(product) {
  const images = productImages(product);
  const category = getCategory(product.categoryId).en;
  const genre = getGenre(product.genreId).en;
  const tags = product.tags.map((tagId) => `#${getTag(tagId).en}`).join(" ");
  return `
    <div class="detail-gallery">
      <div class="detail-main-image" id="detail-main-image">
        ${detailImage(images[activeImageIndex], product.title)}
        ${watermarkMarkup("detail")}
      </div>
      <div class="detail-thumbs">
        ${images
          .map(
            (image, index) => `
              <button class="${index === activeImageIndex ? "is-active" : ""}" type="button" data-image-index="${index}" aria-label="Show preview ${index + 1}">
                ${detailImage(image, "")}
              </button>
            `,
          )
          .join("")}
      </div>
    </div>
    <article class="detail-copy">
      <p class="section-kicker">DROP WORLD</p>
      <h1>${escapeHtml(product.title)}</h1>
      <p class="detail-price">${product.price}</p>
      <div class="rating" aria-label="Preview rating">☆ ☆ ☆ ☆ ☆</div>
      <p class="detail-description">${escapeHtml(product.description || "CAD data package for architecture and spatial presentation projects.")}</p>
      <dl class="detail-specs">
        <div><dt>Category</dt><dd>${escapeHtml(category)}</dd></div>
        <div><dt>Genre</dt><dd>${escapeHtml(genre)}</dd></div>
        <div><dt>Product type</dt><dd>${escapeHtml(product.type)}</dd></div>
        <div><dt>Package</dt><dd>${escapeHtml(product.fileName || "CAD package")}</dd></div>
        <div><dt>Format</dt><dd>${formatLabel(product.fileName)}</dd></div>
        <div><dt>Tags</dt><dd>${escapeHtml(tags || "No tags")}</dd></div>
      </dl>
      <div class="detail-actions">
        <button class="primary-store-button" type="button" id="detail-add-button">Add to cart</button>
        <a class="secondary-store-button" href="index.html#products">Back to collection</a>
      </div>
      <div class="share-row" aria-label="Share buttons">
        <button type="button">Tweet</button>
        <button type="button">Share</button>
        <button type="button">Pin</button>
      </div>
    </article>
  `;
}

function renderRelated(product) {
  const related = sortByCatalogOrder(catalog.products)
    .filter((item) => item.id !== product.id)
    .filter((item) => item.genreId === product.genreId || item.categoryId === product.categoryId)
    .slice(0, 4);

  relatedGrid.innerHTML = related.length
    ? related.map(relatedCard).join("")
    : `<p class="no-results">Add more published items in the admin to show related products.</p>`;
}

function relatedCard(product) {
  const image = product.primaryImage || product.thumbnail || product.secondaryImage;
  return `
    <a class="related-card" href="product.html?id=${encodeURIComponent(product.id)}">
      <span class="related-image">
        ${detailImage(image, product.title)}
        ${watermarkMarkup("related")}
      </span>
      <strong>${escapeHtml(product.title)}</strong>
      <span>${product.price}</span>
    </a>
  `;
}

function bindDetailEvents(product) {
  detail.querySelectorAll("[data-image-index]").forEach((button) => {
    button.addEventListener("click", () => {
      activeImageIndex = Number(button.dataset.imageIndex);
      render();
    });
  });

  detail.querySelector("#detail-add-button")?.addEventListener("click", () => {
    cartItems += 1;
    cartCount.textContent = String(cartItems);
  });
}

function productImages(product) {
  const images = [product.primaryImage || product.thumbnail, product.secondaryImage].filter(Boolean);
  return images.length ? images : [""];
}

function detailImage(src, alt) {
  if (src) return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" />`;
  return `
    <svg viewBox="0 0 900 900" role="img" aria-label="${escapeAttr(alt || "CAD preview")}">
      <rect width="900" height="900" fill="#f6f6f3" />
      <path d="M0 90h900M0 180h900M0 270h900M0 360h900M0 450h900M0 540h900M0 630h900M0 720h900M0 810h900M90 0v900M180 0v900M270 0v900M360 0v900M450 0v900M540 0v900M630 0v900M720 0v900M810 0v900" stroke="#d8dbd7" stroke-width="2" />
      <path d="M195 570 450 210 705 570 450 705z" fill="#fff" stroke="#2d3330" stroke-width="14" />
      <path d="M318 520h264M352 474h196M387 428h126M450 210v495" stroke="#83b8b0" stroke-width="10" stroke-linecap="round" opacity=".72" />
      <text x="450" y="794" text-anchor="middle" fill="#686f6c" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700">DROP WORLD CAD</text>
    </svg>
  `;
}

function watermarkMarkup(context = "detail") {
  if (!catalog.settings.watermarkImage) return "";
  return `<img class="watermark-overlay watermark-${context}" src="${escapeAttr(catalog.settings.watermarkImage)}" alt="" />`;
}

function getCategory(id) {
  return catalog.categories.find((item) => item.id === id) || { id, en: "Unassigned", ja: "未設定" };
}

function getGenre(id) {
  return catalog.genres.find((item) => item.id === id) || { id, en: id || "CAD", ja: id || "CAD" };
}

function getTag(id) {
  return catalog.tags.find((item) => item.id === id) || { id, en: id, ja: id };
}

function sortByCatalogOrder(list) {
  const rank = new Map((catalog.sortOrders.all || []).map((id, index) => [id, index]));
  return [...list].sort((a, b) => {
    const aRank = rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER;
    const bRank = rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return Number(a.order || 0) - Number(b.order || 0);
  });
}

function formatLabel(fileName = "") {
  const extension = fileName.split(".").pop()?.toUpperCase();
  if (!extension || extension === fileName.toUpperCase()) return "DWG, DXF, AI, PDF, PNG";
  return `${extension} package`;
}

function updateHeaderState() {
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 24);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value = "") {
  return escapeHtml(value);
}

window.addEventListener("scroll", updateHeaderState, { passive: true });
render();
