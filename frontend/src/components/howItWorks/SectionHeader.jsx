import { ShoppingBag } from "lucide-react";

export default function SectionHeader({ className = "" }) {
  return (
    <header className={`text-center ${className}`}>
      <span className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] px-4 py-1.5 text-sm font-semibold shadow-[3px_3px_0_#FFBC42]">
        <ShoppingBag className="h-4 w-4 text-[#b45309]" strokeWidth={2.25} />
        Built for serial shoppers
      </span>
      <h2 className="text-3xl font-bold leading-tight text-[var(--color-text-primary)] sm:text-4xl md:text-5xl">
        Why should I use{" "}
        <span className="relative inline-block">
          <span className="relative z-10 font-extrabold underline decoration-[#FFBC42] decoration-[6px] underline-offset-4">
            Chaos
          </span>
          <span
            className="absolute -bottom-1 left-0 right-0 -z-0 h-3 rounded-sm bg-[#FFBC42]/40"
            aria-hidden
          />
        </span>
        ?
      </h2>
      <p className="text-primary-dark dark:text-stone-400 mx-auto mt-4 max-w-xl text-base leading-relaxed sm:text-lg">
        Save products from anywhere, sort them into carts on a clean dashboard, then
        favorite, note, and filter your way to the perfect buy — without another
        spreadsheet.
      </p>
    </header>
  );
}
