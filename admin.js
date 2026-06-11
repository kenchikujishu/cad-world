const STORAGE_KEY = "dropworld_catalog_state";
const SESSION_KEY = "dropworld_admin_session";
const API_CONFIG_KEY = "dropworld_api_config";
const CATALOG_DB_URL = "data/catalog.json";
const SITE_CONFIG_URL = "data/site-config.json";
const ADMIN_EMAIL = "admin@dropworld.space";
const ADMIN_PASSWORD = "demo2026";
const LOGIN_REQUIRED = false;
const memoryStorage = {};

const defaultState = {
  version: 5,
  storage: {
    provider: "cloudflare-r2",
    bucket: "",
    publicBucket: "",
    privateBucket: "",
    keyPrefix: "",
    publicBaseUrl: "",
    apiBaseUrl: "",
  },
  store: {
    name: "DROP WORLD",
  },
  settings: {
    watermarkImage: "",
  },
  pages: {
    heroEyebrowEn: "Digital drawing assets for spatial stories",
    heroEyebrowJa: "空間の物語のためのデジタル図面素材",
    heroTitleEn: "CAD sets for quiet, detailed architecture presentations.",
    heroTitleJa: "静かで緻密な建築プレゼンのためのCADセット。",
    heroCtaEn: "Browse collection",
    aboutTitleEn: "Curated CAD fragments with the calm of a finished drawing.",
    aboutTitleJa: "完成図面の静けさをまとった、使いやすいCAD素材。",
    aboutBodyEn:
      "DROP WORLD is a CAD asset shop for architecture, landscape, and spatial presentation. Products are arranged for immediate placement into plans, sections, elevations, and axonometric scenes.",
    aboutBodyJa:
      "DROP WORLDは、建築・ランドスケープ・空間プレゼンテーションのためのCAD素材ショップです。平面、断面、立面、アクソメのシーンにすぐ配置できるように整理しています。",
  },
  categories: [],
  genres: [
    { id: "plan", en: "Plan", ja: "平面" },
    { id: "section", en: "Section", ja: "断面" },
    { id: "elevation", en: "Elevation", ja: "立面" },
    { id: "axonometric", en: "Axonometric", ja: "アクソメ" },
  ],
  tags: [],
  products: [],
  sortOrders: {
    all: [],
    categories: {},
    genres: {},
    tags: {},
  },
};

let state = normalizeState(defaultState);
let pendingPrimaryImage = "";
let pendingSecondaryImage = "";
let currentView = "products";
let currentScope = "all";

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
const scopeFilter = document.querySelector("#scope-filter");
const cadFile = document.querySelector("#cad-file");
const primaryImageFile = document.querySelector("#primary-image-file");
const secondaryImageFile = document.querySelector("#secondary-image-file");
const primaryPreview = document.querySelector("#primary-preview");
const secondaryPreview = document.querySelector("#secondary-preview");
const watermarkFile = document.querySelector("#watermark-file");
const watermarkPreview = document.querySelector("#watermark-preview");
const fileName = document.querySelector("#file-name");
const pagesForm = document.querySelector("#pages-form");
const apiBaseInput = document.querySelector("#api-base-url");
const adminApiTokenInput = document.querySelector("#admin-api-token");
const apiStatus = document.querySelector("#api-status");
const uploadStatus = document.querySelector("#upload-status");

const viewMeta = {
  products: ["CAD Items", "Product Library"],
  editor: ["Upload / Edit", "CAD Data Editor"],
  taxonomy: ["Taxonomy", "Categories, Genres and # Tags"],
  pages: ["Fixed Pages", "Storefront Copy"],
  storage: ["Storage", "Upload and Database Flow"],
};

async function loadState() {
  const useLocalPreview = new URLSearchParams(window.location.search).get("preview") === "local";
  const stored = storageGet(STORAGE_KEY);
  if (useLocalPreview && stored) {
    try {
      return { ...cloneState(defaultState), ...JSON.parse(stored) };
    } catch {
      return cloneState(defaultState);
    }
  }

  const database = await fetchCatalogDatabase();
  if (database) return cloneState(database);

  if (stored) {
    try {
      return { ...cloneState(defaultState), ...JSON.parse(stored) };
    } catch {
      return cloneState(defaultState);
    }
  }

  return cloneState(defaultState);
}

