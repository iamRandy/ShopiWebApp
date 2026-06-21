import GridProductCard from "./GridProductCard";

export default function ProductGridView({
  products = [],
  onFavoriteToggle,
  onOpen,
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((product) => (
        <GridProductCard
          key={product.id}
          product={product}
          onFavoriteToggle={onFavoriteToggle}
          onOpen={onOpen}
          isFavoriteLoading={favoriteLoadingId === product.id}
        />
      ))}
    </div>
  );
}
