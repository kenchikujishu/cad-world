const STORAGE_KEY = "nezumi_admin_demo_state";
const SESSION_KEY = "nezumi_admin_session";
const ADMIN_EMAIL = "admin@nezumi.cad";
const ADMIN_PASSWORD = "demo2026";
const LOGIN_REQUIRED = false;
const memoryStorage = {};

const defaultState = {
  categories: [
    { id: "landscape", en: "Landscape", ja: "ランドスケープ" },
    { id: "architecture", en: "Architecture", ja: "建築" },
    { id: "urban", en: "Urban", ja: "都市" },
    { id: "interior", en: "Interior", ja: "インテリア" },
  ],
  genres: [
    { id: "plan", en: "Plan", ja: "平面" },
    { id: "section", en: "Section", ja: "断面" },
    { id: "elevation", en: "Elevation", ja: "立面" },
    { id: "axonometric", en: "Axonometric", ja: "アクソメ" },
    { id: "asset-pack", en: "Asset Pack", ja: "素材パック" },
  ],
  products: [
    {
      id: "p-urban-section",
      order: 1,
      titleEn: "Cad Monochrome Urban Street Section",
      titleJa: "CAD モノクローム都市ストリート断面",
      descriptionEn: "Editable street section with people, facade elements, trees, cars, and linework layers.",
      descriptionJa: "人物、ファサード、樹木、車両、線画レイヤーを含む編集可能なストリート断面セット。",
      categoryId: "urban",
      genreId: "section",
      type: "Section",
      price: 12.99,
      status: "Published",
      slug: "cad-monochrome-urban-street-section",
      fileName: "urban-street-section.zip",
      thumbnail: "",
      sold: 184,
      revenue: 2390.16,
    },
    {
      id: "p-courtyard-plan",
      order: 2,
      titleEn: "Cad Botanical Courtyard Plan Creator",
      titleJa: "CAD ボタニカル中庭平面クリエイター",
      descriptionEn: "Plan drawing components for planting beds, pathways, furniture, and interior landscape layouts.",
      descriptionJa: "植栽帯、園路、家具、インテリアランドスケープ配置に使える平面図素材。",
      categoryId: "landscape",
      genreId: "plan",
      type: "Plan",
      price: 10.99,
      status: "Published",
      slug: "cad-botanical-courtyard-plan-creator",
      fileName: "botanical-courtyard-plan.zip",
      thumbnail: "",
      sold: 126,
      revenue: 1384.74,
    },
    {
      id: "p-housing-elevation",
      order: 3,
      titleEn: "Cad Quiet Housing Elevation Kit",
      titleJa: "CAD 静かな集合住宅立面キット",
      descriptionEn: "Facade elevation kit with windows, balconies, planting, and presentation-ready annotations.",
      descriptionJa: "窓、バルコニー、植栽、プレゼン用注記を含む集合住宅立面キット。",
      categoryId: "architecture",
      genreId: "elevation",
      type: "Elevation",
      price: 9.99,
      status: "Review",
      slug: "cad-quiet-housing-elevation-kit",
      fileName: "quiet-housing-elevation.zip",
      thumbnail: "",
      sold: 53,
      revenue: 529.47,
    },
    {
      id: "p-wetland-axon",
      order: 4,
      titleEn: "Axonometric Wetland Habitat Set",
      titleJa: "アクソメ湿地ハビタットセット",
      descriptionEn: "Axonometric landscape set for ecological diagrams, animal habitats, planting islands, and water edges.",
      descriptionJa: "生態ダイアグラム、動物ハビタット、植栽島、水際表現のためのアクソメ素材。",
      categoryId: "landscape",
      genreId: "axonometric",
      type: "Axonometric",
      price: 12.99,
      status: "Draft",
      slug: "axonometric-wetland-habitat-set",
      fileName: "wetland-habitat-axon.zip",
      thumbnail: "",
      sold: 37,
      revenue: 480.63,
    },
  ],
  orders: [
    { id: "NC-1044", customer: "Studio Mori", productId: "p-urban-section", total: 25.98, status: "Paid", day: "Mon" },
    { id: "NC-1045", customer: "Atelier N", productId: "p-courtyard-plan", total: 10.99, status: "Paid", day: "Tue" },
    { id: "NC-1046", customer: "Kita Office", productId: "p-wetland-axon", total: 12.99, status: "Pending", day: "Wed" },
    { id: "NC-1047", customer: "Field House", productId: "p-urban-section", total: 12.99, status: "Paid", day: "Thu" },
    { id: "NC-1048", customer: "Grid Room", productId: "p-housing-elevation", total: 19.98, status: "Refund review", day: "Fri" },
    { id: "NC-1049", customer: "Plot Lab", productId: "p-courtyard-plan", total: 21.98, status: "Paid", day: "Sat" },
    { id: "NC-1050", customer: "Line Archive", productId: "p-urban-section", total: 12.99, status: "Paid", day: "Sun" },
  ],
};

