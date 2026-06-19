import { memo } from "react";
import { Heart, LayoutGrid, List, SlidersHorizontal } from "lucide-react";

const ROWS = [
  {
    name: "Linen blazer",
    note: "For summer wedding — size M",
    price: "$89",
    store: "nordstrom.com",
    favorite: true,
    swatch: "from-amber-100 to-orange-50",
  },
  {
    name: "Running shoes",
    note: "Compare with the Nike pair",
    price: "$120",
    store: "rei.com",
    favorite: true,
    swatch: "from-sky-100 to-blue-50",
  },
  {
    name: "Ceramic vase",
    note: null,
    price: "$34",
    store: "etsy.com",
    favorite: false,
    swatch: "from-stone-100 to-stone-50",
  },
];

function FavoritesNotesStatic() {
  return (
    <div className="flex h-full w-full flex-col bg-[#f8f6f0] p-2">
      <div className="mb-2 flex items-center justify-between gap-1">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold text-black">Wishlist</p>
          <p className="text-[8px] text-stone-500">3 items</p>
        </div>
        <div className="flex items-center gap-0.5">
          <span className="flex h-5 w-5 items-center justify-center rounded border border-stone-300 bg-white text-stone-400">
            <LayoutGrid className="h-2.5 w-2.5" strokeWidth={2.25} />
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded border-2 border-black bg-white shadow-[1px_1px_0_#000]">
            <List className="h-2.5 w-2.5" strokeWidth={2.25} />
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded border border-stone-300 bg-white text-stone-500">
            <SlidersHorizontal className="h-2.5 w-2.5" strokeWidth={2.25} />
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#000]">
        {ROWS.map((row, index) => (
          <div
            key={row.name}
            className={`flex items-center gap-2 px-2 py-1.5 ${
              index < ROWS.length - 1 ? "border-b border-stone-100" : ""
            }`}
          >
            <div
              className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-gradient-to-br ${row.swatch}`}
            >
              <button
                type="button"
                className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/40 text-[#FFBC42]"
                aria-hidden
              >
                <Heart
                  className={row.favorite ? "h-3 w-3" : "h-2.5 w-2.5"}
                  fill={row.favorite ? "currentColor" : "none"}
                  strokeWidth={2}
                />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[9px] font-semibold text-black">{row.name}</p>
              <p className="truncate text-[7px] text-stone-500">
                {row.note || row.store}
              </p>
            </div>
            <span className="shrink-0 text-[8px] font-bold text-black">{row.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(FavoritesNotesStatic);
