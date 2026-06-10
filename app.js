const STORAGE_KEY = "dropworld_catalog_state";

const defaultCatalog = {
  store: { name: "DROP WORLD" },
  pages: {
    heroEyebrowEn: "Digital drawing assets for spatial stories",
    heroEyebrowJa: "空間の物語のためのデジタル図面素材",
    heroTitleEn: "CAD sets for quiet, detailed architecture presentations.",
    heroTitleJa: "静かで緻密な建築プレゼンのためのCADセット。",
    heroCtaEn: "Browse collection",
    aboutTitleEn: "Curated CAD fragments with the calm of a finished drawing.",
    aboutTitleJa: "完成図面の静けさをまとった、使いやすいCAD素材。",
    aboutBodyEn:
      "DROP WORLD is a CAD asset shop for landscape, architecture, and urban drawing assets. Each set is arranged for immediate placement into plans, sections, elevations, and axonometric scenes.",
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
  sortOrders: { all: [], categories: {}, genres: {}, tags: {} },
};

let catalog = loadCatalog();

const i18n = {
  en: {
    "nav.about": "About",
    "nav.cad": "Cad",
    "nav.language": "Language",
    "category.all": "All",
    "category.plan": "Plan",
    "category.section": "Section",
    "category.elevation": "Elevation",
    "category.axonometric": "Axonometric",
    "search.placeholder": "Search CAD",
    "hero.eyebrow": "Digital drawing assets for spatial stories",
    "hero.title": "CAD sets for quiet, detailed architecture presentations.",
    "hero.cta": "Browse collection",
    "about.kicker": "About",
    "about.title": "Curated CAD fragments with the calm of a finished drawing.",
    "about.body1":
      "DROP WORLD is a CAD asset shop for landscape, architecture, and urban drawing assets. Each set is arranged for immediate placement into plans, sections, elevations, and axonometric scenes.",
    "about.body2":
      "The storefront keeps browsing visual and fast: minimal filters, precise previews, soft transitions, and a catalogue that feels closer to a drawing archive than a standard ecommerce shelf.",
    "product.quickView": "Quick View",
    "product.add": "Add",
    "product.added": "Added",
    "product.meta": "DWG + AI + PNG",
    "product.set": "Set",
    "product.noResults": "No matching CAD sets found.",
    "svg.meta": "CAD BLOCKS / VECTOR / PNG",
    "document.title": "DROP WORLD",
  },
  ja: {
    "nav.about": "About",
    "nav.cad": "Cad",
    "nav.language": "Language",
    "category.all": "すべて",
    "category.plan": "平面",
    "category.section": "断面",
    "category.elevation": "立面",
    "category.axonometric": "アクソメ",
    "search.placeholder": "CADを検索",
    "hero.eyebrow": "空間の物語のためのデジタル図面素材",
    "hero.title": "静かで緻密な建築プレゼンのためのCADセット。",
    "hero.cta": "コレクションを見る",
    "about.kicker": "About",
    "about.title": "完成図面の静けさをまとった、使いやすいCAD素材。",
    "about.body1":
      "DROP WORLDは、ランドスケープ、建築、都市表現のための図面素材ショップです。平面、断面、立面、アクソメのシーンにすぐ配置できるように整理しています。",
    "about.body2":
      "閲覧は視覚的で軽やかに。最小限のフィルター、精密なプレビュー、やわらかな動きで、一般的なEC棚よりも図面アーカイブに近い体験を目指しています。",
    "product.quickView": "詳細を見る",
    "product.add": "追加",
    "product.added": "追加済み",
    "product.meta": "DWG + AI + PNG",
    "product.set": "セット",
    "product.noResults": "該当するCADセットがありません。",
    "svg.meta": "CADブロック / ベクター / PNG",
    "document.title": "DROP WORLD",
  },
};

const grid = document.querySelector("#product-grid");
const collectionTitle = document.querySelector("#collection-title");
const collectionTools = document.querySelector(".collection-tools");
const cadMenu = document.querySelector("#cad-menu");
const navToggles = [...document.querySelectorAll("[data-menu-toggle]")];
const navMenus = [...document.querySelectorAll(".nav-menu")];
const languageButtons = [...document.querySelectorAll("[data-language]")];
const searchInput = document.querySelector("#search-input");
const cartCount = document.querySelector("#cart-count");
const siteHeader = document.querySelector(".site-header");
let activeFilter = "all";
let activeLanguage = "en";
let cartItems = 0;

const slideButtons = [...document.querySelectorAll(".slide-index button")];
const heroSlides = [...document.querySelectorAll(".hero-slide")];
const HERO_SLIDE_INTERVAL = 3000;
let activeSlide = 0;
let heroTimer = window.setInterval(nextSlide, HERO_SLIDE_INTERVAL);

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
  next.pages = { ...defaultCatalog.pages, ...(value.pages || {}) };
  next.categories = Array.isArray(value.categories) ? value.categories : [];
  next.genres = Array.isArray(value.genres) && value.genres.length ? value.genres : defaultCatalog.genres;
  next.tags = Array.isArray(value.tags) ? value.tags : [];
  next.products = Array.isArray(value.products) ? value.products.map(normalizeProduct).filter((product) => product.status === "Published") : [];
  next.sortOrders = {
    all: Array.isArray(value.sortOrders?.all) ? value.sortOrders.all : next.products.map((product) => product.id),
    categories: value.sortOrders?.categories || {},
    genres: value.sortOrders?.genres || {},
    tags: value.sortOrders?.tags || {},
  };
  return next;
}