async function fetchCatalogDatabase() {
  const api = getApiConfig();
  const siteConfig = await fetchSiteConfig();
  const apiBaseUrl = api.baseUrl || trimSlash(siteConfig.apiBaseUrl || "");
  if (apiBaseUrl) {
    try {
      const response = await fetch(`${apiBaseUrl}/catalog?v=${Date.now()}`, { cache: "no-store" });
      if (response.ok) return response.json();
    } catch {
      setApiStatus("Worker API could not be reached. Falling back to local data/catalog.json.", "warn");
    }
  }

  try {
    const response = await fetch(`${CATALOG_DB_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function fetchSiteConfig() {
  try {
    const response = await fetch(`${SITE_CONFIG_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return {};
    return response.json();
  } catch {
    return {};
  }
}

function normalizeState(value) {
  const next = { ...cloneState(defaultState), ...value };
  next.storage = { ...defaultState.storage, ...(value.storage || {}) };
  next.store = { ...defaultState.store, ...(value.store || {}) };
  next.settings = { ...defaultState.settings, ...(value.settings || {}) };
  next.pages = { ...defaultState.pages, ...(value.pages || {}) };
  next.categories = Array.isArray(value.categories) ? value.categories : [];
  next.genres = Array.isArray(value.genres) && value.genres.length ? value.genres : cloneState(defaultState.genres);
  next.tags = Array.isArray(value.tags) ? value.tags : [];
  next.products = Array.isArray(value.products) ? value.products.map(normalizeProduct) : [];
  next.sortOrders = {
    all: Array.isArray(value.sortOrders?.all) ? value.sortOrders.all : next.products.map((product) => product.id),
    categories: value.sortOrders?.categories || {},
    genres: value.sortOrders?.genres || {},
    tags: value.sortOrders?.tags || {},
  };
  next.products = next.products.map((product, index) => ({ ...product, order: Number(product.order || index + 1) }));
  return next;
}

function normalizeProduct(product) {
  const primaryImage =
    product.primaryImage || product.thumbnail || assetUrl(product.assets?.previewPrimary, product.assets?.previewImage1, product.previewImage1);
  const secondaryImage = product.secondaryImage || assetUrl(product.assets?.previewSecondary, product.assets?.previewImage2, product.previewImage2);
  const packageAsset = product.assets?.package || product.package || {};
  return {
    id: product.id || createId(),
    order: Number(product.order || 0),
    titleEn: product.titleEn || "",
    titleJa: product.titleJa || "",
    descriptionEn: product.descriptionEn || "",
    descriptionJa: product.descriptionJa || "",
    categoryId: product.categoryId || "",
    genreId: product.genreId || "",
    type: product.type || "Plan",
    price: Number(product.price || 0),
    status: product.status || "Draft",
    slug: product.slug || slugify(product.titleEn || ""),
    fileName: product.fileName || packageAsset.fileName || fileNameFromKey(packageAsset.key) || "",
    primaryImage,
    secondaryImage,
    thumbnail: primaryImage,
    assets: product.assets || {},
    tags: Array.isArray(product.tags) ? product.tags : [],
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: product.updatedAt || new Date().toISOString(),
  };
}

function assetUrl(...assets) {
  const flatAssets = assets.flat().filter(Boolean);
  for (const asset of flatAssets) {
    if (typeof asset === "string") return asset;
    if (asset.url) return asset.url;
    if (asset.publicUrl) return asset.publicUrl;
    if (asset.href) return asset.href;
    if (asset.key && state?.storage?.publicBaseUrl) return `${trimSlash(state.storage.publicBaseUrl)}/${asset.key}`;
  }
  return "";
}

function fileNameFromKey(key = "") {
  return key.split("/").filter(Boolean).pop() || "";
}

function saveState() {
  state = normalizeState(state);
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

function getApiConfig() {
  const stored = storageGet(API_CONFIG_KEY);
  const fallbackBase = trimSlash(state?.storage?.apiBaseUrl || "");
  if (!stored) return { baseUrl: fallbackBase, token: "" };
  try {
    const parsed = JSON.parse(stored);
    return {
      baseUrl: trimSlash(parsed.baseUrl || fallbackBase),
      token: parsed.token || "",
    };
  } catch {
    return { baseUrl: fallbackBase, token: "" };
  }
}

function saveApiConfig(config) {
  storageSet(
    API_CONFIG_KEY,
    JSON.stringify({
      baseUrl: trimSlash(config.baseUrl || ""),
      token: config.token || "",
    }),
  );
}

function isApiConfigured() {
  const config = getApiConfig();
  return Boolean(config.baseUrl && config.token);
}

function renderApiConfig() {
  if (!apiBaseInput || !adminApiTokenInput) return;
  const config = getApiConfig();
  apiBaseInput.value = config.baseUrl;
  adminApiTokenInput.value = config.token;
  setApiStatus(config.baseUrl ? "Worker API configured in this browser." : "Worker API is not configured yet. Admin saves locally until this is set.", config.baseUrl ? "ok" : "warn");
}

function setApiStatus(message, tone = "neutral") {
  if (!apiStatus) return;
  apiStatus.textContent = message;
  apiStatus.dataset.tone = tone;
}

function setUploadStatus(message, tone = "neutral") {
  if (!uploadStatus) return;
  uploadStatus.textContent = message;
  uploadStatus.dataset.tone = tone;
}

function trimSlash(value = "") {
  return String(value).replace(/\/+$/, "");
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

document.querySelector("#reset-button").addEventListener("click", () => {
  if (!window.confirm("Clear local DROP WORLD admin data in this browser?")) return;
  state = cloneState(defaultState);
  pendingPrimaryImage = "";
  pendingSecondaryImage = "";
  currentScope = "all";
  storageRemove(STORAGE_KEY);
  clearForm();
  renderAll();
});

document.querySelector("#export-button").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "dropworld-catalog.json";
  link.click();
  URL.revokeObjectURL(url);
});

document.querySelector("#reload-db-button").addEventListener("click", async () => {
  const database = await fetchCatalogDatabase();
  if (!database) {
    window.alert("Could not load data/catalog.json.");
    return;
  }
  state = normalizeState(database);
  pendingPrimaryImage = "";
  pendingSecondaryImage = "";
  currentScope = "all";
  storageSet(STORAGE_KEY, JSON.stringify(state));
  clearForm();
  renderAll();
  setView("products");
});

document.querySelector("#save-api-config-button")?.addEventListener("click", () => {
  saveApiConfig({
    baseUrl: apiBaseInput.value.trim(),
    token: adminApiTokenInput.value.trim(),
  });
  renderApiConfig();
});

document.querySelector("#test-api-button")?.addEventListener("click", async () => {
  saveApiConfig({
    baseUrl: apiBaseInput.value.trim(),
    token: adminApiTokenInput.value.trim(),
  });
  const api = getApiConfig();
  if (!api.baseUrl) {
    setApiStatus("Enter the Worker API URL first.", "error");
    return;
  }

  setApiStatus("Testing Worker API...", "neutral");
  try {
    const response = await fetch(`${api.baseUrl}/health`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Worker returned ${response.status}.`);
    setApiStatus("Worker API is reachable. Uploads can use R2.", "ok");
  } catch (error) {
    setApiStatus(error.message || "Worker API test failed.", "error");
  }
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
  if (view === "pages") fillPagesForm();
}

function renderAll() {
  renderScopeOptions();
  renderTaxonomySelects();
  renderTagChecks();
  renderProductsTable();
  renderTaxonomy();
  fillPagesForm();
  renderImagePreviews();
  renderWatermarkPreview();
  renderApiConfig();
}

function currency(value) {
  return `$${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getCategory(id) {
  return state.categories.find((category) => category.id === id) || { en: "Unassigned", ja: "未設定", id: "" };
}

function getGenre(id) {
  return state.genres.find((genre) => genre.id === id) || { en: "Unassigned", ja: "未設定", id: "" };
}

function getTag(id) {
  return state.tags.find((tag) => tag.id === id) || { en: id, ja: id, id };
}

function renderScopeOptions() {
  const options = [
    `<option value="all">All products</option>`,
    ...state.categories.map((item) => `<option value="category:${escapeAttr(item.id)}">Category / ${escapeHtml(item.en)}</option>`),
    ...state.genres.map((item) => `<option value="genre:${escapeAttr(item.id)}">Genre / ${escapeHtml(item.en)}</option>`),
    ...state.tags.map((item) => `<option value="tag:${escapeAttr(item.id)}"># ${escapeHtml(item.en)}</option>`),
  ];
  scopeFilter.innerHTML = options.join("");
  if (![...scopeFilter.options].some((option) => option.value === currentScope)) currentScope = "all";
  scopeFilter.value = currentScope;
}

function scopeParts(scopeKey = currentScope) {
  if (scopeKey === "all") return ["all", ""];
  const [type, id] = scopeKey.split(":");
  return [type, id];
}

function productsInScope(scopeKey = currentScope) {
  const [type, id] = scopeParts(scopeKey);
  if (type === "category") return state.products.filter((product) => product.categoryId === id);
  if (type === "genre") return state.products.filter((product) => product.genreId === id);
  if (type === "tag") return state.products.filter((product) => product.tags.includes(id));
  return [...state.products];
}

function getScopeOrder(scopeKey = currentScope) {
  const [type, id] = scopeParts(scopeKey);
  if (type === "category") return state.sortOrders.categories[id] || [];
  if (type === "genre") return state.sortOrders.genres[id] || [];
  if (type === "tag") return state.sortOrders.tags[id] || [];
  return state.sortOrders.all || [];
}

function setScopeOrder(scopeKey, ids) {
  const [type, id] = scopeParts(scopeKey);
  if (type === "category") state.sortOrders.categories[id] = ids;
  else if (type === "genre") state.sortOrders.genres[id] = ids;
  else if (type === "tag") state.sortOrders.tags[id] = ids;
  else state.sortOrders.all = ids;
}

function sortedProducts(scopeKey = currentScope) {
  const list = productsInScope(scopeKey);
  const order = getScopeOrder(scopeKey);
  const rank = new Map(order.map((id, index) => [id, index]));
  return list.sort((a, b) => {
    const aRank = rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER;
    const bRank = rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return Number(a.order || 0) - Number(b.order || 0);
  });
}

function ensureScopeOrders() {
  const scopes = [
    "all",
    ...state.categories.map((item) => `category:${item.id}`),
    ...state.genres.map((item) => `genre:${item.id}`),
    ...state.tags.map((item) => `tag:${item.id}`),
  ];

  scopes.forEach((scopeKey) => {
    const ids = productsInScope(scopeKey).map((product) => product.id);
    const existing = getScopeOrder(scopeKey).filter((id) => ids.includes(id));
    const missing = ids.filter((id) => !existing.includes(id));
    setScopeOrder(scopeKey, [...existing, ...missing]);
  });
}

function renderProductsTable() {
  ensureScopeOrders();
  const query = productSearch.value.trim().toLowerCase();
  const status = statusFilter.value;
  const rows = sortedProducts(currentScope).filter((product) => {
    const tagText = product.tags.map((tagId) => getTag(tagId).en).join(" ");
    const haystack = `${product.titleEn} ${product.titleJa} ${product.slug} ${getCategory(product.categoryId).en} ${getGenre(product.genreId).en} ${tagText}`.toLowerCase();
    const statusMatch = status === "all" || product.status === status;
    return statusMatch && haystack.includes(query);
  });

  document.querySelector("#products-table").innerHTML = rows.length
    ? rows.map(productRow).join("")
    : `<tr><td colspan="7"><div class="empty-state">No CAD items yet. Add categories first, then upload a product.</div></td></tr>`;
}

function productRow(product) {
  return `
    <tr>
      <td>
        <div class="action-row">
          <button class="icon-action" type="button" data-action="up" data-id="${escapeAttr(product.id)}" aria-label="Move up">↑</button>
          <button class="icon-action" type="button" data-action="down" data-id="${escapeAttr(product.id)}" aria-label="Move down">↓</button>
        </div>
      </td>
      <td>
        <div class="cad-cell">
          <div class="mini-thumb">${thumbMarkup(product)}</div>
          <div>
            <strong>${escapeHtml(product.titleEn || "Untitled CAD")}</strong>
            <span>${escapeHtml(product.titleJa || "無題")}</span>
            <span>/${escapeHtml(product.slug)}</span>
          </div>
        </div>
      </td>
      <td>${escapeHtml(getCategory(product.categoryId).en)}<br /><span class="muted">${escapeHtml(getGenre(product.genreId).en)} · ${escapeHtml(product.type)}</span></td>
      <td>${tagPills(product.tags)}</td>
      <td>${currency(product.price)}</td>
      <td><span class="status-pill ${product.status.toLowerCase()}">${escapeHtml(product.status)}</span></td>
      <td>
        <div class="action-row">
          <button class="icon-action" type="button" data-action="edit" data-id="${escapeAttr(product.id)}">Edit</button>
          <button class="icon-action danger" type="button" data-action="delete" data-id="${escapeAttr(product.id)}">Delete</button>
        </div>
      </td>
    </tr>
  `;
}

function tagPills(tagIds = []) {
  if (!tagIds.length) return `<span class="muted">No tags</span>`;
  return tagIds.map((id) => `<span class="tag-pill">#${escapeHtml(getTag(id).en)}</span>`).join("");
}

function thumbMarkup(product) {
  const preview = product.primaryImage || product.thumbnail;
  if (preview) return `<img src="${escapeAttr(preview)}" alt="" />`;
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
scopeFilter.addEventListener("change", () => {
  currentScope = scopeFilter.value;
  renderProductsTable();
});

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
    removeProductFromOrders(product.id);
    normalizeGlobalOrder();
    saveState();
    renderAll();
  }

  if (button.dataset.action === "up" || button.dataset.action === "down") {
    moveProduct(product.id, button.dataset.action);
  }
});

function moveProduct(id, direction) {
  const list = sortedProducts(currentScope);
  const index = list.findIndex((product) => product.id === id);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= list.length) return;
  const ids = list.map((product) => product.id);
  [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
  setScopeOrder(currentScope, ids);
  saveState();
  renderProductsTable();
}

function normalizeGlobalOrder() {
  const ids = sortedProducts("all").map((product) => product.id);
  state.products = state.products.map((product) => ({ ...product, order: ids.indexOf(product.id) + 1 || product.order }));
  ensureScopeOrders();
}

function removeProductFromOrders(id) {
  const clean = (ids) => ids.filter((itemId) => itemId !== id);
  state.sortOrders.all = clean(state.sortOrders.all || []);
  Object.keys(state.sortOrders.categories).forEach((key) => {
    state.sortOrders.categories[key] = clean(state.sortOrders.categories[key]);
  });
  Object.keys(state.sortOrders.genres).forEach((key) => {
    state.sortOrders.genres[key] = clean(state.sortOrders.genres[key]);
  });
  Object.keys(state.sortOrders.tags).forEach((key) => {
    state.sortOrders.tags[key] = clean(state.sortOrders.tags[key]);
  });
}

document.querySelector("#new-product-button").addEventListener("click", () => {
  clearForm();
  setView("editor");
});

document.querySelector("#clear-form-button").addEventListener("click", clearForm);

function renderTaxonomySelects() {
  document.querySelector("#category-select").innerHTML = state.categories.length
    ? state.categories.map((category) => `<option value="${escapeAttr(category.id)}">${escapeHtml(category.en)} / ${escapeHtml(category.ja)}</option>`).join("")
    : `<option value="">Add category first</option>`;
  document.querySelector("#genre-select").innerHTML = state.genres.length
    ? state.genres.map((genre) => `<option value="${escapeAttr(genre.id)}">${escapeHtml(genre.en)} / ${escapeHtml(genre.ja)}</option>`).join("")
    : `<option value="">Add genre first</option>`;
}

function renderTagChecks(selected = getSelectedTags()) {
  document.querySelector("#tag-checks").innerHTML = state.tags.length
    ? state.tags
        .map(
          (tag) => `
            <label class="tag-check">
              <input type="checkbox" value="${escapeAttr(tag.id)}" ${selected.includes(tag.id) ? "checked" : ""} />
              <span>#${escapeHtml(tag.en)}</span>
            </label>
          `,
        )
        .join("")
    : `<p class="helper-copy">No tags yet. Add tags in Taxonomy.</p>`;
}

function getSelectedTags() {
  return [...document.querySelectorAll("#tag-checks input:checked")].map((input) => input.value);
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
  pendingPrimaryImage = product.primaryImage || product.thumbnail || "";
  pendingSecondaryImage = product.secondaryImage || "";
  document.querySelector("#editor-mode").textContent = "Editing";
  renderTagChecks(product.tags);
  renderImagePreviews();
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
  document.querySelector("#status-select").value = "Published";
  document.querySelector("#editor-mode").textContent = "New item";
  fileName.textContent = "Select package";
  pendingPrimaryImage = "";
  pendingSecondaryImage = "";
  renderTaxonomySelects();
  renderTagChecks([]);
  renderImagePreviews();
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

primaryImageFile.addEventListener("change", () => {
  readImageFile(primaryImageFile.files[0], (dataUrl) => {
    pendingPrimaryImage = dataUrl;
    renderImagePreviews();
  });
});

secondaryImageFile.addEventListener("change", () => {
  readImageFile(secondaryImageFile.files[0], (dataUrl) => {
    pendingSecondaryImage = dataUrl;
    renderImagePreviews();
  });
});

watermarkFile.addEventListener("change", async () => {
  const file = watermarkFile.files[0];
  if (!file) return;

  if (isApiConfigured()) {
    setApiStatus("Uploading watermark to R2...", "neutral");
    try {
      const formData = new FormData();
      formData.append("watermark", file);
      const result = await apiFetch("/admin/watermark", {
        method: "POST",
        body: formData,
      });
      state = normalizeState(result.catalog || state);
      saveState();
      renderWatermarkPreview();
      setApiStatus("Watermark uploaded to R2 and catalog settings updated.", "ok");
      return;
    } catch (error) {
      setApiStatus(error.message || "Watermark upload failed.", "error");
      window.alert(error.message || "Watermark upload failed.");
      return;
    }
  }

  readImageFile(
    file,
    (dataUrl) => {
      state.settings.watermarkImage = dataUrl;
      saveState();
      renderWatermarkPreview();
      setApiStatus("Watermark saved locally. Configure Worker API to store it in R2.", "warn");
    },
    { preservePng: true, maxSize: 1600 },
  );
});

document.querySelector("#clear-watermark-button").addEventListener("click", () => {
  state.settings.watermarkImage = "";
  watermarkFile.value = "";
  saveState();
  renderWatermarkPreview();
});

function readImageFile(file, callback, options = {}) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    window.alert("Please select an image file.");
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    resizeImage(reader.result, file.type, callback, options);
  });
  reader.readAsDataURL(file);
}

function resizeImage(dataUrl, fileType, callback, options = {}) {
  const image = new Image();
  image.addEventListener("load", () => {
    const maxSize = options.maxSize || 1800;
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, width, height);
    const outputType = options.preservePng && fileType.includes("png") ? "image/png" : "image/jpeg";
    callback(canvas.toDataURL(outputType, 0.86));
  });
  image.addEventListener("error", () => window.alert("Could not read this image."));
  image.src = dataUrl;
}

function renderImagePreviews() {
  primaryPreview.innerHTML = pendingPrimaryImage ? `<img src="${escapeAttr(pendingPrimaryImage)}" alt="" />` : "Preview image 1";
  secondaryPreview.innerHTML = pendingSecondaryImage ? `<img src="${escapeAttr(pendingSecondaryImage)}" alt="" />` : "Preview image 2";
}

function renderWatermarkPreview() {
  const watermark = state.settings.watermarkImage || assetUrl(state.settings.watermarkAsset);
  watermarkPreview.innerHTML = watermark
    ? `<img src="${escapeAttr(watermark)}" alt="" />`
    : "No watermark selected";
}

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.categories.length) {
    window.alert("Add at least one category before uploading CAD data.");
    setView("taxonomy");
    return;
  }
  if (!state.genres.length) {
    window.alert("Add at least one genre before uploading CAD data.");
    setView("taxonomy");
    return;
  }

  const now = new Date().toISOString();
  const id = document.querySelector("#product-id").value || createId();
  const existing = state.products.find((product) => product.id === id);
  const product = normalizeProduct({
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
    primaryImage: pendingPrimaryImage || existing?.primaryImage || existing?.thumbnail || "",
    secondaryImage: pendingSecondaryImage || existing?.secondaryImage || "",
    thumbnail: pendingPrimaryImage || existing?.primaryImage || existing?.thumbnail || "",
    assets: existing?.assets || {},
    tags: getSelectedTags(),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  });

  if (isApiConfigured()) {
    setUploadStatus("Uploading to R2 through the Worker API...", "neutral");
    try {
      const remoteProduct = productPayloadForApi(product, existing);
      const result = await uploadProductToApi(remoteProduct);
      state = normalizeState(result.catalog || state);
      saveState();
      currentScope = "all";
      clearForm();
      setView("products");
      renderAll();
      setUploadStatus("Uploaded to R2 and saved to the catalog database.", "ok");
      return;
    } catch (error) {
      setUploadStatus(error.message || "R2 upload failed.", "error");
      window.alert(error.message || "R2 upload failed.");
      return;
    }
  }

  state.products = existing ? state.products.map((item) => (item.id === id ? product : item)) : [...state.products, product];
  normalizeGlobalOrder();
  ensureScopeOrders();
  saveState();
  currentScope = "all";
  clearForm();
  setView("products");
  renderAll();
  setUploadStatus("Saved locally in this browser. Configure Worker API to upload to R2.", "warn");
});

