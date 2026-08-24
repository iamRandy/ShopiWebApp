# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Install (first time, from repo root):
```
npm i && npm i --prefix frontend && npm i --prefix backend
```
Both `frontend/.env` and `backend/.env` must exist before running anything.

Run everything (frontend on :5173, backend on :3000):
```
npm run dev
```
This is `concurrently` running `npm run dev --prefix backend` (nodemon) and `npm run dev --prefix frontend` (vite) from the root `package.json`. There is no root build/lint/test script — those only exist inside `frontend/`.

Frontend-only (run from `frontend/`):
- `npm run dev` — Vite dev server, proxies `/api` to `http://localhost:3000`
- `npm run build` — production build
- `npm run lint` — ESLint (flat config, `eslint.config.js`)
- `npm run preview` — preview a production build

Backend-only (run from `backend/`): `npm run dev` (nodemon on `server.js`).

There is no test suite configured in either package.

Required env vars:
- `frontend/.env`: `VITE_CLIENT_ID` (Google OAuth client ID), `VITE_PORT`, `VITE_EXTENSION_ID` (optional override for the companion browser extension's id), `VITE_API_URL` (optional, defaults to `http://localhost:3000`)
- `backend/.env`: `MONGODB_URI`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `VITE_CLIENT_ID` (server also verifies Google ID tokens against this), `FRONTEND_URL` (optional, defaults to `http://localhost:5173` — used for Socket.IO/CORS origin and for building `shareUrl`s returned by the cart-sharing endpoints)

## Architecture

**Two independent npm packages, no shared workspace.** `frontend/` (Vite + React 19 + Tailwind v4 + react-router + socket.io-client + recharts) and `backend/` (single-file Express + MongoDB + Socket.IO) are not linked by any build tooling — the root `package.json` only orchestrates running both dev servers together. There's no shared types/utils package, so duplicated logic between them (see cart icons and the `frontend/api/` serverless mirror below) has to be kept in sync by hand.

**This web app is one half of a pair.** There's a companion browser extension in a sibling repo (`../Shopi`, different git remote/owner) that scrapes product pages and saves products into the same Mongo-backed carts via the backend API. When changing cart/product data shapes or shared display logic (e.g. cart icons), check whether the extension's mirrored copy needs the same change — it has its own `extension/utils/cartIcons.jsx` that must stay in sync with `frontend/src/utils/cartIcons.js` by convention/comment, not by import.

**Backend is one file, plus a serverless mirror for Vercel.** `backend/server.js` has no routes/controllers/models split — every endpoint, JWT helper, Socket.IO handler, and Mongo query lives there; it's what `npm run dev` runs locally. There's a single MongoDB collection (`users`, db `shopi`); each user document embeds a `carts` array, and each cart embeds its own `products` array directly (no separate products collection — this was a deliberate consolidation, see the comment above the product routes). Nested updates use Mongo `arrayFilters` (e.g. `PATCH /api/carts/:cartId/products/:productId` matches via `carts.$[c].products.$[p]`). Production on Vercel doesn't run `server.js` as a long-lived process — `frontend/api/` reimplements the same REST endpoints (not the Socket.IO/real-time parts) as individual serverless functions, with shared helpers in `frontend/api/_lib/`, consolidated per-resource (e.g. `carts/[cartId]/share.js`) to stay under Vercel's function-count cap. **These two implementations duplicate the same auth/Mongo logic and must be kept in sync by hand** — any change to a REST endpoint's behavior in `server.js` (validation, response shape, access rules) needs the matching edit under `frontend/api/`.

**Real-time cart sharing runs over Socket.IO.** `backend/server.js` authenticates socket connections with the same JWT used for REST calls, and rooms are scoped per-cart (`cart:join`/`cart:leave`, keyed by owner sub + cart id). `frontend/src/utils/socket.js` owns the singleton client connection (auth token kept in sync across silent token refreshes); `frontend/src/hooks/useCartRoom.js` joins/leaves the room for whichever cart is open, and `useSharedCartEvents.js` subscribes once to the full event set (`product:updated`, `product:deleted`, `cart:renamed`, `cart:deleted`, `cart:ownershipTransferred`, `collaborator:added/roleChanged/removed`) and dispatches to handlers passed in from `Dashboard.jsx`. Sharing a cart (`ShareCartModal.jsx`) generates a `shareToken`-based link (`/shared/:token`, handled by `pages/SharedCart.jsx`) with a role (`view`/`edit`); accepting one adds it to the recipient's `sharedCarts` list, shown via `SharedCartsSection.jsx` in the sidebar.

**Auth flow:** Google OAuth (`@react-oauth/google` client-side, `google-auth-library` server-side) is exchanged for app-issued tokens — a 15-minute JWT access token and a 7-day refresh token that's rotated and persisted on the user document. The frontend keeps both in `localStorage`; `frontend/src/utils/api.js` exports `authenticatedFetch`, which wraps `fetch` to auto-refresh on a `401`/`TOKEN_EXPIRED` response (queuing concurrent calls behind a single in-flight refresh) and redirect to `/login` on unrecoverable auth failure. Always use `authenticatedFetch` rather than bare `fetch` for anything under `/api`.

**Routing is flat, not nested/guarded.** `App.jsx` declares `/`, `/login`, `/home` (the dashboard), `/home/settings`, `/home/compare`, `/privacy`, `/shared/:token` directly — there's no shared protected-route wrapper; each page checks its own session (`ensureValidSession` from `utils/api.js`) and redirects itself.

**The real dashboard lives under `components/dashboard/`.** `components/Dashboard.jsx` composes `AppShell` (cart sidebar, including `SharedCartsSection`) + `ProductToolbar` + `ProductGridView`/`ProductListView` (the grid/list toggle persists to `localStorage`) + `FilterModal` + `Pagination` + `productModal/ProductModal` (detail/edit view) + `ShareCartModal`, with filtering/sorting/pagination handled client-side via the `useProductFilters`/`usePagination` hooks in that folder. Note: `components/CartArea.jsx` and `components/ProductArea.jsx` look like they'd be part of this but are unused/orphaned — don't build on them.

**Product comparison is a separate flow off the same selection state.** Hovering a card in `GridProductCard`/`ListProductRow` reveals a per-card select checkbox plus a "select all on this page" square; `Dashboard.jsx` tracks the chosen ids in a `compareIds` Set (capped at `MAX_COMPARE_PRODUCTS`, `constants.js`, reset on cart switch) and shows a Compare chip in `ProductToolbar` once 2+ are selected. "Compare Now" navigates to `/home/compare` (`pages/Compare.jsx`) passing the selected products via router `state`, which renders `components/compare/PriceComparisonChart.jsx` (Recharts bar chart — axis labels truncate via `truncateProductName`, but the tooltip always shows the full name since it reads the untruncated data value) and `SelectedProductsGrid.jsx` (removable image/title cards).

**Extension messaging bridge.** `frontend/src/utils/extension.js` talks to the installed browser extension two ways at once: `window.postMessage` (relayed by the extension's content script) and direct `chrome.runtime.sendMessage` to a hardcoded extension ID (overridable via `VITE_EXTENSION_ID` or a `?extId=` query param) — used e.g. to clear extension-side storage on logout/account switch.

**Cart icons resolve dynamically.** `frontend/src/utils/cartIcons.js` lets a cart use any of lucide-react's ~1600 icons by resolving `Icons[name]` at lookup time rather than a fixed map; `POPULAR_CART_ICONS` is just the curated default list shown before a user searches, not an allow-list.

**Styling conventions.** Tailwind v4 is configured via `@config "../tailwind.config.js"` inside `index.css` (not auto-detected). Most styling uses arbitrary-value utilities rather than theme tokens — the brand accent `#FFBC42` is written inline (e.g. `text-[#FFBC42]`, `bg-[#FFBC42]`) throughout rather than referenced as a named Tailwind color.
