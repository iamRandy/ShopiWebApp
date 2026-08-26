# Changelog

Notable changes to the ShopiWebApp frontend and backend. This project ships continuously rather than in numbered releases, so entries are grouped by date instead of version.

## Unreleased

- Added the ability to move an already-saved product from one cart into another cart you have edit access to — your own carts, or a cart shared with you at "edit" role (view-only shared carts can't be a destination). Single-item move is a new button in the product detail modal; selecting 2+ products (the existing compare-selection checkboxes) surfaces a "Move N items" button in the toolbar for bulk moves, both opening a new destination-cart picker. Since a cart's products live embedded in its owner's document, moving into a cart owned by someone else (e.g. a cart shared with you) is a cross-document Mongo transaction, modeled on the existing ownership-transfer flow. New Socket.IO events (`product:moved`/`products:moved` on the source cart, `product:movedIn`/`products:movedIn` on the destination) keep collaborators' open carts live-updated on both ends. Also mirrored the existing bulk-delete endpoint (`DELETE /api/carts/:cartId/products`) to the Vercel serverless deployment for the first time — it previously only worked against the local Express backend, 404ing in production; this closes that gap since the new bulk-move endpoint needed a new file there anyway. This uses the last of Vercel's Hobby-plan 12-function budget (now 12/12) — any future new endpoint needs a consolidation pass first.
- Fixed production sessions expiring after ~15 minutes instead of the intended 7 days of inactivity: the Vercel serverless API (`frontend/api/`, what actually runs in production) had two auth bugs that never made it into the Express backend's earlier fixes. (1) `login/google` — now consolidated into `frontend/api/auth.js` — stored a random, unrelated value as the user's `refreshToken` in the DB while returning a *different* JWT to the client, so `/api/refresh-token`'s DB lookup could never match and every refresh silently failed, forcing a full re-login the moment the access token expired; `backend/server.js` had already been fixed to persist the actual issued JWT, but the Vercel copy hadn't. (2) `frontend/api/_lib/auth.js` still issued 15-minute access tokens; `backend/server.js` had been bumped to 2 hours. Both are now fixed to match the Express backend.
- Fixed descenders on letters like "y"/"g" getting clipped in the cart banner title — Tailwind's default line-height gets tighter as the responsive text size grows (`text-4xl`'s default is only ~1.11x the font size), which wasn't leaving room below the baseline at extrabold weight before `truncate`'s `overflow: hidden` clipped it.
- Fixed the Vercel deployment failing outright with "No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan" — the product-tagging merge added 2 new API route files, pushing the count from 12 to 14. Consolidated `login/google.js` + `logout.js` + `refresh-token.js` into one `auth.js` and `tags.js` + `tags/suggest.js` into one file, each dispatched via a `?action=` query param set by new `vercel.json` rewrites (same pattern already used by `carts/[cartId]/share.js`) — down to 11 functions. Purely a Vercel routing change: the public API paths, the frontend's fetch calls, and `backend/server.js`'s Express routes are all unchanged.
- Active filters now show as removable pills directly next to the Filter button (keyword, store, price range, and each tag individually), each with its own "×" to clear just that one criterion; wraps onto multiple lines alongside the other toolbar buttons on narrow screens.
- Reworked the banner solid-color presets to a warm spectrum (red through pink) plus black and white, and the cart banner/title/icon/view-toggle/Share button now pick dark or light text automatically per-cart based on the actual WCAG contrast ratio against the chosen background (color or gradient), instead of always assuming white text — so light presets like yellow or white stay readable instead of washing out.
- Fixed a leftover, unscoped `h1 { font-size: 3.2em }` rule in `index.css` (dead Vite-scaffold CSS, same category as the earlier `a { color: black }` bug) that was silently overriding every heading's actual size app-wide, including the new cart banner title, no matter what Tailwind text-size class was applied to it.
- The cart banner now spans the full width of the content area with no top padding, edge-to-edge like the rest of the app's neo-brutalist bordered look intentionally dropped for this one element (no border/shadow/rounded corners) to match the reference design; the cart name starts smaller on mobile and only truncates with "…" if it still doesn't fit at that size.
- Redesigned the dashboard header: cart title/icon, the grid/list toggle, and Share now live in a new banner block at the top of the cart view; Filter/Delete/Unselect/Compare moved to their own row underneath, alongside a new "Showing X of Y items" count. Carts can now have a custom banner backdrop — a solid color (with a color picker and quick presets) or one of 8 curated gradients — configurable when creating or editing a cart, with a live preview in the cart modal. Image/photo banners are intentionally deferred until object storage is added; for now this is colors/gradients only. Also fixed `POST /api/carts` (both `backend/server.js` and the Vercel API) silently dropping `color`/banner fields sent at creation time — they were never persisted before this. Sidebar cart rows now swap the item count for the edit (⋯) button on hover/selection instead of the two visually overlapping.
- Fixed switching carts from the Settings or Compare page: clicking a different cart in the sidebar always dropped you back onto the dashboard's first cart instead of the one you clicked, because navigating to `/home` had no way to say which cart to select and `Dashboard.jsx` always defaulted to `carts[0]`. Settings/Compare now navigate with `?cart=<id>`, which `Dashboard.jsx` already reads (previously only used for share-invite redirects) — and `fetchCarts()` no longer overwrites an already-selected cart once one has been chosen, whether that's from a `?cart=` deep link or a prior selection being preserved across a refresh.
- Added product tagging: products can be tagged from the detail modal (a searchable `TagInput` with suggestions from a shared, extension-owned canonical tag list) and tags show as pills on grid/list cards and are filterable from the Filter modal. Backend/serverless add read-only `GET /api/tags` and `GET /api/tags/suggest?q=`, and the product PATCH route now accepts a `tags` array (max 10). The canonical tag list itself is written by the companion browser extension's backend, not this app.
- Added real-time cart sharing: a cart owner can generate a share link with a view or edit role (`ShareCartModal`); recipients accept it into a "Shared with me" sidebar section and collaborate live via Socket.IO (`product:updated/deleted`, `cart:renamed/deleted/ownershipTransferred`, `collaborator:added/roleChanged/removed`), scoped to per-cart rooms and authenticated with the same JWT as REST calls. Extended the JWT access token lifetime from 15 minutes to 2 hours to cut down on forced re-logins. The production (Vercel) deployment has no persistent Socket.IO layer, so its serverless mirror instead exposes the same sharing actions as REST endpoints and the dashboard silently refetches the open cart on tab focus to catch up on changes made by collaborators.
- Added product comparison: hovering a grid/list product reveals a select checkbox plus a "select all on this page" square; picking 2+ shows a Compare chip in the toolbar that navigates to a new `/home/compare` page with a per-product price bar chart (names >20 chars truncated on the axis, full name still shown in the tooltip) and a removable "Selected Products" grid of image/title cards.
- Added background price rescanning: opening a cart, turning the page, or changing filters triggers a lightweight re-check of whatever's currently visible whose price hasn't been verified in 2+ weeks — a direct HTTP fetch of the product page parsing its schema.org JSON-LD price data, no headless browser. A price change shows a small color-coded "!" badge with the old price struck through next to the current one, in both grid and list views. Backend adds `POST /api/carts/:cartId/products/rescan` to `backend/server.js`.
- Fixed the Vercel serverless API (`frontend/api/*.js`) — a separate, hand-maintained copy of the backend that's what actually runs in production — missing the new rescan endpoint entirely (it 405'd, silently falling through to the product PATCH/DELETE route) and its `PATCH` product route silently ignoring `price` edits. Both already worked in the Express backend but had drifted out of sync with what's deployed. The Vercel version of rescan also can't run the same way as the Express one — Vercel functions there are capped at 10s and torn down right after responding, so it scrapes a small batch synchronously within the request and returns any price change directly, instead of continuing in the background and pushing a socket update.
- Favoriting a product (or a background price rescan updating it) no longer reshuffles the grid/list or resets your page position while you're looking at it — the favorites-first reorder is now deferred until you turn the page or switch carts (`usePagination.js`, `Dashboard.jsx`).
- Mitigated shared-cart collaborators seeing stale data in production: the Vercel deployment has no real-time socket layer at all (only the local Express dev backend does — see above), so the currently open cart now silently refetches when the browser tab regains focus, instead of only updating on a manual cart switch.
- Mobile dashboard fixes: the bulk "Delete N items" button goes icon-only on small screens instead of getting squished; the compare-selection checkbox is now always visible on touch devices instead of hover-only; list view gets a dedicated stacked mobile layout instead of squeezing every column into a narrow screen.
- Fixed the dashboard toolbar's action buttons (Compare/Delete/view toggle/Filter) getting clipped off-screen at tablet and split-screen widths — they now stay stacked below the title until there's enough room, and wrap as a fallback.
- The unfavorited heart icon now has a visible dark stroke instead of low-contrast orange-on-orange; hovering a grid product card fades its image overlay so the photo shows through more clearly.
- Fixed login persisting the wrong refresh token: the DB stored an unused random value instead of the JWT actually issued to the client, so the first token refresh after any login always failed, forcing a re-login every ~2 hours instead of after 7 days of inactivity.
- Deleting a product from inside the product detail modal no longer reloads the whole page — it now removes the item from state in place (same as quick-delete/bulk-delete), so your selected cart, scroll position, filters, and pagination are no longer reset when you delete an item.
- Replaced every browser-native `confirm()` prompt with a new in-app `ConfirmModal` component for a consistent look — covers product quick-delete/bulk-delete, the product detail modal's delete button, deleting a cart (`CartModal.jsx`), and leaving a shared cart (`CartSidebarItem.jsx`). The only one left as a native `confirm()` is in the unused/orphaned `ProductCard.jsx`.
- Also: the "Delete N items" bulk-delete button is now solid red with white text; the compare-selection "unselect all" control moved out of the Compare pill into its own standalone button ("Unselect all" with an X on larger screens, X-only on mobile), visible as soon as 1+ items are selected.
- Added quick-delete: hovering a product card now shows a trash icon that deletes it from the cart without opening the detail modal, and selecting one or more products (reusing the existing compare-selection checkboxes) surfaces a red "Delete N items" button in the toolbar (right of Compare, left of the grid/list toggle) for deleting several at once. Backend adds `DELETE /api/carts/:cartId/products` (bulk, takes `{ productIds: [...] }`) alongside the existing single-product delete route, broadcasting a new `products:deleted` socket event for realtime sync to collaborators.
- Product details modal now has a single edit button (top-right, next to close) that opens one combined form for nickname, price, and note, replacing the old scattered pencil icons next to each field individually. Users can now correct a price the extension saved incorrectly. Backend `PATCH /api/carts/:cartId/products/:productId` accepts a `price` field alongside the existing nickname/note/favorite fields.
- Redesigned the product details modal: a full-bleed hero photo replaces the small thumbnail, with the favorite-heart and store-hostname chip overlaid on it (matching the grid/list cards); wider modal, bigger type, and an internally scrollable body so it no longer overflows the screen on short viewports.
- The product details modal now has its own favorite toggle and shows a "Saved Xd ago" timestamp — previously favoriting was only possible from the grid/list cards.
- Removed the now-unused `ProductModalImage` component now that the product modal builds its own hero image block directly.
- Grid view now shows 4 columns on screens ≥1024px wide (was 3), so a full page of 6 products fits without scrolling to reach pagination.
- Pagination is now pinned to the bottom of the dashboard regardless of how many products are on the current page — it used to ride up directly under a short last page (e.g. 1 product) instead of staying put.
- Added a site-wide dark mode. Switch between Light, Dark, and System in Settings → Appearance (`SettingsPage.jsx`); the choice persists per-device and applies everywhere — landing, login, privacy, dashboard, and settings.
- Fixed a global `a { color: black }` rule in `App.css` that forced every link — most visibly the "Chaos" logo wordmark in the NavBar — to render black regardless of theme, making them unreadable against dark-mode backgrounds.

