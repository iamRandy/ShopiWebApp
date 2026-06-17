import { Bookmark, ShoppingCart, Globe, User } from "lucide-react";

const PRIMARY = "#f59f0b";

export function ExtensionAveeTab({ wiggle = false, bounce = false, scale = 1 }) {
  return (
    <div
      className={`relative h-[48px] w-[48px] shrink-0 md:h-[60px] md:w-[60px] ${
        bounce ? "animate-[bounce-left_0.5s_ease-out_1]" : ""
      } ${wiggle ? "motion-safe:animate-[avee-wiggle_0.55s_ease-in-out_infinite]" : ""}`}
      style={{ transform: `scale(${scale})` }}
    >
      <div className="absolute inset-0 rounded-l-md border border-black border-r-0 bg-[#F9F6F0] p-1 shadow-xl">
        <img
          src="/images/Avee.png"
          alt=""
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  );
}

export function ExtensionPanelMain({ compact = false }) {
  return (
    <div className="flex flex-col gap-2 py-2">
      <button
        type="button"
        className="flex h-[42px] w-full items-center justify-center gap-2 rounded-md text-sm font-bold text-white md:h-[50px] md:text-base"
        style={{ backgroundColor: PRIMARY }}
      >
        <Bookmark className="h-4 w-4" strokeWidth={2.5} />
        Save Product
      </button>
      <button
        type="button"
        className="flex h-[42px] w-full items-center justify-center gap-2 rounded-md border-2 bg-transparent text-sm font-bold md:h-[50px] md:text-base"
        style={{ borderColor: PRIMARY, color: PRIMARY }}
      >
        <ShoppingCart className="h-4 w-4" strokeWidth={2.5} />
        View Carts
      </button>
    </div>
  );
}

export function ExtensionPanelCartPicker({ selectedIndex = 0 }) {
  const carts = ["Wishlist", "Gifts", "Deals"];
  return (
    <div className="py-2">
      <p className="mb-2 text-sm font-semibold text-stone-800">Save to which cart?</p>
      <div className="flex flex-col gap-1.5">
        {carts.map((name, i) => (
          <div
            key={name}
            className={`rounded-md border-2 px-2 py-2 text-sm font-semibold transition-colors ${
              i === selectedIndex
                ? "border-[#f59f0b] bg-amber-50"
                : "border-stone-200 bg-white"
            }`}
          >
            <ShoppingCart className="mr-1.5 inline h-4 w-4" strokeWidth={2} />
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExtensionPanelSuccess({ float = false }) {
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className={float ? "motion-safe:animate-[avee-float_2.2s_ease-in-out_infinite]" : ""}>
        <img
          src="/images/Avee.png"
          alt=""
          className="mx-auto h-12 w-12 md:h-16 md:w-16"
        />
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-green-600 md:text-sm">
        Saved to cart!
      </p>
    </div>
  );
}

export default function ExtensionPanel({
  panelWidth = 250,
  mode = "main",
  cartSelectedIndex = 0,
  showGlow = false,
}) {
  const width = Math.max(0, Math.min(250, panelWidth));

  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{ width }}
    >
      <div
        className={`relative min-w-[200px] rounded-[10px] bg-white p-3 md:min-w-[250px] md:p-[15px] ${
          showGlow ? "shadow-[0_0_3px_3px_rgba(0,0,0,0.1)]" : ""
        }`}
      >
        <div className="mb-3 flex items-start justify-between">
          <p className="text-lg font-bold md:text-xl">Chaos</p>
          <div className="flex gap-1">
            <div className="flex h-7 w-7 items-center justify-center md:h-[30px] md:w-[30px]">
              <Globe className="h-5 w-5 text-black" strokeWidth={2} />
            </div>
            <div className="flex h-7 w-7 items-center justify-center md:h-[30px] md:w-[30px]">
              <User className="h-5 w-5 text-black" strokeWidth={2} />
            </div>
          </div>
        </div>
        {mode === "main" && <ExtensionPanelMain />}
        {mode === "picker" && (
          <ExtensionPanelCartPicker selectedIndex={cartSelectedIndex} />
        )}
        {mode === "success" && <ExtensionPanelSuccess float={false} />}
      </div>
    </div>
  );
}

export function ExtensionWidget({
  tabVisible = true,
  tabBounce = false,
  tabWiggle = false,
  tabSlide = 1,
  panelWidth = 0,
  panelMode = "main",
  cartSelectedIndex = 0,
  className = "",
}) {
  if (!tabVisible && panelWidth <= 0) return null;

  return (
    <div
      className={`pointer-events-none absolute right-0 top-[22%] z-20 flex flex-row items-start ${className}`}
      style={{
        transform: `translateX(${(1 - tabSlide) * 100}%)`,
        opacity: tabSlide,
      }}
    >
      {tabVisible && (
        <ExtensionAveeTab wiggle={tabWiggle} bounce={tabBounce} />
      )}
      <ExtensionPanel
        panelWidth={panelWidth}
        mode={panelMode}
        cartSelectedIndex={cartSelectedIndex}
        showGlow={panelWidth > 40}
      />
    </div>
  );
}