let state = loadState();
let pendingThumbnail = "";
let currentView = "dashboard";

const authScreen = document.querySelector("#auth-screen");
const adminShell = document.querySelector("#admin-shell");
const loginForm = document.querySelector("#login-form");
const authError = document.querySelector("#auth-error");
const navLinks = [...document.querySelectorAll(".nav-link")];
const views = [...document.querySelectorAll(".view")];
const viewKicker = document.querySelector("#view-kicker");
const viewTitle = document.querySelector("#view-title");
const productForm = document.querySelector("#product-form");
const productSearch = document.querySelector("#product-search");
const statusFilter = document.querySelector("#status-filter");
const cadFile = document.querySelector("#cad-file");
const thumbnailFile = document.querySelector("#thumbnail-file");
const thumbPreview = document.querySelector("#thumb-preview");
const fileName = document.querySelector("#file-name");

const viewMeta = {
  dashboard: ["Dashboard", "Today at Nezumi CAD"],
  products: ["CAD Items", "Product Library"],
  editor: ["Upload / Edit", "CAD Data Editor"],
  taxonomy: ["Taxonomy", "Categories and Genres"],
  sales: ["Sales", "Revenue and Orders"],
  settings: ["Settings", "Publishing Controls"],
};

function loadState() {
  const stored = storageGet(STORAGE_KEY);
  if (!stored) return cloneState(defaultState);
  try {
    return { ...cloneState(defaultState), ...JSON.parse(stored) };
  } catch {
    return cloneState(defaultState);
  }
}

function saveState() {
  storageSet(STORAGE_KEY, JSON.stringify(state));
}

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return memoryStorage[key] || null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    memoryStorage[key] = value;
  }
}

function storageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    delete memoryStorage[key];
  }
}

function cloneState(value) {
  return JSON.parse(JSON.stringify(value));
}

function showApp() {
  authScreen.classList.add("is-hidden");
  adminShell.classList.remove("is-hidden");
  renderAll();
}

function showAuth() {
  authScreen.classList.remove("is-hidden");
  adminShell.classList.add("is-hidden");
}

if (!LOGIN_REQUIRED || storageGet(SESSION_KEY) === "active") {
  showApp();
} else {
  showAuth();
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.querySelector("#login-email").value.trim();
  const password = document.querySelector("#login-password").value;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    storageSet(SESSION_KEY, "active");
    authError.textContent = "";
    showApp();
    return;
  }

  authError.textContent = "Email or password is incorrect.";
});

document.querySelector("#logout-button").addEventListener("click", () => {
  storageRemove(SESSION_KEY);
  LOGIN_REQUIRED ? showAuth() : showApp();
});

document.querySelector("#seed-button").addEventListener("click", () => {
  state = cloneState(defaultState);
  pendingThumbnail = "";
  saveState();
  clearForm();
  renderAll();
});

navLinks.forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

function setView(view) {
  currentView = view;
  navLinks.forEach((button) => button.classList.toggle("is-active", button.dataset.view === view));
  views.forEach((section) => section.classList.toggle("is-active", section.id === `view-${view}`));
  viewKicker.textContent = viewMeta[view][0];
  viewTitle.textContent = viewMeta[view][1];
  if (view === "editor" && !document.querySelector("#product-id").value) clearForm();
}

function renderAll() {
  renderMetrics();
  renderChart();
  renderQueue();
  renderTaxonomySelects();
  renderProductsTable();
  renderTaxonomy();
  renderSales();
  renderThumbPreview();
}