## 2026-06-18

- Cart icon picker now searches lucide-react's full ~1600-icon library (`frontend/src/utils/cartIcons.js`, `CartModal.jsx`), with a horizontally scrollable "popular for shopping" carousel as the default view, replacing the old fixed 30-icon grid.
- Product images that aren't roughly square (noticeably tall or wide) now render with `object-contain` so the whole product stays visible, instead of being cropped by `object-cover`; near-square photos still crop to fill (new `ProductImage` component, used in the grid/list dashboard views and the product detail modal).
- Redesigned the favorite-heart toggle on grid/list cart cards and the marketing "How It Works" demo: a dark semi-transparent circle instead of the white/grey one, with the heart always in the brand accent color (`#FFBC42`), growing and filling in when favorited.
- Fixed the companion browser extension's cart icon rendering, which only recognized a hardcoded ~40-icon list and silently fell back to the default icon for anything chosen from the new picker; it now resolves any lucide-react icon name dynamically, matching the web app.
- Added `CLAUDE.md` with build/run commands and architecture notes for future work in this repo.
- Fixed the collapsed sidebar's account menu (sign out) rendering behind the product grid instead of on top of it (`AppShell.jsx`).
- Added the missing "previous page" button to dashboard pagination — only "next" existed, even though `usePagination` already tracked `hasPrev` (`Pagination.jsx`, `Dashboard.jsx`).
- Reworked the "one-click save" flow.
- Fixed one-click save and resolved a background clash with the chaos theme.

