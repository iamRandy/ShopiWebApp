import ListProductRow from "./ListProductRow";

export default function ProductListView({
  products = [],
  onFavoriteToggle,
  onOpen,
  onMenu,
  favoriteLoadingId,
}) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/50 p-8 text-center dark:border-stone-700 dark:bg-stone-900/40">
        <p className="text-stone-500 dark:text-stone-400">No products match your filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
      <div className="hidden grid-cols-[minmax(0,2fr)_minmax(4rem,1fr)_minmax(5rem,1fr)_minmax(4rem,1fr)_auto] gap-3 border-b border-stone-100 px-4 py-2.5 text-xs font-medium text-stone-400 sm:grid dark:border-stone-800 dark:text-stone-500">
        <span>Product</span>
        <span>Price</span>
        <span>Store</span>
        <span>Added</span>
        <span className="sr-only">Actions</span>
      </div>
      <div className="divide-y divide-stone-100 dark:divide-stone-800">
        {products.map((product) => (
          <ListProductRow
            key={product.id}
            product={product}
            onFavoriteToggle={onFavoriteToggle}
            onOpen={onOpen}
            onMenu={onMenu}
            isFavoriteLoading={favoriteLoadingId === product.id}
          />
        ))}
      </div>
    </div>
  );
}
