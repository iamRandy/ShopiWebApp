const { connectToDatabase } = require("../../_lib/db");
const { verifyToken } = require("../../_lib/auth");
const { resolveCartAccess } = require("../../_lib/cartAccess");

// Mirrors backend/server.js's PATCH /api/carts/:cartId/order. This deployment has no
// persistent Socket.IO server, so unlike the Express route this never emits a live-update
// event — matching every other mutation route under frontend/api/.
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PATCH, OPTIONS");
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

  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { usersCollection, cartSharesCollection } = await connectToDatabase();
    const { productOrder } = req.body;

    if (!Array.isArray(productOrder) || productOrder.some((id) => typeof id !== "string")) {
      return res.status(400).json({ error: "productOrder must be an array of product ids" });
    }

    const access = await resolveCartAccess(usersCollection, cartSharesCollection, req.user.sub, cartId);
    if (!access.allowed || access.role === "view") {
      return res.status(403).json({ error: "You do not have permission to edit this cart" });
    }

    const result = await usersCollection.updateOne(
      { sub: access.ownerSub, "carts.id": cartId },
      { $set: { "carts.$.productOrder": productOrder } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Cart not found" });
    }

    return res.json({ success: true, productOrder });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to save product order" });
  }
};
