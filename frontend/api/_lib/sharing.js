// Cart sharing by link: https://<site>/shared/<shareId>.
//
// A shared cart carries a `shareId` in the owner's document. Anyone with the
// link can view the cart (no account needed) but never change it. Stopping
// sharing removes the shareId, so old links stop working; deleting the cart or
// the account does the same.
const crypto = require("crypto");

// 128 random bits, base64url: a link can't be guessed, only handed out.
const SHARE_ID_PATTERN = /^[A-Za-z0-9_-]{22}$/;

function newShareId() {
  return crypto.randomBytes(16).toString("base64url");
}

function isShareId(value) {
  return typeof value === "string" && SHARE_ID_PATTERN.test(value);
}

// What a viewer gets: what the cart shows, never scraper details, timestamps
// or the cart's internal id.
const PRODUCT_FIELDS = ["id", "url", "hostname", "title", "nickname", "description", "image", "price", "currency"];

function publicProduct(product) {
  const shown = {};
  for (const field of PRODUCT_FIELDS) {
    if (product[field] !== undefined && product[field] !== null) shown[field] = product[field];
  }
  return shown;
}

function publicCart(cart, shareId) {
  const products = Array.isArray(cart.products) ? cart.products : [];
  return {
    id: shareId,
    name: cart.name ?? null,
    icon: cart.icon ?? null,
    color: cart.color ?? null,
    products: products.filter((p) => p && typeof p === "object").map(publicProduct),
  };
}

/** "Dhruv" from "Dhruv Chowdhary": enough to say whose cart it is. */
function firstName(name) {
  if (typeof name !== "string") return null;
  return name.trim().split(/\s+/)[0] || null;
}

// Viewers look carts up by shareId, so it's indexed. Sparse: only shared carts
// are in it. Created once per function instance; it's a no-op once it exists.
let indexReady = null;
function ensureShareIndex(users) {
  if (!indexReady) {
    indexReady = users
      .createIndex({ "carts.shareId": 1 }, { name: "carts_shareId", sparse: true })
      .catch((e) => {
        indexReady = null; // Lookups still work without it, just slower.
        console.error("Couldn't create the share index:", e);
      });
  }
  return indexReady;
}

module.exports = { newShareId, isShareId, publicCart, firstName, ensureShareIndex };
