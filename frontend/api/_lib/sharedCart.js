const { connectToDatabase } = require("./db");
const { isShareId, publicCart, firstName } = require("./sharing");

// GET /api/shared/:shareId — a cart someone shared by link, read-only.
// Served by api/share.js (see the rewrite in vercel.json).
//
// No sign-in: having the link is what grants access. Responds
//   { cart: { id, name, icon, color, products }, owner: { name } }
// where `cart.id` is the shareId and `owner.name` is the owner's first name.
// 404 once the owner stops sharing, or deletes the cart or their account.

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // Always the live cart, and gone the moment sharing stops.
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { shareId } = req.query;
  const notShared = { error: "This cart isn't shared anymore", code: "NOT_SHARED" };
  if (!isShareId(shareId)) {
    return res.status(404).json(notShared);
  }

  try {
    const { usersCollection } = await connectToDatabase();
    const owner = await usersCollection.findOne(
      { "carts.shareId": shareId },
      { projection: { _id: 0, name: 1, "carts.$": 1 } }
    );
    const cart = owner?.carts?.[0];
    if (!cart || cart.shareId !== shareId) {
      return res.status(404).json(notShared);
    }
    return res.json({
      cart: publicCart(cart, shareId),
      owner: { name: firstName(owner.name) },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load the shared cart" });
  }
};