## 2026-06-17
- Added a settings page, refreshed the landing nav, and polished dashboard UX.
- Added profile photos and fixed oversized JWT auth headers.

## 2026-06-16
- Stripped HTML from product titles and descriptions on display.
- Resolved relative product image URLs using the product's source URL.
- Redesigned the dashboard with a sidebar shell and modernized "How It Works".

## 2026-06-09
- Modernized the landing hero, footer, login page, and section transitions.

## 2026-05-27
- Improved landing UX, dashboard loaders, auth flow, and price display.

## 2026-05-21
- Refined landing scroll animations and the CTA quote layout.
- Adjusted the landing page's "How It Works" and closing sections.

## 2026-05-17
- Edit-cart now lets you nickname products.

## 2026-05-13
- Made the home page mobile-friendly.
- Fixed a delete-cart error on the API endpoint.

## 2026-05-11
- Removed an inner scroll container from the product area.

## 2026-05-10
- Logout now clears extension storage via the content-script bridge.
- Renamed the product from Shopi to Chaos throughout the app.
- Improved scroll behavior.
- Added a `/privacy` policy page and footer link; trimmed it to a standard, concise format; switched the contact address to shoppii.cart@gmail.com.
- Fixed SPA navigation scroll resets for the logo and Save/Organize links.

## 2026-02-01
- Removed the collapsible nav (hard to navigate) and swapped the FAQ entry for "Get Started" on the mobile menu.
- Hotfixed the nav not showing properly on mobile devices.

## 2026-01-31
- Added a closing section with a "Get Started" button.

## 2026-01-22
- Updated the README.

## 2026-01-21
- Made edit-cart backgrounds opaque.

## 2026-01-19
- Restyled the login page and made the landing page mobile-friendly.
- Cart icon/background read the extension ID from an env var instead of a hardcoded value.
- Made item backgrounds opaque and swapped the close icon.

## 2026-01-17
- Fixed Firefox compatibility.
- Pulled in current account info.

## 2026-01-12
- Added images to the landing page; general frontend tweaks.
- Fixed login info not reaching the extension, and logout compatibility with Chrome.

## 2026-01-09
- Restructured carts, fixing a cart/product deletion bug.

## 2026-01-08
- Fixed API routes for Vercel deployment (cart edit).

---
History before 2026-01-08 isn't included here — see `git log` for the full project history.
