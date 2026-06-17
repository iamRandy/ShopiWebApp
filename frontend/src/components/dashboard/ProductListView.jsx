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
      <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-white/50 p-8 text-center">
        <p className="text-stone-500">No products match your filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#FFBC42]">
      <div className="hidden grid-cols-[minmax(0,2fr)_minmax(4rem,1fr)_minmax(5rem,1fr)_minmax(4rem,1fr)_auto] gap-3 border-b-2 border-stone-200 px-4 py-3 text-xs font-bold uppercase tracking-wide text-stone-400 sm:grid">
        <span>Product</span>
        <span>Price</span>
        <span>Store</span>
        <span>Added</span>
        <span className="sr-only">Actions</span>
      </div>
      <div>
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
