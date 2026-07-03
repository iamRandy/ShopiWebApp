const { connectToDatabase } = require("./_lib/db");
const { verifyToken } = require("./_lib/auth");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS");
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

  const { usersCollection, cartSharesCollection } = await connectToDatabase();

  if (req.method === "GET") {
    // List (metadata only, no products) of carts shared with the current user.
    try {
      const doc = await usersCollection.findOne(
        { sub: req.user.sub },
        { projection: { _id: 0, sharedCartIds: 1 } }
      );
      res.json(doc?.sharedCartIds || []);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch shared carts" });
    }
    return;
  }

  if (req.method === "DELETE") {
    // A collaborator removes their own access to a shared cart (body: { cartId }).
    try {
      const { cartId } = req.body || {};
      if (!cartId) {
        return res.status(400).json({ error: "cartId is required" });
      }

      const share = await cartSharesCollection.findOne({ cartId });
      if (!share) {
        return res.status(404).json({ error: "This cart is not shared" });
      }
      if (share.ownerSub === req.user.sub) {
        return res.status(400).json({ error: "Owners cannot leave their own cart" });
      }

      await cartSharesCollection.updateOne(
        { cartId },
        { $pull: { collaborators: { sub: req.user.sub } } }
      );
      await usersCollection.updateOne(
        { sub: req.user.sub },
        { $pull: { sharedCartIds: { cartId } } }
      );

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to leave shared cart" });
    }
    return;
  }

  res.setHeader("Allow", "GET, DELETE, OPTIONS");
  res.status(405).json({ error: "Method not allowed" });
};
