const { connectToDatabase } = require("../../../_lib/db");
const { verifyToken } = require("../../../_lib/auth");
const { resolveCartAccess } = require("../../../_lib/cartAccess");
const { scrapeProductPriceGuarded } = require("../../../_lib/priceScraper");

// A product's price is re-checked at most once per this window, and only when visible to a user.
const STALE_SCAN_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks

// This function has a hard 10s ceiling (frontend/vercel.json) and is torn down right after
// responding — unlike the always-on Express backend, there's no "keep scraping after the
// response is sent." So this scrapes a small, capped batch concurrently within the request
// itself and returns the outcome directly, instead of relying on a later background push.
const MAX_PRODUCTS_PER_REQUEST = 6;
const SCRAPE_TIMEOUT_MS = 6000;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const verifyTokenPromise = new Promise((resolve, reject) => {
    verifyToken(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
  try {
    await verifyTokenPromise;
  } catch {
    return;
  }

  const { cartId } = req.query;
  const { productIds } = req.body || {};

  if (!cartId) {
    return res.status(400).json({ error: "Cart ID is required" });
  }
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: "productIds must be a non-empty array" });
  }

  try {
    const { usersCollection, cartSharesCollection, blockedHostsCollection } = await connectToDatabase();
    const access = await resolveCartAccess(usersCollection, cartSharesCollection, req.user.sub, cartId);
    if (!access.allowed) {
      return res.status(403).json({ error: "You do not have access to this cart" });
    }

    const user = await usersCollection.findOne(
      { sub: access.ownerSub, "carts.id": cartId },
      { projection: { _id: 0, "carts.$": 1 } }
    );
    const cart = user?.carts?.[0];
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const requestedIds = new Set(productIds);
    const now = Date.now();
    const staleProducts = (cart.products || [])
      .filter(
        (p) =>
          requestedIds.has(p.id) &&
          p.url &&
          (!p.lastScannedAt || now - new Date(p.lastScannedAt).getTime() >= STALE_SCAN_MS)
      )
      .slice(0, MAX_PRODUCTS_PER_REQUEST);

    const updates = await Promise.all(
      staleProducts.map(async (product) => {
        const result = await scrapeProductPriceGuarded(blockedHostsCollection, product.url, SCRAPE_TIMEOUT_MS);
        const priceChanged =
          result.ok &&
          Number.isFinite(result.price) &&
          (!Number.isFinite(Number(product.price)) || Math.abs(result.price - Number(product.price)) >= 0.01);

        const $set = { "carts.$[c].products.$[p].lastScannedAt": new Date().toISOString() };
        if (priceChanged) {
          $set["carts.$[c].products.$[p].price"] = result.price;
        }

        await usersCollection.updateOne(
          { sub: access.ownerSub },
          { $set },
          { arrayFilters: [{ "c.id": cartId }, { "p.id": product.id }] }
        );

        return priceChanged
          ? { productId: product.id, previousPrice: product.price, price: result.price }
          : null;
      })
    );

    return res.json({
      scanned: staleProducts.map((p) => p.id),
      updates: updates.filter(Boolean),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to rescan products" });
  }
};
