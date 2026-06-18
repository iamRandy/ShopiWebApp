export function getProductDisplayName(product) {
  const nickname = product?.nickname?.trim();
  if (nickname) return nickname;
  return product?.title?.trim() || "Unknown Product";
}

export function getProductNote(product) {
  return product?.note?.trim() || "";
}

/** Note replaces description in display when present. */
export function getProductDisplayDescription(product) {
  const note = getProductNote(product);
  if (note) return note;
  return product?.description?.trim() || "";
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

export function getProductNumericPrice(product) {
  if (product?.price === null || product?.price === undefined || product?.price === "") {
    return null;
  }
  const normalized =
    typeof product.price === "string"
      ? product.price.replace(/,/g, "").trim()
      : product.price;
  const numeric = Number(normalized);
  return Number.isNaN(numeric) ? null : numeric;
}

export function formatRelativeAdded(savedAt) {
  if (!savedAt) return "—";

  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return "—";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((startOfToday - startOfDate) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1d ago";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export function sortProducts(products = []) {
  return [...products].sort((a, b) => {
    const favA = a.isFavorite ? 1 : 0;
    const favB = b.isFavorite ? 1 : 0;
    if (favA !== favB) return favB - favA;

    const dateA = a.savedAt ? new Date(a.savedAt).getTime() : 0;
    const dateB = b.savedAt ? new Date(b.savedAt).getTime() : 0;
    if (dateA !== dateB) return dateB - dateA;

    return (a.title || "").localeCompare(b.title || "");
  });
}

export function formatItemCount(count) {
  if (count === 0) return "0 Items";
  if (count === 1) return "1 Item";
  return `${count} Items`;
}
