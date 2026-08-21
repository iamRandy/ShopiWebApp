import { useEffect, useMemo, useState } from "react";
import { PAGE_SIZE } from "./constants";

export function usePagination(items = [], pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Depends on the result COUNT, not the `items` array reference — an in-place field
  // mutation (favoriting, a background price update, ...) produces a new array reference
  // without changing how many items there are, and shouldn't bounce the user back to page 1.
  useEffect(() => {
    setPage(1);
  }, [items.length, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return {
    page,
    setPage,
    totalPages,
    pageItems,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
