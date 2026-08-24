import { useMemo } from "react";

const DEFAULT_FILTERS = {
  keyword: "",
  priceMin: "",
  priceMax: "",
  store: "",
  tags: [],
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

      if (filters.tags.length > 0) {
        const productTags = product.tags || [];
        if (!filters.tags.some((t) => productTags.includes(t))) return false;
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
  if (filters.tags.length > 0) count += 1;
  return count;
}

/** One removable chip per active filter criterion — price min/max collapse into a single
 * range chip (they're one logical filter), while each tag gets its own chip since they're
 * independently removable. */
export function getActiveFilterChips(filters = DEFAULT_FILTERS, tagLabelBySlug) {
  const chips = [];

  if (filters.keyword.trim()) {
    chips.push({ id: "keyword", label: `"${filters.keyword.trim()}"` });
  }

  if (filters.store.trim()) {
    chips.push({ id: "store", label: filters.store.trim() });
  }

  if (filters.priceMin !== "" || filters.priceMax !== "") {
    let label;
    if (filters.priceMin !== "" && filters.priceMax !== "") {
      label = `$${filters.priceMin}–$${filters.priceMax}`;
    } else if (filters.priceMin !== "") {
      label = `≥ $${filters.priceMin}`;
    } else {
      label = `≤ $${filters.priceMax}`;
    }
    chips.push({ id: "price", label });
  }

  filters.tags.forEach((tag) => {
    chips.push({ id: `tag:${tag}`, label: tagLabelBySlug?.get(tag) || tag });
  });

  return chips;
}

/** Returns filters with the single criterion behind `chipId` (from getActiveFilterChips) cleared. */
export function removeFilterChip(filters, chipId) {
  if (chipId === "keyword") return { ...filters, keyword: "" };
  if (chipId === "store") return { ...filters, store: "" };
  if (chipId === "price") return { ...filters, priceMin: "", priceMax: "" };
  if (chipId.startsWith("tag:")) {
    const tag = chipId.slice(4);
    return { ...filters, tags: filters.tags.filter((t) => t !== tag) };
  }
  return filters;
}

export { DEFAULT_FILTERS };
