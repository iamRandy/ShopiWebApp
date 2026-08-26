const { connectToDatabase } = require("../../_lib/db");
const { verifyToken } = require("../../_lib/auth");
const { resolveCartAccess } = require("../../_lib/cartAccess");
const { moveProductsBetweenCarts } = require("../../_lib/moveProducts");

// Collection-level product routes for a cart: bulk delete (mirrors backend/server.js's
// DELETE /api/carts/:cartId/products, previously missing from this Vercel deployment) and
// bulk move (POST with a body.action discriminator, matching the consolidation pattern used
// throughout frontend/api/ to stay under Vercel's Hobby-plan function cap).
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
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

  if (!cartId) {
    return res.status(400).json({ error: "Cart ID is required" });
  }

  try {
    const { client, usersCollection, cartSharesCollection } = await connectToDatabase();
    const access = await resolveCartAccess(usersCollection, cartSharesCollection, req.user.sub, cartId);
    if (!access.allowed || access.role === "view") {
      return res.status(403).json({ error: "You do not have permission to edit this cart" });
    }

    if (req.method === "DELETE") {
      const { productIds } = req.body;

      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ error: "productIds must be a non-empty array" });
      }

      const result = await usersCollection.updateOne(
        { sub: access.ownerSub, "carts.id": cartId },
        { $pull: { "carts.$.products": { id: { $in: productIds } } } }
      );

      if (result.modifiedCount > 0) {
        return res.json({ success: true });
      }
      return res.status(404).json({ error: "No matching products found in cart" });
    }

    if (req.method === "POST") {
      const { action, productIds, destinationCartId } = req.body;

      if (action !== "move") {
        return res.status(400).json({ error: "Unknown or missing action" });
      }
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ error: "productIds must be a non-empty array" });
      }
      if (!destinationCartId) {
        return res.status(400).json({ error: "destinationCartId is required" });
      }
      if (destinationCartId === cartId) {
        return res.status(400).json({ error: "Source and destination cart must be different" });
      }

      const destAccess = await resolveCartAccess(usersCollection, cartSharesCollection, req.user.sub, destinationCartId);
      if (!destAccess.allowed || destAccess.role === "view") {
        return res.status(403).json({ error: "You do not have permission to edit the destination cart" });
      }

      let movedProducts;
      try {
        movedProducts = await moveProductsBetweenCarts(
          client,
          usersCollection,
          access,
          cartId,
          productIds,
          destAccess,
          destinationCartId
        );
      } catch (e) {
        return res.status(e.status || 500).json({ error: e.status ? e.message : "Failed to move products" });
      }

      return res.json({ success: true, movedProducts });
    }

    res.setHeader("Allow", "DELETE, POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to process request" });
  }
};
