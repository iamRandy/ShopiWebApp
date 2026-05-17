export function getProductDisplayName(product) {
  const nickname = product?.nickname?.trim();
  if (nickname) return nickname;
  return product?.title?.trim() || "Unknown Product";
}