function normalizeProduct(product) {
  const genre = product.genreId || product.category || "plan";
  return {
    id: product.id || product.slug || `product-${Math.random().toString(36).slice(2)}`,
    title: product.titleEn || product.title || "Untitled CAD",
    titleJa: product.titleJa || product.titleEn || product.title || "無題のCAD",
    description: product.descriptionEn || "",
    descriptionJa: product.descriptionJa || "",
    categoryId: product.categoryId || "",
    genreId: genre,
    type: product.type || genre,
    status: product.status || "Draft",
    price: `$${Number(product.price || 0).toFixed(2)}`,
    priceValue: Number(product.price || 0),
    fileName: product.fileName || "",
    thumbnail: product.thumbnail || "",
    template: templateFor(product.type || genre),
    accent: accentFor(product.type || genre),
    tags: Array.isArray(product.tags) ? product.tags : [],
    order: Number(product.order || 0),
  };
}

function templateFor(type = "") {
  const key = type.toLowerCase();
  if (key.includes("section")) return "street";
  if (key.includes("elevation")) return "elevation";
  if (key.includes("axon")) return "axon";
  return "plan";
}

function accentFor(type = "") {
  const key = type.toLowerCase();
  if (key.includes("section")) return "#6570df";
  if (key.includes("elevation")) return "#a06a55";
  if (key.includes("axon")) return "#72aaa1";
  if (key.includes("bundle")) return "#9d7a5e";
  return "#83b8b0";
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

function scopeParts(scopeKey = activeFilter) {
  if (scopeKey === "all") return ["all", ""];
  const [type, id] = scopeKey.split(":");
  return [type, id];
}

function getScopeOrder(scopeKey = activeFilter) {
  const [type, id] = scopeParts(scopeKey);
  if (type === "category") return catalog.sortOrders.categories[id] || [];
  if (type === "genre") return catalog.sortOrders.genres[id] || [];
  if (type === "tag") return catalog.sortOrders.tags[id] || [];
  return catalog.sortOrders.all || [];
}

function sortByScope(list, scopeKey = activeFilter) {
  const order = getScopeOrder(scopeKey);
  const rank = new Map(order.map((id, index) => [id, index]));
  return [...list].sort((a, b) => {
    const aRank = rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER;
    const bRank = rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return Number(a.order || 0) - Number(b.order || 0);
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
);

function nextSlide() {
  setSlide((activeSlide + 1) % heroSlides.length);
}

function setSlide(index) {
  activeSlide = index;
  heroSlides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === activeSlide);
  });
  slideButtons.forEach((button, buttonIndex) => {
    button.classList.toggle("is-active", buttonIndex === activeSlide);
  });
}

