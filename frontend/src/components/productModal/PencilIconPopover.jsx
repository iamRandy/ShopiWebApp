import { Pencil } from "lucide-react";

export default function PencilIconPopover({ label, onClick }) {
  return (
    <div className="group relative shrink-0">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="flex h-6 w-6 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
      >
        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-800 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </div>
  );
}
