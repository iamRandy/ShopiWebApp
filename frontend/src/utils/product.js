export function resolveAbsoluteUrl(url, baseUrl) {
  if (url == null || typeof url !== "string") return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;

  if (trimmed.startsWith("//")) {
    try {
      const base = baseUrl ? new URL(baseUrl) : null;
      return `${base?.protocol || "https:"}${trimmed}`;
    } catch {
      return `https:${trimmed}`;
    }
  }

  if (!baseUrl) return trimmed;

  try {
    return new URL(trimmed, baseUrl).href;
  } catch {
    return trimmed;
  }
}

export function getProductImageUrl(product, fallback = null) {
  const image = product?.image?.trim();
  if (!image) return fallback;
  return resolveAbsoluteUrl(image, product?.url) || fallback;
}

export function stripHtml(text) {
  if (text == null || typeof text !== "string") return "";

  const trimmed = text.trim();
  if (!trimmed || !/[<>&]/.test(trimmed)) return trimmed;

  const doc = new DOMParser().parseFromString(trimmed, "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}

export function getProductDisplayName(product) {
  const nickname = product?.nickname?.trim();
  if (nickname) return nickname;
  return stripHtml(product?.title) || "Unknown Product";
}

export function getProductDescription(product) {
  return stripHtml(product?.description);
}

/** Formats numeric prices with two decimal places (e.g. 12.0 → "12.00"). */
export function formatProductPrice(price, currency = "$") {
  if (price === null || price === undefined || price === "") {
    return null;
  }

  const normalized =
    typeof price === "string" ? price.replace(/,/g, "").trim() : price;
  const numeric = Number(normalized);

  if (Number.isNaN(numeric)) {
    return `${currency}${price}`;
  }

  return `${currency}${numeric.toFixed(2)}`;
}

export function getFormattedProductPrice(product) {
  return (
    formatProductPrice(product?.price, product?.currency || "$") ??
    "Price not available"
  );
}