slideButtons.forEach((button) => {
  button.addEventListener("click", () => {
    window.clearInterval(heroTimer);
    setSlide(Number(button.dataset.slide));
    heroTimer = window.setInterval(nextSlide, HERO_SLIDE_INTERVAL);
  });
});

navToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const menu = document.querySelector(`#${toggle.dataset.menuToggle}`);
    const willOpen = !menu.classList.contains("is-open");
    closeMenus(toggle.dataset.menuToggle);
    menu.classList.toggle("is-open", willOpen);
    toggle.setAttribute("aria-expanded", String(willOpen));
  });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".main-nav")) {
    closeMenus();
  }
});

function closeMenus(exceptId = "") {
  navMenus.forEach((menu) => {
    if (menu.id !== exceptId) {
      menu.classList.remove("is-open");
    }
  });
  navToggles.forEach((toggle) => {
    if (toggle.dataset.menuToggle !== exceptId) {
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

collectionTools.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  setFilter(button.dataset.filter);
});

cadMenu.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  setFilter(button.dataset.filter);
  closeMenus();
  document.querySelector("#products").scrollIntoView({ behavior: "smooth", block: "start" });
});

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setLanguage(button.dataset.language);
    closeMenus();
  });
});

searchInput.addEventListener("input", renderProducts);
window.addEventListener("scroll", updateHeaderState, { passive: true });

function updateHeaderState() {
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 24);
}

function t(key) {
  return i18n[activeLanguage][key] || i18n.en[key] || key;
}

function setLanguage(language) {
  activeLanguage = language;
  document.documentElement.lang = language;
  document.title = t("document.title");

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  });

  languageButtons.forEach((button) => {
    button.classList.toggle("is-current", button.dataset.language === activeLanguage);
  });
  applyCatalogCopy();
  renderDynamicFilters();
  collectionTitle.textContent = filterTitle(activeFilter);
  renderProducts();
}

function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === filter);
  });
  collectionTitle.textContent = filterTitle(filter);
  renderProducts();
}

function renderDynamicFilters() {
  const filterItems = [
    { key: "all", label: t("category.all") },
    ...catalog.genres.map((item) => ({ key: `genre:${item.id}`, label: localized(item) })),
    ...catalog.categories.map((item) => ({ key: `category:${item.id}`, label: localized(item) })),
    ...catalog.tags.map((item) => ({ key: `tag:${item.id}`, label: `#${localized(item)}` })),
  ];

  collectionTools.innerHTML = filterItems
    .map(
      (item) => `
        <button class="filter-button ${item.key === activeFilter ? "is-active" : ""}" type="button" data-filter="${escapeAttr(item.key)}">
          ${escapeHtml(item.label)}
        </button>
      `,
    )
    .join("");

  cadMenu.innerHTML = catalog.genres
    .map(
      (item) => `
        <button class="${`genre:${item.id}` === activeFilter ? "is-current" : ""}" type="button" data-filter="genre:${escapeAttr(item.id)}">
          ${escapeHtml(localized(item))}
        </button>
      `,
    )
    .join("");
}

function applyCatalogCopy() {
  const first = document.querySelector(".brand span:first-child");
  const second = document.querySelector(".brand span:last-child");
  const nameParts = (catalog.store.name || "DROP WORLD").split(/\s+/);
  first.textContent = nameParts[0] || "DROP";
  second.textContent = nameParts.slice(1).join(" ") || "WORLD";
  document.title = catalog.store.name || t("document.title");

  document.querySelector("[data-i18n='hero.eyebrow']").textContent =
    activeLanguage === "ja" ? catalog.pages.heroEyebrowJa : catalog.pages.heroEyebrowEn;
  document.querySelector("[data-i18n='hero.title']").textContent =
    activeLanguage === "ja" ? catalog.pages.heroTitleJa : catalog.pages.heroTitleEn;
  document.querySelector("[data-i18n='hero.cta']").textContent = activeLanguage === "ja" ? t("hero.cta") : catalog.pages.heroCtaEn;
  document.querySelector("[data-i18n='about.title']").textContent =
    activeLanguage === "ja" ? catalog.pages.aboutTitleJa : catalog.pages.aboutTitleEn;
  document.querySelector("[data-i18n='about.body1']").textContent =
    activeLanguage === "ja" ? catalog.pages.aboutBodyJa : catalog.pages.aboutBodyEn;
  document.querySelector("[data-i18n='about.body2']").textContent =
    activeLanguage === "ja"
      ? "商品データ、分類、タグ、固定ページは管理画面から編集できます。本番ではConoHaのPHP/MySQLに接続します。"
      : "Product data, taxonomy, tags, and fixed pages can be edited from the admin. Production storage will connect to ConoHa PHP/MySQL.";
}

