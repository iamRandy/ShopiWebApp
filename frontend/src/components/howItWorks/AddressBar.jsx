import { Lock } from "lucide-react";
import { memo } from "react";

function AddressBar({ typedText = "", placeholder = "Search or enter URL" }) {
  const display = typedText || placeholder;
  const isPlaceholder = !typedText;

  return (
    <div className="flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3 py-1.5 shadow-inner">
      <Lock className="h-3 w-3 shrink-0 text-stone-400" strokeWidth={2.5} />
      <span
        className={`min-w-0 flex-1 truncate text-xs font-medium md:text-sm ${
          isPlaceholder ? "text-stone-400" : "text-stone-800"
        }`}
      >
        {display}
        {!isPlaceholder && (
          <span className="ml-0.5 inline-block h-3.5 w-0.5 bg-[#f59f0b] align-middle" />
        )}
      </span>
    </div>
  );
}

export default memo(AddressBar);