function productPayloadForApi(product, existing) {
  const noDataUrl = (value, fallback = "") => (isDataUrl(value) ? fallback : value);
  return {
    ...product,
    primaryImage: noDataUrl(product.primaryImage, existing?.primaryImage || existing?.thumbnail || ""),
    secondaryImage: noDataUrl(product.secondaryImage, existing?.secondaryImage || ""),
    thumbnail: noDataUrl(product.thumbnail, existing?.thumbnail || existing?.primaryImage || ""),
    assets: existing?.assets || product.assets || {},
  };
}

async function uploadProductToApi(product) {
  const formData = new FormData();
  formData.append("product", JSON.stringify(product));
  if (cadFile.files[0]) formData.append("package", cadFile.files[0]);
  if (primaryImageFile.files[0]) formData.append("previewPrimary", primaryImageFile.files[0]);
  if (secondaryImageFile.files[0]) formData.append("previewSecondary", secondaryImageFile.files[0]);
  return apiFetch("/admin/upload", {
    method: "POST",
    body: formData,
  });
}

async function apiFetch(path, options = {}) {
  const api = getApiConfig();
  if (!api.baseUrl) throw new Error("Worker API URL is not configured.");
  if (!api.token) throw new Error("Admin API token is not configured.");

  const headers = new Headers(options.headers || {});
  headers.set("x-dropworld-admin-token", api.token);
  const response = await fetch(`${api.baseUrl}${path}`, { ...options, headers });
  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { error: text };
  }
  if (!response.ok) throw new Error(payload.error || `Worker API returned ${response.status}.`);
  return payload;
}

