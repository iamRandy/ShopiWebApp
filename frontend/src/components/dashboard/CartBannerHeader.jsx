import { LayoutGrid, List, Share2 } from "lucide-react";
import { ShoppingCart } from "lucide-react";
import { getCartIcon } from "../../utils/cartIcons";
import { getCartBannerBackground, getCartBannerTone } from "../../utils/cartBanners";

export default function CartBannerHeader({
  cart,
  viewMode,
  onViewModeChange,
  canShare = false,
  onShareClick,
}) {
  const cartName = cart?.name || "Unnamed cart";
  const isDark = getCartBannerTone(cart) === "dark";
  const contentColor = isDark ? "text-[#1a1a1a]" : "text-white";
  const controlBorder = isDark ? "border-[#1a1a1a]/30" : "border-white/70";
  const controlBg = isDark ? "bg-black/10" : "bg-black/20";
  const controlActiveBg = isDark ? "bg-black/15" : "bg-white/30";
  const controlHoverBg = isDark ? "hover:bg-black/10" : "hover:bg-white/10";

  return (
    <div
      className="relative mb-6 flex h-24 items-center justify-between overflow-hidden px-4 sm:h-32 sm:px-6 md:h-40"
      style={{ background: getCartBannerBackground(cart) }}
    >
      {!isDark && <div className="absolute inset-0 bg-black/30" />}

      <div className={`relative flex min-w-0 items-center gap-2 sm:gap-3 ${contentColor}`}>
        <span className="shrink-0">
          {getCartIcon(cart?.icon, { className: "h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" }) || (
            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
          )}
        </span>
        <h1 className="truncate text-xl font-extrabold leading-snug tracking-tight sm:text-2xl md:text-3xl lg:text-4xl">
          {cartName}
        </h1>
      </div>

      <div className="relative flex shrink-0 items-center gap-2">
        <div
          className={`flex overflow-hidden rounded-xl border-2 backdrop-blur-sm ${controlBorder} ${controlBg}`}
        >
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            aria-pressed={viewMode === "grid"}
            className={`flex h-9 w-9 items-center justify-center transition-colors sm:h-10 sm:w-10 ${contentColor} ${
              viewMode === "grid" ? controlActiveBg : controlHoverBg
            }`}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            aria-pressed={viewMode === "list"}
            className={`flex h-9 w-9 items-center justify-center border-l-2 transition-colors sm:h-10 sm:w-10 ${contentColor} ${controlBorder} ${
              viewMode === "list" ? controlActiveBg : controlHoverBg
            }`}
            title="List view"
          >
            <List className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>

        {canShare && (
          <button
            type="button"
            onClick={onShareClick}
            title="Share cart"
            className={`group/share flex h-9 items-center gap-1.5 overflow-hidden rounded-xl border-2 px-2.5 text-sm font-bold backdrop-blur-sm transition-colors sm:h-10 ${contentColor} ${controlBorder} ${controlBg} ${controlHoverBg}`}
          >
            <Share2 className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover/share:max-w-[4rem] group-hover/share:opacity-100">
              Share
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