function filterTitle(filter) {
  const [type, id] = scopeParts(filter);
  if (type === "category") return `${localized(getCategory(id))} CAD Sets`;
  if (type === "genre") return `${localized(getGenre(id))} CAD Sets`;
  if (type === "tag") return `#${localized(getTag(id))}`;
  return activeLanguage === "ja" ? "CADセット一覧" : "All CAD Sets";
}

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const [filterType, filterId] = scopeParts(activeFilter);
  const filtered = sortByScope(catalog.products, activeFilter).filter((product) => {
    const matchesFilter =
      filterType === "all" ||
      (filterType === "category" && product.categoryId === filterId) ||
      (filterType === "genre" && product.genreId === filterId) ||
      (filterType === "tag" && product.tags.includes(filterId));
    const tagText = product.tags.map((tagId) => localized(getTag(tagId))).join(" ");
    const searchable =
      `${product.title} ${product.titleJa} ${localized(getCategory(product.categoryId))} ${localized(getGenre(product.genreId))} ${tagText} ${product.fileName}`.toLowerCase();
    return matchesFilter && searchable.includes(query);
  });

  grid.innerHTML = filtered.length
    ? filtered.map((product, index) => productCard(product, index)).join("")
    : `<p class="no-results">${catalog.products.length ? t("product.noResults") : emptyCatalogMessage()}</p>`;

  grid.querySelectorAll(".product-card").forEach((card, index) => {
    card.style.transitionDelay = `${Math.min(index * 55, 440)}ms`;
    revealObserver.observe(card);
  });

  grid.querySelectorAll(".add-button").forEach((button) => {
    button.addEventListener("click", () => {
      cartItems += 1;
      cartCount.textContent = String(cartItems);
      button.classList.add("is-added");
      button.querySelector("span").textContent = t("product.added");
      window.setTimeout(() => {
        button.classList.remove("is-added");
        button.querySelector("span").textContent = t("product.add");
      }, 1200);
    });
  });
}

function productCard(product, index) {
  const title = productTitle(product);
  const genre = localized(getGenre(product.genreId));
  const category = product.categoryId ? localized(getCategory(product.categoryId)) : genre;
  const tags = product.tags.map((tagId) => `#${localized(getTag(tagId))}`).join(" ");
  return `
    <article class="product-card" style="--accent: ${product.accent}">
      <div class="preview" aria-label="${title} preview">
        ${product.thumbnail ? `<img class="uploaded-preview main" src="${escapeAttr(product.thumbnail)}" alt="${escapeAttr(title)}" />` : cadSvg(product, index, "main")}
        ${cadSvg(product, index + 9, "alt")}
        <button class="quick-view" type="button" aria-label="${t("product.quickView")} ${title}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
          ${t("product.quickView")}
        </button>
      </div>
      <div class="product-info">
        <p class="product-category">${category} / ${genre} / ${t("product.meta")}</p>
        <h3 class="product-title">${title}</h3>
        <p class="product-tags">${tags}</p>
        <div class="product-row">
          <span class="price">${product.price}</span>
          <button class="add-button" type="button" aria-label="${t("product.add")} ${title}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
            <span>${t("product.add")}</span>
          </button>
        </div>
      </div>
    </article>
  `;
}

function label(category) {
  return localized(getGenre(category));
}

