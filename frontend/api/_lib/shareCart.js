const { connectToDatabase } = require("./db");
const { verifyToken } = require("./auth");
const { newShareId, ensureShareIndex } = require("./sharing");

// /api/carts/:cartId/share — sharing one of the signed-in user's carts by link.
// Served by api/share.js (see the rewrite in vercel.json).
//
// POST   Starts sharing, or returns the existing link's id if it's already
//        shared, so asking twice never breaks a link already sent.
//        Responds { shareId }; the link is <site>/shared/<shareId>.
// DELETE Stops sharing: links already sent stop working. Responds { success }.
//
// Viewers load the cart through GET /api/shared/:shareId.

async function sharedCart(users, sub, cartId) {
  const doc = await users.findOne(
    { sub, "carts.id": cartId },
    { projection: { _id: 0, "carts.$": 1 } }
  );
  return doc?.carts?.[0] ?? null;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST" && req.method !== "DELETE") {
    res.setHeader("Allow", "POST, DELETE, OPTIONS");
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
    return; // verifyToken already sent the response
  }

  const { cartId } = req.query;
  if (!cartId) {
    return res.status(400).json({ error: "Cart ID is required" });
  }

  try {
    const { usersCollection } = await connectToDatabase();
    const sub = req.user.sub;

    if (req.method === "POST") {
      const cart = await sharedCart(usersCollection, sub, cartId);
      if (!cart) return res.status(404).json({ error: "Cart not found" });
      if (cart.shareId) return res.json({ shareId: cart.shareId });

      await ensureShareIndex(usersCollection);
      const shareId = newShareId();
      // Only if it's still unshared: two taps at once end up with one link.
      const result = await usersCollection.updateOne(
        { sub, carts: { $elemMatch: { id: cartId, shareId: null } } },
        { $set: { "carts.$.shareId": shareId } }
      );
      if (result.modifiedCount > 0) return res.json({ shareId });

      const current = await sharedCart(usersCollection, sub, cartId);
      if (!current) return res.status(404).json({ error: "Cart not found" });
      return res.json({ shareId: current.shareId });
    }

    const result = await usersCollection.updateOne(
      { sub, "carts.id": cartId },
      { $unset: { "carts.$.shareId": "" } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Cart not found" });
    }
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: req.method === "POST" ? "Failed to share cart" : "Failed to stop sharing cart",
    });
  }
};