function isDataUrl(value = "") {
  return String(value).startsWith("data:");
}

function renderTaxonomy() {
  document.querySelector("#category-count").textContent = `${state.categories.length}`;
  document.querySelector("#genre-count").textContent = `${state.genres.length}`;
  document.querySelector("#tag-count").textContent = `${state.tags.length}`;
  document.querySelector("#category-list").innerHTML = state.categories.length
    ? state.categories.map((item) => taxonomyMarkup(item, "category")).join("")
    : `<div class="empty-state">No categories yet.</div>`;
  document.querySelector("#genre-list").innerHTML = state.genres.length
    ? state.genres.map((item) => taxonomyMarkup(item, "genre")).join("")
    : `<div class="empty-state">No genres yet.</div>`;
  document.querySelector("#tag-list").innerHTML = state.tags.length
    ? state.tags.map((item) => taxonomyMarkup(item, "tag")).join("")
    : `<div class="empty-state">No tags yet.</div>`;
}

function taxonomyMarkup(item, type) {
  return `
    <div class="taxonomy-item">
      <div>
        <strong>${escapeHtml(type === "tag" ? `#${item.en}` : item.en)}</strong>
        <span>${escapeHtml(item.ja)} · ${escapeHtml(item.id)}</span>
      </div>
      <button class="icon-action danger" type="button" data-taxonomy="${type}" data-id="${escapeAttr(item.id)}">Delete</button>
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

document.querySelector("#tag-form").addEventListener("submit", (event) => {
  event.preventDefault();
  addTaxonomy("tags", document.querySelector("#tag-en"), document.querySelector("#tag-ja"));
});

function addTaxonomy(collection, enInput, jaInput) {
  const en = enInput.value.trim();
  const ja = jaInput.value.trim();
  if (!en || !ja) return;
  const id = slugify(en);
  if (!id) {
    window.alert("Use an English name that can become a URL slug.");
    return;
  }
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
  const type = button.dataset.taxonomy;
  const collection = type === "category" ? "categories" : type === "genre" ? "genres" : "tags";
  const id = button.dataset.id;

  if (type === "category" && state.products.some((product) => product.categoryId === id)) {
    window.alert("This category is used by CAD data.");
    return;
  }
  if (type === "genre" && state.products.some((product) => product.genreId === id)) {
    window.alert("This genre is used by CAD data.");
    return;
  }
  if (type === "tag" && state.products.some((product) => product.tags.includes(id))) {
    window.alert("This tag is used by CAD data.");
    return;
  }

  state[collection] = state[collection].filter((item) => item.id !== id);
  if (type === "category") delete state.sortOrders.categories[id];
  if (type === "genre") delete state.sortOrders.genres[id];
  if (type === "tag") delete state.sortOrders.tags[id];
  saveState();
  renderAll();
});