function currency(value) {
  return `$${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getCategory(id) {
  return state.categories.find((category) => category.id === id) || { en: "Unassigned", ja: "未設定" };
}

function getGenre(id) {
  return state.genres.find((genre) => genre.id === id) || { en: "Unassigned", ja: "未設定" };
}

function sortedProducts() {
  return [...state.products].sort((a, b) => a.order - b.order);
}

function renderMetrics() {
  const published = state.products.filter((product) => product.status === "Published").length;
  const totalRevenue = state.products.reduce((sum, product) => sum + Number(product.revenue || 0), 0);
  const totalSold = state.products.reduce((sum, product) => sum + Number(product.sold || 0), 0);
  const pending = state.products.filter((product) => product.status !== "Published").length;
  document.querySelector("#metric-grid").innerHTML = [
    ["Revenue", currency(totalRevenue), "+12.4%"],
    ["Published", published, "Live CAD data"],
    ["Units Sold", totalSold, "+28 this week"],
    ["Queue", pending, "Draft / Review"],
  ]
    .map(
      ([label, value, note]) => `
        <article class="metric-card">
          <span>${label}</span>
          <strong>${value}</strong>
          <small>${note}</small>
        </article>
      `,
    )
    .join("");
}

function renderChart() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const revenue = days.map((day) =>
    state.orders.filter((order) => order.day === day).reduce((sum, order) => sum + Number(order.total || 0), 0),
  );
  const max = Math.max(...revenue, 1);
  document.querySelector("#bar-chart").innerHTML = days
    .map((day, index) => {
      const height = Math.max(8, Math.round((revenue[index] / max) * 100));
      return `<div class="bar" style="--bar-height:${height}%"><span>${day}</span></div>`;
    })
    .join("");
}

function renderQueue() {
  const queued = sortedProducts().filter((product) => product.status !== "Published");
  document.querySelector("#queue-count").textContent = `${queued.length} items`;
  document.querySelector("#queue-list").innerHTML = queued.length
    ? queued
        .map(
          (product) => `
            <div class="queue-item">
              <strong>${product.titleEn}</strong>
              <span>${product.status} · ${getCategory(product.categoryId).en} / ${getGenre(product.genreId).en}</span>
            </div>
          `,
        )
        .join("")
    : `<div class="queue-item"><strong>No queued items</strong><span>All products are published.</span></div>`;
}

function renderProductsTable() {
  const query = productSearch.value.trim().toLowerCase();
  const status = statusFilter.value;
  const rows = sortedProducts().filter((product) => {
    const haystack = `${product.titleEn} ${product.titleJa} ${product.slug} ${getCategory(product.categoryId).en} ${getGenre(product.genreId).en}`.toLowerCase();
    const statusMatch = status === "all" || product.status === status;
    return statusMatch && haystack.includes(query);
  });

  document.querySelector("#products-table").innerHTML = rows
    .map(
      (product) => `
        <tr>
          <td>
            <div class="action-row">
              <button class="icon-action" type="button" data-action="up" data-id="${product.id}" aria-label="Move up">↑</button>
              <button class="icon-action" type="button" data-action="down" data-id="${product.id}" aria-label="Move down">↓</button>
            </div>
          </td>
          <td>
            <div class="cad-cell">
              <div class="mini-thumb">${thumbMarkup(product)}</div>
              <div>
                <strong>${product.titleEn}</strong>
                <span>${product.titleJa}</span>
                <span>/${product.slug}</span>
              </div>
            </div>
          </td>
          <td>${getCategory(product.categoryId).en}<br /><span class="muted">${getGenre(product.genreId).en} · ${product.type}</span></td>
          <td>${currency(product.price)}</td>
          <td><span class="status-pill ${product.status.toLowerCase()}">${product.status}</span></td>
          <td>${product.sold}</td>
          <td>
            <div class="action-row">
              <button class="icon-action" type="button" data-action="edit" data-id="${product.id}">Edit</button>
              <button class="icon-action danger" type="button" data-action="delete" data-id="${product.id}">Delete</button>
            </div>
          </td>
        </tr>
      `,
    )
    .join("");
}

function thumbMarkup(product) {
  if (product.thumbnail) return `<img src="${product.thumbnail}" alt="" />`;
  const color = product.type === "Section" ? "#6570df" : product.type === "Elevation" ? "#a06a55" : "#83b8b0";
  return `
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <rect width="120" height="120" fill="#f6f5f1" />
      <path d="M14 30h92M14 60h92M14 90h92M30 14v92M60 14v92M90 14v92" stroke="#d7dad5" />
      <path d="M22 86c16-36 42-44 78-18" stroke="${color}" stroke-width="4" fill="none" opacity=".72" />
      <path d="M26 40h54v32H26zM36 50h34M36 60h34" stroke="#303633" stroke-width="3" fill="none" />
    </svg>
  `;
}

productSearch.addEventListener("input", renderProductsTable);
statusFilter.addEventListener("change", renderProductsTable);

document.querySelector("#products-table").addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const product = state.products.find((item) => item.id === button.dataset.id);
  if (!product) return;

  if (button.dataset.action === "edit") {
    fillForm(product);
    setView("editor");
  }

  if (button.dataset.action === "delete") {
    if (!window.confirm("Delete this CAD item?")) return;
    state.products = state.products.filter((item) => item.id !== product.id);
    normalizeOrder();
    saveState();
    renderAll();
  }

  if (button.dataset.action === "up" || button.dataset.action === "down") {
    moveProduct(product.id, button.dataset.action);
  }
});

function moveProduct(id, direction) {
  const list = sortedProducts();
  const index = list.findIndex((product) => product.id === id);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= list.length) return;
  [list[index].order, list[targetIndex].order] = [list[targetIndex].order, list[index].order];
  state.products = list;
  saveState();
  renderAll();
}

function normalizeOrder() {
  state.products = sortedProducts().map((product, index) => ({ ...product, order: index + 1 }));
}

document.querySelector("#new-product-button").addEventListener("click", () => {
  clearForm();
  setView("editor");
});

document.querySelector("#clear-form-button").addEventListener("click", clearForm);

function renderTaxonomySelects() {
  document.querySelector("#category-select").innerHTML = state.categories
    .map((category) => `<option value="${category.id}">${category.en} / ${category.ja}</option>`)
    .join("");
  document.querySelector("#genre-select").innerHTML = state.genres
    .map((genre) => `<option value="${genre.id}">${genre.en} / ${genre.ja}</option>`)
    .join("");
}

function fillForm(product) {
  document.querySelector("#product-id").value = product.id;
  document.querySelector("#title-en").value = product.titleEn;
  document.querySelector("#title-ja").value = product.titleJa;
  document.querySelector("#description-en").value = product.descriptionEn;
  document.querySelector("#description-ja").value = product.descriptionJa;
  document.querySelector("#category-select").value = product.categoryId;
  document.querySelector("#genre-select").value = product.genreId;
  document.querySelector("#type-select").value = product.type;
  document.querySelector("#price-input").value = product.price;
  document.querySelector("#slug-input").value = product.slug;
  document.querySelector("#status-select").value = product.status;
  fileName.textContent = product.fileName || "Select package";
  pendingThumbnail = product.thumbnail || "";
  document.querySelector("#editor-mode").textContent = "Editing";
  renderThumbPreview();
}

function clearForm() {
  productForm.reset();
  document.querySelector("#product-id").value = "";
  document.querySelector("#title-en").value = "";
  document.querySelector("#title-ja").value = "";
  document.querySelector("#description-en").value = "";
  document.querySelector("#description-ja").value = "";
  document.querySelector("#price-input").value = "12.99";
  document.querySelector("#slug-input").value = "";
  document.querySelector("#status-select").value = "Draft";
  document.querySelector("#editor-mode").textContent = "New item";
  fileName.textContent = "Select package";
  pendingThumbnail = "";
  renderTaxonomySelects();
  renderThumbPreview();
}

document.querySelector("#title-en").addEventListener("input", (event) => {
  const slugInput = document.querySelector("#slug-input");
  if (document.querySelector("#product-id").value || slugInput.value) return;
  slugInput.value = slugify(event.target.value);
});

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

cadFile.addEventListener("change", () => {
  fileName.textContent = cadFile.files[0]?.name || "Select package";
});

thumbnailFile.addEventListener("change", () => {
  const file = thumbnailFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    pendingThumbnail = reader.result;
    renderThumbPreview();
  });
  reader.readAsDataURL(file);
});

function renderThumbPreview() {
  thumbPreview.innerHTML = pendingThumbnail ? `<img src="${pendingThumbnail}" alt="" />` : "No thumbnail selected";
}

productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = document.querySelector("#product-id").value || `p-${crypto.randomUUID().slice(0, 8)}`;
  const existing = state.products.find((product) => product.id === id);
  const product = {
    id,
    order: existing?.order || state.products.length + 1,
    titleEn: document.querySelector("#title-en").value.trim(),
    titleJa: document.querySelector("#title-ja").value.trim(),
    descriptionEn: document.querySelector("#description-en").value.trim(),
    descriptionJa: document.querySelector("#description-ja").value.trim(),
    categoryId: document.querySelector("#category-select").value,
    genreId: document.querySelector("#genre-select").value,
    type: document.querySelector("#type-select").value,
    price: Number(document.querySelector("#price-input").value),
    status: document.querySelector("#status-select").value,
    slug: document.querySelector("#slug-input").value.trim() || slugify(document.querySelector("#title-en").value),
    fileName: cadFile.files[0]?.name || existing?.fileName || "cad-package.zip",
    thumbnail: pendingThumbnail || existing?.thumbnail || "",
    sold: existing?.sold || 0,
    revenue: existing?.revenue || 0,
  };

  state.products = existing ? state.products.map((item) => (item.id === id ? product : item)) : [...state.products, product];
  normalizeOrder();
  saveState();
  clearForm();
  setView("products");
  renderAll();
});

function renderTaxonomy() {
  document.querySelector("#category-count").textContent = `${state.categories.length}`;
  document.querySelector("#genre-count").textContent = `${state.genres.length}`;
  document.querySelector("#category-list").innerHTML = state.categories.map((item) => taxonomyMarkup(item, "category")).join("");
  document.querySelector("#genre-list").innerHTML = state.genres.map((item) => taxonomyMarkup(item, "genre")).join("");
}

function taxonomyMarkup(item, type) {
  return `
    <div class="taxonomy-item">
      <div>
        <strong>${item.en}</strong>
        <span>${item.ja} · ${item.id}</span>
      </div>
      <button class="icon-action danger" type="button" data-taxonomy="${type}" data-id="${item.id}">Delete</button>
    </div>
  `;
}

document.querySelector("#category-form").addEventListener("submit", (event) => {
  event.preventDefault();
  addTaxonomy("categories", document.querySelector("#category-en"), document.querySelector("#category-ja"));
});

document.querySelector("#genre-form").addEventListener("submit", (event) => {
  event.preventDefault();
  addTaxonomy("genres", document.querySelector("#genre-en"), document.querySelector("#genre-ja"));
});

function addTaxonomy(collection, enInput, jaInput) {
  const en = enInput.value.trim();
  const ja = jaInput.value.trim();
  if (!en || !ja) return;
  const id = slugify(en);
  if (state[collection].some((item) => item.id === id)) {
    window.alert("This name already exists.");
    return;
  }
  state[collection].push({ id, en, ja });
  enInput.value = "";
  jaInput.value = "";
  saveState();
  renderAll();
}

document.querySelector("#view-taxonomy").addEventListener("click", (event) => {
  const button = event.target.closest("[data-taxonomy]");
  if (!button) return;
  const collection = button.dataset.taxonomy === "category" ? "categories" : "genres";
  const field = button.dataset.taxonomy === "category" ? "categoryId" : "genreId";
  if (state.products.some((product) => product[field] === button.dataset.id)) {
    window.alert("This item is used by CAD data.");
    return;
  }
  state[collection] = state[collection].filter((item) => item.id !== button.dataset.id);
  saveState();
  renderAll();
});

function renderSales() {
  document.querySelector("#orders-count").textContent = `${state.orders.length}`;
  document.querySelector("#orders-table").innerHTML = state.orders
    .map((order) => {
      const product = state.products.find((item) => item.id === order.productId);
      return `
        <tr>
          <td>${order.id}</td>
          <td>${order.customer}</td>
          <td>${product?.titleEn || "Deleted CAD"}</td>
          <td>${currency(order.total)}</td>
          <td><span class="status-pill ${order.status === "Paid" ? "published" : "review"}">${order.status}</span></td>
        </tr>
      `;
    })
    .join("");

  const best = [...state.products].sort((a, b) => b.sold - a.sold).slice(0, 5);
  const top = Math.max(...best.map((product) => product.sold), 1);
  document.querySelector("#seller-list").innerHTML = best
    .map(
      (product) => `
        <div class="seller-item">
          <strong>${product.titleEn}</strong>
          <span>${product.sold}</span>
          <div class="seller-meter"><i style="--meter:${Math.round((product.sold / top) * 100)}%"></i></div>
        </div>
      `,
    )
    .join("");
}

setView(currentView);