function productTitle(product) {
  return activeLanguage === "ja" ? product.titleJa : product.title;
}

function localized(item) {
  if (!item) return "";
  return activeLanguage === "ja" ? item.ja || item.en || item.id : item.en || item.ja || item.id;
}

function emptyCatalogMessage() {
  return activeLanguage === "ja"
    ? "まだ公開中のCAD商品がありません。管理画面から商品を追加するとここに表示されます。"
    : "No published CAD items yet. Upload a product in the admin to display it here.";
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

function cadSvg(product, seed, tone) {
  const alternate = tone === "alt";
  const title = productTitle(product);
  const body = {
    street: streetScene,
    plan: planScene,
    elevation: elevationScene,
    axon: axonScene,
  }[product.template](product, seed, alternate);

  return `
    <svg class="${tone}" viewBox="0 0 640 720" role="img" aria-label="${title}">
      <defs>
        <pattern id="grid-${product.id}-${tone}" width="34" height="34" patternUnits="userSpaceOnUse">
          <path d="M 34 0 L 0 0 0 34" fill="none" stroke="#d8dbd7" stroke-width="1" />
        </pattern>
        <filter id="soft-${product.id}-${tone}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#222725" flood-opacity="0.07" />
        </filter>
      </defs>
      <rect width="640" height="720" fill="${alternate ? "#f1f4f1" : "#f8f8f5"}" />
      <rect x="22" y="22" width="596" height="596" fill="url(#grid-${product.id}-${tone})" opacity="${alternate ? 0.42 : 0.28}" />
      ${body}
      <g transform="translate(42 652)">
        <text x="0" y="0" fill="#2a2f2d" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700">${localized(getGenre(product.genreId))} ${t("product.set")}</text>
        <text x="0" y="28" fill="#7a817e" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700">${t("svg.meta")}</text>
      </g>
    </svg>
  `;
}

function streetScene(product, seed, alternate) {
  const accent = product.accent;
  const filter = `url(#soft-${product.id}-${alternate ? "alt" : "main"})`;
  const shift = alternate ? 26 : 0;
  const trees = [86, 478, 558].map((x, i) => tree(x - shift * 0.4, 438 - i * 18, 1 + i * 0.09, accent)).join("");
  const people = [180, 255, 335, 414, 502].map((x, i) => person(x + (alternate ? 12 : 0), 510 + (i % 2) * 6, i)).join("");
  const windows = Array.from({ length: 8 }, (_, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 66 + col * 118 + (row ? 14 : 0);
    const y = 92 + row * 138;
    return windowUnit(x, y, alternate && i % 2 === 0);
  }).join("");

  return `
    <g filter="${filter}">
      <rect x="46" y="62" width="548" height="410" fill="#eeeeec" stroke="#c2c6c2" stroke-width="2" />
      <rect x="392" y="62" width="202" height="410" fill="#e2e4e2" stroke="#bcc0bd" stroke-width="2" />
      <path d="M46 154H594 M46 290H594 M46 430H594" stroke="#c8ccc8" stroke-width="3" />
      ${windows}
      <g stroke="#2f3533" stroke-width="3.5" fill="none">
        <path d="M143 268h194v44H143z" />
        <path d="M161 278h50v24h-50zM228 278h82v24h-82z" />
        <path d="M143 312v30M337 312v30" />
        <path d="M138 405h210v41H138z" />
        <path d="M158 416h58v22h-58zM234 416h84v22h-84z" />
      </g>
      <rect x="46" y="472" width="548" height="78" fill="#f6f6f2" stroke="#d0d3d0" stroke-width="2" />
      <path d="M46 524H594 M46 548H594" stroke="#d4d8d4" stroke-width="1.6" />
      <path d="M46 588H594" stroke="#b9bdb9" stroke-width="3" />
      ${trees}
      ${people}
      ${car(332 + shift, 570, 1, "#cfd2cf")}
      ${car(470 - shift, 570, 0.82, "#d8dad7")}
      <circle cx="${alternate ? 504 : 520}" cy="118" r="52" fill="${accent}" opacity="0.92" />
      <text x="${alternate ? 475 : 490}" y="108" fill="#fff" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="700">CAD</text>
      <text x="${alternate ? 462 : 477}" y="133" fill="#fff" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="700">LIBRARY</text>
    </g>
  `;
}

function planScene(product, seed, alternate) {
  const accent = product.accent;
  const filter = `url(#soft-${product.id}-${alternate ? "alt" : "main"})`;
  const rotation = alternate ? "rotate(-3 320 310)" : "rotate(0 320 310)";
  const plantDots = [
    [116, 162],
    [498, 148],
    [524, 438],
    [118, 458],
    [298, 514],
  ]
    .map(([x, y], i) => planPlant(x + (alternate ? i * 5 : 0), y, accent, 0.86 + i * 0.04))
    .join("");

  return `
    <g transform="${rotation}" filter="${filter}">
      <rect x="76" y="86" width="488" height="468" fill="#f9f9f6" stroke="#aeb4af" stroke-width="3" />
      <path d="M76 234H284V86M284 234V554M76 370h208M416 86v176h148M416 262v292M284 388h280" fill="none" stroke="#8f9692" stroke-width="7" stroke-linecap="square" />
      <path d="M111 121h120v76H111zM324 116h62v110h-62zM454 121h75v96h-75zM112 402h112v107H112zM326 423h64v86h-64zM449 420h78v82h-78z" fill="none" stroke="#c4c9c5" stroke-width="4" />
      <g stroke="#2f3533" stroke-width="2.4" fill="none">
        <path d="M154 288h72v38h-72zM340 306h98v50h-98zM445 294c34 0 61 22 61 50" />
        <path d="M145 150c38 0 68 22 68 50M345 134h28v75M472 138h37v64M136 430h64v48M344 442h30v48" />
      </g>
      <g stroke="${accent}" stroke-width="3" fill="none" opacity="0.75">
        <path d="M96 278c54-28 112-26 164 6M330 176c36-28 80-28 116 0M425 474c30-29 70-30 104-3" />
      </g>
      ${plantDots}
      ${furniturePlan(322, 294, alternate)}
      <rect x="102" y="580" width="188" height="18" fill="#e7e8e4" stroke="#c9cdc8" />
      <rect x="308" y="580" width="230" height="18" fill="#e7e8e4" stroke="#c9cdc8" />
    </g>
  `;
}

function elevationScene(product, seed, alternate) {
  const accent = product.accent;
  const filter = `url(#soft-${product.id}-${alternate ? "alt" : "main"})`;
  const roof = alternate ? "M86 172 278 94 562 172" : "M78 165 316 78 568 165";
  const windows = Array.from({ length: 9 }, (_, i) => {
    const x = 105 + (i % 3) * 139;
    const y = 203 + Math.floor(i / 3) * 104;
    return tallWindow(x + (alternate && i % 2 ? 14 : 0), y);
  }).join("");

  return `
    <g filter="${filter}">
      <path d="${roof}" fill="none" stroke="#b8bdb9" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
      <rect x="82" y="166" width="480" height="352" fill="#f4f4f0" stroke="#b6bbb7" stroke-width="3" />
      <rect x="410" y="166" width="152" height="352" fill="#e7e8e5" stroke="#c2c7c3" stroke-width="2" />
      <path d="M82 274H562M82 386H562" stroke="#d1d5d1" stroke-width="3" />
      ${windows}
      <g fill="none" stroke="#313735" stroke-width="3.8">
        <path d="M126 478h178v40M142 478v-55h145v55" />
        <path d="M430 518V402h74v116M438 418h58M438 442h58M438 466h58" />
      </g>
      <rect x="60" y="518" width="528" height="46" fill="#f8f7f3" stroke="#cbd0cc" stroke-width="2" />
      ${tree(116, 508, 1.22, accent)}
      ${tree(506, 502, 1.08, accent)}
      ${shrubs(214, 540, accent)}
      ${shrubs(356, 542, accent)}
      ${person(322, 502, 1)}
      ${person(388, 504, 3)}
      <g stroke="${accent}" stroke-width="3" opacity="0.72">
        <path d="M94 596H548" />
        <path d="M94 606H548" opacity="0.4" />
      </g>
    </g>
  `;
}

function axonScene(product, seed, alternate) {
  const accent = product.accent;
  const filter = `url(#soft-${product.id}-${alternate ? "alt" : "main"})`;
  const ox = alternate ? 18 : 0;
  return `
    <g transform="translate(${ox} 0)" filter="${filter}">
      <path d="M320 96 548 226 320 356 92 226z" fill="#f5f5f1" stroke="#bbc1bc" stroke-width="3" />
      <path d="M92 226v178l228 130 228-130V226" fill="#ededeb" stroke="#bbc1bc" stroke-width="3" />
      <path d="M320 356v178" stroke="#b9beb9" stroke-width="3" />
      <path d="M92 226 320 356 548 226" fill="none" stroke="#aeb4af" stroke-width="3" />
      <path d="M174 225 320 142 466 225 320 308z" fill="${accent}" opacity="0.34" stroke="${accent}" stroke-width="3" />
      <path d="M220 206 320 150 420 206 320 262z" fill="#fbfbf8" stroke="#c7ccc8" stroke-width="2" />
      <g stroke="#8d9490" stroke-width="1.5" opacity="0.6">
        ${isoLines(128, 262, 385)}
      </g>
      ${isoBlock(360, 218, 74, 56, 82, "#ffffff")}
      ${isoBlock(208, 260, 84, 62, 58, "#f4f3ef")}
      ${isoBlock(385, 336, 78, 52, 44, "#f7f7f3")}
      ${axonTree(168, 214, accent, 1.05)}
      ${axonTree(472, 250, accent, 0.9)}
      ${axonTree(246, 354, accent, 0.96)}
      ${axonPerson(300, 300)}
      ${axonPerson(348, 276)}
      <path d="M244 438c52 26 102 25 152-2" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round" opacity="0.52" />
      <path d="M184 486 320 564 456 486" fill="none" stroke="#c3c8c4" stroke-width="2" stroke-dasharray="5 7" />
    </g>
  `;
}

function windowUnit(x, y, active) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="76" height="82" fill="${active ? "#fbfbf9" : "#eeeeec"}" stroke="#b8bdb9" stroke-width="3" />
      <path d="M${x + 12} ${y + 18}h52M${x + 12} ${y + 42}h52M${x + 38} ${y + 8}v64" stroke="#c5cac5" stroke-width="2" />
      ${active ? person(x + 39, y + 64, 2, 0.62) : ""}
    </g>
  `;
}

function tallWindow(x, y) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="76" height="72" fill="#f7f7f4" stroke="#c0c5c1" stroke-width="3" />
      <path d="M${x + 14} ${y + 18}h48M${x + 14} ${y + 42}h48M${x + 38} ${y + 8}v56" stroke="#cbd0cc" stroke-width="2" />
    </g>
  `;
}

