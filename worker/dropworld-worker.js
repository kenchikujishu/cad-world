const DEFAULT_CATALOG_KEY = "database/catalog.json";
const DEFAULT_KEY_PREFIX = "drop-world";
const DOWNLOAD_TTL_SECONDS = 60 * 10;

const DEFAULT_CATALOG = {
  version: 5,
  storage: {
    provider: "cloudflare-r2",
    publicBucket: "",
    privateBucket: "",
    keyPrefix: DEFAULT_KEY_PREFIX,
    publicBaseUrl: "",
    apiBaseUrl: "",
  },
  store: { name: "DROP WORLD" },
  settings: { watermarkImage: "", watermarkAsset: null },
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    try {
      if (url.pathname === "/health") {
        return json(request, env, { ok: true, service: "dropworld-api" });
      }

      if (url.pathname === "/catalog" && request.method === "GET") {
        return json(request, env, await getCatalog(env));
      }

      if (url.pathname === "/admin/upload" && request.method === "POST") {
        requireAdmin(request, env);
        return json(request, env, await uploadProduct(request, env));
      }

      if (url.pathname === "/admin/watermark" && request.method === "POST") {
        requireAdmin(request, env);
        return json(request, env, await uploadWatermark(request, env));
      }

      if (url.pathname === "/admin/catalog" && request.method === "PUT") {
        requireAdmin(request, env);
        const catalog = normalizeCatalog(await request.json(), env);
        await saveCatalog(env, catalog);
        return json(request, env, { ok: true, catalog });
      }

      if (url.pathname === "/purchase-demo" && request.method === "POST") {
        return json(request, env, await createDemoPurchase(request, env));
      }

      if (url.pathname === "/download" && request.method === "GET") {
        return downloadPurchasedFile(request, env);
      }

      return json(request, env, { error: "Not found" }, 404);
    } catch (error) {
      const status = error.status || 500;
      return json(request, env, { error: error.message || "Server error" }, status);
    }
  },
};

async function uploadProduct(request, env) {
  assertBuckets(env);
  const form = await request.formData();
  const rawProduct = form.get("product");
  if (!rawProduct) throw httpError(400, "Missing product metadata.");

  const submitted = JSON.parse(rawProduct);
  const now = new Date().toISOString();
  const catalog = await getCatalog(env);
  const existing = catalog.products.find((product) => product.id === submitted.id);
  const id = submitted.id || createId();
  const slug = submitted.slug || slugify(submitted.titleEn || id);
  const keyPrefix = catalog.storage.keyPrefix || env.KEY_PREFIX || DEFAULT_KEY_PREFIX;
  const productPrefix = `${keyPrefix}/products/${slug}`;

  const next = {
    ...existing,
    ...submitted,
    id,
    slug,
    createdAt: existing?.createdAt || submitted.createdAt || now,
    updatedAt: now,
    assets: {
      ...(existing?.assets || {}),
      ...(submitted.assets || {}),
      provider: "r2",
    },
  };

  const primary = form.get("previewPrimary");
  if (isUpload(primary)) {
    const key = `${productPrefix}/preview-01.${extensionFor(primary.name, primary.type, "webp")}`;
    await putObject(env.PUBLIC_BUCKET, key, primary);
    next.primaryImage = publicAssetUrl(env, key);
    next.thumbnail = next.primaryImage;
    next.assets.previewPrimary = publicAsset("previewPrimary", env, key, primary);
  }

  const secondary = form.get("previewSecondary");
  if (isUpload(secondary)) {
    const key = `${productPrefix}/preview-02.${extensionFor(secondary.name, secondary.type, "webp")}`;
    await putObject(env.PUBLIC_BUCKET, key, secondary);
    next.secondaryImage = publicAssetUrl(env, key);
    next.assets.previewSecondary = publicAsset("previewSecondary", env, key, secondary);
  }

  const packageFile = form.get("package");
  if (isUpload(packageFile)) {
    const safeName = safeFileName(packageFile.name || `${slug}.zip`);
    const key = `${productPrefix}/${safeName}`;
    await putObject(env.PRIVATE_BUCKET, key, packageFile);
    next.fileName = safeName;
    next.assets.package = {
      provider: "r2",
      bucket: env.PRIVATE_BUCKET_NAME || catalog.storage.privateBucket || "",
      private: true,
      key,
      fileName: safeName,
      contentType: packageFile.type || contentTypeFor(safeName),
      size: packageFile.size || 0,
    };
  }

  catalog.products = existing
    ? catalog.products.map((product) => (product.id === existing.id ? next : product))
    : [...catalog.products, next];
  catalog.sortOrders.all = mergeOrder(catalog.sortOrders.all, catalog.products.map((product) => product.id));
  catalog.storage = storageWithEnv(catalog.storage, env);
  await saveCatalog(env, catalog);

  return { ok: true, product: next, catalog };
}

