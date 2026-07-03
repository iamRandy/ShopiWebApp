const { connectToDatabase } = require("../../_lib/db");
const { verifyToken } = require("../../_lib/auth");

// A collaborator removes their own access to a shared cart.
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
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

  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { cartId } = req.query;

  try {
    const { usersCollection, cartSharesCollection } = await connectToDatabase();

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
};
