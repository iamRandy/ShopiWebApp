import { useMemo } from "react";

const DEFAULT_FILTERS = {
  keyword: "",
  priceMin: "",
  priceMax: "",
  store: "",
};

export function useProductFilters(products = [], filters = DEFAULT_FILTERS) {
  return useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();
    const store = filters.store.trim().toLowerCase();
    const min =
      filters.priceMin === "" ? null : Number(filters.priceMin);
    const max =
      filters.priceMax === "" ? null : Number(filters.priceMax);

    return products.filter((product) => {
      if (keyword) {
        const haystack = [
          product.title,
          product.nickname,
          product.note,
          product.hostname,
          product.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }

      if (store) {
        const hostname = (product.hostname || "").toLowerCase();
        if (!hostname.includes(store)) return false;
      }

      if (min !== null || max !== null) {
        const raw =
          typeof product.price === "string"
            ? product.price.replace(/,/g, "").trim()
            : product.price;
        const price = Number(raw);
        if (Number.isNaN(price)) return false;
        if (min !== null && price < min) return false;
        if (max !== null && price > max) return false;
      }

      return true;
    });
  }, [products, filters]);
}

export function countActiveFilters(filters = DEFAULT_FILTERS) {
  let count = 0;
  if (filters.keyword.trim()) count += 1;
  if (filters.store.trim()) count += 1;
  if (filters.priceMin !== "") count += 1;
  if (filters.priceMax !== "") count += 1;
  return count;
}

export { DEFAULT_FILTERS };
