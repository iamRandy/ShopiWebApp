const { connectToDatabase } = require("../../../_lib/db");
const { verifyToken } = require("../../../_lib/auth");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PATCH, DELETE, OPTIONS");
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

  const { cartId, productId } = req.query;

  if (!cartId || !productId) {
    return res.status(400).json({ error: "Cart ID and Product ID are required" });
  }

  try {
    const { usersCollection } = await connectToDatabase();

    if (req.method === "PATCH") {
      const { nickname } = req.body;

      if (nickname !== undefined && typeof nickname !== "string") {
        return res.status(400).json({ error: "Nickname must be a string" });
      }

      const trimmedNickname =
        typeof nickname === "string" ? nickname.trim() : undefined;

      const update =
        trimmedNickname === undefined
          ? {}
          : trimmedNickname
            ? { $set: { "carts.$[c].products.$[p].nickname": trimmedNickname } }
            : { $unset: { "carts.$[c].products.$[p].nickname": "" } };

      if (!update.$set && !update.$unset) {
        return res.status(400).json({ error: "Nickname is required" });
      }

      const result = await usersCollection.updateOne(
        { sub: req.user.sub },
        update,
        { arrayFilters: [{ "c.id": cartId }, { "p.id": productId }] }
      );

      if (result.matchedCount === 0) {
        return res
          .status(404)
          .json({ error: "Product not found in cart or cart not found" });
      }

      const user = await usersCollection.findOne(
        { sub: req.user.sub },
        { projection: { _id: 0, carts: 1 } }
      );
      const cart = user?.carts?.find((c) => c.id === cartId);
      const product = cart?.products?.find((p) => p.id === productId);

      if (!product) {
        return res.status(404).json({ error: "Product not found after update" });
      }

      return res.json({ success: true, product });
    }

    if (req.method === "DELETE") {
      const result = await usersCollection.updateOne(
        { sub: req.user.sub, "carts.id": cartId },
        { $pull: { "carts.$.products": { id: productId } } }
      );

      if (result.modifiedCount > 0) {
        return res.json({ success: true, message: "Product deleted successfully" });
      }
      return res
        .status(404)
        .json({ error: "Product not found in cart or cart not found" });
    }

    res.setHeader("Allow", "PATCH, DELETE, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to update product" });
  }
};