function tree(x, y, scale, color) {
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <path d="M0 0c14-48 4-96 31-130M0 0c-18-55-8-112-45-148" stroke="#313735" stroke-width="4" fill="none" stroke-linecap="round" />
      <path d="M-52-126c-36 18-51 56-34 85 16 28 57 28 94 14 44-17 62-51 47-82-16-34-68-36-107-17z" fill="${color}" opacity="0.42" stroke="#8ba49d" />
      <path d="M-92-54c28-20 56-32 100-33M-46-150c20 44 18 70 5 110M24-130c-28 34-42 61-45 96" stroke="#5d6a66" stroke-width="1.4" fill="none" opacity="0.45" />
    </g>
  `;
}

function shrubs(x, y, color) {
  return `
    <g transform="translate(${x} ${y})">
      <path d="M-58 0c18-34 52-42 82-25 27-18 68-2 78 25z" fill="${color}" opacity="0.34" stroke="#95aaa4" stroke-width="2" />
      <path d="M-33-4c14-12 31-18 51-13M22-9c16-11 34-12 55-2" stroke="#596561" stroke-width="1.3" fill="none" opacity="0.46" />
    </g>
  `;
}

function person(x, y, variant = 0, scale = 1) {
  const dark = variant % 2 ? "#383d3b" : "#8f9693";
  return `
    <g transform="translate(${x} ${y}) scale(${scale})" stroke="${dark}" stroke-width="3" stroke-linecap="round" fill="none">
      <circle cx="0" cy="-30" r="8" fill="${dark}" stroke="none" opacity="0.85" />
      <path d="M0-20v34" />
      <path d="M0-6l${variant % 2 ? 15 : -13}-12" />
      <path d="M0 14l-12 26M0 14l16 24" />
    </g>
  `;
}

function car(x, y, scale, fill) {
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <path d="M-54 5h96c17 0 31 13 31 29v4H-76v-8c0-14 9-25 22-25z" fill="${fill}" stroke="#aeb4af" stroke-width="3" />
      <path d="M-30 5c15-28 55-28 76 0" fill="#eeeeec" stroke="#aeb4af" stroke-width="3" />
      <circle cx="-35" cy="40" r="12" fill="#f7f7f5" stroke="#868d89" stroke-width="4" />
      <circle cx="38" cy="40" r="12" fill="#f7f7f5" stroke="#868d89" stroke-width="4" />
    </g>
  `;
}