async function uploadWatermark(request, env) {
  assertBuckets(env);
  const form = await request.formData();
  const file = form.get("watermark");
  if (!isUpload(file)) throw httpError(400, "Missing watermark image.");

  const catalog = await getCatalog(env);
  const keyPrefix = catalog.storage.keyPrefix || env.KEY_PREFIX || DEFAULT_KEY_PREFIX;
  const key = `${keyPrefix}/system/watermark/${safeFileName(file.name || "dropworld-watermark.png")}`;
  await putObject(env.PUBLIC_BUCKET, key, file);

  catalog.settings = {
    ...(catalog.settings || {}),
    watermarkImage: "",
    watermarkAsset: publicAsset("watermark", env, key, file),
  };
  catalog.storage = storageWithEnv(catalog.storage, env);
  await saveCatalog(env, catalog);

  return { ok: true, settings: catalog.settings, catalog };
}

async function createDemoPurchase(request, env) {
  const { productId } = await request.json();
  if (!productId) throw httpError(400, "Missing product id.");

  const catalog = await getCatalog(env);
  const product = catalog.products.find((item) => item.id === productId || item.slug === productId);
  if (!product) throw httpError(404, "Product not found.");

  const packageAsset = product.assets?.package;
  if (!packageAsset?.key) throw httpError(404, "No private package is attached to this product.");

  const expires = Math.floor(Date.now() / 1000) + DOWNLOAD_TTL_SECONDS;
  const signature = await signDownload(env, product.id, packageAsset.key, expires);
  const url = new URL(request.url);
  url.pathname = "/download";
  url.search = new URLSearchParams({
    productId: product.id,
    expires: String(expires),
    signature,
  }).toString();

  return {
    ok: true,
    message: "Demo purchase accepted.",
    expires,
    downloadUrl: url.toString(),
  };
}

async function downloadPurchasedFile(request, env) {
  assertBuckets(env);
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId") || "";
  const expires = Number(url.searchParams.get("expires") || 0);
  const signature = url.searchParams.get("signature") || "";

  if (!productId || !expires || !signature) throw httpError(400, "Invalid download URL.");
  if (expires < Math.floor(Date.now() / 1000)) throw httpError(403, "Download URL has expired.");

  const catalog = await getCatalog(env);
  const product = catalog.products.find((item) => item.id === productId);
  const packageAsset = product?.assets?.package;
  if (!product || !packageAsset?.key) throw httpError(404, "Product package not found.");

  const expected = await signDownload(env, product.id, packageAsset.key, expires);
  if (!constantTimeEqual(signature, expected)) throw httpError(403, "Invalid download signature.");

  const object = await env.PRIVATE_BUCKET.get(packageAsset.key);
  if (!object) throw httpError(404, "The private R2 file is not uploaded yet.");

  const headers = corsHeaders(request, env);
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("content-disposition", `attachment; filename="${safeHeaderFileName(packageAsset.fileName || product.fileName || "dropworld-cad.zip")}"`);
  return new Response(object.body, { headers });
}

async function getCatalog(env) {
  assertPublicBucket(env);
  const key = env.CATALOG_KEY || DEFAULT_CATALOG_KEY;
  const object = await env.PUBLIC_BUCKET.get(key);
  if (!object) return normalizeCatalog(DEFAULT_CATALOG, env);
  return normalizeCatalog(await object.json(), env);
}

async function saveCatalog(env, catalog) {
  assertPublicBucket(env);
  await env.PUBLIC_BUCKET.put(env.CATALOG_KEY || DEFAULT_CATALOG_KEY, JSON.stringify(normalizeCatalog(catalog, env), null, 2), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  });
}

function normalizeCatalog(value, env) {
  const catalog = {
    ...DEFAULT_CATALOG,
    ...value,
    storage: storageWithEnv({ ...DEFAULT_CATALOG.storage, ...(value.storage || {}) }, env),
    store: { ...DEFAULT_CATALOG.store, ...(value.store || {}) },
    settings: { ...DEFAULT_CATALOG.settings, ...(value.settings || {}) },
    categories: Array.isArray(value.categories) ? value.categories : [],
    genres: Array.isArray(value.genres) && value.genres.length ? value.genres : DEFAULT_CATALOG.genres,
    tags: Array.isArray(value.tags) ? value.tags : [],
    products: Array.isArray(value.products) ? value.products : [],
    sortOrders: {
      all: Array.isArray(value.sortOrders?.all) ? value.sortOrders.all : [],
      categories: value.sortOrders?.categories || {},
      genres: value.sortOrders?.genres || {},
      tags: value.sortOrders?.tags || {},
    },
  };
  catalog.sortOrders.all = mergeOrder(catalog.sortOrders.all, catalog.products.map((product) => product.id));
  return catalog;
}

