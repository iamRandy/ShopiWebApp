export function getProductDisplayName(product) {
  const nickname = product?.nickname?.trim();
  if (nickname) return nickname;
  return product?.title?.trim() || "Unknown Product";
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
