import { useRef, useState } from "react";
import { Menu } from "lucide-react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import DashboardSidebar from "./DashboardSidebar";
import { SIDEBAR_COLLAPSED_KEY } from "./constants";

function getInitialSidebarCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

// Dragging a product near this many px from the left screen edge on mobile auto-opens the
// cart drawer, mirroring how a file manager expands a folder you hover a drag over — the
// drawer normally only opens via the hamburger button, so without this a mobile user could
// never drag a product onto a cart (the sidebar is otherwise unreachable mid-drag).
const LEFT_EDGE_PX = 28;
const LEFT_EDGE_HOLD_MS = 350;

// A drop only counts as "onto a cart" when the pointer is literally inside that cart's
// tile (pointerWithin); otherwise the drag resolves against product cards only. Without
// this split, closestCenter would snap a drop anywhere in the sidebar's dead space to
// whichever cart tile happened to be nearest — silently moving the product to that cart
// when the user meant the drag-to-previous-page gesture.
function collisionDetection(args) {
  const pointerHits = pointerWithin(args);
  const cartHits = pointerHits.filter((hit) => {
    const container = args.droppableContainers.find((c) => c.id === hit.id);
    return container?.data?.current?.type === "cart";
  });
  if (cartHits.length > 0) return cartHits;
  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter(
      (c) => c.data?.current?.type !== "cart"
    ),
  });
}

export default function AppShell({ children, sidebarProps, dnd }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const leftEdgeTimerRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const clearLeftEdgeTimer = () => {
    if (leftEdgeTimerRef.current) {
      clearTimeout(leftEdgeTimerRef.current);
      leftEdgeTimerRef.current = null;
    }
  };

  const handleDragMove = (event) => {
    if (window.innerWidth < 768 && !drawerOpen) {
      const rect = event.active?.rect?.current?.translated;
      const nearLeft = rect && rect.left < LEFT_EDGE_PX;
      if (nearLeft && !leftEdgeTimerRef.current) {
        leftEdgeTimerRef.current = setTimeout(() => setDrawerOpen(true), LEFT_EDGE_HOLD_MS);
      } else if (!nearLeft) {
        clearLeftEdgeTimer();
      }
    }
    dnd?.onDragMove?.(event);
  };

  const handleDragEnd = (event) => {
    clearLeftEdgeTimer();
    dnd?.onDragEnd?.(event);
  };

  const handleDragCancel = (event) => {
    clearLeftEdgeTimer();
    dnd?.onDragCancel?.(event);
  };

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const desktopSidebarProps = {
    ...sidebarProps,
    collapsed: sidebarCollapsed,
    onToggleCollapse: toggleSidebarCollapsed,
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={dnd?.onDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex min-h-[100dvh] w-full bg-[var(--color-bg-app)]">
        <div
          className={`relative z-10 hidden shrink-0 transition-[width] duration-200 ease-out md:sticky md:top-0 md:block md:h-[100dvh] ${
            sidebarCollapsed ? "md:w-16" : "md:w-64 lg:w-72"
          }`}
        >
          <DashboardSidebar {...desktopSidebarProps} />
        </div>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="relative h-full w-[min(18rem,85vw)] shadow-xl">
              <DashboardSidebar
                {...sidebarProps}
                collapsed={false}
                isMobileDrawer
                onMobileClose={() => setDrawerOpen(false)}
                onCartsChanged={() => {
                  sidebarProps.onCartsChanged?.();
                  setDrawerOpen(false);
                }}
              />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center border-b-2 border-[var(--color-border-subtle)] bg-[var(--color-bg-app-alt)] px-4 py-3 md:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-[2px_2px_0_var(--color-shadow)]"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        </div>
      </div>
      <DragOverlay>{dnd?.dragOverlayContent}</DragOverlay>
    </DndContext>
  );
}
