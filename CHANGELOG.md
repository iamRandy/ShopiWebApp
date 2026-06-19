# Changelog

Notable changes to the ShopiWebApp frontend and backend. This project ships continuously rather than in numbered releases, so entries are grouped by date instead of version.

## Unreleased

- Cart icon picker now searches lucide-react's full ~1600-icon library (`frontend/src/utils/cartIcons.js`, `CartModal.jsx`), with a horizontally scrollable "popular for shopping" carousel as the default view, replacing the old fixed 30-icon grid.
- Product images that aren't roughly square (noticeably tall or wide) now render with `object-contain` so the whole product stays visible, instead of being cropped by `object-cover`; near-square photos still crop to fill (new `ProductImage` component, used in the grid/list dashboard views and the product detail modal).
- Redesigned the favorite-heart toggle on grid/list cart cards and the marketing "How It Works" demo: a dark semi-transparent circle instead of the white/grey one, with the heart always in the brand accent color (`#FFBC42`), growing and filling in when favorited.
- Fixed the companion browser extension's cart icon rendering, which only recognized a hardcoded ~40-icon list and silently fell back to the default icon for anything chosen from the new picker; it now resolves any lucide-react icon name dynamically, matching the web app.
- Added `CLAUDE.md` with build/run commands and architecture notes for future work in this repo.
- Fixed the collapsed sidebar's account menu (sign out) rendering behind the product grid instead of on top of it (`AppShell.jsx`).
- Added the missing "previous page" button to dashboard pagination — only "next" existed, even though `usePagination` already tracked `hasPrev` (`Pagination.jsx`, `Dashboard.jsx`).

## 2026-06-18
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
