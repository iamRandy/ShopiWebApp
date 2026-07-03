import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Users } from "lucide-react";
import CartSidebarItem from "./CartSidebarItem";
import { SHARED_SECTION_COLLAPSED_KEY } from "./constants";

function getInitialSectionCollapsed() {
  try {
    return localStorage.getItem(SHARED_SECTION_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

export default function SharedCartsSection({
  sharedCarts = [],
  selectedCartId,
  onCartSelect,
  onLeaveCart,
  collapsed = false,
}) {
  const [sectionCollapsed, setSectionCollapsed] = useState(getInitialSectionCollapsed);

  if (sharedCarts.length === 0) return null;

  const toggleSection = () => {
    setSectionCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SHARED_SECTION_COLLAPSED_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <div className={`mt-4 w-full ${collapsed ? "flex flex-col items-center" : ""}`}>
      {collapsed ? (
        <div
          className="mb-2 flex h-7 w-7 items-center justify-center text-stone-400"
          title="Shared with me"
        >
          <Users className="h-4 w-4" />
        </div>
      ) : (
        <button
          type="button"
          onClick={toggleSection}
          className="mb-2 flex w-full items-center justify-between gap-2 px-0.5 text-sm font-bold text-stone-600 transition-colors hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
          aria-expanded={!sectionCollapsed}
        >
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Shared with me
          </span>
          <motion.span
            animate={{ rotate: sectionCollapsed ? -90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </button>
      )}

      <AnimatePresence initial={false}>
        {(!sectionCollapsed || collapsed) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full overflow-hidden"
          >
            <div className={`flex w-full flex-col gap-1 ${collapsed ? "items-center" : ""}`}>
              {sharedCarts.map((shared) => (
                <CartSidebarItem
                  key={shared.cartId}
                  cart={{
                    id: shared.cartId,
                    name: shared.cartName,
                    icon: shared.cartIcon,
                    color: shared.cartColor,
                  }}
                  variant="shared"
                  selected={selectedCartId === shared.cartId}
                  onSelect={() => onCartSelect(shared)}
                  onLeave={onLeaveCart}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