function planPlant(x, y, color, scale) {
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <circle cx="0" cy="0" r="32" fill="${color}" opacity="0.2" stroke="${color}" stroke-width="3" />
      <path d="M0-30v60M-30 0h60M-22-22l44 44M22-22-22 22" stroke="#5e6c68" stroke-width="1.4" opacity="0.48" />
    </g>
  `;
}

function furniturePlan(x, y, alternate) {
  const rotate = alternate ? "rotate(12)" : "rotate(0)";
  return `
    <g transform="translate(${x} ${y}) ${rotate}" stroke="#606866" stroke-width="2.4" fill="none">
      <rect x="-44" y="-26" width="88" height="52" rx="26" />
      <circle cx="-68" cy="-32" r="16" />
      <circle cx="68" cy="-32" r="16" />
      <circle cx="-68" cy="32" r="16" />
      <circle cx="68" cy="32" r="16" />
    </g>
  `;
}

function isoLines(x, y, length) {
  return Array.from({ length: 9 }, (_, i) => {
    const offset = i * 27;
    return `<path d="M${x + offset} ${y - offset * 0.57}l${length} ${length * 0.56}" />`;
  }).join("");
}

function isoBlock(x, y, w, d, h, fill) {
  return `
    <g>
      <path d="M${x} ${y}l${w} ${w * 0.52}l-${d} ${d * 0.52}l-${w} -${w * 0.52}z" fill="${fill}" stroke="#aeb4af" stroke-width="2" />
      <path d="M${x} ${y}v${h}l${w} ${w * 0.52}v-${h}z" fill="#e7e9e7" stroke="#aeb4af" stroke-width="2" />
      <path d="M${x + w} ${y + w * 0.52}v${h}l-${d} ${d * 0.52}v-${h}z" fill="#d8ddda" stroke="#aeb4af" stroke-width="2" />
    </g>
  `;
}

function axonTree(x, y, color, scale) {
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <path d="M0 44V0" stroke="#5f6864" stroke-width="4" stroke-linecap="round" />
      <ellipse cx="0" cy="-4" rx="42" ry="25" fill="${color}" opacity="0.45" stroke="#8aa59e" stroke-width="2" />
      <ellipse cx="-18" cy="14" rx="34" ry="19" fill="${color}" opacity="0.28" stroke="#8aa59e" stroke-width="1.5" />
    </g>
  `;
}

function axonPerson(x, y) {
  return `
    <g transform="translate(${x} ${y})" stroke="#3d4441" stroke-width="2.6" stroke-linecap="round" fill="none">
      <circle cx="0" cy="-13" r="5" fill="#3d4441" stroke="none" />
      <path d="M0-8v22M0 4l-11 10M0 14l-7 18M0 14l13 15" />
    </g>
  `;
}

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
updateHeaderState();
setLanguage("en");