function storageWithEnv(storage, env) {
  return {
    ...storage,
    publicBucket: env.PUBLIC_BUCKET_NAME || storage.publicBucket || storage.bucket || "",
    privateBucket: env.PRIVATE_BUCKET_NAME || storage.privateBucket || "",
    keyPrefix: env.KEY_PREFIX || storage.keyPrefix || DEFAULT_KEY_PREFIX,
    publicBaseUrl: trimSlash(env.PUBLIC_BASE_URL || storage.publicBaseUrl || ""),
    apiBaseUrl: trimSlash(env.API_BASE_URL || storage.apiBaseUrl || ""),
  };
}

async function putObject(bucket, key, file) {
  await bucket.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type || contentTypeFor(file.name),
    },
  });
}

function publicAsset(kind, env, key, file) {
  return {
    provider: "r2",
    bucket: env.PUBLIC_BUCKET_NAME || "",
    key,
    url: publicAssetUrl(env, key),
    contentType: file.type || contentTypeFor(file.name),
    size: file.size || 0,
    kind,
  };
}

function publicAssetUrl(env, key) {
  const base = trimSlash(env.PUBLIC_BASE_URL || "");
  return base ? `${base}/${key}` : "";
}

function requireAdmin(request, env) {
  if (!env.ADMIN_TOKEN) throw httpError(503, "ADMIN_TOKEN is not configured on the Worker.");
  const bearer = request.headers.get("authorization") || "";
  const headerToken = request.headers.get("x-dropworld-admin-token") || "";
  const token = bearer.startsWith("Bearer ") ? bearer.slice(7) : headerToken;
  if (token !== env.ADMIN_TOKEN) throw httpError(401, "Admin token is invalid.");
}

async function signDownload(env, productId, key, expires) {
  if (!env.DOWNLOAD_SECRET) throw httpError(503, "DOWNLOAD_SECRET is not configured on the Worker.");
  const message = `${productId}:${key}:${expires}`;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.DOWNLOAD_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
  return base64Url(signature);
}

function corsHeaders(request, env) {
  const headers = new Headers();
  const origin = request.headers.get("origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!origin || allowed.includes(origin)) {
    headers.set("access-control-allow-origin", origin || allowed[0] || "*");
  }
  headers.set("vary", "Origin");
  headers.set("access-control-allow-methods", "GET,POST,PUT,OPTIONS");
  headers.set("access-control-allow-headers", "content-type,authorization,x-dropworld-admin-token");
  headers.set("access-control-max-age", "86400");
  return headers;
}

function json(request, env, data, status = 200) {
  const headers = corsHeaders(request, env);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { status, headers });
}

function assertBuckets(env) {
  assertPublicBucket(env);
  if (!env.PRIVATE_BUCKET) throw httpError(503, "PRIVATE_BUCKET binding is missing.");
}

function assertPublicBucket(env) {
  if (!env.PUBLIC_BUCKET) throw httpError(503, "PUBLIC_BUCKET binding is missing.");
}

function isUpload(value) {
  return value && typeof value === "object" && typeof value.stream === "function" && Number(value.size || 0) > 0;
}

function mergeOrder(existing = [], ids = []) {
  const known = existing.filter((id) => ids.includes(id));
  return [...known, ...ids.filter((id) => !known.includes(id))];
}

function createId() {
  return `p-${crypto.randomUUID().slice(0, 8)}`;
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeFileName(value = "") {
  const fallback = "dropworld-file";
  const clean = String(value)
    .split(/[\\/]/)
    .pop()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean || fallback;
}

function safeHeaderFileName(value = "") {
  return safeFileName(value).replace(/"/g, "");
}

function extensionFor(fileName = "", contentType = "", fallback = "bin") {
  const ext = safeFileName(fileName).split(".").pop();
  if (ext && ext !== fileName) return ext.toLowerCase();
  if (contentType.includes("png")) return "png";
  if (contentType.includes("jpeg")) return "jpg";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("pdf")) return "pdf";
  if (contentType.includes("zip")) return "zip";
  return fallback;
}

function contentTypeFor(fileName = "") {
  const ext = extensionFor(fileName);
  if (ext === "zip") return "application/zip";
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "svg") return "image/svg+xml";
  return "application/octet-stream";
}

function trimSlash(value = "") {
  return String(value).replace(/\/+$/, "");
}

function base64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