function fillPagesForm() {
  document.querySelector("#store-name").value = state.store.name;
  document.querySelector("#hero-eyebrow-en").value = state.pages.heroEyebrowEn;
  document.querySelector("#hero-eyebrow-ja").value = state.pages.heroEyebrowJa;
  document.querySelector("#hero-title-en").value = state.pages.heroTitleEn;
  document.querySelector("#hero-title-ja").value = state.pages.heroTitleJa;
  document.querySelector("#hero-cta-en").value = state.pages.heroCtaEn;
  document.querySelector("#about-title-en").value = state.pages.aboutTitleEn;
  document.querySelector("#about-title-ja").value = state.pages.aboutTitleJa;
  document.querySelector("#about-body-en").value = state.pages.aboutBodyEn;
  document.querySelector("#about-body-ja").value = state.pages.aboutBodyJa;
}

pagesForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.store.name = document.querySelector("#store-name").value.trim() || "DROP WORLD";
  state.pages.heroEyebrowEn = document.querySelector("#hero-eyebrow-en").value.trim();
  state.pages.heroEyebrowJa = document.querySelector("#hero-eyebrow-ja").value.trim();
  state.pages.heroTitleEn = document.querySelector("#hero-title-en").value.trim();
  state.pages.heroTitleJa = document.querySelector("#hero-title-ja").value.trim();
  state.pages.heroCtaEn = document.querySelector("#hero-cta-en").value.trim();
  state.pages.aboutTitleEn = document.querySelector("#about-title-en").value.trim();
  state.pages.aboutTitleJa = document.querySelector("#about-title-ja").value.trim();
  state.pages.aboutBodyEn = document.querySelector("#about-body-en").value.trim();
  state.pages.aboutBodyJa = document.querySelector("#about-body-ja").value.trim();
  saveState();
  window.alert("Fixed page copy saved.");
});

function createId() {
  if (globalThis.crypto?.randomUUID) return `p-${globalThis.crypto.randomUUID().slice(0, 8)}`;
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
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

async function initializeAdmin() {
  state = normalizeState(await loadState());
  saveState();
  setView(currentView);
  if (!LOGIN_REQUIRED || storageGet(SESSION_KEY) === "active") {
    showApp();
  } else {
    showAuth();
  }
}

initializeAdmin();
